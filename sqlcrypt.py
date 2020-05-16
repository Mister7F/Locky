import os
import apsw
import functools


from hashlib import md5
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import scrypt


BLOCK_SIZE = 4096
HEADER_SIZE = 32


@functools.lru_cache(maxsize=2048)
def _get_iv(offset: int, salt=bytes) -> bytes:
    """Generate an IV for the block."""
    assert salt, "Salt is required"

    block_position = offset // BLOCK_SIZE
    return md5(salt + block_position.to_bytes(16, "big")).digest()


def _decrypt(key: bytes, iv: bytes, data: bytes) -> bytearray:
    assert len(key) == 32, "Must decrypt in AES-256"
    assert len(iv) == 16
    assert len(data) == BLOCK_SIZE

    return bytearray(AES.new(key, AES.MODE_CBC, IV=iv).decrypt(data))


def _encrypt(key: bytes, iv: bytes, data: bytes) -> bytearray:
    assert len(key) == 32, "Must encrypt in AES-256"
    assert len(iv) == 16
    assert len(data) == BLOCK_SIZE

    return bytearray(AES.new(key, AES.MODE_CBC, IV=iv).encrypt(data))


def _derive_password(password: str, salt: bytes) -> bytes:
    """Generate the AES key from the master password."""
    return scrypt(password, salt=salt, key_len=32, N=2 ** 12, r=8, p=1)


class EncryptedVFSFile(apsw.VFSFile):
    def __init__(self, key: bytes, ivs_salt: bytes, *args):
        """Encrypt the data when writing on the disk and decrypt when reading.

        :param key: AES key used for encryption/decryption
        :param ivs_salt: Salt used to generate the IV of each block
        """
        assert len(key) == 32
        assert len(ivs_salt) == 16

        self.key = key
        self.ivs_salt = ivs_salt
        return super().__init__(*args)

    def xRead(self, amount: int, offset: int):
        assert amount <= BLOCK_SIZE

        start_block_offset = offset - (offset % BLOCK_SIZE)
        end_offset = offset + amount
        end_block_offset = end_offset - (end_offset % -BLOCK_SIZE)

        assert not (end_block_offset - start_block_offset) % BLOCK_SIZE

        data = super().xRead(
            end_block_offset - start_block_offset, start_block_offset + HEADER_SIZE
        )

        if not data:
            return data

        data = _decrypt(self.key, _get_iv(offset, self.ivs_salt), data)
        return data[offset % BLOCK_SIZE : offset % BLOCK_SIZE + amount]

    def xWrite(self, data: bytes, offset: int):
        start_block_offset = offset - (offset % BLOCK_SIZE)

        assert not start_block_offset % BLOCK_SIZE

        if (offset + len(data)) > (start_block_offset + BLOCK_SIZE):
            end_data_pos = (start_block_offset + BLOCK_SIZE) - offset
            self.xWrite(data[:end_data_pos], start_block_offset + BLOCK_SIZE)
            data = data[:end_data_pos]

        iv = _get_iv(offset, self.ivs_salt)

        # the data doesn't fill into blocks
        # so we need to read the entire block to add data
        blocks_data = super().xRead(BLOCK_SIZE, start_block_offset + HEADER_SIZE)

        if len(blocks_data) != BLOCK_SIZE:
            # we add new block at the end of the file
            blocks_data += os.urandom(BLOCK_SIZE - len(blocks_data))

        blocks_data = _decrypt(self.key, iv, blocks_data)
        blocks_data[offset % BLOCK_SIZE : offset % BLOCK_SIZE + len(data)] = data
        blocks_data = _encrypt(self.key, iv, blocks_data)

        super().xWrite(blocks_data, start_block_offset + HEADER_SIZE)

    def xFileSize(self):
        return super().xFileSize() - HEADER_SIZE


class EncryptedVFS(apsw.VFS):
    def __init__(self, password: str, vfsname: str = "encrypted", basevfs: str = ""):
        self.vfsname = vfsname
        self.basevfs = basevfs
        self.password = password

        # SQLite open and close many time the same file
        # so we store the derived keys and the IVs salt
        # to not re-generate them each time the file is opened
        self.files_key = {}
        self.files_ivs_salt = {}

        super().__init__(self.vfsname, self.basevfs)

    def xOpen(self, name, flags):
        """Open the file and read the header (store necessary data)."""
        assert self.files_key.keys() == self.files_ivs_salt.keys()

        filename = name if isinstance(name, str) else name.filename()

        if filename not in self.files_key or filename not in self.files_ivs_salt:
            with open(filename, "a+b") as file:
                header = self._parse_header(file)

                if not header:
                    # init the header of the file
                    password_salt = os.urandom(16)
                    ivs_salt = os.urandom(16)

                    file.seek(0)
                    file.write(password_salt)
                    file.write(ivs_salt)
                else:
                    password_salt, ivs_salt = header

            self.files_key[filename] = _derive_password(self.password, password_salt)
            self.files_ivs_salt[filename] = ivs_salt

        return EncryptedVFSFile(
            self.files_key[filename],
            self.files_ivs_salt[filename],
            self.basevfs,
            name,
            flags,
        )

    def _parse_header(self, file):
        file.seek(0)
        header = file.read(HEADER_SIZE)
        if header:
            password_salt = header[:16]
            ivs_salt = header[16:32]
            return password_salt, ivs_salt


class Connection(apsw.Connection):
    def __init__(self, filename: str, password: str) -> "Connection":
        self.password = password
        self.encrypted_vfs = EncryptedVFS(password)
        super().__init__(filename, vfs=self.encrypted_vfs.vfsname)

    def change_password(self, new_password: str):
        new_password_salt = os.urandom(16)
        new_ivs_salt = os.urandom(16)
        new_key = _derive_password(new_password, new_password_salt)

        if not self.filename:
            # ':memory:' database (so not encrypted)
            return

        with open(self.filename, "r+b") as file:
            file.seek(0)

            header = file.read(HEADER_SIZE)

            old_password_salt = header[:16]
            old_ivs_salt = header[16:32]
            old_key = _derive_password(self.password, old_password_salt)

            if len(header) != HEADER_SIZE:
                self.__init__(self.filename, new_password)
                return

            file.seek(0)

            file.write(new_password_salt)
            file.write(new_ivs_salt)

            data = file.read(BLOCK_SIZE)
            offset = 0
            while data:
                data = _decrypt(old_key, _get_iv(offset, old_ivs_salt), data)
                data = _encrypt(new_key, _get_iv(offset, new_ivs_salt), data)

                file.seek(-BLOCK_SIZE, 1)
                file.write(data)

                offset += BLOCK_SIZE
                data = file.read(BLOCK_SIZE)

        self.__init__(self.filename, new_password)


# run tests
if __name__ == "__main__":
    os.system("rm _test_sqlcrypt_")
    conn = Connection("_test_sqlcrypt_", "pass")
    cursor = conn.cursor()

    with conn:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS accounts (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  value INTEGER DEFAULT 0,
                  name TEXT DEFAULT ''
                )
            """
        )

    with conn:
        for i in range(20):
            cursor.execute(
                """
                INSERT INTO accounts (value, name)
                     VALUES (?, ?)
                """,
                [i, hex(i) * 9999],
            )
            cursor.execute(
                """
                INSERT INTO accounts (value)
                     VALUES (?)
                """,
                [i],
            )

    conn.close()

    # re-open the database

    conn = Connection("_test_sqlcrypt_", "pass")
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT COUNT(DISTINCT value), COUNT(*), SUM(value)
          FROM accounts
        """
    )
    assert cursor.fetchall() == [(20, 40, 380)]

    for i in range(10):
        cursor.execute(
            """
            SELECT id
              FROM accounts
             WHERE name = ?
            """,
            [hex(i) * 9999],
        )
        assert cursor.fetchall() == [(i * 2 + 1,)]

    # change the password
    conn.change_password("azerty")

    cursor.execute(
        """
        SELECT COUNT(DISTINCT value), COUNT(*), SUM(value)
          FROM accounts
        """
    )
    assert cursor.fetchall() == [(20, 40, 380)]

    conn.close()

    conn = Connection("_test_sqlcrypt_", "azerty")
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT COUNT(DISTINCT value), COUNT(*), SUM(value)
          FROM accounts
        """
    )
    assert cursor.fetchall() == [(20, 40, 380)]

    for i in range(10):
        cursor.execute(
            """
            SELECT id
              FROM accounts
             WHERE name = ?
            """,
            [hex(i) * 9999],
        )
        assert cursor.fetchall() == [(i * 2 + 1,)]

    with conn:
        cursor.execute(
            """
            UPDATE accounts
               SET name = 'test'
            """
        )

    cursor.execute(
        """
        SELECT COUNT(DISTINCT name)
          FROM accounts
        """
    )
    assert cursor.fetchall() == [(1,)]

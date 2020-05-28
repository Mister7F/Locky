import os
import apsw


from Crypto.Cipher import AES
from Crypto.Protocol.KDF import scrypt
from Crypto.Hash import HMAC, SHA256

# PASSWORD SALT (16)
HEADER_SIZE = 16
# IV (16) | MAC (32) | CIPHERTEXT
BLOCK_HEADER_SIZE = 16 + 32
BLOCK_SIZE = 4096 + BLOCK_HEADER_SIZE


class WrongSignature(Exception):
    pass


def _parse_header(file):
    file.seek(0)
    password_salt = file.read(HEADER_SIZE)
    return password_salt


def _decrypt(key: bytes, data: bytes) -> bytearray:
    assert len(key) == 32, "Must decrypt in AES-256"
    assert len(data) == BLOCK_SIZE
    iv = data[:16]
    mac = data[16:48]
    ciphertext = data[BLOCK_HEADER_SIZE:]

    plaintext = AES.new(key, AES.MODE_CBC, iv=iv).decrypt(ciphertext)
    if mac != HMAC.new(key, msg=plaintext, digestmod=SHA256).digest():
        return b""

    assert len(plaintext) == BLOCK_SIZE - BLOCK_HEADER_SIZE
    return bytearray(plaintext)


def _encrypt(key: bytes, plaintext: bytes) -> bytearray:
    assert len(key) == 32, "Must encrypt in AES-256"
    assert len(plaintext) == BLOCK_SIZE - BLOCK_HEADER_SIZE

    iv = os.urandom(16)
    mac = HMAC.new(key, msg=plaintext, digestmod=SHA256).digest()

    ciphertext = AES.new(key, AES.MODE_CBC, iv=iv).encrypt(plaintext)

    assert len(ciphertext) == BLOCK_SIZE - BLOCK_HEADER_SIZE
    assert len(iv + mac) == BLOCK_HEADER_SIZE

    return bytearray(iv + mac + ciphertext)


def _derive_password(password: str, salt: bytes) -> bytes:
    """Generate the AES key from the master password."""
    return scrypt(password, salt=salt, key_len=32, N=2 ** 15, r=8, p=1)


def _decrypt_database(password: str, filename: str) -> bytes:
    """For testing purpose only.

    Decrypt the encrypt database. To use for testing purpose, to check that the decrypted
    database is the same as the not-encrypted one.
    """
    with open(filename, "rb") as file:
        password_salt = _parse_header(file)
        key = _derive_password(password, password_salt)

        file.seek(HEADER_SIZE)
        data = file.read()

        plaindata = b""
        for i in range(0, len(data), BLOCK_SIZE):
            plaindata += _decrypt(key, data[i : i + BLOCK_SIZE])

    return plaindata


class EncryptedVFSFile(apsw.VFSFile):
    def __init__(self, key: bytes, *args):
        """Encrypt the data when writing on the disk and decrypt when reading.

        :param key: AES key used for encryption/decryption
        """
        assert len(key) == 32

        self.key = key
        super().__init__(*args)

        # check that the SQLite page size match with the encryption block size
        sector_size = self.xSectorSize()
        assert sector_size <= BLOCK_SIZE - BLOCK_HEADER_SIZE
        assert not (BLOCK_SIZE - BLOCK_HEADER_SIZE) % sector_size

    def xRead(self, amount: int, offset: int) -> bytes:
        assert amount <= BLOCK_SIZE

        offset += (offset // (BLOCK_SIZE - BLOCK_HEADER_SIZE)) * BLOCK_HEADER_SIZE

        start_block_offset = offset - (offset % BLOCK_SIZE)
        end_offset = offset + amount
        end_block_offset = end_offset - (end_offset % -BLOCK_SIZE)

        assert not (end_block_offset - start_block_offset) % BLOCK_SIZE

        data = super().xRead(
            end_block_offset - start_block_offset, start_block_offset + HEADER_SIZE
        )

        if not data:
            return data

        data = _decrypt(self.key, data)
        return data[offset % BLOCK_SIZE : offset % BLOCK_SIZE + amount]

    def xWrite(self, data: bytes, offset: int):
        offset += (offset // (BLOCK_SIZE - BLOCK_HEADER_SIZE)) * BLOCK_HEADER_SIZE

        start_block_offset = offset - (offset % BLOCK_SIZE)

        assert not start_block_offset % BLOCK_SIZE

        if (offset + len(data)) > (start_block_offset + BLOCK_SIZE - BLOCK_HEADER_SIZE):
            end_data_pos = (
                start_block_offset + BLOCK_SIZE - BLOCK_HEADER_SIZE
            ) - offset
            self.xWrite(data[:end_data_pos], start_block_offset + BLOCK_SIZE)
            data = data[:end_data_pos]

        assert offset + len(data) <= start_block_offset + BLOCK_SIZE

        # the data doesn't fill into blocks
        # so we need to read the entire block to add data
        blocks_data = super().xRead(BLOCK_SIZE, start_block_offset + HEADER_SIZE)

        assert len(blocks_data) in [0, BLOCK_SIZE]

        if not len(blocks_data):
            # we add new block at the end of the file
            blocks_data = bytearray(os.urandom(BLOCK_SIZE - BLOCK_HEADER_SIZE))
        else:
            blocks_data = _decrypt(self.key, blocks_data)

        blocks_data[offset % BLOCK_SIZE : offset % BLOCK_SIZE + len(data)] = data
        blocks_data = _encrypt(self.key, blocks_data)

        super().xWrite(blocks_data, start_block_offset + HEADER_SIZE)

    def xFileSize(self) -> int:
        file_size = super().xFileSize()
        return file_size - HEADER_SIZE - (file_size // BLOCK_SIZE) - BLOCK_HEADER_SIZE


class EncryptedVFS(apsw.VFS):
    def __init__(self, password: str, vfsname: str = "encrypted", basevfs: str = ""):
        self.vfsname = vfsname
        self.basevfs = basevfs
        self.password = password

        # SQLite open and close many time the same file
        # so we store the derived keys and the IVs salt
        # to not re-generate them each time the file is opened
        self.files_key = {}

        super().__init__(self.vfsname, self.basevfs)

    def xOpen(self, name, flags):
        """Open the file and read the header (store necessary data)."""
        filename = name if isinstance(name, str) else name.filename()

        if filename not in self.files_key:
            with open(filename, "a+b") as file:
                password_salt = _parse_header(file)

                if not password_salt:
                    # init the header of the file
                    password_salt = os.urandom(16)

                    file.seek(0)
                    file.write(password_salt)

            self.files_key[filename] = _derive_password(self.password, password_salt)

        return EncryptedVFSFile(self.files_key[filename], self.basevfs, name, flags)


class Connection(apsw.Connection):
    def __init__(self, filename: str, password: str) -> "Connection":
        self.password = password
        self.encrypted_vfs = EncryptedVFS(password)
        super().__init__(filename, vfs=self.encrypted_vfs.vfsname)

    def change_password(self, new_password: str):
        new_password_salt = os.urandom(16)
        new_key = _derive_password(new_password, new_password_salt)

        if not self.filename:
            # ':memory:' database (so not encrypted)
            return

        with open(self.filename, "r+b") as file:
            file.seek(0)

            header = file.read(HEADER_SIZE)

            old_password_salt = header[:16]
            old_key = _derive_password(self.password, old_password_salt)

            if len(header) != HEADER_SIZE:
                self.__init__(self.filename, new_password)
                return

            file.seek(0)
            file.write(new_password_salt)

            data = file.read(BLOCK_SIZE)
            offset = 0
            while data:
                data = _decrypt(old_key, data)
                data = _encrypt(new_key, data)

                file.seek(-BLOCK_SIZE, 1)
                file.write(data)

                offset += BLOCK_SIZE
                data = file.read(BLOCK_SIZE)

        self.__init__(self.filename, new_password)


# run tests
if __name__ == "__main__":
    os.system("rm ./tests/_test_sqlcrypt_")
    conn = Connection("./tests/_test_sqlcrypt_", "pass")
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

    conn = Connection("./tests/_test_sqlcrypt_", "pass")
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

    conn = Connection("./tests/_test_sqlcrypt_", "azerty")
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

    # test with and without key
    # if decrypted version is the same as the "not-encrypted" one
    os.system("rm ./tests/_test_sqlcrypt_")
    conn = Connection("./tests/_test_sqlcrypt_", "pass")
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
        for i in range(200):
            cursor.execute(
                """
                INSERT INTO accounts (value, name)
                     VALUES (?, ?)
                """,
                [i, hex(i) * 9999],
            )

    conn.close()

    encrytped_database = open("./tests/_test_sqlcrypt_", "rb").read()
    decrypted_database = _decrypt_database("pass", "./tests/_test_sqlcrypt_")
    os.system("rm ./tests/_test_sqlcrypt_")

    conn = apsw.Connection("./tests/_test_sqlcrypt_")
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
        for i in range(200):
            cursor.execute(
                """
                INSERT INTO accounts (value, name)
                     VALUES (?, ?)
                """,
                [i, hex(i) * 9999],
            )
    conn.close()

    plain_database = open("./tests/_test_sqlcrypt_", "rb").read()

    assert decrypted_database.startswith(plain_database)
    assert len(decrypted_database) - len(plain_database) < BLOCK_SIZE

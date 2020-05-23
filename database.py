import os
import json
from sqlcrypt import Connection
from Crypto.Protocol.KDF import scrypt


class Database:
    def __init__(self, password, filename=":memory:"):
        self.hash_salt = os.urandom(32)
        self.hash_password = self._hash(password)

        self.conn = Connection(filename, password)
        self.cursor = self.conn.cursor()
        self._create_table()

    def _create_table(self):
        with self.conn:
            self.cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS accounts (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      name VARCHAR,
                      login VARCHAR,
                      password VARCHAR,
                      icon VARCHAR,
                      url VARCHAR DEFAULT '',
                      totp VARCHAR DEFAULT '',
                      fields TEXT DEFAULT '[]',
                      folder BOOLEAN DEFAULT false,
                      sequence REAL DEFAULT 0,
                      folder_id INTEGER DEFAULT 0
                    )
                """
            )
            self.cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS keys (
                      encryption_key BLOB
                    )
                """
            )

    def add_account(self, account):
        self._check_json_account(account)
        with self.conn:
            self.cursor.execute(
                """
                INSERT INTO accounts (name, login, password, icon, url,
                                      totp, fields, folder, folder_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    account.get("name", ""),
                    account.get("login", ""),
                    account.get("password", ""),
                    account.get("icon", ""),
                    account.get("url", ""),
                    account.get("totp", ""),
                    json.dumps(account.get("fields", "")),
                    account.get("folder", False),
                    account.get("folder_id", 0),
                ],
            )

            self.cursor.execute("SELECT last_insert_rowid()")
            account_id = self.cursor.fetchone()[0]
            return self.get_account(account_id)

    def write_account(self, account):
        assert "id" in account
        with self.conn:
            self.cursor.execute(
                """
                    UPDATE accounts
                       SET name = ?,
                           login = ?,
                           password = ?,
                           icon = ?,
                           url = ?,
                           totp = ?,
                           fields = ?,
                           folder = ?,
                           folder_id = ?
                    WHERE id = ?
                    """,
                [
                    account.get("name", ""),
                    account.get("login", ""),
                    account.get("password", ""),
                    account.get("icon", ""),
                    account.get("url", ""),
                    account.get("totp", ""),
                    json.dumps(account.get("fields", "")),
                    account.get("folder", False),
                    account.get("folder_id", 0),
                    account["id"],
                ],
            )

        return account

    def remove_account(self, account_id):
        with self.conn:
            self.cursor.execute("DELETE FROM accounts WHERE id=?", [account_id])

    def search_account(self, name=""):
        self.cursor.execute(
            """
            SELECT id, name, login, password, icon, url,
                   totp, fields, folder, folder_id, sequence
              FROM accounts
             WHERE name LIKE '%' || ? || '%'
                OR login LIKE '%' || ? || '%'
            """,
            [name, name],
        )

        return [
            self._sql_response_to_dict(response) for response in self.cursor.fetchall()
        ]

    def get_account(self, account_id=0):
        self.cursor.execute(
            """
            SELECT id, name, login, password, icon, url, totp,
                   fields, folder, folder_id, sequence
              FROM accounts
             WHERE id = ?
            """,
            [account_id],
        )

        return self._sql_response_to_dict(self.cursor.fetchone())

    def open_folder(self, folder_id=0):
        self.cursor.execute(
            """
            SELECT id, name, login, password, icon, url, totp,
                   fields, folder, folder_id, sequence
              FROM accounts
             WHERE folder_id = ?
          ORDER BY sequence ASC
            """,
            [folder_id],
        )

        return [
            self._sql_response_to_dict(response) for response in self.cursor.fetchall()
        ]

    def account_count(self):
        self.cursor.execute(
            """
            SELECT COUNT(id)
              FROM accounts
            """
        )
        return self.cursor.fetchone()

    def check_password(self):
        self.account_count()

    def move_account(self, account_id, new_index):
        """Move an account to the specify position in his parent folder."""
        current_folder_id = self.get_account(account_id)["folder_id"]

        with self.conn:
            # can not update in the first query because SQLite will perform the
            # second SELECT command on the current modified columns
            self.cursor.execute(
                """
                SELECT (CASE
                           WHEN id != ? THEN (
                                SELECT COUNT(*)
                                  FROM accounts AS a
                                 WHERE a.folder_id = ?
                                   AND (
                                    -- Use the id to sort accounts with the same sequence
                                          (0.00000001 * a.id + a.sequence)
                                        < (0.00000001 * accounts.id + accounts.sequence)
                                       )
                                   AND a.id != ?
                                   AND a.id != accounts.id
                           )
                           ELSE (? - 0.5)
                       END) as new_sequence, id
                  FROM accounts
                 WHERE folder_id = ?
                """,
                [
                    account_id,
                    current_folder_id,
                    account_id,
                    new_index,
                    current_folder_id,
                ],
            )

            results = self.cursor.fetchall()

            self.cursor.executemany(
                """
                UPDATE accounts
                   SET sequence = ?
                 WHERE id = ?
                """,
                results,
            )

    def move_into_folder(self, account_id, folder_id):
        """Move the account inside the specified folder."""
        with self.conn:
            self.cursor.execute(
                """
                UPDATE accounts
                   SET folder_id = ?,
                       sequence = (SELECT COUNT(*) FROM accounts WHERE folder_id=?)
                 WHERE id = ?
                """,
                [folder_id, folder_id, account_id],
            )

    def check_password_value(self, password: str):
        return self._hash(password) == self.hash_password

    def change_password(self, old_password: str, new_password: str):
        if not self.check_password_value(old_password):
            raise Exception("Wrong password")

        self.hash_password = self._hash(new_password)

        self.conn.change_password(new_password)
        self.cursor = self.conn.cursor()

    def clean_accounts(self):
        """Clean the database.

        Do multiple actions
        - Move all accounts without parent to the root folder
        - If a "loop" is present, move all accounts of the loop to the root
        """
        pass

    def _sql_response_to_dict(self, response):
        if not response:
            return {}
        return {
            "id": response[0],
            "name": response[1],
            "login": response[2],
            "password": response[3],
            "icon": response[4],
            "url": response[5],
            "totp": response[6],
            "fields": json.loads(response[7] or "[]"),
            "folder": response[8],
            "folder_id": response[9],
            "sequence": response[10],
        }

    def _check_json_account(self, account):
        """Check the account dict before writing."""
        alloweds_key = {
            "id",
            "name",
            "login",
            "password",
            "url",
            "totp",
            "fields",
            "folder_id",
            "sequence",
            "force",
            "icon",
            "folder",
        }

        assert all(key in alloweds_key for key in account)

        if account.get("fields"):
            assert isinstance(account.get("fields"), list)
            for field in account.get("fields"):
                assert len(field) == 3
                assert "name" in field
                assert "type" in field
                assert "value" in field

    def _hash(self, password):
        return scrypt(password, salt=self.hash_salt, key_len=32, N=2 ** 12, r=8, p=1)


if __name__ == "__main__":
    import random

    os.system("rm _test_sqlcrypt_")

    database = Database("test", "_test_sqlcrypt_")
    for i in range(5):
        database.add_account({"name": str(i)})
    database.move_account(3, 1)

    # test moving accounts
    current_order = [account["id"] for account in database.open_folder(0)]

    database.move_account(3, 1)

    # check if order is stable
    for _ in range(100):
        database.move_account(3, 1)
        assert current_order == [account["id"] for account in database.open_folder(0)]

    # python implementation of the accounts move
    # to check the SQL query
    def move_account(account_id, index):
        current_order.remove(account_id)
        current_order.insert(index, account_id)

    for _ in range(100):
        moved_account_id = random.choice(current_order)
        new_index = random.randint(0, len(current_order))
        database.move_account(moved_account_id, new_index)
        move_account(moved_account_id, new_index)

        assert current_order == [account["id"] for account in database.open_folder(0)]

    # test moving into a folder
    folder = database.add_account({"folder": 1})
    account = database.add_account({})

    for _ in range(5):
        database.add_account({"folder": 0, "folder_id": folder["id"]})

    database.move_into_folder(account["id"], folder["id"])

    account = database.get_account(account["id"])

    assert account["folder_id"] == folder["id"]
    assert account["sequence"] == 5

    # change password test
    database.change_password("test", "new password !")

    account = database.get_account(account["id"])
    assert account["folder_id"] == folder["id"]
    assert account["sequence"] == 5

    database = Database("new password !", "_test_sqlcrypt_")
    assert account["folder_id"] == folder["id"]
    assert account["sequence"] == 5

import os
import sys
import eel
import apsw
import json
import pyotp

from database import Database
from flask_helper import Error
from flask import Flask, request, send_from_directory, session
from werkzeug.exceptions import BadRequest
from flask import jsonify


app = Flask(__name__)
app.secret_key = os.urandom(1024).hex()


database_connections = {}

"""
Svelte serving
"""


@app.route("/")
def base():
    return send_from_directory("web/public", "index.html")


# Path for all the static files (compiled JS/CSS, etc.)
@app.route("/<path:path>")
def home(path):
    return send_from_directory("web/public", path)


@app.route("/account_icons")
def account_icons():
    if not session.get("login"):
        raise

    return json.dumps(
        [f"img/accounts/{icon}" for icon in os.listdir("./web/public/img/accounts")]
    )


"""
API
"""


@app.errorhandler(Error)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.route("/login", methods=["POST"])
def login():
    if session.get("login"):
        return "ok"

    login = request.json.get("login")
    password = request.json.get("password")

    if not login or not password:
        raise Error("Missing parameters")

    if login not in database_connections:
        try:
            database = Database(password, "wallet.db")
            database.check_password()
        except apsw.NotADBError:
            raise Error("Wrong password")
        database_connections[login] = database
    elif not database_connections[login].check_password_value(password):
        raise BadRequest("Wrong password")

    session["login"] = login

    return "ok"


@app.route("/logout")
def logout():
    if "login" in session:
        del session["login"]
    return ""


@app.route("/save_account", methods=["POST"])
def save_account():
    account = request.json
    if not session.get("login") or not account:
        raise Error("Invalid request")

    if "id" not in account:
        account = database_connections[session["login"]]._add_account(account)
    else:
        account = database_connections[session["login"]]._write_account(account)

    return json.dumps(account)


@app.route("/remove_account", methods=["POST"])
def remove_account():
    account = request.json

    if not session.get("login") or not account or "id" not in account:
        raise Error("Invalid request")

    database_connections[session["login"]]._remove_account(account["id"])

    return "ok"


@app.route("/move_account", methods=["POST"])
def move_account():
    if not session.get("login"):
        raise Error("Invalid request")

    account_id = request.json.get("account_id")
    new_index = request.json.get("new_index")
    into_folder = request.json.get("into_folder")
    dest_account_id = request.json.get("dest_account_id")

    if not into_folder:
        database_connections[session["login"]]._move_account(account_id, new_index)
    else:
        database_connections[session["login"]]._move_into_folder(
            account_id, dest_account_id
        )

    return "ok"


@app.route("/move_up", methods=["POST"])
def move_up():
    if not session.get("login"):
        raise Error("Invalid request")

    account_id = int(request.json.get("account_id"))

    database = database_connections[session["login"]]
    account = database._get_account(account_id)
    folder = database._get_account(account["folder_id"])
    database._move_into_folder(account_id, folder.get("folder_id", 0))

    return "ok"


@app.route("/open_folder", methods=["GET"])
def open_folder():
    if not session.get("login"):
        raise Error("Invalid request")

    folder_id = int(request.args.get("id", 0))

    return json.dumps(database_connections[session["login"]]._open_folder(folder_id))


@app.route("/account/<int:account_id>", methods=["GET"])
def account(account_id):
    if not session.get("login"):
        raise Error("Invalid request")

    return json.dumps(database_connections[session["login"]]._get_account(account_id))


@app.route("/search", methods=["GET"])
def search():
    search = request.args.get("q")
    if not session.get("login"):
        raise Error("Invalid request")

    return json.dumps(database_connections[session["login"]]._search_account(search))


@app.route("/change_password", methods=["POST"])
def change_password():
    if not session.get("login"):
        raise Error("Invalid request")

    old_password = request.json.get("old_password")
    new_password = request.json.get("new_password")

    database = database_connections[session["login"]]

    database.change_password(old_password, new_password)

    return "ok"


@app.route("/totp")
def totp():
    if not session.get("login"):
        raise Error("Invalid request")

    code = request.args.get("code", "")
    code = "".join([c for c in code if c != " "])
    if not code:
        return ""

    totp = pyotp.TOTP(code).now()

    return totp[:3] + " " + totp[3:]


if __name__ == "__main__":
    debug = "dev" in sys.argv
    if debug:
        # disable cache for dev purpose
        app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0

    # `allowed_extensions` is empty because we do not use `eel.expose`
    eel.init("web", allowed_extensions=[])
    eel.start("", port=5002, app=app, size=(500, 700), host="0.0.0.0")

import os
import re
import sys
import eel
import apsw
import json
import pyotp

from database import Database
from flask_helper import Error, check_endpoint
from flask import Flask, request, send_from_directory, session, render_template
from werkzeug.exceptions import BadRequest
from flask import jsonify


app = Flask(__name__, template_folder="web/public")
app.secret_key = os.urandom(1024).hex()

database_connections = {}

"""
Svelte serving
"""


@app.route("/")
def base():
    session["csrf_token"] = os.urandom(32).hex()
    return render_template("index.html", csrf_token=session["csrf_token"])


# Path for all the static files (compiled JS/CSS, etc.)
@app.route("/<path:path>")
def home(path):
    assert ".." not in path
    return send_from_directory("web/public", path)


@app.route("/account_icons")
@check_endpoint(only_json=False, check_csrf_token=False)
def account_icons():
    if not session.get("login"):
        raise

    return json.dumps(
        [f"img/accounts/{icon}" for icon in os.listdir("./web/public/img/accounts")]
    )


@app.route("/databases")
def databases():
    return json.dumps(sorted(os.listdir("./databases")))


"""
API
"""


@app.errorhandler(Error)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.route("/login", methods=["POST"])
@check_endpoint(check_login=False)
def login():
    if session.get("login"):
        return session["login"]

    login = request.json.get("login")
    password = request.json.get("password")

    if not login or not password:
        raise Error("Missing parameters")

    if not re.match(r"^[a-zA-Z0-9.-_\ ]+$", login):
        raise Error("Wrong character in the username")

    if login not in database_connections:
        try:
            database = Database(password, f"./databases/{login}")
            database.check_password()
        except apsw.NotADBError:
            raise Error("Wrong password")
        database_connections[login] = database
    elif not database_connections[login].check_password_value(password):
        raise BadRequest("Wrong password")

    session["login"] = login
    return login


@app.route("/logout")
def logout():
    if "login" in session:
        del session["login"]
    return ""


@app.route("/save_account", methods=["POST"])
@check_endpoint()
def save_account():
    account = request.json
    if not account:
        raise Error("Invalid request")

    if "id" not in account:
        account = database_connections[session["login"]].add_account(account)
    else:
        account = database_connections[session["login"]].write_account(account)

    return json.dumps(account)


@app.route("/save_folder", methods=["POST"])
@check_endpoint()
def save_folder():
    folder = request.json
    if not folder:
        raise Error("Invalid request")

    if "id" not in folder:
        folder = database_connections[session["login"]].add_folder(folder)
    else:
        folder = database_connections[session["login"]].write_folder(folder)

    return json.dumps(folder)


@app.route("/remove_account", methods=["POST"])
@check_endpoint()
def remove_account():
    account = request.json

    if not account or "id" not in account:
        raise Error("Invalid request")

    database_connections[session["login"]].remove_account(account["id"])

    return "ok"


@app.route("/move_account", methods=["POST"])
@check_endpoint()
def move_account():
    account_id = request.json.get("account_id")
    new_index = request.json.get("new_index")
    into_folder = request.json.get("into_folder")
    dest_account_id = request.json.get("dest_account_id")

    if not into_folder:
        database_connections[session["login"]].move_account(account_id, new_index)
    else:
        database_connections[session["login"]].move_into_folder(
            account_id, dest_account_id
        )

    return "ok"


@app.route("/move_folder", methods=["POST"])
@check_endpoint()
def move_folder():
    folder_id = int(request.json.get("folder_id"))
    new_index = int(request.json.get("new_index"))

    database_connections[session["login"]].move_folder(folder_id, new_index)
    return "ok"


@app.route("/delete_folder", methods=["POST"])
@check_endpoint()
def delete_folder():
    folder_id = int(request.json.get("folder_id"))
    database_connections[session["login"]].delete_folder(folder_id)
    return "ok"


@app.route("/open_folder", methods=["GET"])
@check_endpoint(only_json=False, check_csrf_token=False)
def open_folder():
    folder_id = int(request.args.get("id", 0))
    return json.dumps(database_connections[session["login"]].open_folder(folder_id))


@app.route("/get_folders", methods=["GET"])
@check_endpoint(only_json=False, check_csrf_token=False)
def get_folders():
    folders = database_connections[session["login"]].get_folders()
    return json.dumps([{"id": 0, "name": "All", "icon": "home"}] + folders)


@app.route("/account/<int:account_id>", methods=["GET"])
@check_endpoint(only_json=False, check_csrf_token=False)
def account(account_id):
    return json.dumps(database_connections[session["login"]].get_account(account_id))


@app.route("/search", methods=["GET"])
@check_endpoint(only_json=False, check_csrf_token=False)
def search():
    search = request.args.get("q")
    return json.dumps(database_connections[session["login"]].search_account(search))


@app.route("/change_password", methods=["POST"])
@check_endpoint()
def change_password():
    old_password = request.json.get("old_password")
    new_password = request.json.get("new_password")

    database = database_connections[session["login"]]

    database.change_password(old_password, new_password)

    return "ok"


@app.route("/totp")
def totp():
    if not session.get("login"):
        raise Error("Invalid request")

    base32_charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    assert len(base32_charset) == 32

    code = request.args.get("code", "").upper()
    code = "".join([c for c in code if c in base32_charset])
    if not code:
        return ""

    try:
        totp = pyotp.TOTP(code).now()
    except Exception:
        return ""

    return totp[:3] + " " + totp[3:]


if __name__ == "__main__":
    cert = None
    key = None
    debug = "dev" in sys.argv
    for arg in sys.argv:
        if arg.startswith("--cert"):
            cert = arg.split("=")[1]
        if arg.startswith("--key"):
            key = arg.split("=")[1]

    if cert and key:
        app.run(debug=False, host="0.0.0.0", port=5002, ssl_context=(cert, key))
    elif debug:
        # disable cache for dev purpose
        app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
        app.run(debug=True, host="0.0.0.0", port=5002)
    else:
        # `allowed_extensions` is empty because we do not use `eel.expose`
        eel.init("web", allowed_extensions=[])
        eel.start("", port=5002, app=app, size=(500, 700), host="127.0.0.1")

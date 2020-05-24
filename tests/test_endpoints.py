import re
import copy
import requests

# settings to test the running application
BASE_URL = "http://localhost:5002/"
USERNAME = "zzz_test_db"
PASSWORD = "zzz_test_db"


def get_csrf_token(session):
    response = session.get(BASE_URL)
    return re.findall(r'\"csrf-token\" content=\"([^\"]+)"', response.text)[0]


def login(session, csrf_token):
    session.post(
        BASE_URL + "login",
        json={"login": USERNAME, "password": PASSWORD},
        headers={"CSRF-Token": csrf_token},
    )


def test_login():
    session = requests.Session()

    response = session.get(BASE_URL + "login")
    assert response.status_code == 404, "Login endpoint must accept only POST request"

    response = session.post(BASE_URL + "login")
    assert "Wrong headers" in response.text, "Login endpoint must only accept JSON"

    csrf_token = get_csrf_token(session)

    response = session.post(
        BASE_URL + "login",
        json={"login": "test", "password": "q68qsd65qsd65qsd"},
        headers={"CSRF-Token": csrf_token},
    )
    assert "Wrong password" in response.text

    response = session.post(
        BASE_URL + "login",
        json={"login": "test", "password": "qsd54qsd"},
        headers={"CSRF-Token": csrf_token + "wrong_token"},
    )
    assert "Wrong CSRF token" in response.text

    # login successfully on the application
    new_csrf_token = get_csrf_token(session)
    response = session.post(
        BASE_URL + "login",
        json={"login": USERNAME, "password": PASSWORD},
        headers={"CSRF-Token": new_csrf_token},
    )
    assert response.status_code == 200
    assert USERNAME in response.text

    # use the old token
    # a new one must be generated
    response = session.post(
        BASE_URL + "login",
        json={"login": "test", "password": "qsd54qsd"},
        headers={"CSRF-Token": csrf_token},
    )
    assert "Wrong CSRF token" in response.text


def test_api_endpoint():
    test_requests = [
        {"endpoint": "save_account", "json": {"id": 0}},
        {"endpoint": "remove_account", "json": {"id": 0}},
        {
            "endpoint": "move_account",
            "json": {
                "account_id": 1,
                "new_index": 0,
                "into_folder": False,
                "dest_account_id": 1,
            },
        },
        {"endpoint": "open_folder", "method": "get", "csrf": False},
        {"endpoint": "account/1", "method": "get", "csrf": False},
        {"endpoint": "search?q=g", "method": "get", "csrf": False},
        {
            "endpoint": "change_password",
            "json": {"old_password": PASSWORD, "new_password": PASSWORD,},
        },
        {"endpoint": "get_folders", "method": "get", "csrf": False},
        {"endpoint": "get_folders", "method": "get", "csrf": False},
    ]

    for test_request in test_requests:
        endpoint = test_request["endpoint"]
        csrf_security = test_request.get("csrf", True)
        method = test_request.get("method", "json")

        session = requests.Session()
        csrf_token = get_csrf_token(session)

        valid_parameters = {
            "url": BASE_URL + endpoint,
            "headers": {"CSRF-Token": csrf_token} if csrf_security else {},
        }

        if "json" in test_request:
            valid_parameters["json"] = test_request["json"]

        if method == "get":
            request = session.get
        else:
            request = session.post

        response = request(**valid_parameters)
        assert response.status_code == 400
        assert "Not logged" in response.text

        login(session, csrf_token)
        response = request(**valid_parameters)
        assert response.status_code == 200

        if csrf_security:
            parameter = copy.deepcopy(valid_parameters)
            parameter["headers"]["CSRF-Token"] += "XX"

            login(session, csrf_token)
            response = request(**parameter)
            assert response.status_code == 400
            assert "Wrong CSRF token" in response.text

        if "json" in test_request:
            parameter = copy.deepcopy(valid_parameters)
            parameter["headers"]["CSRF-Token"] += "XX"
            parameter["headers"]["Content-Type"] = "plain/text"

            login(session, csrf_token)
            response = request(**parameter)
            assert response.status_code == 400
            assert "Wrong headers" in response.text


if __name__ == "__main__":
    test_login()
    test_api_endpoint()

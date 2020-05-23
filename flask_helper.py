from flask import request, session
from functools import wraps


class Error(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


def url_ok(url, port):
    # Use httplib on Python 2
    try:
        from http.client import HTTPConnection
    except ImportError:
        from httplib import HTTPConnection

    try:
        conn = HTTPConnection(url, port)
        conn.request("GET", "/")
        r = conn.getresponse()
        return r.status == 200
    except Exception:
        return False


def check_endpoint(only_json=True, check_csrf_token=True, check_login=True):
    """Wrapper for Flask JSON routes.

    Make some security verification and parse the headers.
    """
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            if check_login and not session.get("login"):
                raise Error("Not logged")

            headers = request.headers
            if only_json and headers.get('Content-Type') != 'application/json':
                raise Error("Wrong headers")

            csrf_token = session.get("csrf_token")
            provided_csrf_token = headers.get("CSRF-Token")
            if check_csrf_token and provided_csrf_token != csrf_token or not csrf_token:
                raise Error("Wrong CSRF token")

            return function(*args, **kwargs)
        return wrapper
    return decorator

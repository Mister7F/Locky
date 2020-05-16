# Locky
Locky is a password manager written in python

*Under development*

<p align="center">
    <a href="https://www.youtube.com/watch?v=AtO5PiIEL8w" target="_blank">
        <img src="https://raw.githubusercontent.com/Mister7F/Locky/master/screenshots/1.png"/>
    </a>
</p>

# Install
First, install the python dependencies,
> `pip install -r requirements.txt`

Then, you can start the application with,
> `python main.py`

# Dev
First, install `npm` and `python`

Install the npm dependency
> `npm install --save-dev svelte-mui`

Then, install the python dependencies,
> `pip install -r requirements.txt`

Then, run
> `cd web && npm run dev`

And start the python application in dev mode
> `python main.py dev`

# Technologies
Python has been used for the backend with `Flask` and `Svelte` for the frontend (with `svelte-mui` for the components).

The accounts are stored in a SQLite encrypted database
- AES 256 bits
- CBC mode
- scrypt as key derivation algorithm

# Todo
- UI
    - account editor
        - scroll to bottom if add a new field
        - save & close on press enter
    - auto logout if loose session *should work now, to test*
    - test on mobile (phone & tablet)
    - use prettier on svelte files (make it work for svelte)
    - create initial wallet
- Backend
    - G-Drive sync
    - `database.py`, optimize `move_account` to drop the column `sequence_tmp`
    - use only account ID when possible
    - `databse.py` make method public
    - clean database function
    - error on component (shake them)
- Security
    - Check route login
    - Check route path (home & base routes)
    - Check CSRF
    - Add unit test on the endpoints
    - HMAC database
- Other
    - Build binary
    - Clean the all code

# Ideas
- Multiple databases
    - choose the database in the lock screen
- Sync with Dropbox
- Check if passwords have been leaked
- Write notes in markdown



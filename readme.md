# Locky
Locky is a password manager written in python

*Under development*

<p align="center">
    <a href="https://youtu.be/4DK_RlTr8Jg" target="_blank">
        <img src="https://raw.githubusercontent.com/Mister7F/Locky/master/screenshots/presentation.gif"/>
    </a>
</p>

# Install
First, install the python dependencies,
> `pip install -r requirements.txt`

Then, you can start the application with,
> `python main.py`

# Dev
First, install `npm` and `python`

Then,
> `cd web && npm install`

Install the npm dependency
> `npm install --save-dev svelte-material-ui node-sass sass-loader rollup-plugin-postcss`

Then, install the python dependencies,
> `pip install -r requirements.txt`

Then, run
> `cd web && npm run dev`

And start the python application in dev mode
> `python main.py dev`

Use `black` to prettify the python code

Use `prettier` to format the svelte file
> `npm i --save-dev prettier-plugin-svelte prettier`

> `cd web && prettier --write --tab-width=4 --plugin-search-dir=. ./src/*.svelte ./src/*/*.svelte`

# Technologies
Python has been used for the backend with `Flask` and `Svelte` for the frontend (with `svelte-material-ui` for the components).

The accounts are stored in a SQLite encrypted database
- AES 256 bits
- CBC mode
- scrypt as key derivation algorithm

# Todo
- UI
    - account editor
        - save & close on press enter
    - test on mobile (phone & tablet)
    - create initial wallet
- Backend
    - G-Drive sync
    - `database.py`, optimize `move_account` to drop the column `sequence_tmp`
    - use only account ID when possible
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



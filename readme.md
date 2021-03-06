# Locky
Locky is a password manager written in python

*Under development*

<p align="center">
    <img src="https://raw.githubusercontent.com/Mister7F/Locky/master/screenshots/presentation.gif" height="700"/>
    <br/>
    <a href="https://github.com/Mister7F/Locky/blob/master/screenshots/presentation.mp4?raw=true" target="_blank">Download the video</a>
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

# Mobile
Want to use the application on mobile ?

Go on your browser, navigate to your Locky instance, and <a href="https://www.howtogeek.com/196087/how-to-add-websites-to-the-home-screen-on-any-smartphone-or-tablet/">send the application to the home screen</a>.

# HTTPS
If you want to access to the application remotely, you might want to use HTTPS (and you really should).

You can generate a certificate
> `openssl req -x509 -nodes -days 730 -newkey rsa:2048 -keyout server.key -out server.crt -sha256`

Then, start the server with the SSL certificate
> `python main.py --cert=./certificate/server.crt --key=./certificate/server.key`

Register the certificate on your devices (to prevent MITM, do not accept unknown certificates)

Android,
> `Settings -> Password & Security -> Privacy -> Encryption & credentials -> Install the certificate (.cert) from your SD card`


# Technologies
Python has been used for the backend with `Flask` and `Svelte` for the frontend (with `svelte-material-ui` for the components).

The accounts are stored in a SQLite encrypted database
- AES 256 bits in CBC mode
- HMAC-SHA256 for the data signature
- scrypt as key derivation algorithm

# Todo
- UI
    - save & close on press enter/esc
    - test on mobile (phone & tablet)
    - show copy notification in the account editor
    - compute password strength
    - show password strength only on creation
    - generate password
    - animate account when changing folder
- Backend
    - G-Drive sync
    - `database.py`, optimize `move_account` to drop the column `sequence_tmp`
    - close the process when the window is closed
- Security
    - update security test for new route
        - method "setCurrentFoler" ?
        - wallet & uiWallet ? (the different method (setCurrentFoler, search) apply filter on wallet)
- Other
    - Build binary
    - Clean the all code

# Ideas
- Sync with Dropbox
- add themes
- Write notes in markdown
- Keep an history of all the modification
- Shortcut
    - ctrl C
    - ctrl V
    - escape to close form
    - reverse navigation
- Store file
- View old passwords
- Statistics on the accounts
- Store setting in local storage instead of cookies

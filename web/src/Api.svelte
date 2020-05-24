<script context="module">
    function csrf_token() {
        // https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
        return document
            .querySelector("meta[name='csrf-token']")
            .getAttribute("content");
    }

    export async function login(username, password) {
        let response = await fetch("/login", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrf_token(),
            },
            body: JSON.stringify({ login: username, password: password }),
        });

        if (response.ok) {
            return await response.text();
        }

        return false;
    }

    export async function logout() {
        let response = await fetch("/logout");
        return response.ok;
    }

    export async function getAccounts(folderId) {
        let response = await fetch(
            "/open_folder?id=" + encodeURIComponent(folderId || 0)
        );
        if (!response.ok) {
            return null;
        }
        return await response.json();
    }

    export async function getFolders() {
        let response = await fetch("/get_folders");
        if (!response.ok) {
            return null;
        }
        return await response.json();
    }

    export async function moveFolder(folder_id, new_index) {
        let response = await fetch("/move_folder", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrf_token(),
            },
            body: JSON.stringify({
                folder_id: folder_id,
                new_index: new_index,
            }),
        });
        return response.ok;
    }

    export async function deleteFolder(folder_id) {
        let response = await fetch("/delete_folder", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrf_token(),
            },
            body: JSON.stringify({ folder_id: folder_id }),
        });
        return response.ok;
    }

    export async function saveFolder(folder) {
        let response = await fetch("/save_folder", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrf_token(),
            },
            body: JSON.stringify(folder),
        });

        if (response.ok) {
            return await response.json();
        }
        return false;
    }

    export async function saveAccount(account) {
        let response = await fetch("/save_account", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrf_token(),
            },
            body: JSON.stringify(account),
        });

        if (response.ok) {
            return await response.json();
        }
        return false;
    }

    export async function searchAccount(search) {
        let response = await fetch("/search?q=" + encodeURIComponent(search));
        if (response.ok) {
            return await response.json();
        }
        return false;
    }

    export async function moveAccountInFolder(detail) {
        let response = await fetch("/move_account", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrf_token(),
            },
            body: JSON.stringify(detail),
        });

        return response.ok;
    }

    export async function getAccount(account_id) {
        let response = await fetch(
            "/account/" + encodeURIComponent(account_id || 0)
        );

        if (response.ok) {
            return await response.json();
        }
        return false;
    }

    export async function updatePassword(oldPassword, newPassword) {
        let response = await fetch("/change_password", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrf_token(),
            },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
            }),
        });

        return response.ok;
    }

    export async function getDatabasesName() {
        let response = await fetch("/databases");
        if (response.ok) {
            return await response.json();
        }
        return false;
    }
</script>

<script context="module">

    function csrf_token() {
        // https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
        return document.querySelector("meta[name='csrf-token']").getAttribute("content");
    }

    export async function login(password) {
        let response = await fetch("/login", {
            method: "post",
            headers: { "Content-Type": "application/json", "CSRF-Token": csrf_token() },
            body: JSON.stringify({ login: "admin", password: password }),
        });

        return response.ok;
    }

    export async function logout() {
        let response = await fetch("/logout");
        return response.ok;
    }

    export async function getAccounts(folderId) {
        let response = await fetch("/open_folder?id=" + encodeURIComponent(folderId || 0));
        if (!response.ok) {
            return null;
        }
        return await response.json();
    }

    export async function updateAccount(account) {
        let response = await fetch("/save_account", {
            method: "post",
            headers: { "Content-Type": "application/json", "CSRF-Token": csrf_token() },
            body: JSON.stringify(account),
        });

        if (response.ok) {
            return await response.json();
        }
        return false;
    }

    export async function searchAccount(search) {
        let response = await fetch(
            "/search?q=" + encodeURIComponent(search)
        );
        if (response.ok) {
            return await response.json();
        }
        return false;
    }

    export async function moveAccountUp(account_id) {
        let response = await fetch("/move_up", {
            method: "post",
            headers: { "Content-Type": "application/json", "CSRF-Token": csrf_token() },
            body: JSON.stringify({ account_id: account_id }),
        });

        return response.ok;
    }

    export async function moveAccountInFolder(detail) {
        let response = await fetch("/move_account", {
            method: "post",
            headers: { "Content-Type": "application/json", "CSRF-Token": csrf_token() },
            body: JSON.stringify({
                account_id: detail.fromItem.id,
                new_index: detail.to,
                into_folder: detail.intoFolder,
                dest_account_id: detail.destItem.id,
            }),
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
            headers: { "Content-Type": "application/json", "CSRF-Token": csrf_token() },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
            }),
        });

        return response.ok;
    }


</script>

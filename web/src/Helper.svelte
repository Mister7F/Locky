<script context="module">
    export function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
    }

    export function copyValue(str) {
        const el = document.createElement("textarea");
        // clear the clipboard with space if nothing
        el.value = str || " ";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
    }

    export async function getTotpCode(token) {
        let response = await fetch("/totp?code=" + encodeURIComponent(token));
        if (response.ok) {
            return await response.text();
        }
    }
</script>

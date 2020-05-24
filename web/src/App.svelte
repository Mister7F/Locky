<script>
    import Wallet from "./Wallet.svelte";
    import LockScreen from "./LockScreen.svelte";
    import { getCookie } from "./Helper.svelte";
    import { logout } from "./Api.svelte";

    let username = "";
    let wallet = [];
    let locked = true;
    let walletElement;

    function openWallet(event) {
        locked = false;
        setTimeout(() => {
            // do after the DOM is updated
            walletElement.openFolder(
                parseInt(getCookie("currentFolderId")) || 0
            );
        });
    }

    async function lock() {
        await logout();
        locked = true;
        wallet = [];
    }
</script>

<style>
    @font-face {
        font-family: "Open Sans";
        font-style: normal;
        font-weight: 400;
        src: url("/font/OpenSans-Regular.ttf");
    }
    :global(*) {
        /* Svelte MUI */
        --background: #fcfcfc;

        /* Other colors */
        --link-color: #1877f2;
        --error-color: #e53935;
        --wallet-background: #edf0f2;
        --account-background: #fff;

        transition-timing-function: ease;
        user-select: none;
    }

    :global(html),
    :global(body) {
        margin: 0;
        padding: 0;
        overflow: hidden;
    }

    .root {
        font-family: "Open Sans";
        font-size: 15px;
        height: 100vh;
        width: 100vw;
        margin: 0;
        overflow: hidden;
        overflow-x: hidden;
    }

    :global(.wallet) {
        height: calc(100% - 56px);
        overflow-y: scroll;
        margin-top: 56px;
    }

    /* Scroll bar */
    :global(::-webkit-scrollbar) {
        width: 6px;
    }

    /* Track */
    :global(::-webkit-scrollbar-track) {
    }

    /* Handle */
    :global(::-webkit-scrollbar-thumb) {
        background: var(--primary);
    }

    /* Handle on hover */
    :global(::-webkit-scrollbar-thumb:hover) {
        background: var(--primary);
    }
</style>

<svelte:head>
    <script src="/lib/qrious.min.js">

    </script>
    <script type="text/javascript" src="/lib/eel.js">

    </script>
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700" />
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Roboto+Mono" />
</svelte:head>

<div class="root">
    {#if locked}
        <LockScreen on:open_wallet={openWallet} bind:username />
    {:else}
        <Wallet
            bind:wallet
            on:lock={lock}
            bind:this={walletElement}
            bind:username />
    {/if}
</div>

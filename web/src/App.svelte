<script>
    import Wallet from './Wallet.svelte';
    import LockScreen from './LockScreen.svelte';
    import { flip } from 'svelte/animate';

    let wallet = [];
    let locked = true;
    let walletElement;

    function openWallet (event) {
        locked = false;
        setTimeout(() => {
            // do after the DOM is updated
            walletElement.openFolder(getCookie('currentFolderId') || 0);
        });
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    async function lock () {
        await fetch('/logout');
        locked = true;
        wallet = [];
    }
</script>

<svelte:head>
    <script src="/lib/qrious.min.js"></script>
</svelte:head>

<div class="root">
    {#if locked}
    <LockScreen on:open_wallet={openWallet}/>
    {:else}
    <Wallet wallet={wallet} on:lock={lock} bind:this={walletElement}/>
    {/if}
</div>

<style lang="less">
    @font-face {
        font-family: 'Open Sans';
        font-style: normal;
        font-weight: 400;
        src: url('/font/OpenSans-Regular.ttf');
    }
    :global(*) {
        /* Svelte MUI */
        --color: #688c89;
        --label: #688c89;
        --primary: #C876E0;
        --background: #272B34;
        --accent:  #C876E0;

        /* Other colors */
        --link-color: #1976d2;
        --error-color: #e53935;
        --wallet-background: #FCFCFC;
        --account-background: #FFF;

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
        font-family: 'Open Sans';
        font-size: 15px;
        height: 100vh;
        width: 100vw;
        margin: 0;
        overflow: hidden;
        overflow-x: hidden;
    }

    .wallet {
        height: calc(100% - 3em);
        overflow-y: scroll;
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
        background: var(--background);
    }

    /* Handle on hover */
    :global(::-webkit-scrollbar-thumb:hover) {
        background: var(--background);
    }
</style>

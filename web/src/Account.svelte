<script>
    import Card, {
        Content,
        PrimaryAction,
        Actions,
        ActionButtons,
        ActionIcons,
    } from "@smui/card";
    import Button, { Label } from "@smui/button";
    import IconButton, { Icon } from "@smui/icon-button";

    import { createEventDispatcher } from "svelte";
    import { copyValue, getTotpCode } from "./Helper.svelte";

    const dispatch = createEventDispatcher();
    export let account;
    export let viewMode = "detail";

    let editingFolder = false;
    let editFolderNameElement;

    function saveFolder() {
        editingFolder = false;
        dispatch("save_folder", account);
    }
</script>

<style>
    .account {
        padding: 0;
        margin: 0;
        width: 150px;
        height: 70px;
        margin: 10px;
        cursor: pointer;
    }

    .account:hover {
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19),
            0 6px 6px rgba(0, 0, 0, 0.23);
    }

    .card {
        padding: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: var(--surface);
        border: 1px solid var(--on-surface);
        border-radius: 2px;
        transition: 0.1s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
        width: 150px;
        height: 70px;
        margin: 0;
        overflow: hidden;
        box-sizing: border-box;
    }

    .row {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        max-height: 100%;
        max-width: 100%;
    }

    h5 {
        font-size: 1.2em;
    }

    .image {
        margin-right: 10px;
        max-height: 40px;
        max-width: 100%;
    }

    .strength {
        float: right;
        margin-top: -30px;

        display: block;
        cursor: pointer;
        /* Set in HTML */
        /* --force: 90; */
        --red: calc(255 * ((100 - var(--force)) / 100));
        --green: calc(255 * var(--force) / 100);
        width: 30px;
        height: 30px;
        background-image: linear-gradient(
            to bottom right,
            RGBA(var(--red), var(--green), 0, 0) 50%,
            RGBA(var(--red), var(--green), 0, 1)
        );
    }
    :global(.drag_over) .account {
        color: var(--accent);
        border: 1px solid var(--accent);
    }

    img {
        pointer-events: none;
        max-height: 100%;
        max-width: 100%;
        height: 30px;
    }

    /* Detail mode */
    .detail-card {
        margin: 0;
        color: var(--on-surface);
        width: 280px;
        height: 170px;
        overflow: hidden;
    }
    :global(.detail_primary_action) {
        padding: 5px;
        border-bottom: 1px solid var(--on-surface);
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
    }
    .folder :global(.detail_primary_action) {
        height: 145px;
        border: 0;
    }
    .detail_img {
        min-height: 70px;
        min-width: 70px;
        height: 70px;
        width: 70px;
        padding: 8px;
        box-sizing: border-box;
    }
    .detail_img img {
        max-width: 100%;
        max-height: 100%;
        height: 100%;
    }

    .detail_title {
        margin-left: 10px;
        box-sizing: border-box;
    }

    .detail_name {
        font-weight: 600;
        font-size: 1.5em;
    }
    .detail_login {
        font-weight: 500;
        font-size: 1em;
    }

    :global(.detail-card) .strength {
        margin-top: 0px;
        margin-bottom: -30px;
        transform: rotate(270deg);
        margin-left: calc(100% - 30px);
    }

    :global(.detail_account_actions) {
    }
</style>

{#if viewMode === 'minimalist'}
    <div class="account" on:click={() => dispatch('click')}>
        <div class="card">
            <div class="row">
                <div class="image">
                    <img src={account.icon} alt="Account" />
                </div>
                <h5>{account.name}</h5>
            </div>
        </div>
        {#if !account.folder}
            <div class="strength" style="--force: {account.force || 0}" />
        {/if}
    </div>
{:else}
    <div class="detail-card {account.folder ? 'folder' : ''}">
        <Card>
            {#if !account.folder}
                <div class="strength" style="--force: {account.force || 0}" />
            {/if}
            <PrimaryAction
                class="detail_primary_action"
                on:click={() => dispatch('click')}>
                <div class="detail_img">
                    <img src={account.icon} alt="Account" />
                </div>
                <div class="detail_title">
                    <div class="detail_name">{account.name}</div>
                    <div class="detail_login">{account.login}</div>
                </div>
            </PrimaryAction>
            {#if !account.folder}
                <Actions class="detail_account_actions">
                    <ActionButtons>
                        {#if account.url && account.url.startsWith('http')}
                            <IconButton
                                class="material-icons"
                                title="Open URL"
                                href={account.url}
                                target="_blank">
                                launch
                            </IconButton>
                        {/if}
                    </ActionButtons>
                    <ActionIcons>
                        {#if account.login}
                            <IconButton
                                class="material-icons"
                                on:click={() => {
                                    dispatch('notify', 'Login copied');
                                    copyValue(account.login);
                                }}
                                title="More options">
                                alternate_email
                            </IconButton>
                        {/if}
                        {#if account.password}
                            <IconButton
                                class="material-icons"
                                on:click={() => {
                                    dispatch('notify', 'Password copied');
                                    copyValue(account.password);
                                }}
                                title="Share">
                                vpn_key
                            </IconButton>
                        {/if}
                        {#if account.totp}
                            <IconButton
                                class="material-icons"
                                on:click={async () => {
                                    dispatch('notify', '2FA copied');
                                    copyValue((await getTotpCode(account.totp)).replace(' ', ''));
                                }}
                                title="Share">
                                schedule
                            </IconButton>
                        {/if}
                    </ActionIcons>
                </Actions>
            {/if}
        </Card>
    </div>
{/if}

<script>
    import Card, {
        Content,
        PrimaryAction,
        Media,
        MediaContent,
        Actions,
        ActionButtons,
        ActionIcons,
    } from "@smui/card";
    import Button, { Label } from "@smui/button";
    import IconButton, { Icon } from "@smui/icon-button";
    import Include from "./Include.svelte";
    import { copyValue, getTotpCode } from "./Helper.svelte";
    import { createEventDispatcher } from "svelte";

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
        width: 180px;
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
        background-color: var(--account-background);
        border: 1px solid var(--background);
        border-radius: 2px;
        transition: 0.1s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
        width: 180px;
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
    }

    h5 {
        font-size: 1.2em;
    }

    .image {
        margin-right: 10px;
    }

    .image * {
        width: 30px;
        max-height: 30px;
        fill: var(--background);
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

    .account:hover .edit {
        opacity: 1;
    }

    img {
        pointer-events: none;
    }

    /* Detail mode */
    .detail-card {
        margin: 15px;
        color: var(--color);
    }
    :global(.detail_primary_action) {
        height: 70%;
    }
    .folder :global(.detail_primary_action) {
        height: 100%;
    }
    .detail_img {
        margin: auto;
        max-width: 100%;
        margin-top: 10%;
        height: 65%;
        min-height: 65%;
    }
    .detail_img img {
        max-width: 100%;
        max-height: 100%;
        height: 100%;
        opacity: 0.2;
    }

    .detail_title {
        padding: 5px 20px;
        margin-top: -100%;
        box-sizing: border-box;
    }
    .detail_name {
        font-size: 1.7em;
    }
    .detail_login {
        font-size: 1em;
    }

    :global(.detail-card) .strength {
        margin-top: 0;
        margin-bottom: -30px;
        transform: rotate(270deg);
        margin-left: calc(100% - 30px);
    }

    /* List mode */
    .account_list {
        border: 1px solid red;
        width: calc(100vw - 20px);
        height: 60px;
        padding: 0 50px;
        align-items: center;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        box-sizing: border-box;
        margin: 10px;
    }

    .account_list_actions {
        border: 1px solid red;
        display: flex;
        align-items: center;
        flex-direction: row;
        justify-content: flex-end;
        box-sizing: border-box;
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
        <Card style="height: 150px; width: 250px;">
            <PrimaryAction
                class="detail_primary_action"
                on:click={() => dispatch('click')}>
                {#if !account.folder}
                    <div
                        class="strength"
                        style="--force: {account.force || 0}" />
                {/if}
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
                            <Button href={account.url} target="_blank">
                                <Label>Open</Label>
                            </Button>
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

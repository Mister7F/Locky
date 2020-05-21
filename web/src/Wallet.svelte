<script>
    import Snackbar, { Actions } from "@smui/snackbar";
    import IconButton from "@smui/icon-button";
    import Fab, { Label, Icon } from "@smui/fab";

    import Account from "./Account.svelte";
    import AccountEditor from "./AccountEditor.svelte";
    import Navbar from "./Navbar.svelte";
    import Sortablegrid from "./components/Sortablegrid.svelte";
    import Sidepanel from "./components/Sidepanel.svelte";
    import { getCookie } from "./Helper.svelte";

    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let wallet = [];

    let currentFolderId = 0;
    let activeAccountIndex = null;
    let accountEditor;
    let dragging;
    let viewMode = getCookie("viewMode") || "detail";

    let menuVisible = false;

    let snackbar;
    let snackbarText;

    $: menuHideTrigger = menuVisible ? "" : closeMenu();

    function closeMenu() {
        menuVisible = false;
        activeAccountIndex = -1;
        if (accountEditor) accountEditor.reset();
    }

    function computePasswordStrength(account) {
        // Todo: better function
        account.force = account.password.length * 10;
        return account;
    }

    async function moveAccount(event) {
        let response = await fetch("/move_account", {
            method: "post",
            headers: { "Content-Type": "application/json;" },
            body: JSON.stringify({
                account_id: event.detail.fromItem.id,
                new_index: event.detail.to,
                into_folder: event.detail.intoFolder,
                dest_account_id: event.detail.destItem.id,
            }),
        });

        if (!response.ok) {
            dispatch("lock");
        }
    }

    function clickAccount(account) {
        if (account.folder) {
            openFolder(account.id);
        } else {
            editAccount(account);
        }
    }

    function editAccount(account, read = true) {
        activeAccountIndex = wallet.findIndex((a) => a.id === account.id);

        accountEditor.editAccount(wallet[activeAccountIndex], read);
        menuVisible = true;
    }

    function newAccount() {
        activeAccountIndex = -1;
        accountEditor.newAccount({
            folder_id: currentFolderId,
            icon: "img/account_default.svg",
        });
        menuVisible = true;
    }

    async function saveAccount(event) {
        let response = await fetch("/save_account", {
            method: "post",
            headers: { "Content-Type": "application/json;" },
            body: JSON.stringify(event.detail.account),
        });

        if (response.ok) {
            let account = computePasswordStrength(await response.json());
            if (activeAccountIndex < 0) {
                // new account
                wallet = wallet.concat(account);
            } else {
                // write on existing account
                wallet[activeAccountIndex] = account;
            }
            closeMenu();
        } else {
            dispatch("lock");
        }
    }

    async function removeAccount(event) {
        let response = await fetch("/remove_account", {
            method: "post",
            headers: { "Content-Type": "application/json;" },
            body: JSON.stringify(event.detail.account),
        });
        if (response.ok) {
            wallet = wallet.filter((account) => {
                return account.id !== event.detail.account.id;
            });
            closeMenu();
        } else {
            dispatch("lock");
        }
    }

    export async function openFolder(folderId) {
        let response = await fetch(
            "/open_folder?id=" + encodeURIComponent(folderId || 0)
        );
        if (response.ok) {
            currentFolderId = folderId;
            document.cookie = "currentFolderId=" + folderId;

            let accounts = await response.json();
            for (let account of accounts) {
                account = computePasswordStrength(account);
            }
            wallet = accounts;
        }
    }

    async function goBack() {
        let response = await fetch(
            "/account/" + encodeURIComponent(currentFolderId || 0)
        );

        if (response.ok) {
            let folder = await response.json();
            await openFolder(folder.folder_id);
        }
    }

    async function search(event) {
        if (!event.detail || !event.detail.length) {
            openFolder(currentFolderId);
            return;
        }

        let response = await fetch(
            "/search?q=" + encodeURIComponent(event.detail)
        );
        if (response.ok) {
            wallet = await response.json();
        }
    }

    async function newFolder() {
        let folder = {
            name: "Folder",
            icon: "img/folder.svg",
            folder: 1,
            folder_id: currentFolderId,
        };
        wallet = wallet.concat(folder);
        await saveFolder(folder);
    }

    async function saveFolder(folder) {
        await saveAccount({ detail: { account: folder } });
    }

    async function accountAction(event) {
        let action = event.detail.action.classList.contains(
            "parent_folder_action"
        )
            ? "parent"
            : "edit";
        let account = event.detail.item;

        if (action === "parent") {
            let response = await fetch("/move_up", {
                method: "post",
                headers: { "Content-Type": "application/json;" },
                body: JSON.stringify({ account_id: account.id }),
            });

            if (response.ok) {
                await openFolder(currentFolderId);
            }
        } else if (action === "edit") {
            editAccount(account, false);
        }
    }

    function onNotify(event) {
        snackbar.close();
        snackbarText = event.detail;
        snackbar.open(snackbarText);
    }

    /* ** DEBUG ** */
    import { onMount, onDestroy, getContext } from "svelte";
    onMount(() => {
        setTimeout(() => {
            // editAccount(wallet[0])
        }, 200);
    });
</script>

<style>
    .wallet {
        height: calc(100vh - 50px);
        padding-top: 20px;
        background-color: var(--wallet-background);
    }
    .actions {
        position: absolute;
        z-index: 999;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        left: -65px;
        bottom: 20px;
        height: 120px;
        width: 60px;
        background: transparent;
        transition: 0.5s cubic-bezier(0.47, 1.64, 0.41, 0.8);
    }

    .actions.visible {
        left: 20px;
    }

    .actions :global(.button) {
        position: initial;
    }

    :global(.new_account) {
        position: absolute;
        bottom: -65px;
        right: -65px;
        transition: all 0.5s cubic-bezier(0.47, 1.64, 0.41, 0.8);
    }

    :global(.new_account).visible {
        bottom: 20px;
        right: 20px;
    }

    :global(.new_account:active) {
        transform: rotate(-90deg);
    }

</style>

<Sidepanel bind:visible={menuVisible}>
    <AccountEditor
        bind:this={accountEditor}
        on:close={() => menuVisible = false}
        on:save_account={saveAccount}
        on:remove_account={removeAccount} />
</Sidepanel>
<Navbar
    on:lock
    on:search={search}
    on:new_folder={newFolder}
    on:go_back={goBack}
    bind:viewMode />
<div class="wallet">
    <Sortablegrid
        on:move={moveAccount}
        on:action={accountAction}
        bind:items={wallet}
        let:item
        let:index
        bind:dragging>
        <div slot="actions" class="actions {dragging ? 'visible' : ''}">
            <Fab class="parent_folder_action">
                <Icon class="material-icons">arrow_drop_up</Icon>
            </Fab>
            <Fab class="edit_account_action">
                <Icon class="material-icons">create</Icon>
            </Fab>
        </div>
        <div slot="item">
            <Account
                account={item}
                on:click={() => clickAccount(item)}
                on:save_folder={() => {
                    saveFolder(item);
                }}
                bind:viewMode
                on:notify={onNotify} />
        </div>
    </Sortablegrid>
    <Fab class="new_account {dragging ? '' : 'visible'}" on:click={newAccount}>
        <Icon class="material-icons">add</Icon>
    </Fab>
</div>

<Snackbar bind:this={snackbar} bind:labelText={snackbarText}>
    <Label />
    <Actions>
        <IconButton class="material-icons" title="Dismiss">close</IconButton>
    </Actions>
</Snackbar>

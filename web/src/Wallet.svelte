<script>
    import Snackbar, { Actions } from "@smui/snackbar";
    import IconButton from "@smui/icon-button";
    import Button from "@smui/button";
    import Textfield from "@smui/textfield";
    import Fab, { Label } from "@smui/fab";
    import Dialog, { Title, Content } from "@smui/dialog";
    import Menu, { SelectionGroup, SelectionGroupIcon } from "@smui/menu";
    import List, {
        Group,
        Item,
        Graphic,
        Meta,
        Separator,
        Subheader,
        Text,
        PrimaryText,
        SecondaryText,
    } from "@smui/list";

    import Account from "./Account.svelte";
    import Folders from "./Folders.svelte";
    import AccountEditor from "./AccountEditor.svelte";
    import Icon from "./components/Icon.svelte";
    import Navbar from "./Navbar.svelte";
    import Sortablegrid from "./components/Sortablegrid.svelte";
    import Sidepanel from "./components/Sidepanel.svelte";
    import { getCookie } from "./Helper.svelte";
    import {
        getAccounts,
        saveAccount,
        searchAccount,
        getAccount,
        moveAccountInFolder,
        getFolders,
        saveFolder,
        deleteFolder,
    } from "./Api.svelte";

    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let wallet = [];
    let folders = null;

    let currentFolderId = 0;
    let activeAccountIndex = null;
    let accountEditor;
    let dragging;
    let viewMode = getCookie("viewMode") || "detail";
    export let username = "";

    let menuVisible = false;

    // folders variable
    let walletWidth;
    let foldersVisible = false;
    $: floatingFolder = walletWidth < 870;

    let snackbar;
    let snackbarText;

    $: accountsMovable = !!currentFolderId;

    $: menuHideTrigger = menuVisible ? "" : closeMenu();
    let folderDomIds = [];
    $: {
        folderDomIds = [];
        for (let folder of folders || []) {
            folderDomIds = folderDomIds.concat(["item_folder_" + folder.id]);
        }
    }

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
        let newIndex = event.detail.to;
        let movedAccount = event.detail.fromItem;

        if (!currentFolderId) {
            // we are in the "all accounts" folder
            // we must recompute the new index based on the accounts
            // in the original directory, not based on all the accounts
            let firstFolderAccountIndex = wallet.findIndex(
                (a) => a.folder_id === movedAccount.folder_id
            );
            newIndex -= firstFolderAccountIndex;
        }

        let detail = {
            account_id: movedAccount.id,
            new_index: newIndex,
            into_folder: event.detail.intoFolder,
            dest_account_id: event.detail.destItem.id,
        };
        if (!(await moveAccountInFolder(detail))) {
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

    async function onSaveAccount(event) {
        let account = await saveAccount(event.detail.account);

        if (account) {
            account = computePasswordStrength(account);
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

    export async function openFolder(folderId) {
        let accounts = await getAccounts(folderId);

        if (accounts) {
            currentFolderId = folderId;
            document.cookie = "currentFolderId=" + folderId;
            for (let account of accounts) {
                account = computePasswordStrength(account);
            }
            wallet = accounts;
        }

        if (!folders) {
            folders = await getFolders();
        }
    }

    async function onSearchAccount(event) {
        if (!event.detail || !event.detail.length) {
            openFolder(currentFolderId);
            return;
        }

        let results = await searchAccount(event.detail);
        if (results) {
            wallet = results;
        }
    }

    async function accountAction(event) {
        let actionElement = event.detail.action;
        if (actionElement.id && actionElement.id.startsWith("item_folder_")) {
            let folderId = actionElement.id.split("item_folder_")[1];
            await moveAccountInFolder({
                account_id: event.detail.item.id,
                new_index: -1,
                into_folder: 1,
                dest_account_id: parseInt(folderId),
            });
            await openFolder(currentFolderId);
            return;
        }
    }

    function onNotify(event) {
        snackbar.close();
        snackbarText = event.detail ? event.detail : event;
        snackbar.open(snackbarText);
    }

    /* ** DEBUG ** */
    import { onMount, onDestroy, getContext } from "svelte";
    onMount(() => {
        setTimeout(() => {
            // editAccount(wallet[0])
            // editFolder(folders[0]);
        }, 200);
    });
</script>

<style>
    .wallet {
        height: calc(100vh - 50px);
        padding-top: 20px;
        background-color: var(--wallet-background);
    }

    :global(.new_account) {
        position: absolute;
        bottom: -65px;
        right: -65px;
        transition: all 0.5s cubic-bezier(0.47, 1.64, 0.41, 0.8);
    }

    :global(.new_account).visible {
        bottom: 40px;
        right: 20px;
    }

    :global(.new_account:active) {
        transform: rotate(-90deg);
    }

    /* Folder list */
    .wallet {
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    .wallet :global(.accountsGrid) {
        width: 100%;
    }
</style>

<Sidepanel bind:visible={menuVisible}>
    <AccountEditor
        bind:this={accountEditor}
        on:close={() => (menuVisible = false)}
        on:save_account={onSaveAccount} />
</Sidepanel>
<Navbar
    on:lock
    on:search={onSearchAccount}
    bind:viewMode
    on:show_folders={() => (foldersVisible = !foldersVisible)}
    bind:floatingFolder
    bind:username />
<div class="wallet" bind:clientWidth={walletWidth}>
    <Folders
        bind:folders
        bind:floating={floatingFolder}
        bind:visible={foldersVisible}
        on:open_folder={(event) => {
            foldersVisible = false;
            openFolder(event.detail);
        }}
        bind:currentFolderId />

    <Sortablegrid
        class="accountsGrid"
        on:move={moveAccount}
        on:action={accountAction}
        on:move_blocked={() => onNotify('Can not move accounts in this folder')}
        bind:items={wallet}
        let:item
        let:index
        bind:dragging
        bind:movable={accountsMovable}
        bind:customActions={folderDomIds}>
        <div slot="item">
            <Account
                account={item}
                on:click={() => clickAccount(item)}
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

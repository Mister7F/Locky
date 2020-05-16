<script>
    import { Button, Icon, Sidepanel } from 'svelte-mui';
    import Account from './Account.svelte';
    import AccountEditor from './AccountEditor.svelte';
    import Navbar from './Navbar.svelte';
    import Menu from './Menu.svelte';
    import Sortablegrid from './Sortablegrid.svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let wallet = [];

    let currentFolderId = 0;
    let activeAccountIndex = null;
    let accountEditor;
    let dragging;

    let menuVisible = false;

    $: menuHideTrigger = menuVisible ? '' : closeMenu();

    function closeMenu () {
        menuVisible = false;
        activeAccountIndex = null;
        if (accountEditor)
            accountEditor.reset();
    }

    function computePasswordStrength (account) {
        // Todo: better function
        account.force = account.password.length * 10;
        return account;
    }

    async function moveAccount (event) {
        let response = await fetch('/move_account', {
            method: 'post',
            headers: {'Content-Type': 'application/json;'},
            body: JSON.stringify({
                account_id: event.detail.fromItem.id,
                new_index: event.detail.to,
                into_folder: event.detail.intoFolder,
                dest_account_id: event.detail.destItem.id,
            })
        })

        if (!response.ok) {
            dispatch('lock');
        } else {
            openFolder(currentFolderId);
        }
    }

    function clickAccount (account) {
        if (account.folder) {
            openFolder(account.id);
        } else {
            editAccount(account);
        }
    }

    function editAccount (account, read=true) {
        activeAccountIndex = wallet.findIndex(a => a.id === account.id);

        accountEditor.editAccount(wallet[activeAccountIndex], read);
        menuVisible = true;
    }

    function newAccount () {
        activeAccountIndex = -1;
        accountEditor.newAccount({
            folder_id: currentFolderId,
            icon: 'img/account_default.svg',
        });
        menuVisible = true;
    }

    async function saveAccount (event) {
        let response = await fetch('/save_account', {
            method: 'post',
            headers: {'Content-Type': 'application/json;'},
            body: JSON.stringify(event.detail.account)
        })

        if (response.ok) {
            let account = computePasswordStrength(await response.json())
            if (activeAccountIndex < 0) {
                // new account
                wallet = wallet.concat(account);
            } else {
                // write on existing account
                wallet[activeAccountIndex] = account;
            }
        } else {
            dispatch('lock');
        }
    }

    async function removeAccount (event) {
        let response = await fetch('/remove_account', {
            method: 'post',
            headers: {'Content-Type': 'application/json;'},
            body: JSON.stringify(event.detail.account)
        })
        if (response.ok) {
            wallet = wallet.filter((account) => {
                return account.id !== event.detail.account.id
            });
            closeMenu();
        } else {
            dispatch('lock');
        }
    }

    export async function openFolder(folderId) {
        let response = await fetch('/open_folder?id=' + encodeURIComponent(folderId || 0));
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
        let response = await fetch('/account/' + encodeURIComponent(currentFolderId || 0));

        if (response.ok) {
            let folder = await response.json();
            await openFolder(folder.folder_id);
        }
    }

    async function search (event) {
        if (!event.detail) {
            openFolder(currentFolderId);
            return;
        }

        let response = await fetch('/search?q=' + encodeURIComponent(event.detail));
        if (response.ok) {
            wallet = await response.json();
        }
    }

    async function newFolder () {
        let folder = {
            name: 'Folder',
            icon: 'img/folder.svg',
            folder: 1,
            folder_id: currentFolderId,
        }
        wallet = wallet.concat(folder);
        await saveFolder(folder);
    }

    async function saveFolder (folder) {
        await saveAccount({detail: {account: folder}});
    }

    async function accountAction (event) {
        let action = event.detail.action.classList.contains('parent_folder_action') ? 'parent' : 'edit';
        let account = event.detail.item;

        if (action === 'parent') {
            let response = await fetch('/move_up', {
                method: 'post',
                headers: {'Content-Type': 'application/json;'},
                body: JSON.stringify({account_id: account.id}),
            })

            if (response.ok) {
                await openFolder(currentFolderId);
            }
        } else if (action === 'edit') {
            editAccount(account, false);
        }
    }

</script>

<Sidepanel bind:visible={menuVisible}>
    <AccountEditor bind:this={accountEditor} on:save_account={saveAccount} on:remove_account={removeAccount}/>
</Sidepanel>
<Navbar on:lock on:search={search} on:new_folder={newFolder} on:go_back={goBack}/>
<div class="wallet">
    <Sortablegrid on:move={moveAccount} on:action={accountAction} bind:items={wallet} let:item let:index bind:dragging={dragging}>
        <div slot="actions" class="actions {dragging ? 'visible' : ''}">
            <Button class="parent_folder_action" raised icon>
                <Icon>
                    <svg xmlns="http://www.w3.org/2000/svg"><polyline points="3.41 16.34 12.1 7.66 20.59 16.14"/></svg>
                </Icon>
            </Button>
            <Button class="edit_account_action" raised icon>
                <Icon>
                    <svg xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
                </Icon>
            </Button>
        </div>
        <div slot="item">
            <Account account={item} on:click={() => clickAccount(item)} on:save_folder={() => {saveFolder(item)}}/>
        </div>
    </Sortablegrid>
    <Button class="new_account {dragging ? '' : 'visible'}" raised icon on:click={newAccount}>
        <Icon path="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </Button>
</div>


<style lang="less">
    .wallet {
        height: calc(100vh - 50px);
        background-color: var(--wallet-background);
    }
    .actions {
        position: absolute;
        z-index: 999;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        left: -50px;
        bottom: 20px;
        height: 120px;
        width: 50px;
        background: transparent;
        transition: 0.5s cubic-bezier(.47,1.64,.41,.8);
    }

    .actions.visible {
        left: 20px;
    }

    .actions :global(.button) {
        position: initial;
    }

    :global(.new_account) {
        position: absolute!important;
        bottom: -50px;
        right: -50px;
        transition: 0.5s cubic-bezier(.47,1.64,.41,.8);
    }

    :global(.new_account).visible {
        bottom: 20px;
        right: 20px;
    }

    :global(.side-panel) {
        width: 350px!important;
        --bg-color: var(--background)!important;
    }

</style>

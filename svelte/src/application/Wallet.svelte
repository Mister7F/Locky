<script lang="ts">
    import Fab from '../helpers/Fab.svelte'
    import Audit from './Audit.svelte'
    import AccountCard from './AccountCard.svelte'
    import AccountEditor from './editor/AccountEditor.svelte'
    import * as api from './api.ts'
    import { cleanSearchValue, fuzzyScore } from '../helpers/utils.ts'
    import Folders from './folders/Folders.svelte'
    import Navbar from './navbar/Navbar.svelte'
    import Sidepanel from '../helpers/Sidepanel.svelte'
    import Sortablegrid from '../helpers/Sortablegrid.svelte'
    import Account from '../models/account.ts'

    import Wallet from '../models/wallet.ts'
    import {
        isAccountViewMode,
        type AccountViewMode,
    } from '../helpers/types.ts'

    interface Props {
        wallet?: Wallet
        searchText?: string
        openSearch?: boolean
        onlock: () => void
        onnotify: (message: string) => void
    }

    let {
        wallet = $bindable(),
        searchText = $bindable(''),
        openSearch = $bindable(false),
        onlock,
        onnotify,
    }: Props = $props()

    // accounts displayed in the UI
    // care about the search, the current directory, etc
    let accounts = $derived.by(() => {
        let ret = []
        if (wallet && wallet.accounts) {
            const folderIds = wallet.folders.map((folder) => folder.id)
            const trashVisible = currentFolderId === 'trash'
            const visibleAccounts = wallet.accounts.filter(
                (account) => account.in_trash === trashVisible
            )

            if (searchText.length) {
                // Fuzzy search: keep accounts whose name or a URL matches the
                // subsequence, then sort by score (stable, so equal scores keep
                // the wallet order).
                const pattern = cleanSearchValue(searchText)
                ret = visibleAccounts
                    .map((account) => ({
                        account,
                        score: Math.max(
                            0,
                            ...account.searchableTerms.map((term) =>
                                fuzzyScore(cleanSearchValue(term), pattern)
                            )
                        ),
                    }))
                    .filter((match) => match.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .map((match) => match.account)
            } else {
                ret = visibleAccounts.filter((account) => {
                    if (trashVisible) {
                        return true
                    }
                    if (currentFolderId === 'no_folder') {
                        return !folderIds.includes(account.folder_id)
                    }
                    return currentFolderId
                        ? account.folder_id === currentFolderId
                        : true
                })
            }
        }
        return ret
    })
    let currentFolderId = $state<string>('')

    // Account edition
    let accountEdited: Account | undefined = $state()
    let accountEditorReadonly = $state(false)
    let editedAccountIndex = $state(null)

    let accountHistory = $derived(
        wallet?.accounts
            .find((a) => a.id === accountEdited?.id)
            ?.history.toReversed() || []
    )

    let dragging = $state(false)
    const storedViewMode = window.localStorage.getItem('viewMode')
    let viewMode = $state<AccountViewMode>(
        isAccountViewMode(storedViewMode) ? storedViewMode : 'detail'
    )

    // folders variable
    let walletWidth = $state(window.innerWidth)
    let foldersVisible = $state(false)
    let floatingFolder = $derived(walletWidth < 870)
    let folderDomIds = $derived.by(() => {
        let ret = ['item_no_folder', 'item_trash']
        for (let folder of wallet['folders'] || []) {
            ret = ret.concat(['item_folder_' + folder.id])
        }
        return ret
    })
    // Accounts audit
    let auditVisible = $derived(currentFolderId === 'security')

    async function onMoveAccount(event: {
        from: number
        to: number
        fromItem: Account
        destItem: Account
    }) {
        // from / to are the index on the filtered array (based on search)
        wallet = await api.moveAccount(event.fromItem, event.destItem)
    }
    function editAccount(account: Account) {
        editedAccountIndex = wallet.accounts.findIndex(
            (a) => a.id === account.id
        )
        // Deep copy, to not change the account before saving
        accountEdited = Account.fromJson(JSON.parse(JSON.stringify(account)))
        accountEditorReadonly = true
    }
    function onNewAccount() {
        editedAccountIndex = null
        const folderId = wallet.folders.some(
            (folder) => folder.id === currentFolderId
        )
            ? currentFolderId
            : ''
        accountEdited = Account.fromJson({
            icon: 'img/accounts/default.svg',
            folder_id: folderId,
        })

        accountEditorReadonly = false
    }
    async function onSaveAccount(account: Account) {
        if (editedAccountIndex !== null) {
            wallet = await api.updateAccount(account)
        } else {
            wallet = await api.newAccount(account)
            // Edit this account to not create one for future "save" event
            editAccount(account)
        }
    }
    async function onRemoveAccount() {
        if (editedAccountIndex !== null) {
            wallet = accountEdited.in_trash
                ? await api.removeAccount(accountEdited.id)
                : await api.moveAccountToTrash(accountEdited.id)
            editedAccountIndex = null
        }
        accountEdited = undefined
    }
    async function onRestoreAccount() {
        if (editedAccountIndex !== null) {
            wallet = await api.restoreAccount(accountEdited.id)
            editedAccountIndex = null
        }
        accountEdited = undefined
    }
    async function onRemoveHistoryEntry(entryId: string) {
        wallet = await api.removeHistoryEntry(accountEdited.id, entryId)
    }
    async function onAccountAction(event: {
        action: HTMLElement
        item: Account
    }) {
        const actionElement = event.action
        if (actionElement.id === 'item_no_folder') {
            wallet = await api.changeFolder(event.item, '')
        } else if (actionElement.id === 'item_trash') {
            wallet = await api.moveAccountToTrash(event.item.id)
        } else if (
            actionElement.id &&
            actionElement.id.startsWith('item_folder_')
        ) {
            const folderId = actionElement.id.split('item_folder_')[1]
            wallet = await api.changeFolder(event.item, folderId)
        } else {
            console.error(`Wrong action ${event.action}.`)
        }
    }
</script>

<Sidepanel
    visible={!!accountEdited}
    onclose={() => (accountEdited = undefined)}
>
    {#if accountEdited}
        <AccountEditor
            account={accountEdited}
            folders={wallet.folders}
            history={accountHistory}
            readonly={accountEditorReadonly}
            onsave={onSaveAccount}
            onremove={onRemoveAccount}
            onrestore={onRestoreAccount}
            onremove_history={onRemoveHistoryEntry}
            onclose={() => (accountEdited = undefined)}
        />
    {/if}
</Sidepanel>
<Navbar
    {onlock}
    onwalletdownloaded={(newWallet) => (wallet = newWallet)}
    onshow_folders={() => (foldersVisible = !foldersVisible)}
    {floatingFolder}
    bind:viewMode
    bind:searchText
    bind:openSearch
/>

<div class="wallet" bind:clientWidth={walletWidth}>
    <Folders
        bind:wallet
        floating={floatingFolder}
        bind:visible={foldersVisible}
        bind:currentFolderId
        onchange={() => {
            searchText = ''
            openSearch = false
        }}
    />
    {#if auditVisible}
        <Audit {wallet} onedit={(account) => editAccount(account)} />
    {:else}
        <Sortablegrid
            class="accountsGrid"
            onmove={onMoveAccount}
            onaction={onAccountAction}
            onmove_blocked={() => onnotify('Cannot move')}
            movable={!searchText.length}
            items={accounts}
            bind:dragging
            customActions={folderDomIds}
        >
            {#snippet card(item)}
                <AccountCard
                    account={item}
                    onclick={() => editAccount(item)}
                    {viewMode}
                    {onnotify}
                />
            {/snippet}
        </Sortablegrid>
        {#if currentFolderId !== 'trash'}
            <Fab
                class="new_account {dragging ? '' : 'visible'}"
                onclick={onNewAccount}
                icon="add"
                color="on-secondary"
            />
        {/if}
    {/if}
</div>

<style>
    :global(.new_account) {
        position: absolute;
        bottom: -65px;
        right: -65px;
        transition: all 0.5s cubic-bezier(0.47, 1.64, 0.41, 0.8);
    }

    :global(.new_account.visible) {
        bottom: 40px;
        right: 20px;
    }

    :global(.new_account:active) {
        transform: rotate(-90deg);
    }

    /* Folder list */
    .wallet {
        position: initial !important;
        background-color: var(--wallet-background);
        box-sizing: border-box;
        overflow-y: scroll;
        height: calc(100vh - 57px);
        height: calc(100dvh - 57px);
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    .wallet :global(.accountsGrid) {
        width: 100%;
        height: 100%;
        min-height: 0;
    }
</style>

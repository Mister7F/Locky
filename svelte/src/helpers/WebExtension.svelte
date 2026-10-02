<script lang="ts">
    import Dialog from './Dialog.svelte'
    import Button from './Button.svelte'
    import WebExtension from './web_extension.svelte.ts'
    import { eventBus } from './web_extension.svelte.ts'

    import {
        fromHex,
        hex,
        sleep,
        fromBytes,
        toBytes,
        copyValue,
        cleanSearchValue,
    } from './utils.ts'
    import {
        encryptAES,
        decryptAES,
        encryptAESGCM,
        getTotpCode,
    } from './crypto.ts'
    import Wallet from '../models/wallet.ts'
    import * as api from '../application/api.ts'
    import { normalizeOrigin } from '../helpers/utils.ts'
    import { untrack, onMount, onDestroy } from 'svelte'

    interface ExtensionAccount {
        login?: string
        password?: string
        url?: string
        totp?: string
    }

    type WalletToExtensionEvent =
        | {
              action: 'login'
              currentUrl: string | null
              account: ExtensionAccount
          }
        | {
              action: 'savePassword'
              encryptedPassword: string
          }

    interface ExtensionHandshakeMessage {
        pluginKey: string
        channelId: string
        encryptedPassword?: string
        currentUrl?: string
    }

    interface CurrentTabChangedMessage {
        action: 'CURRENT_TAB_CHANGED'
        currentUrl: string
    }

    function isCurrentTabChangedMessage(
        value: unknown
    ): value is CurrentTabChangedMessage {
        return (
            isRecord(value) &&
            value.action === 'CURRENT_TAB_CHANGED' &&
            typeof value.currentUrl === 'string'
        )
    }

    function isExtensionHandshakeMessage(
        value: unknown
    ): value is ExtensionHandshakeMessage {
        return (
            isRecord(value) &&
            typeof value.pluginKey === 'string' &&
            typeof value.channelId === 'string' &&
            (value.encryptedPassword === undefined ||
                typeof value.encryptedPassword === 'string') &&
            (value.currentUrl === undefined ||
                typeof value.currentUrl === 'string')
        )
    }

    function isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null
    }

    let pluginKey = null
    let pluginOrigin = null
    let channelId = null
    let sendSequence = 0

    interface Props {
        wallet: Wallet
        searchText?: string
        openSearch?: boolean
        locked?: boolean
        iframeAllowed?: boolean
        onnotify: (message: string) => void
    }

    let {
        wallet = $bindable({} as Wallet),
        searchText = $bindable(''),
        openSearch = $bindable(false),
        locked = $bindable(false),
        iframeAllowed = $bindable(false),
        onnotify,
    }: Props = $props()

    let currentTabUrl = $state<string | null>(null)
    let currentTabOrigin = $derived(normalizeOrigin(currentTabUrl))

    let confirmationDialogOpen = $state(false)
    let accountOrigin = $state()
    let account = null
    let newWebExtensionKeyDialogMessage = $state('')
    let newWebExtensionKeyDialogOrigin = $state('')
    let newWebExtensionKeyDialogKeyHash = $state('')
    let newWebExtensionKeyDialogOk = $state(null)

    /**
     * Parse the URL to check if a key is present, and ask to save it.
     */
    async function initiateWebExtention() {
        window.addEventListener('message', async (event) => {
            if (
                !event.origin.startsWith('moz-extension://') &&
                !event.origin.startsWith('chrome-extension://')
            ) {
                console.error('Received message from invalid origin', event)
                return
            }
            if (!event.isTrusted) {
                console.error('Received message from un-trusted event')
                return
            }
            if (event.source !== window.parent) {
                // The message must come from the frame that embeds us (the
                // extension sidebar), not from some other window that merely holds a
                // reference to us. This confirms the *framer* is the extension.
                console.error('Received message from unexpected source', event)
                return
            }

            // Force basic types
            const eventData: unknown = JSON.parse(JSON.stringify(event.data))

            if (isCurrentTabChangedMessage(eventData)) {
                if (
                    !WebExtension.inWebExtension ||
                    event.origin !== pluginOrigin
                ) {
                    return
                }
                currentTabUrl = eventData.currentUrl
                if (!locked) {
                    setSearch({ detail: wallet })
                }
                return
            }

            if (!isExtensionHandshakeMessage(eventData)) {
                return
            }

            const newPluginKey = fromHex(eventData.pluginKey)
            const newChannelId = eventData.channelId
            if (
                !newPluginKey?.byteLength ||
                typeof newChannelId !== 'string' ||
                !/^[0-9a-f]{32}$/.test(newChannelId)
            ) {
                return
            }
            const newPluginKeyHash = hex(
                await crypto.subtle.digest(
                    'SHA-256',
                    newPluginKey as BufferSource
                )
            )
            const existingPluginKeyHash = localStorage.getItem('pluginKeyHash')
            const existingPluginOrigin = localStorage.getItem('pluginOrigin')

            if (
                existingPluginKeyHash?.length &&
                newPluginKeyHash === existingPluginKeyHash &&
                existingPluginOrigin === event.origin
            ) {
                pluginKey = newPluginKey
                pluginOrigin = event.origin
                channelId = newChannelId
                sendSequence = 0
                WebExtension.inWebExtension = true
                iframeAllowed = true
                currentTabUrl = eventData.currentUrl

                // The extension is already loaded, decrypt it and unlock the wallet
                if (eventData.encryptedPassword?.length) {
                    const encryptedPassword = fromHex(
                        eventData.encryptedPassword
                    )
                    const pt = await decryptAES(
                        encryptedPassword,
                        getMasterPasswordKey()
                    )
                    const { password, key } = JSON.parse(fromBytes(pt))
                    await unlock(password, new Uint8Array(fromHex(key)))
                }
                return
            }

            await sleep(200) // Let the application loads before showing the alert
            newWebExtensionKeyDialogOrigin = event.origin
            newWebExtensionKeyDialogKeyHash = newPluginKeyHash
            if (existingPluginKeyHash?.length || existingPluginOrigin?.length) {
                newWebExtensionKeyDialogMessage =
                    'Replace the existing extension key with a new one?'
            } else {
                newWebExtensionKeyDialogMessage = 'Save the web extension key?'
            }
            newWebExtensionKeyDialogOk = () => {
                pluginKey = newPluginKey
                pluginOrigin = event.origin
                channelId = newChannelId
                sendSequence = 0
                localStorage.setItem('pluginKeyHash', newPluginKeyHash)
                localStorage.setItem('pluginOrigin', pluginOrigin)
                WebExtension.inWebExtension = true
                iframeAllowed = true
                currentTabUrl = eventData.currentUrl
                newWebExtensionKeyDialogOk = null
            }
        })

        // Ask plugin key
        await sleep(40) // for some reason, without that auto-unlock sometimes fail on Firefox
        window.parent.postMessage('IFRAME_READY', '*')
    }

    async function unlock(password, key) {
        // If we saved the password for the web extension, unlock the wallet
        const newWallet = await api.unlock(password, key)
        if (!newWallet || !password.length) {
            return
        }
        setSearch({ detail: newWallet })
        locked = false
        wallet = newWallet
    }

    function setSearch(event) {
        const wallet = event.detail
        if (!currentTabOrigin || !wallet) {
            return
        }

        searchText = ''
        const walletText = JSON.stringify(
            wallet.accounts
                .filter((account) => !account.in_trash)
                .map((account) => account.searchableTerms.map(cleanSearchValue))
        )

        if (
            currentTabOrigin.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+(:[0-9]+)?$/)
        ) {
            // IP address
            if (walletText.includes(cleanSearchValue(currentTabOrigin))) {
                searchText = currentTabOrigin
            }
        } else {
            // Domain name
            let parts = currentTabOrigin.split('.')
            while (
                parts.length > 2 &&
                !walletText.includes(cleanSearchValue(parts.join('.')))
            ) {
                parts.shift()
            }
            if (
                parts.length &&
                !walletText.includes(cleanSearchValue(parts.join('.')))
            ) {
                parts = [parts[0]]
            }
            if (walletText.includes(cleanSearchValue(parts.join('.')))) {
                searchText = parts.join('.')
            }
        }
        openSearch = !!searchText.length
    }

    // ---------------------------------------------------------------
    // EVENTS
    // ---------------------------------------------------------------
    onMount(() => {
        eventBus.addEventListener('extension-send-credentials', sendCredentials)
    })

    onDestroy(() => {
        eventBus.removeEventListener(
            'extension-send-credentials',
            sendCredentials
        )
    })

    onMount(() => {
        eventBus.addEventListener('extension-save-password', savePassword)
    })

    onDestroy(() => {
        eventBus.removeEventListener('extension-save-password', savePassword)
    })

    onMount(() => {
        eventBus.addEventListener('extension-wallet-opened', setSearch)
    })

    onDestroy(() => {
        eventBus.removeEventListener('extension-wallet-opened', setSearch)
    })

    async function sendCredentials(event) {
        if (!WebExtension.inWebExtension) {
            onnotify('Web Extension is not installed')
            return
        }
        account = event.detail
        accountOrigin = normalizeOrigin(account.url)
        if (!accountOrigin || accountOrigin === currentTabOrigin) {
            onnotify(await _sendCredentials())
            return
        }

        // Look for URL in custom fields
        const hosts = (account.fields || [])
            .filter((f) => f.type === 'url' && f.value)
            .filter((f) => normalizeOrigin(f.value) === currentTabOrigin)
        if (hosts.length) {
            onnotify(await _sendCredentials())
            return
        }

        confirmationDialogOpen = true
    }

    /**
     * Send the encrypted account credentials to the Web Extension sidebar.
     */
    async function _sendCredentials(): Promise<string> {
        if (account.totp) {
            copyValue(getTotpCode(account.totp))
        }
        const event: WalletToExtensionEvent = {
            action: 'login',
            currentUrl: currentTabUrl,
            account: {
                login: account.login,
                password: account.password,
                url: account.url,
                totp: await getTotpCode(account.totp),
            },
        }
        return (await sendToWebExtension(event))
            ? `Credentials sent${account.totp ? ' and TOTP code copied' : ''}`
            : 'Configure the extension before using it'
    }

    /**
     * Save the password in the session storage of the Web Extension, encrypted so
     * - the data is removed when the browser is closed (storage.session)
     * - the data persist if we close the sidebar
     * - the web extension can not read it, since it does not have the key
     */
    async function savePassword(event) {
        if (!pluginKey?.byteLength) {
            return
        }

        const encryptedPassword = await encryptAES(
            toBytes(
                JSON.stringify({
                    password: event.detail.password,
                    key: hex(event.detail.key),
                })
            ),
            getMasterPasswordKey(true)
        )
        return await sendToWebExtension({
            action: 'savePassword',
            encryptedPassword: hex(encryptedPassword),
        })
    }

    /**
     * Key used to store the master password in the Web Extension session storage.
     */
    function getMasterPasswordKey(regenerate: boolean = false) {
        if (!localStorage.getItem('masterPasswordKey')?.length || regenerate) {
            localStorage.setItem('masterPasswordKey', hex(generateToken(32)))
        }
        return fromHex(localStorage.getItem('masterPasswordKey'))
    }

    function generateToken(size) {
        const token = new Uint8Array(size)
        window.crypto.getRandomValues(token)
        return token
    }

    async function sendToWebExtension(event: WalletToExtensionEvent) {
        if (!pluginKey?.byteLength || !channelId) {
            return false
        }
        sendSequence += 1
        const ct = await encryptAESGCM(
            toBytes(
                JSON.stringify({
                    channelId,
                    sequence: sendSequence,
                    event,
                })
            ),
            pluginKey
        )
        window.parent.postMessage(ct, pluginOrigin)
        return true
    }

    $effect(() => {
        initiateWebExtention()
    })
</script>

<Dialog bind:open={confirmationDialogOpen} title="Are you sure ?">
    The current domain <b class="host">{currentTabOrigin}</b>
    does not match the URL in your wallet <b class="host">{accountOrigin}</b>,
    are you sure you are not phished?
    <br />
    <br />
    Did you get here by yourself, and not through a link you received?
    <br />
    <br />
    Consider clicking "No" and adding a new URL field for that account to not see
    this warning again.
    <br />

    {#snippet actions()}
        <Button
            onclick={() => (confirmationDialogOpen = false)}
            color="secondary"
            variant="outlined"
        >
            No
        </Button>
        <Button
            onclick={async () => {
                confirmationDialogOpen = false
                onnotify(await _sendCredentials())
            }}
            color="primary"
        >
            Yes
        </Button>
    {/snippet}
</Dialog>

<Dialog bind:open={newWebExtensionKeyDialogOk} title="Are you sure ?">
    <div class="dialog_message">
        {newWebExtensionKeyDialogMessage}
        <br />
        <br />
        Origin:
        <span>{newWebExtensionKeyDialogOrigin}</span>
        <br />
        <br />
        h(key):
        <span>{newWebExtensionKeyDialogKeyHash}</span>
        <br />
    </div>

    {#snippet actions()}
        <Button
            onclick={() => (newWebExtensionKeyDialogOk = null)}
            color="secondary"
            variant="outlined"
        >
            No
        </Button>
        <Button onclick={newWebExtensionKeyDialogOk} color="primary">
            Yes
        </Button>
    {/snippet}
</Dialog>

<style>
    .host {
        color: var(--error);
    }
    .dialog_message {
        color: var(--on-primary);
        overflow: hidden;
        overflow-wrap: anywhere;
    }
    .dialog_message span {
        color: var(--error);
        display: inline-block;
    }
</style>

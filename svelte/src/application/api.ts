import { savePassword } from '../helpers/web_extension.svelte.ts'
import Wallet from '../models/wallet.ts'
import Folder from '../models/folder.ts'
import Account, { HistoryEntry } from '../models/account.ts'
import { decryptDatabase, encryptDatabase } from './encrypt.ts'
import * as indexdb from './indexdb.ts'

let wallet: Wallet = null
let masterPassword: string = null

// called when a background wallet save fails, so the UI can warn the user
let onSaveError: (message: string) => void = () => {}

export function setOnError(handler: (message: string) => void) {
    onSaveError = handler
}

// the key derivation is slow, so we create a queue to run the write / read operation
// on it synchronously, to avoid any errors (save empty wallet, etc)
let queueEncryptedWallet: Promise<unknown> = Promise.resolve()

function enqueueEncryptedWallet<T>(fn: () => Promise<T>): Promise<T> {
    const result = queueEncryptedWallet.then(fn)
    // keep the queue alive after a failure
    queueEncryptedWallet = result.catch((error) =>
        console.error('Wallet storage operation failed', error)
    )
    return result
}

export async function newWallet(password: string): Promise<Wallet> {
    wallet = Wallet.fromJson({
        accounts: [],
        folders: [],
    })
    masterPassword = password
    return await saveWallet()
}

export async function getEncryptedWallet(): Promise<
    ArrayBuffer | Uint8Array | null
> {
    // wait for write operation before returning the encrypted wallet
    // (the key will be regenerated)
    return (await enqueueEncryptedWallet(() => indexdb.get('wallet'))) as
        | ArrayBuffer
        | Uint8Array
        | null
}

export async function unlock(
    password: string,
    key?: Uint8Array
): Promise<Wallet | undefined> {
    const encryptedWallet = (await indexdb.get('wallet')) as
        | ArrayBuffer
        | Uint8Array
        | null
    if (!encryptedWallet) {
        return
    }

    const [newWallet, next_key] = await decryptDatabase(
        encryptedWallet,
        password,
        key
    )
    if (!newWallet) {
        return
    }

    wallet = newWallet
    masterPassword = password
    if (!key) {
        savePassword(password, next_key)
    }

    return wallet
}

export async function login(
    filedata: ArrayBuffer | Uint8Array,
    password: string
): Promise<Wallet | undefined> {
    const [newWallet, key] = await decryptDatabase(filedata, password)
    if (!newWallet) {
        return
    }

    masterPassword = password
    wallet = newWallet
    savePassword(password, key)
    return await saveWallet()
}

export async function replaceWallet(
    filedata: ArrayBuffer | Uint8Array
): Promise<Wallet | undefined> {
    if (!masterPassword) {
        return
    }
    return await login(filedata, masterPassword)
}

export async function logout(keepIndexDb?: boolean): Promise<void> {
    // wait for the previous write / get operation if any
    return enqueueEncryptedWallet(async () => {
        wallet = null
        masterPassword = null
        if (!keepIndexDb) {
            await indexdb.set('wallet', 0)
        }
    })
}

export async function walletInMemory(): Promise<boolean> {
    const encryptedWallet = (await indexdb.get('wallet')) as
        | ArrayBuffer
        | Uint8Array
        | null
    return !!(encryptedWallet && encryptedWallet.byteLength)
}

async function saveWallet(notifyError: boolean = true): Promise<Wallet> {
    const saved = enqueueEncryptedWallet(async () => {
        if (!masterPassword) return
        const [key, encryptedWallet] = await encryptDatabase(
            wallet,
            masterPassword
        )
        await indexdb.set('wallet', encryptedWallet)
        savePassword(masterPassword, key)
    })
    if (notifyError) {
        // do not block the UI while encrypting the database
        saved.catch(() => onSaveError('Failed to save the wallet!'))
    } else {
        // let the caller wait for the write and handle the failure
        await saved
    }
    return Wallet.fromJson(JSON.parse(JSON.stringify(wallet)))
}

export async function downloadWallet(): Promise<void> {
    let encrypted = await getEncryptedWallet()
    if (!encrypted) {
        encrypted = (await encryptDatabase(wallet, masterPassword))[1]
    }

    const filename = 'wallet.lck'
    const blob = new Blob([encrypted as BlobPart])
    const elem = window.document.createElement('a')
    elem.href = window.URL.createObjectURL(blob)
    elem.download = filename
    document.body.appendChild(elem)
    elem.click()
    document.body.removeChild(elem)
}

export async function moveAccount(
    fromItem: Account,
    destItem: Account
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    if (!fromItem.id || !destItem.id) {
        console.error('No ID for', fromItem, destItem)
        return
    }
    const fromIndex = wallet.accounts.findIndex((a) => a.id === fromItem.id)
    const toIndex = wallet.accounts.findIndex((a) => a.id === destItem.id)
    if (fromIndex < 0 || toIndex < 0) {
        console.error('Failed to move', fromItem, destItem)
        return
    }
    wallet.accounts = array_move(wallet.accounts, fromIndex, toIndex)
    return await saveWallet()
}

export async function newAccount(
    account: Account
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    if (!account.id) {
        account.id = generateId()
    }
    wallet.accounts.push(account)
    return await saveWallet()
}

export async function updateAccount(
    account: Account
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    const toUpdate = wallet.accounts.findIndex((a) => a.id === account.id)
    if (toUpdate < 0) {
        console.error('Account not found')
        return
    }
    // the editor works on a copy, its history might be outdated
    const before = wallet.accounts[toUpdate]
    account.history = [...before.history, ...HistoryEntry.diff(before, account)]
    wallet.accounts[toUpdate] = account
    return await saveWallet()
}

export async function removeAccount(
    accountId: string
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    wallet.accounts = wallet.accounts.filter((a) => a.id !== accountId)
    return await saveWallet()
}

export async function removeHistoryEntry(
    accountId: string,
    entryId: string
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    const account = wallet.accounts.find((a) => a.id === accountId)
    if (!account) {
        console.error('Account not found')
        return
    }
    account.history = account.history.filter((h) => h.id !== entryId)
    return await saveWallet()
}

export async function restoreAccount(
    accountId: string
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    const account = wallet.accounts.find((a) => a.id === accountId)
    if (!account) {
        console.error('Account not found')
        return
    }
    account.in_trash = false
    return await saveWallet()
}

export async function moveAccountToTrash(
    accountId: string
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    const account = wallet.accounts.find((a) => a.id === accountId)
    if (!account) {
        console.error('Account not found')
        return
    }
    account.in_trash = true
    return await saveWallet()
}

export async function changeFolder(
    account: Account,
    newFolderId: string
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    if (
        newFolderId &&
        wallet.folders.findIndex((folder) => folder.id === newFolderId) < 0
    ) {
        console.error("The folder doesn't exist")
        return
    }
    const toUpdate = wallet.accounts.find((a) => a.id === account.id)
    if (!toUpdate) {
        console.error('Account not found')
        return
    }
    toUpdate.folder_id = newFolderId
    toUpdate.in_trash = false
    return await saveWallet()
}

export async function moveFolder(
    folder: Folder,
    newIndex: number
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    const newFolders = wallet.folders.filter((f) => f.id !== folder.id)
    newFolders.splice(newIndex, 0, folder)
    wallet.folders = newFolders
    return await saveWallet()
}

export async function updateFolder(
    folder: Folder
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }

    const index = wallet.folders.findIndex((f) => f.id === folder.id)
    if (index < 0) {
        // New folder
        folder.id = generateId()
        wallet.folders.push(folder)
        return await saveWallet()
    }
    wallet.folders[index] = folder
    return await saveWallet()
}

export async function deleteFolder(
    folder: Folder
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    wallet.folders = wallet.folders.filter((f) => f.id !== folder.id)
    return await saveWallet()
}

export function getSimpleLoginApiKey(): string {
    return wallet?.settings.simpleLoginApiKey || ''
}

export function getDropboxRefreshToken(): string {
    return wallet?.settings.dropboxRefreshToken || ''
}

export async function setDropboxRefreshToken(
    refreshToken: string
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    wallet.settings.dropboxRefreshToken = refreshToken
    return await saveWallet()
}

export async function setSimpleLoginApiKey(
    apiKey: string
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    wallet.settings.simpleLoginApiKey = apiKey
    return await saveWallet()
}

export async function updatePassword(
    oldPassword: string,
    newPassword: string
): Promise<boolean> {
    if (oldPassword !== masterPassword) {
        return false
    }
    masterPassword = newPassword
    try {
        // wait for the write, to not tell the user the password
        // changed while the wallet is still encrypted with the old one
        await saveWallet(false)
    } catch {
        masterPassword = oldPassword
        return false
    }
    return true
}

// HELPERS //
function array_move<T>(
    arr: Array<T | undefined>,
    old_index: number,
    new_index: number
): Array<T | undefined> {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1
        while (k--) {
            arr.push(undefined)
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
    return arr
}

/**
 * Generate a random identifier for an account / folder.
 */
function generateId(): string {
    return crypto.randomUUID()
}

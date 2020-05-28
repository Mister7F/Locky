<script>
    import IconButton from "@smui/icon-button";
    import Button from "@smui/button";
    import Textfield from "@smui/textfield";
    import Fab, { Label } from "@smui/fab";
    import Dialog, { Title, Content } from "@smui/dialog";
    import Menu, { SelectionGroup, SelectionGroupIcon } from "@smui/menu";
    import Icon from "./components/Icon.svelte";
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

    import {
        getFolders,
        saveFolder,
        moveFolder,
        deleteFolder,
    } from "./Api.svelte";
    import Sortablegrid from "./components/Sortablegrid.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let folders;
    export let currentFolderId;
    export let visible = true;
    export let floating = false;

    let editedFolderId = -1;
    let folderDialog;
    let folderIconOpen = false;
    let draggingFolder = false;
    let folderIcons = [
        // https://material.io/resources/icons/?style=baseline
        "home",
        "folder",
        "games",
        "work",
        "account_balance",
        "cloud",
        "build",
        "delete",
        "grade",
        "label",
        "alternate_email",
        "drafts",
        "functions",
        "computer",
        "mouse",
        "security",
        "smartphone",
        "toys",
        "watch",
        "local_bar",
        "local_airport",
        "local_phone",
        "sms",
        "thumb_up",
        "thumb_down",
        "code",
        "vpn_key",
        "music_note",
        "star",
        "wifi",
    ];
    async function editFolder(folder) {
        editedFolderId = folders.indexOf(folder);
        folderDialog.open();
    }

    async function folderAction(event) {
        if (event.detail.action && event.detail.action.id === "delete_folder") {
            if (!(await deleteFolder(event.detail.item.id))) {
                dispatch("lock");
            }
            folders = folders.filter((f) => f.id !== event.detail.item.id);
            if (event.detail.item.id === currentFolderId) {
                dispatch("open_folder", 0);
            }
        }
    }

    async function onSaveFolder() {
        let edited = await saveFolder(folders[editedFolderId]);
        if (edited) {
            folders[editedFolderId] = edited;
            editedFolderId = -1;
            folderDialog.close();
        } else {
            dispatch("lock");
        }
    }

    async function newFolder() {
        let folder = {
            name: "Folder",
            icon: "folder",
        };
        folder = await saveFolder(folder);
        folders = folders.concat(folder);
    }

    async function onMoveFolder(event) {
        // `-1` because of the root folder
        let index = event.detail.to - 1;
        if (!(await moveFolder(event.detail.fromItem.id, index))) {
            dispatch("lock");
        }
    }
</script>

<style>
    .foldersList {
        --folder-width: 350px;
        width: var(--folder-width);
        min-width: var(--folder-width);
        transition: 0.3s;
        padding-top: 10px;
        margin-top: -30px;
        box-sizing: border-box;
    }

    .foldersList.visible {
        margin-left: 0;
    }

    .foldersList.floating {
        position: absolute;
        left: -360px;
        height: 100%;
        background-color: var(--surface);
        z-index: 2;
    }

    .foldersList.floating.visible {
        left: 0;
    }

    .foldersList :global(.folders) {
        width: 100%;
        height: auto;
    }
    .foldersList :global(.folders .container) {
        width: 100%;
    }

    .foldersList :global(.folder_item) {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        box-sizing: border-box;
    }

    .foldersList :global(.folder_item button) {
        transition: 0.2s;
        opacity: 0.2;
    }

    .foldersList :global(.folder_item button:hover) {
        opacity: 1;
    }

    .foldersList :global(.folder_item.move_into:before),
    .foldersList :global(.folder_item.selected:before) {
        /* show the ripple background */
        opacity: 0.2;
    }

    .foldersList :global(.folder_item .mdc-list-item__text) {
        margin-left: 10px;
    }

    :global(.wallet_folder_dialog .mdc-dialog__surface),
    :global(.wallet_folder_dialog p),
    :global(.wallet_folder_dialog .mdc-dialog__title) {
        color: var(--on-primary);
        background-color: var(--primary);
    }

    :global(.menu_folder_icon) {
        position: absolute;
        min-width: 60px;
        width: 60px;
        z-index: 999999;
        box-sizing: border-box;

        background-color: var(--surface);
        max-height: 300px;
        width: 300px;
    }

    :global(.menu_folder_icon > ul) {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        flex-wrap: wrap;
        width: 100%;
    }

    :global(.menu_folder_icon > *) {
        display: block;
        width: 60px;
    }
    .deleteFolder {
        position: absolute;
        margin-top: 20px;
        left: -60px;
        transition: all 0.5s cubic-bezier(0.47, 1.64, 0.41, 0.8);
    }

    .deleteFolder.visible {
        left: 150px;
    }
</style>

<div
    class="foldersList {visible ? 'visible' : ''}
    {floating ? 'floating' : ''}">
    <Group>
        <Subheader>
            Folders
            <IconButton on:click={newFolder}>
                <Icon color="surface">create_new_folder</Icon>
            </IconButton>
        </Subheader>
        {#if folders}
            <Sortablegrid
                class="folders"
                bind:items={folders}
                let:item
                bind:dragging={draggingFolder}
                on:action={folderAction}
                customActions={['delete_folder']}
                on:move={onMoveFolder}>
                <div slot="item">
                    <Item
                        class="folder_item {currentFolderId === item.id ? 'selected' : ''}"
                        id="item_folder_{item.id}"
                        on:click={() => dispatch('open_folder', item.id)}>
                        <Icon color="surface">{item.icon}</Icon>
                        <Text>{item.name}</Text>
                        {#if item.id !== 0}
                            <Meta on:click={() => editFolder(item)}>
                                <IconButton>
                                    <Icon color="surface">create</Icon>
                                </IconButton>
                            </Meta>
                        {/if}
                    </Item>
                </div>
            </Sortablegrid>
            <div
                id="delete_folder"
                class="deleteFolder {draggingFolder ? 'visible' : ''}">
                <Fab color="primary">
                    <Icon>delete</Icon>
                </Fab>
            </div>
        {/if}
    </Group>

    <Dialog bind:this={folderDialog} class="wallet_folder_dialog">
        <Title>Folder</Title>
        <Content>
            {#if editedFolderId >= 0}
                <IconButton
                    on:click={() => (folderIconOpen = !folderIconOpen)}
                    on:blur={() => setTimeout(() => (folderIconOpen = false), 100)}>
                    <Icon color="primary">{folders[editedFolderId].icon}</Icon>
                </IconButton>
                {#if folderIconOpen}
                    <div static class="menu_folder_icon">
                        <List>
                            {#each folderIcons as folderIcon}
                                <Item
                                    on:click={() => (folders[editedFolderId].icon = folderIcon)}>
                                    <Icon color="surface">{folderIcon}</Icon>
                                </Item>
                            {/each}
                        </List>
                    </div>
                {/if}

                <Textfield bind:value={folders[editedFolderId].name} />
                <Button
                    on:click={onSaveFolder}
                    style="float: right; margin-top: 10px;"
                    color="secondary">
                    Save
                </Button>
            {/if}
        </Content>
    </Dialog>
</div>

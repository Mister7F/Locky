<script>
    import { Textfield, Button, Icon, Menu, Menuitem, Dialog } from 'svelte-mui';
    import Field from './Field.svelte';
    import ImagePicker from './ImagePicker.svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let account = null;
    export let readonly = 0;

    let totpCode = null;
    let qrCodeVisible = false;

    $: passwordStrength = (account && account.password) ? 'Strength: ' + account.password.length : '';
    $: totpMessage = totpCode ? (totpCode + ' (' + time + ')') : '';

    let time = 30;

    let editedFieldIndex = -1;
    $: visibleFieldNameModal = editedFieldIndex >= 0;

    async function updateTotp () {
        let timestamp = Math.floor(Date.now() / 1000);

        if (account && account.totp && account.totp.length) {
            if (timestamp % 30 === 0 || !totpCode) {
                let response = await fetch("/totp?code=" + encodeURIComponent(account.totp))
                if (response.ok) {
                    totpCode = await response.text();
                }
            }
        }

        time = 30 - timestamp % 30;
        setTimeout(updateTotp, 1000);
    }
    updateTotp();

    function edit (accountEdited) {
        readonly = 0;
        qrCodeVisible = false;
        totpCode = null;
    }

    function save () {
        dispatch('save_account', {account: account});
        readonly = 1;
        qrCodeVisible = false;
        totpCode = null;
    }

    export function editAccount (accountEdited, read=true) {
        readonly = 1;
        account = JSON.parse(JSON.stringify(accountEdited));;
    }

    export function newAccount (newAccount) {
        readonly = 0;
        qrCodeVisible = false;
        totpCode = null;
        account = newAccount;
    }

    function newField () {
        if (!account.fields) {
            account.fields = [];
        }
        account.fields = account.fields.concat({
            name: 'Field',
            type: 'text',
            value: '',
        });
    }

    function removeField(event) {
        let index = event.detail;
        account.fields.splice(index, 1);
        account.fields = account.fields;
    }

    function editFieldName (event) {
        editedFieldIndex = event.detail;
    }

    function onKeyPressFieldLabel (e) {
        if (!e) e = window.event;
        if ((e.keyCode || e.which) == 13) {
            editedFieldIndex = -1;
            return false;
        }
    }

    export function reset () {
        account = null;
        qrCodeVisible = false;
        totpCode = null;
    }

    async function showQrCode () {
        qrCodeVisible = true;
        setTimeout(() => {
            var qr = new QRious({
              element: document.getElementById('qr_code_canvas'),
              value: 'otpauth://totp/' + encodeURIComponent(account.name) + ':' + encodeURIComponent(account.login) + '?secret=' + encodeURIComponent(account.totp) + '&issuer=' + encodeURIComponent(account.name)
            });
        });
    }

</script>

{#if account}
<div class="account">
    <div class="fields">
        <ImagePicker bind:src={account.icon} bind:readonly size="100px"/>

        <Field label="Name" bind:value={account.name} bind:readonly/>
        <Field label="Login" bind:value={account.login} bind:readonly/>
        <Field label="Password" bind:value={account.password} bind:readonly bind:message={passwordStrength} type="password"/>
        <Field label="URL" bind:value={account.url} bind:readonly type="url"/>
        <Field label="2FA" bind:value={account.totp} bind:readonly type="totp" bind:message={totpMessage} on:show_qrcode={showQrCode}/>


        {#each account.fields || [] as field, i}
            <Field bind:label={field.name} bind:value={field.value} bind:readonly bind:type={field.type} index={i} canEditType="1" on:removefield={removeField} on:edit_field_name={editFieldName}/>
        {/each}

        {#if !readonly}
            <Button on:click={newField}>New field</Button>
        {/if}
    </div>

    {#if readonly}
        <Button class="save_account" raised icon on:click={edit}>
            <Icon color="accent">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
            </Icon>
        </Button>
    {:else}
        <Button class="save_account" raised icon on:click={save}>
            <Icon path="M1 14 L5 10 L13 18 L27 4 L31 8 L13 26 z" viewBox="0 0 32 32" color="accent"/>
        </Button>
    {/if}
</div>

<Dialog width="290" bind:visible={qrCodeVisible}>
    <div slot="title">2FA QR Code</div>
    <p>Scan this QR Code with Google Authenticator, FreeOTP...</p>
    <canvas id="qr_code_canvas"></canvas>
</Dialog>

<Dialog width="290" bind:visible={visibleFieldNameModal}>
    <Textfield label="Label" bind:value={account.fields[editedFieldIndex].name} on:keypress={onKeyPressFieldLabel}/>
</Dialog>

{/if}

<style lang="less">
    .account {
        padding: 20px;
        color: var(--color);
        margin: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        overflow-y: auto;
        box-sizing: border-box;
    }

    .fields {
        width: 90%;
        max-height: 100%;
        overflow-y: auto;
        text-align: center;
    }

    :global(.save_account) {
        position: absolute!important;
        bottom: 20px;
        right: 20px;
    }

    .field {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        height: 72px;
    }

    #qr_code_canvas {
        width: 250px;
        height: 250px;
    }

</style>

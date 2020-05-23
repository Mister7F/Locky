<script>
    import Button from "@smui/button";
    import Textfield from "@smui/textfield";
    import Fab, { Label } from "@smui/fab";
    import Dialog, { Title, Content, Actions } from "@smui/dialog";
    import IconButton from "@smui/icon-button";

    import Field from "./components/Field.svelte";
    import ImagePicker from "./ImagePicker.svelte";
    import Icon from "./components/Icon.svelte";
    import { copyValue, getTotpCode } from "./Helper.svelte";

    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let account = null;
    export let readonly = 0;

    let totpCode = null;
    let qrCodeDialog;
    let fieldNameDialog;

    $: totpMessage = totpCode ? totpCode + " (" + time + ")" : "";

    let time = 30;

    let editedFieldIndex = -1;
    $: visibleFieldNameModal = editedFieldIndex >= 0;

    async function updateTotp() {
        let timestamp = Math.floor(Date.now() / 1000);

        if (account && account.totp && account.totp.length) {
            if (timestamp % 30 === 0 || !totpCode) {
                totpCode = await getTotpCode(account.totp);
            }
        }

        time = 30 - (timestamp % 30);
        setTimeout(updateTotp, 1000);
    }
    updateTotp();

    function edit(accountEdited) {
        readonly = 0;
        totpCode = null;
    }

    function save() {
        dispatch("save_account", { account: account });
        readonly = 1;
        totpCode = null;
    }

    export function editAccount(accountEdited, read = true) {
        readonly = 1;
        account = JSON.parse(JSON.stringify(accountEdited));
    }

    export function newAccount(newAccount) {
        readonly = 0;
        totpCode = null;
        account = newAccount;
    }

    function newField() {
        if (!account.fields) {
            account.fields = [];
        }
        account.fields = account.fields.concat({
            name: "Field",
            type: "text",
            value: "",
        });
        setTimeout(() => {
            document.querySelector(".account .fields").scrollBy(0, 10000);
        });
    }

    function removeField(event) {
        let index = event.detail;
        account.fields.splice(index, 1);
        account.fields = account.fields;
    }

    function editFieldName(event) {
        editedFieldIndex = event.detail;
        fieldNameDialog.open();
    }

    function onKeyPressFieldLabel(e) {
        if (!e) e = window.event;
        if ((e.keyCode || e.which) == 13) {
            editedFieldIndex = -1;
            fieldNameDialog.close();
            return false;
        }
    }

    export function reset() {
        account = null;
        totpCode = null;
    }

    function close() {
        reset();
        dispatch("close");
    }

    async function showQrCode() {
        qrCodeDialog.open();
        setTimeout(() => {
            var qr = new QRious({
                element: document.getElementById("qr_code_canvas"),
                value:
                    "otpauth://totp/" +
                    encodeURIComponent(account.name) +
                    ":" +
                    encodeURIComponent(account.login) +
                    "?secret=" +
                    encodeURIComponent(account.totp) +
                    "&issuer=" +
                    encodeURIComponent(account.name),
            });
        });
    }
</script>

<style>
    .account {
        padding: 20px;
        color: var(--on-primary);
        background-color: var(--primary);
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
        height: 100%;
        max-height: 100%;
        overflow-y: auto;
        text-align: center;
    }

    .account :global(.save_account) {
        position: absolute;
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

    :global(.account_editor_close_button) {
        position: absolute;
        right: 40px;
    }

    :global(.account_editor_dialog .mdc-dialog__surface),
    :global(.account_editor_dialog p),
    :global(.account_editor_dialog .mdc-dialog__title) {
        color: var(--on-primary);
        background-color: var(--primary);
    }
</style>

{#if account}
    <div class="account">
        <IconButton class="account_editor_close_button" on:click={close}>
            <Icon>close</Icon>
        </IconButton>
        <div class="fields">
            <ImagePicker bind:src={account.icon} bind:readonly size="100px" />

            <Field
                label="Name"
                bind:value={account.name}
                bind:readonly
                on:copy={() => copyValue(account.name)} />
            <Field
                label="Login"
                bind:value={account.login}
                bind:readonly
                on:copy={() => copyValue(account.login)} />
            <Field
                label="Password"
                bind:value={account.password}
                bind:readonly
                type="password"
                on:copy={() => copyValue(account.password)} />
            <Field
                label="URL"
                bind:value={account.url}
                bind:readonly
                type="url"
                on:copy={() => copyValue(account.url)} />
            <Field
                label="2FA"
                bind:value={account.totp}
                bind:readonly
                type="totp"
                bind:message={totpMessage}
                on:show_qrcode={showQrCode}
                on:copy={async () => copyValue((await getTotpCode(account.totp)).replace(' ', ''))} />

            {#each account.fields || [] as field, i}
                <Field
                    bind:label={field.name}
                    bind:value={field.value}
                    bind:readonly
                    bind:type={field.type}
                    index={i}
                    canEditType="1"
                    on:removefield={removeField}
                    on:edit_field_name={editFieldName}
                    on:copy={() => copyValue(field.value)} />
            {/each}

            {#if !readonly}
                <Button on:click={newField} color="secondary">New field</Button>
            {/if}
        </div>

        <Fab
            class="save_account"
            color="secondary"
            on:click={() => (readonly ? edit() : save())}>
            <Icon class="material-icons" color="secondary">
                {#if readonly}create{:else}done{/if}
            </Icon>
        </Fab>
    </div>

    <Dialog bind:this={qrCodeDialog} class="account_editor_dialog">
        <Title>2FA QR Code</Title>
        <Content>
            <p>Scan this QR Code with Google Authenticator, FreeOTP...</p>
            <p style="text-align: center">
                <canvas id="qr_code_canvas" />
            </p>
            <Button
                style="float: right; margin-top: 10px;"
                color="secondary"
                on:click={() => qrCodeDialog.close()}>
                Close
            </Button>
        </Content>
    </Dialog>

    <Dialog bind:this={fieldNameDialog} class="account_editor_dialog">
        <Title>Field name</Title>
        <Content>
            {#if editedFieldIndex >= 0}
                <Textfield
                    on:keypress={onKeyPressFieldLabel}
                    bind:value={account.fields[editedFieldIndex].name} />
            {/if}
            <Button
                style="float: right; margin-top: 10px;"
                color="secondary"
                on:click={() => fieldNameDialog.close()}>
                Save
            </Button>
        </Content>
    </Dialog>
{/if}

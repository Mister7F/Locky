<script>
    import Button, { Icon } from "@smui/button";
    import Dialog, { Title, Content, Actions } from "@smui/dialog";

    import Field from "./Field.svelte";

    let oldPassword = "";
    let newPassword = "";
    let confirmPassword = "";

    let dialog;

    let error = false;

    $: canSubmit = newPassword && newPassword === confirmPassword;

    async function changePassword() {
        let response = await fetch("/change_password", {
            method: "post",
            headers: { "Content-Type": "application/json;" },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
            }),
        });

        if (response.ok) {
            dialog.close();
        } else {
            error = true;
        }
    }

    export function open() {
        if (dialog) {
            error = false;
            oldPassword = "";
            newPassword = "";
            confirmPassword = "";
            dialog.open();
        }
    }
</script>

<style>
    .error {
        text-align: center;
        color: var(--error-color);
    }

    .action {
        text-align: center;
    }

    :global(.change_password_icon) {
        margin-left: 10px !important;
    }
</style>

<Dialog width="290" bind:this={dialog}>
    <Title>New password</Title>
    <br />
    <Content>
        <Field
            label="Old password"
            type="password"
            bind:value={oldPassword}
            copy="0" />
        <Field
            label="New password"
            type="password"
            bind:value={newPassword}
            copy="0" />
        <Field
            label="Confirm"
            type="password"
            bind:value={confirmPassword}
            copy="0" />

        <div class="action">
            <Button color="primary" raised on:click={changePassword}>
                Change
            </Button>
        </div>
        {#if error}
            <div class="error">Wrong password !</div>
        {/if}
    </Content>
</Dialog>

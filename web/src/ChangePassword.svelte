<script>
    import { Textfield, Button, Icon, Dialog } from 'svelte-mui';
    import Field from './Field.svelte';

    export let visible = false;

    let oldPassword = '';
    let newPassword = '';
    let confirmPassword = '';

    let error = false;

    $: canSubmit = newPassword && newPassword === confirmPassword;

    async function changePassword () {
        let response = await fetch('/change_password', {
            method: 'post',
            headers: {'Content-Type': 'application/json;'},
            body: JSON.stringify({old_password: oldPassword, new_password: newPassword})
        })

        if (response.ok) {
            visible = false;
        } else {
            error = true;
        }

    }

</script>

<Dialog width="290" bind:visible>
    <div slot="title">New password!</div>

    <Field label="Old password" type="password" bind:value={oldPassword} copy="0"/>
    <Field label="New password" type="password" bind:value={newPassword} copy="0"/>
    <Field label="Confirm" type="password" bind:value={confirmPassword} copy="0"/>

    <div slot="actions" class="actions center">
        {#if canSubmit}
        <Button color="primary" raised on:click={changePassword}>
            Change
            <Icon style="margin-left: 5px">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
                    <path d="M618.9,438.7c35.8,0,64.8,31.6,64.8,70.7v164.9c0,39-29,70.7-64.8,70.7H381.3c-35.8,0-64.8-31.6-64.8-70.7V509.4c0-39,29-70.7,64.8-70.7h57.5l0,0h122.5l0,0H618.9z M499.5,500.2c-33.8,0-61.3,26.2-61.3,58.6c0,21.6,16.8,38.2,35,48.3v76.1h52.5v-76.1c18.3-10.2,35-26.7,35-48.3C560.8,526.4,533.4,500.2,499.5,500.2z M500,316.3c-57.6,0-61.1,48.4-61.3,61.3v61.1h-61.6v-55.2c0,0,0-128.6,122.7-128.6c122.7,0,122.7,128.6,122.7,128.6v55.2h-61.2v-61.1C561.1,365,557.6,316.3,500,316.3z M500,990.1c-270.6,0-490-219.4-490-490c0-270.6,219.4-490,490-490c87.2,0,169,22.9,240,62.9l45.6-63.1l81.6,214.5L653.2,193l50.5-69.9C643.1,90.3,573.8,71.4,500,71.4c-236.8,0-428.8,192-428.8,428.8c0,236.8,192,428.7,428.8,428.7c236.8,0,428.8-192,428.8-428.7c0-57.8-11.6-112.9-32.3-163.2l56.6-23.3c23.7,57.5,37,120.4,37,186.5C990,770.7,770.6,990.1,500,990.1z"/>
                </svg>
            </Icon>
        </Button>
        {/if}
    </div>
    {#if error}
        <div class="error">Wrong password !</div>
    {/if}
</Dialog>


<style>
    .error {
        text-align: center;
        color: var(--error-color);
    }
</style>

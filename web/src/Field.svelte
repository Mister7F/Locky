<script>
    import { Textfield, Button, Icon, Menu, Menuitem } from 'svelte-mui';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let label = '';
    export let readonly = 0;
    export let type = 'text';
    export let value = '';
    export let message = null;
    export let copy = 1;

    export let canEditType = false;

    export let index = 0;

    export let passwordVisible = false;

    $: computedType = passwordVisible ? 'text' : type;

    function copyValue (str) {
        const el = document.createElement('textarea');
        // clear the clipboard with space if nothing
        el.value = str || ' ';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
</script>

{#if value || !readonly}
<div class="field">
    {#if readonly}
        <div class="label">{label}</div>
    {/if}
    <div class="content">
        {#if readonly}
            {#if type === 'url' && value.startsWith('http')}
                <a class="value" href={value}>{value}</a>
            {:else if type === 'password' && !passwordVisible}
                <div class="value">{'•••••••••' }</div>
            {:else if type === 'totp'}
                <div class="value">{message}</div>
            {:else}
                <div class="value">{value}</div>
            {/if}
        {:else}
            <Textfield bind:label bind:value bind:message bind:type={computedType} messagePersist="1"/>
        {/if}

        {#if type === 'password'}
            <Button on:click={() => {passwordVisible = !passwordVisible}}>
                {#if passwordVisible}
                    <Icon path="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z"/>
                {:else}
                    <Icon path="M12 6c3.79 0 7.17 2.13 8.82 5.5-.59 1.22-1.42 2.27-2.41 3.12l1.41 1.41c1.39-1.23 2.49-2.77 3.18-4.53C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l1.65 1.65C10.66 6.09 11.32 6 12 6zm-1.07 1.14L13 9.21c.57.25 1.03.71 1.28 1.28l2.07 2.07c.08-.34.14-.7.14-1.07C16.5 9.01 14.48 7 12 7c-.37 0-.72.05-1.07.14zM2.01 3.87l2.68 2.68C3.06 7.83 1.77 9.53 1 11.5 2.73 15.89 7 19 12 19c1.52 0 2.98-.29 4.32-.82l3.42 3.42 1.41-1.41L3.42 2.45 2.01 3.87zm7.5 7.5l2.61 2.61c-.04.01-.08.02-.12.02-1.38 0-2.5-1.12-2.5-2.5 0-.05.01-.08.01-.13zm-3.4-3.4l1.75 1.75c-.23.55-.36 1.15-.36 1.78 0 2.48 2.02 4.5 4.5 4.5.63 0 1.23-.13 1.77-.36l.98.98c-.88.24-1.8.38-2.75.38-3.79 0-7.17-2.13-8.82-5.5.7-1.43 1.72-2.61 2.93-3.53z"/>
                {/if}
            </Button>
        {:else if type === 'totp' && value}
            <Button on:click={() => {dispatch('show_qrcode')}}>
                <Icon viewBox="0 0 1792 1792" path="M576 1152v128h-128v-128h128zm0-768v128h-128v-128h128zm768 0v128h-128v-128h128zm-1024 1023h384v-383h-384v383zm0-767h384v-384h-384v384zm768 0h384v-384h-384v384zm-256 256v640h-640v-640h640zm512 512v128h-128v-128h128zm256 0v128h-128v-128h128zm0-512v384h-384v-128h-128v384h-128v-640h384v128h128v-128h128zm-768-768v640h-640v-640h640zm768 0v640h-640v-640h640z"/>
            </Button>
        {/if}

        {#if canEditType && !readonly}
            <Menu width="10px" origin="top right">
                <div slot="activator">
                    <Button>
                        {#if type === 'text'}
                            <Icon path="M5 4v3h5.5v12h3V7H19V4z"/>
                        {:else if type === 'url'}
                            <Icon>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                            </Icon>
                        {:else}
                            <Icon path="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                        {/if}
                    </Button>
                </div>
                <Menuitem on:click={() => {type = 'text'}}>
                    <Button>
                        <Icon path="M5 4v3h5.5v12h3V7H19V4z"/>
                    </Button>
                </Menuitem>
                <Menuitem on:click={() => {type = 'password'}}>
                    <Button>
                        <Icon path="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                    </Button>
                </Menuitem>
                <Menuitem on:click={() => {type = 'url'}}>
                    <Button>
                        <Icon>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                        </Icon>
                    </Button>
                </Menuitem>
                <Menuitem on:click={() => {dispatch('removefield', index)}}>
                    <Button>
                        <Icon path="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </Button>
                </Menuitem>
                <Menuitem on:click={() => {dispatch('edit_field_name', index)}}>
                    <Button>
                        <Icon>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
                        </Icon>
                    </Button>
                </Menuitem>
            </Menu>
        {/if}
        {#if parseInt(copy)}
            <Button on:click={() => {copyValue(value)}}>
                <Icon>
                    <svg height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h48v48h-48z" fill="none"/><path d="M32 2h-24c-2.21 0-4 1.79-4 4v28h4v-28h24v-4zm6 8h-22c-2.21 0-4 1.79-4 4v28c0 2.21 1.79 4 4 4h22c2.21 0 4-1.79 4-4v-28c0-2.21-1.79-4-4-4zm0 32h-22v-28h22v28z"/></svg>
                </Icon>
            </Button>
        {/if}
    </div>
</div>
{/if}


<style>
    .field {
        height: 72px;
        width: 100%;
        text-align: left;
    }

    .content {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 50px;
    }

    .label {
        min-width: 100%;
        letter-spacing: 0.4px;
        font-size: 13px;
        margin-bottom: -6px;
    }

    .value {
        width: 100%;
    }

    .message {
        font-size: 12px;
        letter-spacing: 0.4px;
    }

    a:hover {
        color: var(--link-color);
        text-decoration: underline;
    }

</style>

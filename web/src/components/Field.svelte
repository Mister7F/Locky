<script>
    import Textfield from "@smui/textfield";
    import List, { Item } from "@smui/list";
    import HelperText from "@smui/textfield/helper-text/index";
    import Menu, { SelectionGroup, SelectionGroupIcon } from "@smui/menu";
    import IconButton from "@smui/icon-button";

    import Icon from "./Icon.svelte";

    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let label = "";
    export let readonly = 0;
    export let type = "text";
    export let value = "";
    export let message = null;
    export let copy = 1;
    let className = "";
    export { className as class };

    export let canEditType = false;

    export let index = 0;
    export let passwordVisible = false;

    let openMenu = false;
    let textField;

    $: computedType = passwordVisible ? "text" : type;
    $: computedMessage =
        message && message.length
            ? message
            : type === "password"
            ? "Strength:" + value.length
            : null;

    function onKeyPress(e) {
        if (!e) e = window.event;
        if ((e.keyCode || e.which) == 13) {
            dispatch("enter");
            return false;
        }
    }

    export function focus() {
        if (textField) {
            textField.focus();
        }
    }
</script>

<style>
    .field {
        height: 72px;
        max-height: 100%;
        width: auto;
        text-align: left;
        max-width: 350px;
    }

    .content {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 50px;
        box-sizing: border-box;
    }

    .text-field-container {
        width: 100%;
    }

    .text-field-container :global(.text-field) {
        width: 100%;
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

    a {
        color: var(--link-color);
    }

    a:hover {
        text-decoration: underline;
    }

    :global(.menu_field_type) {
        margin-top: 310px;
        margin-left: -60px;
        min-width: 60px;
        width: 60px;
        z-index: 999999;
        box-sizing: border-box;
    }

    /* Set colors */
    .field {
        color: var(--on-primary);
    }
    .field :global(input),
    .field :global(.mdc-text-field-helper-text),
    .field :global(.mdc-floating-label) {
        color: var(--on-primary) !important;
    }

    .field :global(.mdc-text-field--focused input) {
        caret-color: var(--secondary) !important;
    }
    .field :global(.mdc-text-field--focused .mdc-floating-label) {
        color: var(--secondary) !important;
    }

    .field :global(.mdc-text-field__input) {
        border-bottom-color: var(--on-primary) !important;
    }

    .field :global(.mdc-line-ripple) {
        background-color: var(--secondary) !important;
    }
</style>

{#if value || !readonly}
    <div class="field {className}">
        {#if readonly}
            <div class="label">{label}</div>
        {/if}
        <div class="content">
            {#if readonly}
                {#if type === 'url' && value.startsWith('http')}
                    <a class="value" href={value}>{value}</a>
                {:else if type === 'password' && !passwordVisible}
                    <div class="value">{'•••••••••'}</div>
                {:else if type === 'totp'}
                    <div class="value">{message}</div>
                {:else}
                    <div class="value">{value}</div>
                {/if}
            {:else}
                <div class="text-field-container">
                    <Textfield
                        class="text-field"
                        bind:label
                        bind:value
                        bind:this={textField}
                        bind:type={computedType}
                        on:keypress={onKeyPress}
                        on:change
                        on:input
                        on:keydown
                        input$aria-controls="helper-text-standard-field" />
                    {#if computedMessage}
                        <HelperText id="helper-text-standard-fields">
                            {computedMessage}
                        </HelperText>
                    {/if}
                </div>
            {/if}

            {#if type === 'password'}
                <IconButton
                    toggle
                    bind:pressed={passwordVisible}
                    ripple={false}>
                    <Icon class="material-icons" on>visibility</Icon>
                    <Icon class="material-icons">visibility_off</Icon>
                </IconButton>
            {:else if type === 'totp' && value}
                <IconButton
                    on:click={() => {
                        dispatch('show_qrcode');
                    }}>
                    <Icon>
                        <svg
                            height="1792"
                            viewBox="0 0 1792 1792"
                            width="1792"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M576
                                1152v128h-128v-128h128zm0-768v128h-128v-128h128zm768
                                0v128h-128v-128h128zm-1024
                                1023h384v-383h-384v383zm0-767h384v-384h-384v384zm768
                                0h384v-384h-384v384zm-256
                                256v640h-640v-640h640zm512
                                512v128h-128v-128h128zm256
                                0v128h-128v-128h128zm0-512v384h-384v-128h-128v384h-128v-640h384v128h128v-128h128zm-768-768v640h-640v-640h640zm768
                                0v640h-640v-640h640z" />
                        </svg>
                    </Icon>
                </IconButton>
            {/if}

            {#if canEditType && !readonly}
                <IconButton
                    on:click={() => (openMenu = !openMenu)}
                    on:blur={() => setTimeout(() => (openMenu = false), 100)}>
                    <Icon>
                        {#if type === 'text'}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24">
                                <path d="M5 4v3h5.5v12h3V7H19V4z" />
                            </svg>
                        {:else if type === 'password'}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24">
                                <path
                                    d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6
                                    2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67
                                    5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1
                                    0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                            </svg>
                        {:else if type === 'url'}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24">
                                <path d="M0 0h24v24H0z" fill="none" />
                                <path
                                    d="M3.9 12c0-1.71 1.39-3.1
                                    3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5
                                    5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8
                                    13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39
                                    3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0
                                    5-2.24 5-5s-2.24-5-5-5z" />
                            </svg>
                        {/if}

                    </Icon>
                </IconButton>
                {#if openMenu}
                    <Menu static class="menu_field_type">
                        <List>
                            <Item on:click={() => (type = 'text')}>
                                <Icon color="surface">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24">
                                        <path d="M5 4v3h5.5v12h3V7H19V4z" />
                                    </svg>
                                </Icon>
                            </Item>
                            <Item on:click={() => (type = 'password')}>
                                <Icon color="surface">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24">
                                        <path
                                            d="M12.65 10C11.83 7.67 9.61 6 7
                                            6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61
                                            0 4.83-1.67
                                            5.65-4H17v4h4v-4h2v-4H12.65zM7
                                            14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2
                                            2-.9 2-2 2z" />
                                    </svg>
                                </Icon>
                            </Item>
                            <Item on:click={() => (type = 'url')}>
                                <Icon color="surface">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24">
                                        <path d="M0 0h24v24H0z" fill="none" />
                                        <path
                                            d="M3.9 12c0-1.71 1.39-3.1
                                            3.1-3.1h4V7H7c-2.76 0-5 2.24-5
                                            5s2.24 5 5 5h4v-1.9H7c-1.71
                                            0-3.1-1.39-3.1-3.1zM8
                                            13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1
                                            1.39 3.1 3.1s-1.39 3.1-3.1
                                            3.1h-4V17h4c2.76 0 5-2.24
                                            5-5s-2.24-5-5-5z" />
                                    </svg>
                                </Icon>
                            </Item>
                            <hr style="margin: 0 10px;" />
                            <Item
                                on:click={() => dispatch('edit_field_name', index)}>
                                <Icon color="surface">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24">
                                        <path
                                            d="M3 17.25V21h3.75L17.81
                                            9.94l-3.75-3.75L3 17.25zM20.71
                                            7.04c.39-.39.39-1.02
                                            0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41
                                            0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                        <path d="M0 0h24v24H0z" fill="none" />
                                    </svg>
                                </Icon>
                            </Item>
                            <Item on:click={() => dispatch('removefield')}>
                                <Icon color="surface">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24">
                                        <path
                                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9
                                            2-2V7H6v12zM8
                                            9h8v10H8V9zm7.5-5l-1-1h-5l-1
                                            1H5v2h14V4z" />
                                    </svg>
                                </Icon>
                            </Item>
                        </List>
                    </Menu>
                {/if}
            {/if}
            {#if parseInt(copy) && value}
                <IconButton
                    on:click={() => {
                        dispatch('copy');
                    }}>
                    <Icon>
                        <svg
                            height="48"
                            viewBox="0 0 48 48"
                            width="48"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0h48v48h-48z" fill="none" />
                            <path
                                d="M32 2h-24c-2.21 0-4 1.79-4
                                4v28h4v-28h24v-4zm6 8h-22c-2.21 0-4 1.79-4
                                4v28c0 2.21 1.79 4 4 4h22c2.21 0 4-1.79
                                4-4v-28c0-2.21-1.79-4-4-4zm0 32h-22v-28h22v28z" />
                        </svg>
                    </Icon>
                </IconButton>
            {/if}
        </div>
    </div>
{/if}

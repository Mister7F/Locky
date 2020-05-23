<script>
    import Select, { Option } from "@smui/select";
    import FormField from "@smui/form-field";
    import Switch from "@smui/switch";
    import Button from "@smui/button";
    import Icon from "@smui/select/icon/index";

    import { login, getAccounts, getDatabasesName } from "./Api.svelte";
    import Field from "./components/Field.svelte";
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    const maxLen = 8;
    let username = "";
    let password = "";
    let create = false;

    let wrongPassword = false;

    $: svgValue = wrongPassword
        ? 0
        : ((100 - 33) * (maxLen - Math.min(password.length, maxLen))) / maxLen +
          33;
    $: fillColor = wrongPassword ? "var(--error-color)" : "var(--secondary)";

    async function checkPassword() {
        if (await login(username, password)) {
            let wallet = await getAccounts();
            dispatch("open_wallet", wallet);
            return true;
        }

        return false;
    }

    async function unlock() {
        if (!(await checkPassword())) {
            password = "";
            wrongPassword = true;
            let lockSvg = document.querySelector("svg");
            lockSvg.classList.add("wrong_password");
            setTimeout(() => {
                lockSvg.classList.remove("wrong_password");
            }, 1000);
        }
    }

    function onEnter(e) {
        if (wrongPassword) {
            wrongPassword = false;
        }
        unlock();
    }

    checkPassword();

    let databases;
    (async () => {
        databases = await getDatabasesName();
        if (!databases) {
            create = true;
        } else {
            username = databases[0];
        }
    })();
</script>

<style>
    .lock {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: var(--primary);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        justify-content: center;
        align-items: center;
    }

    svg {
        width: 250px;
        height: 250px;
        fill: none;
    }

    :global(svg.wrong_password) {
        animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    svg path {
        stroke: var(--on-primary);
        stroke-width: 0.2px;
        stroke-dasharray: 100px;
        stroke-dashoffset: 0;
        transition: 1s;
    }

    svg path:nth-child(2) {
        stroke: var(--fill-color);
        stroke-dasharray: 100px;
        stroke-dashoffset: var(--lock-value);
    }

    @keyframes shake {
        10%,
        90% {
            transform: translate3d(-1px, 0, 0);
        }

        20%,
        80% {
            transform: translate3d(2px, 0, 0);
        }

        30%,
        50%,
        70% {
            transform: translate3d(-4px, 0, 0);
        }

        40%,
        60% {
            transform: translate3d(4px, 0, 0);
        }
    }

    .lock :global(.mdc-select) {
        width: 100%;
    }

    .fields {
        padding: 20px 0;
        width: 250px;
        height: 280px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
    }

    .fields > :global(*:not(.mdc-form-field)) {
        width: 100%;
    }
    .fields > :global(*) {
        margin-bottom: 30px;
        height: 60px;
    }
</style>

<div class="lock" style="--lock-value: {svgValue}; --fill-color: {fillColor}">
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24">
        <path
            d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0
            1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1
            0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-9H8.9V6c0-1.71 1.39-3.1
            3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
        <path
            d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0
            1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1
            0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-9H8.9V6c0-1.71 1.39-3.1
            3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
    <div class="fields">
        {#if databases}
        <FormField>
            <Switch bind:checked={create} />
            <span slot="label">Create a new wallet</span>
        </FormField>
        {/if}

        {#if databases && !create}
            <Select
                variant="outlined"
                enhanced
                bind:value={username}
                label="Username"
                withLeadingIcon>
                <span slot="icon">
                    <Icon class="material-icons">account_circle</Icon>
                </span>
                {#each databases as database, i}
                    <Option value={database}>{database}</Option>
                {/each}
            </Select>
        {:else}
            <Field label="Username" bind:value={username} copy="0" />
        {/if}

        <Field
            label="Password"
            bind:value={password}
            on:enter={onEnter}
            on:input={() => (wrongPassword = false)}
            type="password"
            copy="0" />

        <Button color="secondary" on:click={onEnter}>
            {create ? 'Create' : 'Login'}
        </Button>
    </div>
</div>

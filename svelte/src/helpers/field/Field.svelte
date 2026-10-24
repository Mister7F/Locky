<script lang="ts">
    import FieldAction from './FieldAction.svelte'
    import IconButton from '../IconButton.svelte'
    import TextInput from '../TextInput.svelte'
    import PasswordWarning from './PasswordWarning.svelte'
    import { passwordStrength } from '../crypto.ts'
    import { isUrlValid } from '../utils.ts'
    import Icon from '../Icon.svelte'
    import GeneratePassword from '../../application/editor/GeneratePassword.svelte'
    import zxcvbn from 'zxcvbn'
    import type { FieldType } from '../types.ts'

    interface Props {
        label?: string
        readonly?: boolean
        type?: FieldType
        autofocus?: boolean
        showPasswordStrength?: boolean
        value?: string
        message?: string
        messagePersistent?: boolean
        copy?: boolean
        class?: string
        canEditType?: boolean
        index?: number
        passwordVisible?: boolean
        showGeneratePassword?: boolean
        onchange?: (event: Event) => void
        oninput?: (event: Event) => void
        onkeydown?: (event: KeyboardEvent) => void
        onblur?: () => void
        onenter?: () => void
        oncopy?: () => void
        onshow_qrcode?: () => void
        onremove?: (index?: number) => void
        onmove_up?: () => void
        onmove_down?: () => void
        actionIcon?: string
        actionTitle?: string
        onaction?: () => void
    }

    let {
        label = $bindable(''),
        readonly = false,
        type = $bindable('text'),
        autofocus = false,
        showPasswordStrength = false,
        value = $bindable(),
        message = '',
        messagePersistent = false,
        copy = true,
        class: className = '',
        canEditType = false,
        index = 0,
        passwordVisible = false,
        showGeneratePassword = false,
        onchange,
        oninput,
        onkeydown,
        onblur,
        onenter,
        oncopy,
        onshow_qrcode,
        onremove,
        onmove_up,
        onmove_down,
        actionIcon = '',
        actionTitle = '',
        onaction,
    }: Props = $props()

    let copied = $state(false)
    let generatePasswordDialog = $state<any>(null)

    let computedType = $derived(
        type === 'text-multiline'
            ? 'textarea'
            : passwordVisible
              ? 'text'
              : type === 'password' || type === 'email'
                ? type
                : 'text'
    )

    let { strength, detail: strengthResult } = $derived(
        type === 'password' && showPasswordStrength && value && value.length
            ? passwordStrength(value, true)
            : { strength: null, detail: null }
    )

    let [urlLeft, urlHost, urlPath] = $derived.by(() => {
        if (type !== 'url' || !isUrlValid(value)) {
            return [null, null, null]
        }

        let url = null
        try {
            url = new URL(value)
        } catch {
            return [null, null, null]
        }

        let leftPart = url.protocol + '//'
        if (url.username) {
            leftPart += url.username
            if (url.password) {
                leftPart += ':' + url.password
            }
            leftPart += '@'
        }

        return [
            leftPart,
            url.host,
            value.slice(leftPart.length + url.host.length),
        ]
    })

    const getMessage = (
        message?: string,
        strength?: number
    ): string | undefined => {
        if (message?.length) {
            return message
        } else if (strength !== null) {
            return 'Strength: ' + (strength || 0) + ' / 100'
        }
    }
    let computedMessage = $derived(getMessage(message, strength))

    /**
     * Generate the event "enter" when pressing enter.
     */
    function onKeyPress(e: KeyboardEvent | Event) {
        if (!e) e = window.event
        const keyEvent = e as KeyboardEvent
        if ((keyEvent.keyCode || keyEvent.which) == 13) {
            e.preventDefault()
            e.stopPropagation()
            onenter?.()
            return false
        }
    }

    function onCopyClick() {
        oncopy?.()
        copied = true
        setTimeout(() => (copied = false), 1000)
    }
</script>

{#if value || !readonly}
    <div class="field {className} {readonly && 'readonly'}">
        <div class="content">
            {#if readonly}
                <div class="readonly-control">
                    <div class="label-readonly">{label}</div>
                    {#if type === 'url' && isUrlValid(value) && urlLeft && urlHost}
                        <a
                            class="value"
                            href={value}
                            title={value}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span>{urlLeft}</span><span class="host"
                                >{urlHost}</span
                            ><span>{urlPath}</span>
                        </a>
                    {:else if type === 'password'}
                        {#if !passwordVisible}
                            <div class="value">{'•••••••••'}</div>
                        {:else}
                            <div class="multi-line-value">{value}</div>
                        {/if}
                    {:else if type === 'totp'}
                        <div class="value">{message}</div>
                    {:else if type === 'text-multiline'}
                        <div class="multi-line-value">{value}</div>
                    {:else}
                        <div class="value">{value}</div>
                    {/if}
                </div>
            {:else}
                <TextInput
                    class="text-field"
                    {label}
                    bind:value
                    type={computedType}
                    {autofocus}
                    onkeypress={type === 'text-multiline'
                        ? undefined
                        : onKeyPress}
                    {onchange}
                    {oninput}
                    {onkeydown}
                    {onblur}
                    help={computedMessage}
                    helpPersistent={!!messagePersistent}
                />
            {/if}
            <div class="field-actions">
                {#if type === 'password'}
                    <IconButton
                        onclick={() => (passwordVisible = !passwordVisible)}
                        icon={passwordVisible ? 'visibility' : 'visibility_off'}
                    />
                    {#if showGeneratePassword && !value?.length}
                        <GeneratePassword
                            bind:this={generatePasswordDialog}
                            onuse={(password) => (value = password)}
                        />
                        <IconButton
                            onclick={() => generatePasswordDialog.open()}
                            icon="refresh"
                        />
                    {:else if strengthResult && strengthResult.feedback}
                        <PasswordWarning {strengthResult} />
                    {/if}
                {:else if type === 'totp' && value}
                    <IconButton onclick={onshow_qrcode} icon="qr_code" />
                {/if}
                {#if canEditType && !readonly}
                    <FieldAction
                        bind:type
                        bind:label
                        {onremove}
                        {onmove_up}
                        {onmove_down}
                    />
                {/if}
                {#if actionIcon && !readonly}
                    <IconButton
                        onclick={onaction}
                        icon={actionIcon}
                        title={actionTitle}
                    />
                {/if}
                {#if copy && value}
                    <IconButton
                        onclick={onCopyClick}
                        icon={copied ? 'check' : 'content_copy'}
                    />
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .field {
        max-height: 100%;
        width: auto;
        text-align: left;
        max-width: 350px;
        padding: 16px 0;
    }
    .field.readonly {
        padding: 16px 0;
    }

    .content {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        min-height: 50px;
        box-sizing: border-box;
        font-size: 16px;
    }

    .readonly-control {
        position: relative;
        flex: 1;
        min-width: 0;
        min-height: 50px;
    }

    .label-readonly {
        /* Same style as TextInput */
        position: absolute;
        top: -2px;
        left: 0;
        --color: hsla(200, 5%, 88%, 0.87);
        --disabled-color: color-mix(in srgb, var(--color) 65%, transparent);
        color: var(--disabled-color) !important;
        font-size: 12px;
        line-height: 1.2;
        font-weight: 400;

        min-width: calc(100% - 50px);
        max-width: calc(100% - 50px);
        letter-spacing: 0.4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .value {
        display: block;
        width: 100%;
        height: 50px;
        box-sizing: border-box;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--on-primary);
        padding: 10px 0;
        border-bottom: 1px solid transparent;
        font-size: 16px;
        line-height: 29px;
    }

    .multi-line-value {
        width: 100%;
        color: var(--on-primary);
        padding: 18px 0 12px;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    .field-actions {
        display: flex;
        align-items: center;
        align-self: flex-start;
        flex-shrink: 0;
        height: 50px;
    }

    a {
        text-decoration: none;
    }
    a span:not(.host) {
        color: var(--on-primary) !important;
    }
    a span.host {
        color: var(--link-color) !important;
    }
    a:hover span {
        text-decoration: underline;
    }
</style>

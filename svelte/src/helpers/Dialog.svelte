<script lang="ts">
    interface Props {
        title?: string
        open?: boolean
        dismissible?: boolean
        children?: () => any
        headerActions?: () => any
        actions?: () => any
    }

    let {
        title = '',
        open = $bindable(false),
        dismissible = true,
        children,
        headerActions,
        actions,
    }: Props = $props()

    function onClose(event: MouseEvent) {
        const target = event.target as HTMLElement
        if (dismissible && target?.classList.contains('background')) {
            open = false
        }
    }
</script>

{#if open}
    <div class="background" onclick={onClose}>
        <div class="dialog">
            <div class="header">
                <span class="title">{title}</span>
                {#if headerActions}
                    {@render headerActions()}
                {/if}
            </div>
            <hr />
            <div class="content">
                {#if children}
                    {@render children()}
                {/if}
            </div>
            <br />
            <div class="actions">
                {#if actions}
                    {@render actions()}
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .background {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        inset: 0;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        background-color: rgba(74, 101, 114, 0.32);
        z-index: 99999;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .title {
        flex: 1;
        font-size: 1.25rem;
        font-weight: 500;
        letter-spacing: 0.0125em;
    }
    span {
        color: var(--on-primary);
    }

    .dialog {
        box-shadow:
            0 19px 38px rgba(0, 0, 0, 0.3),
            0 15px 12px rgba(0, 0, 0, 0.22);
        box-sizing: border-box;
        border-radius: 4px;
        padding: clamp(20px, 4vw, 30px);
        max-width: calc(100vw - 32px);
        max-height: calc(100dvh - 32px);
        min-width: 100px;
        min-height: 100px;
        margin: auto;
        color: var(--on-primary);
        background: var(--primary);
    }

    hr,
    .content {
        color: var(--on-primary);
        max-width: 100%;
        overflow: hidden;
        word-wrap: break-word;
    }

    .actions {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }
</style>

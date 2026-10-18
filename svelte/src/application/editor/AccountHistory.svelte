<script lang="ts">
    import Button from '../../helpers/Button.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import IconButton from '../../helpers/IconButton.svelte'
    import Field from '../../helpers/field/Field.svelte'
    import { copyValue } from '../../helpers/utils.ts'
    import type { HistoryEntry } from '../../models/account.ts'

    interface Props {
        entries: HistoryEntry[]
        onremove: (entryId: string) => Promise<void>
    }

    let { entries, onremove }: Props = $props()

    let historyDialogOpen = $state(false)

    export function open() {
        historyDialogOpen = true
    }

    async function onRemove(entryId: string) {
        await onremove(entryId)
        historyDialogOpen = entries.length > 0
    }
</script>

<Dialog bind:open={historyDialogOpen} title="History">
    <div class="entries">
        {#each entries as entry, i (entry.id)}
            {#if entry.date !== entries[i - 1]?.date}
                <div class="date">{new Date(entry.date).toLocaleString()}</div>
            {/if}
            <div class="entry">
                <Field
                    label={entry.name}
                    value={entry.value}
                    readonly={true}
                    type={entry.type === 'totp' ? 'password' : entry.type}
                    oncopy={() => copyValue(entry.value)}
                />
                <IconButton
                    title="Remove from history"
                    icon="delete"
                    color="danger"
                    onclick={() => onRemove(entry.id)}
                />
            </div>
        {/each}
    </div>

    {#snippet actions()}
        <Button
            color="secondary"
            variant="outlined"
            onclick={() => (historyDialogOpen = false)}
        >
            Close
        </Button>
    {/snippet}
</Dialog>

<style>
    .entries {
        max-height: 50vh;
        max-height: 50dvh;
        overflow-y: auto;
    }

    .date {
        margin-top: 10px;
        font-size: 0.9em;
        color: var(--on-primary);
        opacity: 0.7;
    }

    .entry {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        width: 300px;
        max-width: 100%;
    }

    .entry :global(.field) {
        flex: 1;
        min-width: 0;
    }
</style>

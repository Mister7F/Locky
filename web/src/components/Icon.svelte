<script>
    import IconButton, { Icon } from "@smui/icon-button";

    export let title = "";
    let className = "";
    export { className as class };

    // primary - surface
    export let color = "primary";
    export let on = null;

    $: cssColor =
        color === "primary" ? "var(--on-primary)" : "var(--on-surface)";
</script>

<style>
    :global(.icon-import) {
        color: var(--color) !important;
    }

    :global(.icon-import svg) {
        fill: var(--color);
        width: 100%;
        min-width: 24px;
        min-height: 24px;
    }
</style>

<Icon
    class="icon-import material-icons {className}"
    on:click
    {title}
    {color}
    {on}
    style="--color: {cssColor}">
    <slot />
</Icon>

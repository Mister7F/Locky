<script>
    import { onMount } from "svelte";

    export let src = null;
    let svgContent = "";
    onMount(async () => {
        svgContent = localStorage.getItem("__data__" + src);
        if (svgContent) {
        } else {
            const res = await fetch(src);
            svgContent = await res.text();
            localStorage.setItem("__data__" + src, svgContent);
        }
    });
</script>

<style>
    .include {
        max-height: 100%;
        max-width: 100%;
    }
    .include :global(svg) {
        height: 100%;
        width: 100%;
        margin: 0;
    }
</style>

<div class="include">
    {@html svgContent}
</div>

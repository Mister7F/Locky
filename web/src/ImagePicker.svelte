<script>
    import Textfield from "@smui/textfield";
    import Field from "./components/Field.svelte";
    import { onMount } from "svelte";

    export let src;
    export let chooseIcon = false;
    export let readonly = false;
    export let size = "100px";

    let srcs = [];
    $: currentSrcs =
        !searchValue || !searchValue.length
            ? srcs
            : srcs.filter((url) => {
                  return (
                      url.toLowerCase().indexOf(searchValue.toLowerCase()) > 0
                  );
              });
    let searchValue = "";

    onMount(async () => {
        let response = await fetch("/account_icons");
        srcs = await response.json();
        currentSrcs = srcs;
    });

    function open() {
        chooseIcon = readonly ? false : true;
    }

    function choose(isrc) {
        searchValue = "";

        src = isrc;
        chooseIcon = false;
    }
</script>

<style>
    .image_picker {
        width: 100%;
        max-height: 100%;
    }

    .img {
        cursor: pointer;
        width: var(--size);
        margin: auto;
        max-width: 100%;
        max-height: 100%;
    }

    .image_picker :global(svg),
    img {
        max-width: 100%;
        max-height: 100%;
        height: var(--size);
        margin: auto;
    }

    .readonly {
        cursor: default;
    }
    .icons {
        position: absolute;
        z-index: 99999999;
        top: 0;
        left: 0;
        width: 100%;
        overflow-y: scroll;
        height: 0;
        transition: 0.4s;
        padding: 0 20px;
        box-sizing: border-box;
        transition-timing-function: ease-in-out;
        background-color: var(--primary);
    }

    .icons.visible {
        height: 100vh;
    }

    .icons img {
        max-width: 40px;
        max-height: 40px;
        margin: 10px;
        cursor: pointer;
    }

    .container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        margin-top: 10px;
        max-height: calc(100% - 50px);
        overflow: hidden;
        overflow-y: auto;
        width: 90%;
        margin: auto;
        padding-top: 10px;
    }

    .container::after {
        /* To align the last row to the left */
        content: "";
        flex: auto;
    }

    .search {
        width: 100%;
        position: sticky;
        height: 60px;
    }
</style>

<div class="image_picker" style="--size: {size}">
    <div class={readonly ? 'img readonly' : 'img'} on:click={open}>
        {#if src}
            <img {src} alt={src} />
        {:else}
            <img src="/img/account_default.svg" alt="default" />
        {/if}
    </div>
    <div class="icons {chooseIcon && !readonly ? 'visible' : ''}">
        <div class="search">
            <Field label="Search" copy="0" bind:value={searchValue} />
        </div>
        <div class="container">
            {#each currentSrcs as src}
                <img
                    {src}
                    on:click={() => {
                        choose(src);
                    }}
                    alt={src} />
            {/each}
        </div>
    </div>
</div>

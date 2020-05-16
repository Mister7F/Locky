<script>
    import { Textfield } from 'svelte-mui';
    import Include from './Include.svelte';
    import { onMount } from 'svelte';

    export let src;
    export let chooseIcon = false;
    export let readonly = false;
    export let size = "100px";

    let srcs = [];
    let currentSrcs = [];
    let searchValue = '';

    onMount(async () => {
        let response = await fetch('/account_icons');
        srcs = await response.json();
        currentSrcs = srcs;
    });

    function open () {
        chooseIcon = readonly ? false : true;
    }

    function choose (isrc) {
        search();
        searchValue = '';

        src = isrc;
        chooseIcon = false;
    }

    function search(event) {
        if (!event || !searchValue.length) {
            currentSrcs = srcs;
        } else {
            currentSrcs = srcs.filter((url) => {
                return url.indexOf(searchValue) > 0;
            });
        }
    }

</script>

<div class="image_picker" style="--size: {size}">
    <div class={readonly ? 'img readonly' : 'img'} on:click={open}>
        {#if src}
            <img src={src} alt={src}/>
        {:else}
            <Include src='/img/account_default.svg'/>
        {/if}
    </div>
    <div class="icons {chooseIcon && !readonly ? 'visible' : ''}">
        <div class="search">
            <Textfield placeholder="Search" width="100%" on:input={search} bind:value={searchValue}/>
        </div>
        <div class="container">
            {#each currentSrcs as src}
                <img src={src} on:click={() => {choose(src)}} alt={src}/>
            {/each}
        </div>
    </div>
</div>

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
        height: var(--size);;
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
        background-color: var(--background);
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

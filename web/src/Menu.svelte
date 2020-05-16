<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
	export let visible = true;

	function hide () {
		visible = false;
		dispatch('hide');
	}

</script>

<div class="menu" on:click={hide} style={'--visible: ' + Number(visible)}/>
<div class="container" on:click|stopPropagation style={'--visible: ' + Number(visible)}>
	<slot/>
</div>
<style lang="less">
	.menu {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		z-index: calc(999 * var(--visible) - 9);
		background-color: RGBA(0, 0, 0, 0.6);
		overflow: hidden;
	}
	.container {
		position: absolute;
		top: 0;
		left: calc(-450px + (var(--visible) * 450px));
		z-index: 1000;
		width: 450px;
		height: 100vh;
		opacity: 100;
		background-color: var(--background);
		transition: 0.8s;
		overflow: hidden;
	}
</style>

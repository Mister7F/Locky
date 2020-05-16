<script>
    import Include from './Include.svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
	export let account;

	let editingFolder = false;
    let editFolderNameElement;

	function copyField (event) {
		let field = event.currentTarget.getAttribute('field');
	}

	function saveFolder() {
		editingFolder = false;
		dispatch('save_folder', account);
	}

</script>

<div class="account" on:click={() => dispatch('click')}>
	<div class="card">
		<div class="row">
			<div class="image">
				<img src={account.icon} alt="Account"/>
			</div>
			<h5>{account.name}</h5>
		</div>
	</div>
	<div class="strength" style="--force: {account.force || 0}"/>
</div>

<style>
	.account {
		padding: 0;
		margin: 0;
		width: 180px;
		height: 70px;
		margin: 10px;
		cursor: pointer;
	}

    .account:hover {
        box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
    }

	.card {
		padding: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background-color: var(--account-background);
		border: 1px solid var(--background);
		border-radius: 2px;
		transition: 0.1s;
		box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
		width: 180px;
		height: 70px;
		margin: 0;
        overflow: hidden;
        box-sizing: border-box;
	}

	.row {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	h5 {
		font-size: 1.2em;
	}

	.image {
		margin-right: 10px;
	}

	.image * {
		width: 30px;
		max-height: 30px;
		fill: var(--background);
	}

	.strength {
		float: right;
		margin-top: -30px;

		display: block;
		cursor: pointer;
        /* Set in HTML */
        /* --force: 90; */
        --red: calc(255 * ((100 - var(--force)) / 100));
        --green: calc(255 * var(--force) / 100);
        width: 30px;
        height: 30px;
        background-image: linear-gradient(to bottom right, RGBA(var(--red), var(--green), 0, 0) 50%, RGBA(var(--red), var(--green), 0, 1));
	}
    :global(.drag_over) .account {
    	color: var(--accent);
        border: 1px solid var(--accent);
    }

    .edit {
        opacity: 0;
    	width: 15px;
    	height: 15px;
    	float: right;
    	margin-top: -20px;
    	margin-left: 150px;
        transition: 0.2s;
    }

    .account:hover .edit{
        opacity: 1;
    }

    .edit_folder_name {
    	height: 25px;
    }

    img {
        pointer-events: none;
    }

</style>

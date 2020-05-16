<script>
    import { Textfield, Button, Icon, Menu, Menuitem } from 'svelte-mui';
    import ChangePassword from './ChangePassword.svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let searchText;
    let modalVisible = false;

</script>

<div class="navbar">
    <div class="content">
        <ChangePassword bind:visible={modalVisible}/>

        <Button on:click={() => dispatch('go_back')}>
            <Icon path="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </Button>

        <Button on:click={() => dispatch('new_folder')}>
            <Icon path="m26,23l0,-3l1,0l0,3l3,0l0,1l-3,0l0,3l-1,0l0,-3l-3,0l0,-1l3,0l0,0zm-4.40029,3l-19.60674,0c-0.54686,0 -0.99297,-0.44405 -0.99297,-0.9918l0,-11.0082l27,0l0,4.20703c-0.47683,-0.13486 -0.97999,-0.20703 -1.5,-0.20703c-3.03757,0 -5.5,2.46243 -5.5,5.5c0,0.90022 0.21628,1.74993 0.59971,2.5l0,0l0,0zm0.65745,1l-20.26387,0c-1.09358,0 -1.99329,-0.89147 -1.99329,-1.99115l0,-18.0177c0,-1.10148 0.89667,-1.99115 2.00276,-1.99115l10.99724,0l2,4l11.99414,0c1.1088,0 2.00586,0.89323 2.00586,1.99509l0,7.60462c1.78084,0.91036 3,2.76295 3,4.90029c0,3.03757 -2.46243,5.5 -5.5,5.5c-1.70794,0 -3.23405,-0.7785 -4.24284,-2l0,0l0,0zm-21.25716,-14l0,-6.0082c0,-0.53649 0.44401,-0.9918 0.99173,-0.9918l10.40829,0l1.95997,4l12.63703,0c0.54915,0 1.00298,0.44811 1.00298,1.00087l0,1.99913l-27,0l0,0l0,0zm25.5,15c2.48528,0 4.5,-2.01472 4.5,-4.5c0,-2.48528 -2.01472,-4.5 -4.5,-4.5c-2.48528,0 -4.5,2.01472 -4.5,4.5c0,2.48528 2.01472,4.5 4.5,4.5l0,0z"/>
        </Button>

        <Button on:click={() => dispatch('lock')}>
            <Icon path="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
        </Button>


        <Textfield placeholder="Search" on:input={() => {dispatch('search', searchText)}} bind:value={searchText}/>
        <Menu>
            <div slot="activator">
                <Button>
                    <Icon>
                        <svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </Icon>
                </Button>
            </div>
            <Menuitem on:click={() => {modalVisible = true}}>
                <Button>
                    Change password
                    <Icon style="margin-left: 5px">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
                            <path d="M618.9,438.7c35.8,0,64.8,31.6,64.8,70.7v164.9c0,39-29,70.7-64.8,70.7H381.3c-35.8,0-64.8-31.6-64.8-70.7V509.4c0-39,29-70.7,64.8-70.7h57.5l0,0h122.5l0,0H618.9z M499.5,500.2c-33.8,0-61.3,26.2-61.3,58.6c0,21.6,16.8,38.2,35,48.3v76.1h52.5v-76.1c18.3-10.2,35-26.7,35-48.3C560.8,526.4,533.4,500.2,499.5,500.2z M500,316.3c-57.6,0-61.1,48.4-61.3,61.3v61.1h-61.6v-55.2c0,0,0-128.6,122.7-128.6c122.7,0,122.7,128.6,122.7,128.6v55.2h-61.2v-61.1C561.1,365,557.6,316.3,500,316.3z M500,990.1c-270.6,0-490-219.4-490-490c0-270.6,219.4-490,490-490c87.2,0,169,22.9,240,62.9l45.6-63.1l81.6,214.5L653.2,193l50.5-69.9C643.1,90.3,573.8,71.4,500,71.4c-236.8,0-428.8,192-428.8,428.8c0,236.8,192,428.7,428.8,428.7c236.8,0,428.8-192,428.8-428.7c0-57.8-11.6-112.9-32.3-163.2l56.6-23.3c23.7,57.5,37,120.4,37,186.5C990,770.7,770.6,990.1,500,990.1z"/>
                        </svg>
                    </Icon>
                </Button>
            </Menuitem>
        </Menu>
    </div>
</div>

<style>
    .navbar {
        color: var(--color);
        background-color: var(--background);
        height: 50px;
        box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
    }

    .content {
        width: 100%;
        max-width: 600px;
        height: 50px;
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        margin: auto;
    }

    .content :global(.text-field) {
        max-width: 300px;
    }

</style>

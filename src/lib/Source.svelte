<script>
  import * as d3 from 'd3';

	export let metadata = {};
	export let endpoint = undefined;
	export let align = 'left';

	let dateFormat = d3.utcFormat("%b %d, %Y");

	//metadata values
	let updatedDate = (metadata.update_date==undefined) ? 'MM DD, YYYY' : dateFormat(new Date(metadata.update_date));
	let provider = metadata.dataset_hdx_provider_name ?? 'Source';

	function copyQuery(query) {
		console.log(`${query}&app_identifier=[your app identifier]`)
		navigator.clipboard.writeText(`${query}&app_identifier=[your app identifier]`);
	}
</script>

<div class={`small ${align}`}>
	{updatedDate} | {provider} | <a href={metadata.dataset_hdx_link} title='Go to dataset' target='_blank'>DATA</a>
	{#if endpoint!==undefined}
		| <button on:click={() => copyQuery(endpoint)} title='Copy API Query'>API</button>
	{/if}
</div>

<style lang='scss'>
	.right {
		text-align: right;
	}
	button {
		background: none;
		border: none;
		color: #007CE0;
		cursor: pointer;
  	font-family: 'Source Sans Pro', sans-serif;
  	font-size: 12px;
  	padding: 0;
	}
</style>
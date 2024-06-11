<script>
  import * as d3 from 'd3';

	export let metadata = {};
	export let endpoint = undefined;
	export let align = 'left';

	let dateFormat = d3.utcFormat("%b %d, %Y");

	//metadata values
	let updatedDate = (metadata.update_date==undefined) ? 'MM DD, YYYY' : dateFormat(new Date(metadata.update_date));
	let provider = metadata.dataset_hdx_provider_name ?? 'Source';

	//clean up endpoints
	if (endpoint!==undefined) {
		endpoint = endpoint.replace('output_format=csv', 'output_format=json');
	}
</script>

<div class={`small ${align}`}>
	{updatedDate} | {provider} | <a href={metadata.dataset_hdx_link} target='_blank'>DATA</a>
	{#if endpoint!==undefined}
		 | <a href={endpoint} target='_blank'>API</a>
	{/if}
</div>

<style lang='scss'>
	.right {
		text-align: right;
	}
</style>
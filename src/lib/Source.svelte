<script>
  import * as d3 from 'd3';

	export let metadata = {};
	export let align = 'left';

	let dateFormat = d3.utcFormat("%b %d, %Y");

	//metadata values
	let updatedDate = (metadata.update_date==undefined) ? 'MM DD, YYYY' : dateFormat(new Date(metadata.update_date));
	let provider = metadata.dataset_hdx_provider_name ?? 'Source';
</script>

<div class={`small ${align}`}>
	{updatedDate} | {provider} | <a href={metadata.dataset_hdx_link} target='_blank'>DATA</a>
</div>

<style lang='scss'>
	.right {
		text-align: right;
	}
</style>
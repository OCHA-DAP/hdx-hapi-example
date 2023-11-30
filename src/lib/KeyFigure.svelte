<script>
	import { format } from 'd3';
  import Column from './Charts/Column.svelte'
  import Pie from './Charts/Pie.svelte'
  import Sparkline from './Charts/Sparkline.svelte'

  export let title = 'Key figure';
	export let valueFormat = '.2s';
	export let seriesType = 'sparkline';
	export let value = 0;
	export let series = undefined;
	export let source = 'Source';

	let keyFigInner, containerWidth, chartWidth, chartHeight;

	$: keyVal = value.toString().replace(/,/g, '');
	$: keyVal = (keyVal>0) ? format(valueFormat)(keyVal).replace(/G/, 'B') : keyVal;
</script>

<div class='key-figure'>
	<h3>{title}</h3>
	<div class='key-figure-inner' bind:this={keyFigInner} bind:clientWidth={containerWidth}>
		<span class='num' bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>{keyVal}</span>
		{#if series && keyFigInner}
			{#if seriesType=='column'}
				<Column data={series} width={containerWidth-chartWidth} height={chartHeight - 10} />
			{:else if seriesType=='pie'}
				<Pie data={series} width={containerWidth-chartWidth} height={chartHeight - 10} />
			{:else}
				<Sparkline data={series} width={containerWidth-chartWidth} height={chartHeight - 5} />
			{/if}
		{/if}
	</div>
	<div class='small'>
		MM DD, YYYY | {source} | <a href='#' target='_blank'>DATA</a>
	</div>
</div>


<style lang='scss'>
	.key-figure {
 		border-bottom: 1px solid #CCC; 
 		padding-bottom: 15px;
 		.key-figure-inner {
    	align-items: center;
 			display: flex;
    	margin: 25px 0 15px;
 		}
		.num {
			display: block;
			font-family: 'Gotham-Light', sans-serif;
			font-size: 48px;
			line-height: 48px;
			padding-right: 10px;
		}
	}
</style>
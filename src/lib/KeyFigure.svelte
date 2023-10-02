<script>
	import * as d3 from 'd3';
  import Sparkline from './Charts/Sparkline.svelte'

	export let value = 100000;
	export let format = '.2s';

	let keyVal = parseFloat(value.replaceAll(',', ''));
	keyVal = d3.format(format)(keyVal).replace(/G/, 'B');
</script>

<div class='key-figure'>
	<h3>Key figure</h3>
	<span class='num'>{keyVal}</span>
	<div class='small'>
		MM, DD, YYYY | Source | <a href='#' target='_blank'>DATA</a>
	</div>
</div>


<style lang='scss'>
	.key-figure {
 		border-bottom: 1px solid #CCC; 
 		padding-bottom: 15px;
		.num {
			display: block;
			font-family: 'Gotham-Light', sans-serif;
			font-size: 52px;
			line-height: 52px;
    	margin: 25px 0 15px;
		}
	}
</style>
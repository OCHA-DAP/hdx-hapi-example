<script>
	import * as d3 from 'd3';

	export let data = [];
	export let height = 50;
	export let width = 75;

	const xAccessor = (d) => d.date;
	const yAccessor = (d) => d.value;


	let xScale  = d3.scaleTime()
    .domain(d3.extent(data, xAccessor))
    .range([0, width]);

	console.log('line', d3.extent(data, xAccessor))

  let yScale = d3.scaleLinear()
  	.domain([0, d3.max(data, yAccessor)])
  	.range([height, 0]);

  let line = d3.line()
	  .x((d) => xScale(xAccessor(d)))
		.y((d) => yScale(yAccessor(d)))
	  .curve(d3.curveBasis);
</script>

<div class='line'>
	<svg viewBox='0 0 {width} {height}' preserveAspectRatio='none' {width} {height}>
		<path d={line(data)} />
	</svg>
</div>


<style lang='scss'>
	path {
		fill: none;
		stroke: #007CE0;
		stroke-width: 1px;
	}
</style>

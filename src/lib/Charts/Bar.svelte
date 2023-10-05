<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	export let data = [];
	export let height = 50;
	export let width = 75;

	const xAccessor = (d) => d.date;
	const yAccessor = (d) => d.value;

	let svg;

	let xScale = d3.scaleBand()
		.domain(data.map(xAccessor))
		.range([0, width])
		.padding(0.2);

  let yScale = d3.scaleLinear()
  	.domain([0, d3.max(data, yAccessor)])
  	.range([height, 0]);

	onMount(() => {
	  // append bars
	  let bars = d3.select(svg).selectAll('.bar')
	    .data(data)
	    .enter().append('rect')
	    .attr('class', 'bar')
	    .attr('x', (d) => xScale(d.date))
	    .attr('y', (d) => yScale(d.value))
	    .attr('height', (d) => (height - yScale(d.value)))
	    .attr('width', xScale.bandwidth());
	});
</script>

<div class='bar-container'>
	<svg bind:this={svg} viewBox='0 0 {width} {height}' preserveAspectRatio='none' {width} {height}></svg>
</div>

<style lang='scss'>
	.bar-container {
		fill: #007CE0;
	}
</style>

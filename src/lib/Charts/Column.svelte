<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	export let data = [];
	export let height = 50;
	export let width = 75;
	export let hasAxis = true;

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
		let g = d3.select(svg).append('g')

		// if (hasAxis) {
		// 	g.append('g')
		// 		.attr('class', 'axis')
	  //   	.attr('transform', `translate(0, ${height-1})`)
	  //     .call(d3.axisBottom(xScale));
		// }

	  // // append columns
	  // let bars = g.selectAll('.column')
	  //   .data(data)
	  //   .enter().append('rect')
	  //   .attr('class', 'column')
	  //   .attr('x', (d) => xScale(d.date))
	  //   .attr('y', (d) => yScale(d.value))
	  //   .attr('height', (d) => (height - yScale(d.value)))
	  //   .attr('width', xScale.bandwidth());
	});
</script>

<div class='column-container'>
	<svg bind:this={svg} viewBox='0 0 {width} {height}' preserveAspectRatio='none' {width} {height}>
		<g>
<!-- 			{#if hasAxis}
				<g class='axis' transform='translate(0, {height-1})'>
					
				</g>
			{/if} -->

			{#each data as d}
				<rect 
					class='column'
					x={xScale(d.date)}
					y={yScale(d.value)}
					height={height - yScale(d.value)}
					width={xScale.bandwidth()}
				/>
			{/each}
		</g>
	</svg>
</div>

<style lang='scss'>
	.column-container {
		fill: #007CE0;
	}
	.axis path {
		color: #007CE0;
	}
</style>

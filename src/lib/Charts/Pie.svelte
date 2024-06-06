<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	export let data = [];
	export let height = 50;
	export let width = 75;
	export let colors = ['#E0E0E0', '#007CE0'];

	let svg;

  let radius = Math.min(width, height)/2;

  let color = d3.scaleOrdinal()
    .domain(data)
    .range(colors)

	onMount(() => {
		let pie = d3.pie();
		let arc = d3.arc()
	    .innerRadius(0)
	    .outerRadius(radius);

	  let arcs = d3.select(svg).selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .attr('transform', `translate( ${width/2} , ${height/2} )`);

    arcs.append('path')
      .attr('fill', (d, i) => color(i))
      .attr('d', arc);
	});
</script>

{#if width>30}
	<div class='pie'>
		<svg bind:this={svg} preserveAspectRatio='none' {width} {height}></svg>
	</div>
{/if}

<style lang='scss'>
</style>

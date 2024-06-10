<script>
	import { onMount, tick } from 'svelte';
	import * as d3 from 'd3';

	export let data = [];
	export let height = 50;
	export let width = 75;

	let gy, gx, gyg, tooltip;

	//sort data by date
	data.sort((a, b) => a.date - b.date);

	//console.log(data)

  const margin = { top: 10, right: 10, bottom: 50, left: 50 };
  const innerWidth = width - margin.left;
  const innerHeight = height - margin.top - margin.bottom;

	const xAccessor = (d) => d.date;
	const yAccessor = (d) => d.value;

	let xScale  = d3.scaleTime()
    .domain(d3.extent(data, xAccessor))
    .range([0, innerWidth]);

  let yScale = d3.scaleLinear()
  	.domain([0, d3.max(data, yAccessor)])
  	.range([innerHeight, 0]);

  const xAxis = g => g
  	.attr('transform', `translate(${margin.left - 5}, ${innerHeight + margin.top + 5})`)
    .call(d3.axisBottom(xScale).ticks(8).tickSizeOuter(0))
    .call(g => g.selectAll('.domain').remove())
    .call(g => g.selectAll('.tick text').attr('fill', '#6d6d6d').attr('font-size', '11px'))
    .call(g => g.selectAll('.tick line').attr('stroke', 'none'));

  const yAxis = g => g
    .attr('transform', `translate(35, ${margin.top - 8})`)
    .call(d3.axisLeft(yScale).ticks(5).tickSizeOuter(0).tickFormat(d3.format('.2s')))
    .call(g => g.selectAll('.domain').remove())
    .call(g => g.selectAll('.tick text').attr('fill', '#6d6d6d').attr('font-size', '11px'))
    .call(g => g.selectAll('.tick line').attr('stroke', 'none'));

  const yAxisGrid = g => g
    .attr('transform', `translate(0, ${margin.top})`)
    .call(d3.axisLeft(yScale).ticks(5).tickSizeOuter(0).tickSize(-width).tickFormat(''))
    .call(g => g.selectAll('.domain').remove())
    .call(g => g.selectAll('line').attr('stroke', '#EFEFEF'))

  let line = d3.line()
	  .x((d) => xScale(xAccessor(d)))
		.y((d) => yScale(yAccessor(d)))


	//chart mouse events
	function mouseover() {
		tooltip.style('opacity', 1);
	}
	function mousemove(event, d) {
		let tipSize = tooltip.node().getBoundingClientRect();
		tooltip.html(`<div class='date'>${d3.timeFormat('%b %-d, %Y')(xAccessor(d))}</div>${d3.format('.2s')(yAccessor(d))}`)
			.style('left', `${event.layerX - tipSize.width/2}px`)
			.style('top',`${event.layerY - tipSize.height}px`);
	}
	function mouseout() {
		tooltip.style('opacity', 0);
	}

	onMount(async () => {
		d3.select(gx).call(xAxis);
		d3.select(gy).call(yAxis);
  	d3.select(gyg).call(yAxisGrid);

  	await tick();

		//create tooltip
		tooltip = d3.select('.chart-tooltip');
	});
</script>

<div class='line'>
	<svg {width} {height}>
  	<g bind:this={gyg} />
		<path transform={`translate(${margin.left - 5}, ${margin.top})`} d={line(data)} />
		<g bind:this={gx} />
		<g bind:this={gy} />
		
		{#each data as d, i}
			<circle class='dot' 
				on:mouseover={mouseover}
				on:mousemove={(event) => mousemove(event, d)}
				on:mouseout={mouseout}
				cx={xScale(xAccessor(d)) + margin.left - 5}
				cy={yScale(yAccessor(d)) + margin.top}
				r={3}
			/>
		{/each}
	</svg>
<div class='chart-tooltip'></div>
</div>



<style lang='scss'>
	.line {
		position: relative;
	}
	path {
		fill: none;
		stroke: #007CE0;
		stroke-width: 1px;
	}
	circle {
		fill: #007CE0;
	}
</style>

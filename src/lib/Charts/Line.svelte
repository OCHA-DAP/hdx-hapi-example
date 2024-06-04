<script>
	import { onMount, tick } from 'svelte';
	import * as d3 from 'd3';

	export let data = [];
	export let height = 50;
	export let width = 75;

	let gy, gx, gyg, yAxis, yAxisGrid, xAxis, tooltip;
	console.log(data)
	
	const xAccessor = (d) => d.date;
	const yAccessor = (d) => d.value;

	let xScale  = d3.scaleTime()
    .domain(d3.extent(data, xAccessor))
    .range([0, width-50]);

  let yScale = d3.scaleLinear()
  	.domain([0, d3.max(data, yAccessor)])
  	.range([height-50, 0]);

  xAxis = g => g
  	.attr('transform', `translate(50, ${height-40})`)
    .call(d3.axisBottom(xScale).ticks(8).tickSizeOuter(0))
    .call(g => g.selectAll('.domain').remove())
    .call(g => g.selectAll('.tick text').attr('fill', '#6d6d6d'))
    .call(g => g.selectAll('.tick text').attr('font-size', '11px'))
    .call(g => g.selectAll('.tick line').attr('stroke', 'none'));

  yAxis = g => g
    .attr('transform', `translate(35, 0)`)
    .call(d3.axisLeft(yScale).ticks(5).tickSizeOuter(0).tickFormat(d3.format('.2s')))
    .call(g => g.selectAll('.domain').remove())
    .call(g => g.selectAll('.tick text').attr('fill', '#6d6d6d'))
    .call(g => g.selectAll('.tick text').attr('font-size', '11px'))
    .call(g => g.selectAll('.tick line').attr('stroke', 'none'));

  yAxisGrid = g => g
    .attr('transform', `translate(0, 8)`)
    .call(d3.axisLeft(yScale).ticks(5).tickSizeOuter(0).tickSize(-width).tickFormat(''))
    .call(g => g.selectAll('.domain').remove())
    .call(g => g.selectAll('line').attr('stroke', '#EFEFEF'))

  let line = d3.line()
	  .x((d) => xScale(xAccessor(d)))
		.y((d) => yScale(yAccessor(d)))
	  //.curve(d3.curveBasis);


	onMount(async () => {
		d3.select(gx).call(xAxis);
		d3.select(gy).call(yAxis);
  	d3.select(gyg).call(yAxisGrid);

  	await tick();

		// Create a tooltip element
		tooltip = d3.select('.tooltip');

		//define circle events
  	const svg = d3.select('svg');
		svg.selectAll('circle.dot')
			.on('mouseover', (e, d) => {
				console.log('hello')
				tooltip.style('opacity', 1);
				d3.select(e.currentTarget).attr('opacity', 1); // Enlarge the circle on hover
			})
			.on('mousemove', (e, d) => {
				tooltip.html(`Date: ${d3.timeFormat('%B %d, %Y')(xAccessor(d))}<br>Value: ${yAccessor(d)}`)
					.style('left', (e.pageX + 10) + 'px')
					.style('top', (e.pageY - 28) + 'px');
			})
			.on('mouseout', (e, d) => {
				tooltip.style('opacity', 0);
				d3.select(e.currentTarget).attr('opacity', 0); // Reset the circle size
			});
	});
</script>

<div class='line'>
	<svg {width} {height}>
  	<g bind:this={gyg} />
		<path transform='translate(50)' d={line(data)} />
		<g bind:this={gx} />
		<g bind:this={gy} />
		
		{#each data as d, i}
			<circle class='dot'
				cx={xScale(xAccessor(d)) + 50}
				cy={yScale(yAccessor(d))}
				r={3}
			/>
		{/each}
	</svg>

	<div class='tooltip'></div>
</div>


<style lang='scss'>
	path {
		fill: none;
		stroke: #007CE0;
		stroke-width: 1px;
	}
	.tooltip {
		position: absolute;
		background: lightgray;
		padding: 5px;
		border-radius: 5px;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.2s ease-in-out;
	}
	circle {
		fill: #007CE0;
		//opacity: 0;
	}
</style>

<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	export let data = [];
	export let title = null;
	export let valueFormat = d3.format('.2s');
	export let width = 100;

	let height, margin, xM, xF, y, gx, gy, xAxis, yAxis;

  $: ageData = data.sort((a, b) => b.total_population - a.total_population);
  $: ageData && init()
  
	function init() {
		margin = ({top: 10, right: 5, bottom: 20, left: 5});
		height = ageData.length / 2 * 25 + margin.top + margin.bottom;

		xM = d3.scaleLinear()
	    .domain([0, d3.max(ageData, d => d.total_population)])
	    .rangeRound([width / 2, margin.left])

	  xF = d3.scaleLinear()
	    .domain(xM.domain())
	    .rangeRound([width / 2, width - margin.right])

	  y = d3.scaleBand()
	    .domain(ageData.map(d => d.age_range_code))
	    .rangeRound([height - margin.bottom, margin.top])
	    .padding(0.1)

	  xAxis = g => g
	    .attr('transform', `translate(0,${height - margin.bottom})`)
	    .call(g => g.append('g').call(d3.axisBottom(xM).ticks(width / 80, 's')))
	    .call(g => g.append('g').call(d3.axisBottom(xF).ticks(width / 80, 's')))
	    .call(g => g.selectAll('.domain').remove())
	    .call(g => g.selectAll('.tick:first-of-type').remove())

	  yAxis = g => g
	    .attr('transform', `translate(${xM(0)},0)`)
	    .call(d3.axisRight(y).tickSizeOuter(0))
	    .call(g => g.selectAll('.tick text').attr('fill', 'black'))

	  d3.select(gx).call(xAxis);
  	d3.select(gy).call(yAxis);
  }
</script>


{#if title}
	<h3>{title}</h3>
{/if}

<div class='pyramid'>
	<svg viewBox='0 0 {width} {height}' preserveAspectRatio='none' {width} {height}>
		<g>
			{#each ageData as d, i}
				<rect
					fill={d.gender_code === 'm' ? '#1EBFB3' : '#F2645A'}
					y={y(d.age_range_code)}
					x={d.gender_code === 'm' ? xM(d.total_population) : xF(0)}
					height={y.bandwidth()}
					width={d.gender_code === 'm' ? xM(0) - xM(d.total_population) : xF(d.total_population) - xF(0)}
				/>
			{/each}
		</g>
		<g fill='black'>
			{#each ageData as d, i}
				<text 
					text-anchor={d.gender_code === 'm' ? 'start' : 'end'}
					x={d.gender_code === 'm' ? xM(d.total_population) + 4 : xF(d.total_population) - 4}
					y={y(d.age_range_code) + y.bandwidth() / 2} 
					dy={'0.35em'}>
					{valueFormat(d.total_population)}
				</text>
			{/each}
			{#if ageData.length>0}
				<text
					fill={'black'}
					x={xM(0) - 10}
					y={y(ageData[0].age_range_code) + y.bandwidth() / 2}
					dy={'0.35em'}
					text-anchor={'end'}>
					{'Male'}
				</text>
				<text
					fill={'black'}
					x={xF(0) + 30}
					y={y(ageData[0].age_range_code) + y.bandwidth() / 2} 
					dy={'0.35em'}
					text-anchor={'start'}>
					{'Female'}
				</text>
			{/if}
		</g>
		<g bind:this={gx} />
  	<g bind:this={gy} />
	</svg>
</div>

<style lang='scss'>
	h3 {
		margin-top: 15px;
	}
	.pyramid {
		margin: 10px 0 20px;
	}
	text {
		font-size: 14px;
	}
</style>

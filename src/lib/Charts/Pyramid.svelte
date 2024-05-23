<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	export let data = [];
	export let title = null;
	export let valueFormat = d3.format('.2s');
	export let width = 100;

	let height, margin, xM, xF, y, gx, gy, gyg, xAxis, yAxis, yAxisGrid;

  $: ageData = formatData(data);
  $: ageData && init()


  function formatData(data) {
		const allAgeRanges = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80+'];
		const genders = [...new Set(data.map(item => item.gender))];

		// Create a complete dataset with all combinations of gender and age_range
		const completeData = genders.reduce((acc, gender) => {
	    allAgeRanges.forEach(ageRange => {
        const existingEntry = data.find(item => item.gender === gender && item.age_range === ageRange);
        if (!existingEntry) {
            acc.push({ gender, age_range: ageRange, total_population: 0 });
        } else {
            acc.push(existingEntry);
        }
	    });
	    return acc;
		}, []);

		//sort the data by gender age_range
		return sortByAgeRange(completeData);
  }

	function sortByAgeRange(data) {
    return data.sort((a, b) => {
      const getStartAge = (ageRange) => {
        if (ageRange === '80+') {
          return 80;
        }
        return parseInt(ageRange.split('-')[0]);
      };

      const ageComparison = getStartAge(a.age_range) - getStartAge(b.age_range);
      if (ageComparison !== 0) return ageComparison;
      return a.gender.localeCompare(b.gender);
    });
	}

  
	function init() {
		ageData = ageData.reverse();

		margin = ({top: 10, right: 5, bottom: 20, left: 40});
		height = ageData.length / 2 * 25 + margin.top + margin.bottom;

		//scale for male
		xM = d3.scaleLinear()
	    .domain([0, d3.max(ageData, d => d.total_population)])
	    .rangeRound([width / 2, margin.left])

	  //scake for female
	  xF = d3.scaleLinear()
	    .domain(xM.domain())
	    .rangeRound([width / 2, width - margin.right])

	  y = d3.scaleBand()
	    .domain(ageData.map(d => d.age_range))
	    .rangeRound([height - margin.bottom, margin.top])
	    .padding(0.1)

	  // xAxis = g => g
	  //   .attr('transform', `translate(0,${height - margin.bottom})`)
	  //   .call(g => g.append('g').call(d3.axisBottom(xM).ticks(width / 90, 's')))
	  //   .call(g => g.append('g').call(d3.axisBottom(xF).ticks(width / 90, 's')))
	  //   .call(g => g.selectAll('.domain').remove())
	  //   .call(g => g.selectAll('.tick:first-of-type').remove())

	  yAxis = g => g
	    .attr('transform', `translate(40)`)
	    .call(d3.axisLeft(y).tickSizeOuter(0))
	    .call(g => g.selectAll('.domain').remove())
	    .call(g => g.selectAll('.tick text').attr('fill', 'black'))
	    .call(g => g.selectAll('.tick text').attr('font-size', '11px'))

	  yAxisGrid = g => g
	    .attr('transform', `translate(40)`)
	    .call(d3.axisLeft(y).tickSizeOuter(0).tickSize(-width).tickFormat(''))
	    .call(g => g.selectAll('.domain').remove())
	    .call(g => g.selectAll('line').attr('stroke', '#EFEFEF'))

	  //d3.select(gx).call(xAxis);
  	d3.select(gy).call(yAxis);
  	d3.select(gyg).call(yAxisGrid);
  }

  onMount(() => {
  	d3.select(gy).call(yAxis);
  	d3.select(gyg).call(yAxisGrid);
  });
</script>


{#if title}
	<h3>{title}</h3>
{/if}

<div class='pyramid'>
	<svg viewBox='0 0 {width} {height}' preserveAspectRatio='none' {width} {height}>
  	<g bind:this={gyg} />
		<g>
			{#each ageData as d, i}
				<rect
					fill={d.gender === 'm' ? '#CCE5F9' : '#66B0EC'}
					y={y(d.age_range)}
					x={d.gender === 'm' ? xM(d.total_population) : xF(0)}
					height={y.bandwidth()}
					width={d.gender === 'm' ? xM(0) - xM(d.total_population) : xF(d.total_population) - xF(0)}
				/>
      	<text 
      		text-anchor={(d.gender === 'm') ? 'start' : (d.gender === 'f' && (xF(d.total_population) - xF(0)) < 40) ? 'start' : 'end'}
          x={d.gender === 'm' ? xM(d.total_population) + 4 : xF(d.total_population) - 4}
          y={y(d.age_range) + y.bandwidth() / 2}
  				dx={(d.gender === 'm' && (xM(0) - xM(d.total_population)) < 40) ? '-35' : (d.gender === 'f' && (xF(d.total_population) - xF(0)) < 40) ? '6' : ''}
          dy={'0.35em'}>
          {valueFormat(d.total_population)}
        </text>
			{/each}
		</g>
		<g>
			{#if ageData.length>0}
				<text
					x={xM(0) - 10}
					y={y(ageData[ageData.length-1].age_range) + y.bandwidth() / 2}
					dy={'0.35em'}
					text-anchor={'end'}>
					{'Male'}
				</text>
				<text
					x={xF(0) + 10}
					y={y(ageData[ageData.length-1].age_range) + y.bandwidth() / 2} 
					dy={'0.35em'}
					text-anchor={'start'}>
					{'Female'}
				</text>
			{/if}
		</g>
		<!-- <g bind:this={gx} /> -->
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
	line {
		stroke: '#CCC';
	}
</style>

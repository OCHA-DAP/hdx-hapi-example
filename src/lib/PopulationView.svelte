<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
  import KeyFigure from './KeyFigure.svelte'
  import Map from './Map.svelte'
  import Pyramid from './Charts/Pyramid.svelte'
  import Source from './Source.svelte'

	export let id;
	export let data;
	export let metadata;
  export let endpoint;
	export let iso3;

  let mapData = [];
	let chartData = [];
	let keyFigures = [];
  let sidebarWidth;

	function formatData(data) {
    //format data for pop pyramid chart
    const filteredData = data.filter(row => row.gender !== 'all' && row.age_range !== 'all' && row.gender !== undefined && row.age_range !== undefined);
    const ages = filteredData.reduce((acc, { gender, age_range, population }) => {
      //create unique key for each gender/age combo
      const key = `${gender}_${age_range}`;

      //create accumulator if it doesnt exist for this age/gender combo
      if (!acc[key]) {
        acc[key] = {
          gender,
          age_range,
          total_population: 0
        };
      }

      //get total pop for this age/gender combo
      acc[key].total_population += +population;
      return acc;
    }, {});
    chartData = Object.values(ages);

    //if there are no population demographics, show gender percentages
    if (chartData.length<=0) {
      let totalMalePopulation = 0;
      let totalFemalePopulation = 0;
      let totalPopulation = 0;

      //iterate through data to calculate totals
      data.forEach(row => {
        if (row.gender === 'm') totalMalePopulation += +row.population;
        else if (row.gender === 'f') totalFemalePopulation += +row.population;
        else if (row.gender === 'all') totalPopulation += +row.population;
      });
      const fPercent = totalFemalePopulation/totalPopulation;
      const mPercent = totalMalePopulation/totalPopulation;
      if (fPercent>0) keyFigures.push({title: 'Female Population', value: d3.format('.0%')(fPercent)});
      if (mPercent>0) keyFigures.push({title: 'Male Population', value: d3.format('.0%')(mPercent)});

      //if no gender breakdown, show total population
	    if (keyFigures.length<1) keyFigures.push({title: 'Population', value: d3.format('.3s')(totalPopulation)});
    }

    //aggregate population per adm area for map
    let popByAdm = d3.rollup(
      data,
      v => {
        const aggregatedData = v.filter(d => d.age_range === 'all' && d.gender === 'all');
        return {
          admin1_code: aggregatedData[0] ? aggregatedData[0].admin1_code : null,
          population: d3.sum(aggregatedData, d => d.population)
        };
      },
      d => d.admin1_name
    );

    //convert rollup result to array
    mapData = Array.from(popByAdm, ([admin1_name, values]) => ({
      admin1_name,
      admin1_code: values.admin1_code,
      value: values.population
    })).filter(d => d.admin1_name);
  }

	onMount(() => {
    if (data) formatData(data);
	})
</script>


<div class='content grid-container'>

	{#if data && metadata}
    
    <div class='sidebar col-5' bind:clientWidth={sidebarWidth}>
	    {#if sidebarWidth>0}

	    	{#if chartData.length>0}	 

		      <Pyramid data={chartData} title={'Population Demographics'} width={sidebarWidth-20} />
		      <Source metadata={metadata[0]} endpoint={endpoint} align={'right'} />

		    {:else}

		    	{#if keyFigures.length>0}
			      <div class='grid-container key-figure-container'>
			    		{#each keyFigures as figure}
								<div class='col-6'>
			            <KeyFigure title={figure.title} value={figure.value} metadata={metadata[0]} endpoint={endpoint} />
			          </div>
			        {/each}
		        </div>
		    		<hr>
		    	{/if}

		    {/if}

	    {/if}
    </div>
    <div class='main-content col-7'>
      {#if mapData.length>0}
        <Map mapData={mapData} THEME={id} LOCATION={iso3} />
      {/if}
    </div>

  {:else}

    <div class='col-12'>
      <p class='no-data-msg'>No data available for this view.</p>
    </div>

  {/if}

</div>

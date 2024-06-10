<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
  import Line from './Charts/Line.svelte'
  import KeyFigure from './KeyFigure.svelte'
  import Map from './Map.svelte'
  import Source from './Source.svelte'

	export let id;
	export let data;
	export let metadata;
  export let endpoint;
  export let iso3;

  let mapData = [];
  let chartData = [];
  let sidebarWidth;


	function formatData(data) {
    // Initialize a dictionary to store the data by admin1_code
    const admIPC = {};

    // Iterate over each record in the data
    data.forEach(row => {
      const admin1Code = row.admin1_code;
      const admin1Name = row.admin1_name;
      const ipcPhase = row.ipc_phase;
      const populationInPhase = row.population_in_phase;
      const percentInPhase = row.population_fraction_in_phase;
      const referencePeriodStart = row.reference_period_start;

      // Check if the admin1_code is already in the dictionary
      if (!admIPC[admin1Code]) {
        admIPC[admin1Code] = {
          admin1Name: admin1Name,
          ipcPhase: ipcPhase,
          populationInPhase: populationInPhase,
          percentInPhase: percentInPhase,
          referencePeriod: referencePeriodStart
        };
      } 
      else {
        // Update if the current date is more recent than the stored one
        if (admIPC[admin1Code].referencePeriod < referencePeriodStart) {
          admIPC[admin1Code] = {
            admin1Name: admin1Name,
            ipcPhase: ipcPhase,
            populationInPhase: populationInPhase,
            percentInPhase: percentInPhase,
            referencePeriod: referencePeriodStart
          };
        }
      }
    });

    //convert to array
    const admIPCArray = [];
    Object.keys(admIPC).forEach(admin1Code => {
      if (admin1Code !== 'undefined') {
        admIPCArray.push({
          admin1_code: admin1Code,
          admin1_name: admIPC[admin1Code].admin1Name,
          ipcPhase: admIPC[admin1Code].ipcPhase,
          value: +admIPC[admin1Code].populationInPhase,
          percentInPhase: +admIPC[admin1Code].percentInPhase,
          referencePeriod: admIPC[admin1Code].referencePeriod
        });
      }
    });
    mapData = admIPCArray;

    //format for trend chart
    // Filter data for ipc_phase 3 or higher and aggregate by reference_period_start
    const aggregatedData = data.reduce((acc, curr) => {
      const phase = parseInt(curr.ipc_phase);
      const population = parseInt(curr.population_in_phase);

      if (phase >= 3 && !isNaN(population)) {
        const date = +new Date(curr.reference_period_start);
        if (acc[date]) {
          acc[date] += population;
        } else {
          acc[date] = population;
        }
      }
      return acc;
    }, {});

    // Convert the aggregation object into an array of { period, population }
    chartData = Object.keys(aggregatedData).map(date => {
      return { date, value: aggregatedData[date] };
    });
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
          <h3 class='chart-title'>Population in IPC Phase 3+ Over Time</h3>
          <Line data={chartData} width={sidebarWidth} height={250} />
          <Source metadata={metadata[0]} endpoint={endpoint} align={'right'} />
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

<style lang='scss'>
</style>

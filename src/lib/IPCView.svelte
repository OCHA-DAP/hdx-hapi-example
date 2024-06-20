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
    const admIPC = {};

    data.forEach(row => {
      const { admin1_code, admin1_name, ipc_phase, population_in_phase, population_fraction_in_phase, reference_period_start } = row;
      const referencePeriodStart = new Date(reference_period_start);

      if (!admIPC[admin1_code] || admIPC[admin1_code].referencePeriod < referencePeriodStart) {
        admIPC[admin1_code] = {
          admin1_name,
          ipc_phase,
          population_in_phase: +population_in_phase,
          population_fraction_in_phase: +population_fraction_in_phase,
          referencePeriod: referencePeriodStart,
        };
      }
    });

    //format for map
    mapData = Object.entries(admIPC).map(([admin1_code, details]) => ({
      admin1_code,
      admin1_name: details.admin1_name,
      ipc_phase: details.ipc_phase,
      value: details.population_in_phase,
      population_fraction_in_phase: details.population_fraction_in_phase,
      referencePeriod: details.referencePeriod,
    }));
    console.log('mapData',mapData)

    //format for trend chart
    //filter data for ipc_phase 3 or higher and aggregate by reference_period_start
    const aggregatedData = data.reduce((acc, { ipc_phase, population_in_phase, reference_period_start }) => {
      const phase = parseInt(ipc_phase, 10);
      const population = parseInt(population_in_phase, 10);
      const date = +new Date(reference_period_start);

      if (phase >= 3 && !isNaN(population)) {
        acc[date] = (acc[date] || 0) + population;
      }
      return acc;
    }, {});

    chartData = Object.entries(aggregatedData).map(([date, value]) => ({
      date: new Date(+date),
      value,
    }));
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

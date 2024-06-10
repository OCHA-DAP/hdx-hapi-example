<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
  import Bar from './Charts/Bar.svelte'
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
  let totalValue1, totalValue2;
  let sidebarWidth;


	function formatData(data) {
    console.log('hno data', data)
    const pinAdm1Object = {};
    data.forEach(item => {
      let { admin1_code, admin1_name, population_status, population_group, disabled_marker, sector_code, population } = item;
      population = +population;

      if (admin1_code!==undefined) {

        // Initialize admin1_code group if not already present
        if (!pinAdm1Object[admin1_code]) {
          pinAdm1Object[admin1_code] = {
            admin1_name: admin1_name,
            populationInnAll: 0,
            populationTgtAll: 0,
            populationReaAll: 0,
            populationInnIdp: 0,
            populationInnRef: 0
          };
        }

        // Check conditions and accumulate populations
        if (population_group === 'all' && disabled_marker === 'all' && sector_code === 'Intersectoral') {
          if (population_status === 'INN') {
            pinAdm1Object[admin1_code].populationInnAll += population;
          } 
          else if (population_status === 'TGT') {
            pinAdm1Object[admin1_code].populationTgtAll += population;
          } 
          else if (population_status === 'REA') {
            pinAdm1Object[admin1_code].populationReaAll += population;
          }
        }

        if (population_status === 'INN' && disabled_marker === 'all' && sector_code === 'Intersectoral') {
          if (population_group === 'IDP') {
            pinAdm1Object[admin1_code].populationInnIdp += population;
          } 
          else if (population_group === 'REF') {
            pinAdm1Object[admin1_code].populationInnRef += population;
          }
        }
      }
    });

    //convert to array of objects
    const pinAdm1 = {};
    for (const [admin1_code, attr] of Object.entries(pinAdm1Object)) {
      pinAdm1[admin1_code] = {
        admin1_code: admin1_code,
        admin1_name: attr.admin1_name,
        value: attr.populationInnAll,
        targeted: attr.populationTgtAll,
        reached: attr.populationReaAll,
        idp: attr.populationInnIdp,
        ref: attr.populationInnRef,
      };
    }
    mapData = Object.values(pinAdm1);
    console.log('mapData', mapData)

    //get pin key figures
    const idpPin = data.filter(row => row.sector_code === 'Intersectoral' && row.disabled_marker === 'all' && row.population_group === 'IDP' && row.population_status === 'INN');
    totalValue1 = d3.sum(idpPin, d => d.population);

    const refPin = data.filter(row => row.sector_code === 'Intersectoral' && row.disabled_marker === 'all' && row.population_group === 'REF' && row.population_status === 'INN');
    totalValue2 = d3.sum(refPin, d => d.population);

    //get pin by sector for bar chart
    const pinSector = {};
    data.forEach(d => {
      if (d.population_status === 'INN' && d.sector_code !== 'Intersectoral' && d.disabled_marker === 'all') {
        const sector = d.sector_name;
        const population = +d.population;
        
        if (!isNaN(population)) {
          if (pinSector[sector]) {
            pinSector[sector] += population;
          } 
          else {
            pinSector[sector] = population;
          }
        }
      }
    });

    //convert to array
    let sectorPinArray = [];
    for (const sector in pinSector) {
      sectorPinArray.push({
        name: sector,
        value: pinSector[sector]
      });
    }
    
    chartData = sectorPinArray;
    console.log('sectorPinArray',sectorPinArray)
  }

	onMount(() => {
    if (data) formatData(data);
	})
</script>


<div class='content grid-container'>

  {#if data && metadata}
    
    <div class='sidebar col-5' bind:clientWidth={sidebarWidth}>
      {#if sidebarWidth>0}
        {#if (totalValue1>0 || totalValue2>0)}
          <div class='grid-container key-figure-container'>
            {#if totalValue1>0}
              <div class='col-6'>
                <KeyFigure title={'Internally Displaced People'} value={totalValue1} metadata={metadata[0]} endpoint={endpoint} valueFormat={'.3s'} />
              </div>
            {/if}
            {#if totalValue2>0}
              <div class='col-6'>
                <KeyFigure title={'Refugees'} value={totalValue2} metadata={metadata[0]} endpoint={endpoint} />
              </div>
            {/if}
          </div>
          <hr>
        {/if}

        <h3 class='chart-title'>People in Need by Sector</h3>
        <div class='ranking-container'>
          {#if chartData.length>0}
            <Bar data={chartData} width={sidebarWidth} />
            <Source metadata={metadata[0]} endpoint={endpoint} align={'right'} />
          {/if}
        </div>
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

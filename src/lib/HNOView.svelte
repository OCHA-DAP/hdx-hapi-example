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

  $: selectedYear = '';

  let mapData = [];
  let chartData = [];
  let totalValue1, totalValue2, totalValue3;
  let sidebarWidth;
  let years = [];
  let yearsData = {};

	function formatData(data) {
    const pinAdm1Object = {};

    //console.log(data)
    data.forEach(item => {
      let { admin1_code, admin1_name, population_status, category, sector_name, population } = item;

      if (!admin1_code) return;

      population = +population;


      //initialize admin1_code group if doesnt already exist
      if (!pinAdm1Object[admin1_code]) {
        pinAdm1Object[admin1_code] = {
          admin1_name,
          populationInnAll: 0,
          populationTgtAll: 0,
          populationReaAll: 0,
          // populationInnIdp: 0,
          // populationInnRef: 0,
          // populationInnRet: 0
        };
      }

      //filter diff populations= groups
      if (sector_name === 'Intersectoral' && category === 'total') {
        if (population_status === 'INN') {
          pinAdm1Object[admin1_code].populationInnAll += population;
        } 
        else if (population_status === 'TGT' && category === 'total') {
          pinAdm1Object[admin1_code].populationTgtAll += population;
        } 
        else if (population_status === 'REA' && category === 'total') {
          pinAdm1Object[admin1_code].populationReaAll += population;
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
        reached: attr.populationReaAll
      };
    }

    mapData = Object.values(pinAdm1);

    //get pin key figures
    const pinTotal = data.filter(row => row.sector_code === 'Intersectoral' && row.category === 'total' && row.population_status === 'INN');
    totalValue1 = d3.sum(pinTotal, d => d.population);

    const tgtTotal = data.filter(row => row.sector_code === 'Intersectoral' && row.category === 'total' && row.population_status === 'TGT');
    totalValue2 = d3.sum(tgtTotal, d => d.population);

    //get pin by sector for bar chart
    const pinSector = data.reduce((acc, { sector_name, population_status, sector_code, category, population }) => {
      if (population_status === 'INN' && sector_code !== 'Intersectoral' && category === 'total') {
        const populationValue = +population;
        if (!isNaN(populationValue)) {
          acc[sector_name] = (acc[sector_name] || 0) + populationValue;
        }
      }
      return acc;
    }, {});

    //convert to array
    chartData = Object.entries(pinSector).map(([name, value]) => ({ name, value }));
  }

  function disaggregateDataByYear(data) {
    const disaggregatedData = {};

    data.forEach(item => {
      const year = new Date(item.reference_period_start).getFullYear();
      
      // Check if the year is a valid number
      if (isNaN(year)) {
        return; 
      }

      if (!disaggregatedData[year]) {
        disaggregatedData[year] = [];
      }
      disaggregatedData[year].push(item);
    });

    return disaggregatedData;
  }
  
  function onYearSelect(event) {
    selectedYear = event.target.value;
    let selectedYearData = yearsData[selectedYear];

    formatData(selectedYearData);
  }


 	onMount(() => {
    if (data) {
      yearsData = disaggregateDataByYear(data);

      // for testing
      // yearsData['2025'] = [{        
      //   "location_ref": 1,
      //   "location_code": "AFG",
      //   "location_name": "Afghanistan",
      //   "admin1_ref": 1,
      //   "admin1_code": "AF01",
      //   "admin1_name": "Kabul",
      //   "provider_admin1_name": "Kabul",
      //   "admin2_ref": 30898,
      //   "admin2_code": null,
      //   "admin2_name": null,
      //   "provider_admin2_name": "",
      //   "resource_hdx_id": "8e3931a5-452b-4583-9d02-2247a34e397b",
      //   "sector_code": "FSC",
      //   "category": "Adult",
      //   "population_status": "INN",
      //   "population": 1025289,
      //   "reference_period_start": "2025-01-01T00:00:00",
      //   "reference_period_end": "2025-12-31T23:59:59",
      //   "sector_name": "Intersectoral"
      // }]
      // console.log('by year', yearsData)
      //

      years = Object.keys(yearsData).reverse();
      selectedYear = years[0];
      let selectedYearData = yearsData[selectedYear];

      formatData(selectedYearData);
    }
	})
</script>


<div class='content grid-container'>

  {#if data && metadata}

    {#if years.length>1}
      <div class='col-12 no-border'>
        <div class='select-wrapper'>
          <select class='year-select' bind:value={selectedYear} on:change={onYearSelect}>
            {#each years as year}
              <option value={year}>{year}</option>
            {/each}
          </select>
        </div>
      </div>
    {/if}
    
    <div class='sidebar col-5' bind:clientWidth={sidebarWidth}>
      {#if sidebarWidth>0}
        {#if (totalValue1>0 || totalValue2>0)}
          <div class='grid-container key-figure-container'>
            {#if totalValue1>0}
              <div class='col-6'>
                <KeyFigure title={'People in Need'} value={totalValue1} metadata={metadata[0]} endpoint={endpoint} valueFormat={'.2s'} />
              </div>
            {/if}
            {#if totalValue2>0}
              <div class='col-6'>
                <KeyFigure title={'People Targeted'} value={totalValue2} metadata={metadata[0]} endpoint={endpoint} />
              </div>
            {/if}
          </div>
          <hr>
        {/if}


        {#if chartData.length>0}
          <h3 class='chart-title'>People in Need by Sector</h3>
          <div class='ranking-container'>
            <Bar data={chartData} width={sidebarWidth} />
            <Source metadata={metadata[0]} endpoint={endpoint} align={'right'} />
          </div>
        {/if}

      {/if}
    </div>
    <div class='main-content col-7'>
      {#if mapData.length>1}
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
  .select-wrapper {
    width: 100px;
    select {
      height: 38px;
    }
  }
</style>

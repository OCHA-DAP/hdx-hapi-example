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

	let totalValue;
  let mapData = [];
  let chartData = [];
  let orgTypeData = [];
  let sidebarWidth;


	function formatData(data) {
    //format unique orgs by adm1
    const admOrgs = {};
    const allOrgs = new Set();

    data.forEach(row => {
      const { admin1_code, admin1_name, org_name, sector_name } = row;

      if (!admOrgs[admin1_code]) {
        admOrgs[admin1_code] = {
          admin1_name,
          org_names: new Set(),
          sector_names: new Set(),
        };
      }

      if (org_name) {
        admOrgs[admin1_code].org_names.add(org_name);
        allOrgs.add(org_name);
      }
      if (sector_name) {
        admOrgs[admin1_code].sector_names.add(sector_name);
      }
    });

    //convert to array of objects
    const admOrgsArray = {};
    for (const [admin1, details] of Object.entries(admOrgs)) {
      admOrgsArray[admin1] = {
        admin1_code: admin1,
        admin1_name: details.admin1_name,
        value: details.org_names.size,
        org_names: Array.from(details.org_names),
        sector_names: Array.from(details.sector_names),
      };
    }
    mapData = Object.values(admOrgsArray);

    //get num of orgs by sector
    const sectorCounts = data.reduce((acc, { sector_name, org_name }) => {
      if (!sector_name || !org_name) return acc;
      if (!acc[sector_name]) acc[sector_name] = new Set();
      acc[sector_name].add(org_name);
      return acc;
    }, {});

    chartData = Object.entries(sectorCounts)
      .filter(([sector]) => sector !== 'undefined')
      .map(([name, orgs]) => ({ name, value: orgs.size }));

    totalValue = allOrgs.size;

    //format data for org type chart
    const uniqueOrgs = data.filter((d, index, self) =>
      d.org_name && d.org_name.trim() !== '' &&
      index === self.findIndex((t) => t.org_name === d.org_name)
    );

    //array of counts of each org type
    orgTypeData = Array.from(d3.rollup(
      uniqueOrgs,
      v => v.length/totalValue,
      d => d.org_type_description
    ), ([name, value]) => ({ name, value }));
  }

	onMount(() => {
    if (data) formatData(data);
	})
</script>


<div class='content grid-container'>

  {#if data && metadata}
    
    <div class='sidebar col-5' bind:clientWidth={sidebarWidth}>
      {#if sidebarWidth>0}
        <KeyFigure title={'Humanitarian Organizations Present'} value={totalValue} metadata={metadata[0]} endpoint={endpoint} />
        <hr>

        {#if chartData.length>0}
          <h3 class='chart-title'>Humanitarian Organizations by Sector</h3>
          <div class='ranking-container'>
              <Bar data={chartData} width={sidebarWidth} />
          </div>
        {/if}
        {#if orgTypeData.length>0}
          <h3 class='chart-title'>Humanitarian Organizations by Type</h3>
          <div class='ranking-container'>
            <Bar data={orgTypeData} width={sidebarWidth} valueFormat={d3.format('.0%')} />
            <Source metadata={metadata[0]} endpoint={endpoint} align={'right'} />
          </div>
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

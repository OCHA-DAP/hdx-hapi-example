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
  export let iso3;

	let totalValue;
  let mapData = [];
  let chartData = [];
  let orgTypeData = [];
  let sidebarWidth;

	//$: formattedData = formatData(data, metadata);

	function formatData(data, metadata) {
    //format unique orgs by adm1
    const admOrgs = {};
    const allOrgs = new Set();
    data.forEach(row => {
      const admin1Code = row.admin1_code;
      const admin1Name = row.admin1_name;
      const orgName = row.org_name;
      const sectorName = row.sector_name;

      if (!admOrgs[admin1Code]) {
        admOrgs[admin1Code] = {
          admin1_name: admin1Name,
          org_names: new Set(),
          sector_names: new Set(),
        };
      }

      if (orgName) {
        admOrgs[admin1Code].org_names.add(orgName);
        allOrgs.add(orgName);
      }
      if (sectorName) {
        admOrgs[admin1Code].sector_names.add(sectorName);
      }
    });

    console.log('admOrgs',admOrgs)

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

    //get num of orgs by sector
    const sectorCounts = {};
    data.forEach(row => {
      const sector = row['sector_name'];
      const org = row['org_name'];

      //init sector if doesnt exist
      if (!sectorCounts[sector]) {
        sectorCounts[sector] = new Set();
      }

      //add org to sector set
      sectorCounts[sector].add(org);
    });

    //convert to array
    const sectorCountArray = [];
    for (const sector in sectorCounts) {
      if (sector!=='undefined') {
        sectorCountArray.push({
          name: sector,
          value: sectorCounts[sector].size
        });
      }
    }

    //format data for org type chart
    const orgTypeCounts = d3.rollup(
      data,
      v => v.length,
      d => d.org_type_description
    );

    orgTypeCounts.forEach((value, key) => {
      if (key!=='' && key!==undefined) {
        orgTypeData.push({name: key, value: value});
      }
    });

    chartData = sectorCountArray;
    mapData = Object.values(admOrgsArray);
    totalValue = allOrgs.size;
  }

	onMount(() => {
    if (data) formatData(data, metadata);
	})
</script>


<div class='content grid-container'>

  {#if data && metadata}
    
    <div class='sidebar col-5' bind:clientWidth={sidebarWidth}>
      {#if sidebarWidth>0}
        <KeyFigure title={'Humanitarian Organizations Present'} value={totalValue} metadata={metadata[0]} />
        <hr>

        {#if chartData.length>0}
          <h3 class='chart-title'>Humanitarian Organizations by Sector</h3>
          <div class='ranking-container'>
              <Bar data={chartData} width={sidebarWidth} />
              <Source metadata={metadata[0]} align={'right'} />
          </div>
        {/if}
<!--         {#if orgTypeData.length>0}
          <h3 class='chart-title'>Humanitarian Organizations by Type</h3>
          <div class='ranking-container'>
            <Bar data={orgTypeData} width={sidebarWidth} />
            <Source metadata={metadata[0]} align={'right'} />
          </div>
        {/if} -->
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

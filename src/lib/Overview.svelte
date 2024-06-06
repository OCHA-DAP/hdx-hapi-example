<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
  import KeyFigure from './KeyFigure.svelte'

	export let data;
  export let iso3;

  let keyFigureData = [];

	function formatData(keyfigures) {
    //population
    if (keyfigures[0].data !== null) {
      const popData = keyfigures[0].data[0];
      if (popData) updateData({title: 'Population', value: +popData.population, valueFormat:'.3s', metadata: keyfigures[0].metadata[0]}, 0);
    }
    
    //hno
    if (keyfigures[1].data !== null) {
      const hno = keyfigures[1].data.filter(row => row.population_group === 'all' && row.population_status === 'INN');
      if (hno.length>0) updateData({title: 'People in Need', value: +hno[0].population, metadata: keyfigures[1].metadata[0]}, 1);

      const rea = keyfigures[1].data.filter(row => row.population_group === 'all' && row.population_status === 'REA');
      if (rea.length>0) updateData({title: 'People Reached', value: +rea[0].population, metadata: keyfigures[1].metadata[0]}, 2);
    }

    //conflict
    let conflictData = keyfigures[2].data;
    if (conflictData) {
      console.log(conflictData)
      let totalEvents = 0;
      conflictData.forEach(d => {
        if (d!==undefined) {
          const eventDate = new Date(d.reference_period_end);
          if (eventDate.getFullYear() === 2024) {
            totalEvents += +d.events;
          }
        }
      });
      if (conflictData.length>0) updateData({title: 'Conflict Events in 2024', value: totalEvents, metadata: keyfigures[2].metadata[0]}, 3);
    }

    //risk
    const riskData = keyfigures[3].data[0];
    if (riskData) updateData({title: 'Overall Risk', value: riskData.overall_risk, metadata: keyfigures[3].metadata[0]}, 4);

    //funding
    if (keyfigures[4].data !== null) {
      const funding = keyfigures[4].data.filter(row => row.appeal_code === `H${iso3}24`);
      if (funding[0]) {
        const requirement = +funding[0].requirements_usd;
        const fundedPercent = funding[0].funding_pct / 100;
        const pieData = [1-fundedPercent, fundedPercent];
        updateData({title: funding[0].appeal_type+' requirement', value: requirement, valueFormat:'$.2s', series: pieData, seriesType: 'pie', metadata: keyfigures[4].metadata}, 5);
      }
    }
  }

  function updateData(keyfig, order_id) {
    keyFigureData[order_id] = keyfig;
  }

	onMount(() => {
    console.log('data',data)
    if (data && data.length>0) formatData(data);
	})
</script>


{#if keyFigureData.length>0}
  {#each keyFigureData as keyFigure}
    {#if keyFigure!==undefined}
      <div class='col-2'>
        <KeyFigure {...keyFigure} />
      </div>
    {/if}
  {/each}
{:else}
  <div class='col-12 no-data-msg'>no data</div>
{/if}

<style lang='scss'>
</style>

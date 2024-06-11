<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
  import KeyFigure from './KeyFigure.svelte'

	export let data;
  export let iso3;

  let keyFigureData = [];

	function formatData(population, hno, conflict, risk, funding) {
    //population
    if (population.data !== null) {
      const popData = population.data[0];
      if (popData) updateData({title: 'Population', value: +popData.population, valueFormat:'.3s', metadata: population.metadata[0], endpoint: population.endpoint}, 0);
    }
    
    //hno
    if (hno.data !== null) {
      const pin = hno.data.filter(row => row.population_group === 'all' && row.population_status === 'INN');
      if (pin.length>0) updateData({title: 'People in Need', value: +pin[0].population, metadata: hno.metadata[0], endpoint: hno.endpoint}, 1);

      const rea = hno.data.filter(row => row.population_group === 'all' && row.population_status === 'REA');
      if (rea.length>0) updateData({title: 'People Reached', value: +rea[0].population, metadata: hno.metadata[0], endpoint: hno.endpoint}, 2);
    }

    //conflict
    if (conflict.data !== null) {
      let events = conflict.data;
      if (events) {
        let totalEvents = 0;
        events.forEach(d => {
          if (d!==undefined) {
            const eventDate = new Date(d.reference_period_end);
            if (eventDate.getFullYear() === 2024) {
              totalEvents += +d.events;
            }
          }
        });
        if (events.length>0) updateData({title: 'Civilian Targeted Conflict Events 2024', value: totalEvents, metadata: conflict.metadata[0], endpoint: conflict.endpoint}, 3);
      }
    }

    //risk
    if (risk.data !== null) {
      const riskData = risk.data[0];
      if (riskData) updateData({title: 'Overall Risk', value: riskData.overall_risk, metadata: risk.metadata[0], endpoint: risk.endpoint}, 4);
    }

    //funding
    if (funding.data !== null) {
      const fundingData = funding.data.filter(row => row.appeal_code === `H${iso3}24`);
      if (fundingData[0]) {
        const requirement = +fundingData[0].requirements_usd;
        const fundedPercent = fundingData[0].funding_pct / 100;
        const pieData = [1-fundedPercent, fundedPercent];
        updateData({title: fundingData[0].appeal_type+' requirement', value: requirement, valueFormat:'$.2s', series: pieData, seriesType: 'pie', metadata: funding.metadata[0], endpoint: funding.endpoint}, 5);
      }
    }
  }

  function updateData(keyfig, order_id) {
    keyFigureData[order_id] = keyfig;
  }

	onMount(() => {
    if (data && data.length>0) formatData(data[0], data[1], data[2], data[3], data[4]);
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
  <div class='col-12 no-data-msg'>No data available</div>
{/if}

<style lang='scss'>
</style>

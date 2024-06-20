<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
  import KeyFigure from './KeyFigure.svelte'

	export let data;
  export let iso3;

  let keyFigureData = [];

	function formatData(population, hno, conflict, risk, funding) {
    //Population
    const popData = population.data?.[0];
    if (popData) {
      updateData({
        title: 'Population', 
        value: +popData.population, 
        valueFormat:'.3s', 
        metadata: population.metadata?.[0],
        endpoint: population.endpoint
      }, 0);
    }
    
    //HNO
    const pin = hno.data?.find(row => row.population_group === 'all' && row.population_status === 'INN');
    if (pin) {
      updateData({
        title: 'People in Need',
        value: +pin.population,
        metadata: hno.metadata?.[0],
        endpoint: hno.endpoint
      }, 1);
    }

    const rea = hno.data?.find(row => row.population_group === 'all' && row.population_status === 'REA');
    if (rea) {
      updateData({
        title: 'People Reached',
        value: +rea.population,
        metadata: hno.metadata?.[0],
        endpoint: hno.endpoint
      }, 2);
    }

    //Conflict
    if (conflict.data) {
      const totalEvents = conflict.data.reduce((acc, d) => {
        if (d) {
          const eventDate = new Date(d.reference_period_end);
          if (eventDate.getFullYear() === 2024) {
            acc += +d.events;
          }
        }
        return acc;
      }, 0);
      if (totalEvents > 0) {
        updateData({
          title: 'Civilian Targeted Conflict Events 2024',
          value: totalEvents,
          metadata: conflict.metadata?.[0],
          endpoint: conflict.endpoint
        }, 3);
      }
    }

    //Risk
    const riskData = risk.data?.[0];
    if (riskData) {
      updateData({
        title: 'Overall Risk',
        value: riskData.overall_risk,
        metadata: risk.metadata?.[0],
        endpoint: risk.endpoint
      }, 4);
    }

    //Funding
    const fundingData = funding.data?.find(row => row.appeal_code === `H${iso3}24`);
    if (fundingData) {
      const requirement = +fundingData.requirements_usd;
      const fundedPercent = fundingData.funding_pct / 100;
      const pieData = [1 - fundedPercent, fundedPercent];
      updateData({
        title: `${fundingData.appeal_type} requirement`,
        value: requirement,
        valueFormat: '$.2s',
        series: pieData,
        seriesType: 'pie',
        metadata: funding.metadata?.[0],
        endpoint: funding.endpoint
      }, 5);
    }
  }

  function updateData(keyfig, order_id) {
    keyFigureData[order_id] = keyfig;
  }

	onMount(() => {
    if (data && data.length>0) formatData(...data);
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

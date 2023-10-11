<script>
  import { range } from 'd3';
  import { onMount } from 'svelte';
  import KeyFigure from './lib/KeyFigure.svelte'
  import Bar from './lib/Charts/Bar.svelte'
  import Map from './lib/Map.svelte'

  const randomData = (seriesCount) => {
    return range(seriesCount).map(function (d) {
      return {
        date: d,
        value: Math.random(d)*100
      };
    })
  };

  //dummy pie data
  let requirement = 90;
  let funded = 15;
  let fundedPercent = funded/requirement;
  let pieData = [1-fundedPercent, fundedPercent];

  //dummy key figures
  let keyFigureData = [
    {title: 'Key figure', value: '1,200,000', series: randomData(10)},
    {title: 'Key figure', value: '300000', series: randomData(10)},
    {title: 'Key figure', value: '1100000000', valueFormat:'$.2s'},
    {title: 'Key figure', value: '1100', series: randomData(5), seriesType: 'column'},
    {title: 'Key figure', value: '500'},
    {title: 'Key figure', value: '500', series: pieData, seriesType: 'pie'},
  ];

  let tabs = [
    {title: 'People in Need', id: ''},
    {title: 'Internally Displaced People', id: ''},
    {title: 'Refugees', id: ''},
    {title: 'Returnees', id: ''},
    {title: 'Organizations', id: ''},
    {title: 'Food Insecurity', id: ''},
    {title: 'Malnutrition', id: ''},
    {title: 'Health', id: ''},
  ];

  let sidebarWidth, scrollingWrapperHeight, scrollingWrapper;

  onMount(() => {
    //calculate available space for ranking chart
    scrollingWrapperHeight = window.innerHeight - scrollingWrapper.getBoundingClientRect().top - 30;
    scrollingWrapper.style.height = scrollingWrapperHeight + 'px';
  });
</script>

<main>
  <h1>Title</h1>
  
  <h2 class='header'>Header</h2>
  <div class='grid-container key-figure-container'>
    {#each keyFigureData as keyFigure}
      <div class='col-2'>
        <KeyFigure {...keyFigure} />
      </div>
    {/each}
  </div>

  <h2 class='header'>Header</h2>

  <div class='tabs'>
    {#each tabs as {title, id}, i}
      <div class={`tab ${i==0 ? 'active' : ''}`}><a href='#' {title}>{title}</a></div>
    {/each}
  </div>

<!--   <div class='select-wrapper'>
    <select>
      {#each tabs as {title, id}}
        <option value={id}>{title}</option>
      {/each}
    </select>
  </div> -->

  <div class='content grid-container'>
    <div class='sidebar col-3' bind:clientWidth={sidebarWidth}>
      <KeyFigure value={'300000'} series={randomData(10)} />

      <h3 class='chart-title'>Ranking</h3>
      <div class='scrolling-wrapper' bind:this={scrollingWrapper}>
        {#if sidebarWidth>0}
          <div class='ranking-container'>
            <Bar data={randomData(20)} width={sidebarWidth} />
          </div>
        {/if}
      </div>

    </div>
    <div class='main-content col-9'>
      <Map center={[18, 15]} zoom={4.5} />
    </div>
  </div>
</main>

<style lang='scss'>
  .key-figure-container {
    padding-left: 15px;
  }
  .main-content  {
    margin: 0;
  }
  .sidebar {
    margin-right: 0;
    padding-top: 15px;
  }
  .chart-title {
    margin-top: 15px;
  }
  .scrolling-wrapper {
    overflow-y: scroll;
  }
</style>

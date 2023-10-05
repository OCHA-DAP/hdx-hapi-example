<script>
  import { range } from 'd3';
  import KeyFigure from './lib/KeyFigure.svelte'
  import Map from './lib/Map.svelte'

  const randomData = (seriesCount) => {
    return range(seriesCount).map(function (d) {
      return {
        date: d,
        value: Math.random(d)
      };
    })
  };

  let barData = [
    {date: 1, value: 10},
    {date: 2, value: 30},
    {date: 3, value: 50},
    {date: 4, value: 40},
    {date: 5, value: 60}
  ];

  let requirement = 90;
  let funded = 15;
  let fundedPercent = funded/requirement;
  let pieData = [1-fundedPercent, fundedPercent];

  let keyFigureData = [
    {title: 'Key figure', value: '1,200,000', series: randomData(10)},
    {title: 'Key figure', value: '300000', series: randomData(10)},
    {title: 'Key figure', value: '1100000000', valueFormat:'$.2s', series: barData, seriesType: 'bar'},
    {title: 'Key figure', value: '1100'},
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

  <div class='content grid-container'>
    <div class='sidebar col-3'>
      <KeyFigure value={'300000'} series={randomData(10)} />
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
    padding: 0;
  }
</style>

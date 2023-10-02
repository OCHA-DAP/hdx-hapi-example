<script>
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import KeyFigure from './lib/KeyFigure.svelte'
  import Map from './lib/Map.svelte'

  let val = '1,200,000'
</script>

<main>
  <h1>Title</h1>
  
  <h2 class='header'>Header</h2>
  <div class='grid-container key-figure-container'>
    <div class='col-2'>
      <KeyFigure value={val} />
    </div>
    <div class='col-2'>
      <KeyFigure value={'300000'} />
    </div>
    <div class='col-2'>
      <KeyFigure value={'1100000000'} format='$.2s' />
    </div>
    <div class='col-2'>
      <KeyFigure value={'1100'} />
    </div>
    <div class='col-2'>
      <KeyFigure value={'500'} />
    </div>
    <div class='col-2'>
      <KeyFigure value={'500'} />
    </div>
  </div>

  <h2 class='header'>Header</h2>

  <div class='tabs'>
    <div class='tab active'><a href='#' title='People in Need'>People in Need</a></div>
    <div class='tab'><a href='#' title='Internally Displaced People'>Internally Displaced People</a></div>
    <div class='tab'><a href='#' title='Refugees'>Refugees</a></div>
    <div class='tab'><a href='#' title='Returnees'>Returnees</a></div>
    <div class='tab'><a href='#' title='Organizations'>Organizations</a></div>
    <div class='tab'><a href='#' title='Food Insecurity'>Food Insecurity</a></div>
    <div class='tab'><a href='#' title='Malnutrition'>Malnutrition</a></div>
    <div class='tab'><a href='#' title='Health'>Health</a></div>
  </div>

  <div class='content grid-container'>
    <div class='sidebar col-2'>
      sidebar
    </div>
    <div class='main-content col-10'>
      <Map center={[18, 15]} zoom={4.8} />
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

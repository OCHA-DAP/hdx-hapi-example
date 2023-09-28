<script>
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Map from './lib/Map.svelte'
</script>

<main>
  <h1>Title</h1>
  
  <h2 class='header'>Header</h2>
  <div class='grid-container'>
    <div class='key-figure col-2'>1</div>
    <div class='key-figure col-2'>2</div>
    <div class='key-figure col-2'>3</div>
    <div class='key-figure col-2'>4</div>
    <div class='key-figure col-2'>5</div>
    <div class='key-figure col-2'>6</div>
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
      <Map />
    </div>
  </div>
</main>

<style lang='scss'>
  .main-content  {
    padding: 0;
  }
</style>

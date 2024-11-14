<script>
  import { onMount } from 'svelte';
  import axios from 'axios';
  import Papa from 'papaparse';
  import * as d3 from 'd3';

  import Overview from './lib/Overview.svelte';
  import KeyFigure from './lib/KeyFigure.svelte';
  import PopulationView from './lib/PopulationView.svelte';
  import OrgsView from './lib/OrgsView.svelte';
  import HNOView from './lib/HNOView.svelte';
  import IPCView from './lib/IPCView.svelte';
  
  let viewsData = [];
  let keyFiguresData = [];
  let detailsLoading = true;
  let overviewLoading = true;
  let abortController;

  let selectedTab = 0;
  $: selectedCountry = 'AFG'; //default selected country

  const base_url = 'https://hapi.humdata.org/api/v1/';
  const app_indentifier = 'aGFwaS1kYXNoYm9hcmQ6ZXJpa2Eud2VpQHVuLm9yZw==';
  const rateDelay = 0;

  const countries = [
    { code: 'AFG', name: 'Afghanistan' },
    { code: 'BFA', name: 'Burkina Faso' },
    { code: 'CMR', name: 'Cameroon' },
    { code: 'CAF', name: 'Central African Republic' },
    { code: 'TCD', name: 'Chad' },
    { code: 'COL', name: 'Colombia' },
    { code: 'COD', name: 'Democratic Republic of the Congo' },
    { code: 'SLV', name: 'El Salvador' },
    { code: 'ETH', name: 'Ethiopia' },
    { code: 'GTM', name: 'Guatemala' },
    { code: 'HTI', name: 'Haiti' },
    { code: 'HND', name: 'Honduras' },
    { code: 'MLI', name: 'Mali' },
    { code: 'MOZ', name: 'Mozambique' },
    { code: 'MMR', name: 'Myanmar' },
    { code: 'NER', name: 'Niger' },
    { code: 'NGA', name: 'Nigeria' },
    { code: 'PSE', name: 'State of Palestine' },
    { code: 'SOM', name: 'Somalia' },
    { code: 'SSD', name: 'South Sudan' },
    { code: 'SDN', name: 'Sudan' },
    { code: 'SYR', name: 'Syrian Arab Republic' },
    { code: 'UKR', name: 'Ukraine' },
    { code: 'VEN', name: 'Venezuela (Bolivarian Republic of)' },
    { code: 'YEM', name: 'Yemen' }
  ];

  const views = [
    {name: 'Population', id: 'population', endpoint: `population-social/population?admin_level=1`},
    {name: 'Operational Presence', id: 'orgs', endpoint: `coordination-context/operational-presence?admin_level=2`},
    {name: 'Humanitarian Needs', id: 'hno', endpoint: `affected-people/humanitarian-needs?admin_level=1`},
    {name: 'Food Insecurity', id: 'ipc', endpoint: `food/food-security?ipc_type=current&admin_level=2`}
  ];

  const keyFigures = [
    {id: 'Population', endpoint: `population-social/population?gender=all&age_range=all&admin_level=0`},
    {id: 'HNO', endpoint: `affected-people/humanitarian-needs?sector_name=Intersectoral&admin_level=0`},
    {id: 'Conflict', endpoint: `coordination-context/conflict-event?event_type=civilian_targeting&admin_level=2`},
    {id: 'Risk', endpoint: `coordination-context/national-risk?output_format=csv`},
    {id: 'Funding', endpoint: `coordination-context/funding?`}
  ];

  async function fetchData(endpoint) {
    try {
      const response = await fetch(`${endpoint}&app_identifier=${app_indentifier}`, { signal: abortController.signal });
      const text = await response.text();
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          complete: results => resolve(results.data),
          error: err => reject(err)
        });
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        throw error;
      }
    }
  }

  async function fetchDataWithRateLimit(endpoint, delay) {
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchData(endpoint);
  }

  function generateMetadataEndpoint(hdx_id) {
    return `${base_url}metadata/resource?resource_hdx_id=${hdx_id}&output_format=csv&limit=100`;
  }

  async function loadViewsData() {
    viewsData = [];
    let delay = 0;
    for (let view of views) {
      let data = [];
      let offset = 0;
      let fetchedData;
      let endpoint = '';

      //data pagination
      do {
        endpoint = `${base_url}${view.endpoint}&location_code=${selectedCountry}&offset=${offset}&output_format=csv&limit=10000`;
        fetchedData = await fetchDataWithRateLimit(endpoint, delay);
        data = data.concat(fetchedData);
        offset += 10000;
      } while (fetchedData.length >= 10000);

      //if no data
      if (data.length === 0) {
        viewsData = [...viewsData, { id: view.id, data: null, metadata: null }];
        continue;
      }

      //get metadata
      const metadataEndpoint = generateMetadataEndpoint(data[0].resource_hdx_id);
      const metadata = await fetchDataWithRateLimit(metadataEndpoint, delay + 100);

      //console.log('---view endpoint', endpoint)
      viewsData = [...viewsData, { id: view.id, data, metadata, endpoint }];

      delay += rateDelay;
    }
  }

  async function loadKeyFiguresData() {
    keyFiguresData = [];
    let delay = 0;
    for (let keyFigure of keyFigures) {
      let data = [];
      let offset = 0;
      let fetchedData;
      let endpoint = '';

      //data pagination
      do {
        endpoint = `${base_url}${keyFigure.endpoint}&location_code=${selectedCountry}&offset=${offset}&output_format=csv&limit=10000`;
        fetchedData = await fetchDataWithRateLimit(endpoint, delay);
        data = data.concat(fetchedData);
        offset += 10000;
      } while (fetchedData && fetchedData.length >= 10000);

      //if no data
      if (data.length === 0) {
        keyFiguresData = [...keyFiguresData, { id: keyFigure.id, data: null, metadata: null }];
        continue;
      }
      
      const metadataEndpoint = generateMetadataEndpoint(data[0].resource_hdx_id);
      const metadata = await fetchDataWithRateLimit(metadataEndpoint, delay + 100);

      keyFiguresData = [...keyFiguresData, { id: keyFigure.id, data, metadata, endpoint }];
      
      delay += rateDelay;
    }
  }

  async function onCountryChange(event) {
    selectedCountry = event.target.value;

    //abort ongoing fetch requests, create new controller
    abortController.abort(); 
    abortController = new AbortController();

    detailsLoading = true;
    overviewLoading = true;

    loadData();
  }

  function selectTab(index) {
    selectedTab = index;
  }

  async function loadData() {
    //disable dropdown until page is loaded
    d3.select(".country-select").node().disabled = true;

    await loadViewsData();
    detailsLoading = false;

    await loadKeyFiguresData();
    overviewLoading = false;

    //enable dropdown once page is loaded
    d3.select(".country-select").node().disabled = false;
  }  


  function initTracking() {
    //initialize mixpanel
    var MIXPANEL_TOKEN = window.location.hostname=='ocha-dap.github.io'? '5cbf12bc9984628fb2c55a49daf32e74' : '99035923ee0a67880e6c05ab92b6cbc0';
    mixpanel.init(MIXPANEL_TOKEN);
    mixpanel.track('page view', {
      'page title': document.title,
      'page type': 'datavis'
    });
  }

  onMount(async () => {
    abortController = new AbortController();
    loadData();
    initTracking()
  });
</script>


<main>
  <header>
    <a href='https://hdx-hapi.readthedocs.io/en/latest/' target='_blank'><img src='logo_hdx_hapi.png' alt='HDX HAPI' /></a>
    <p>This dashboard was created to demonstrate the <a href='https://hdx-hapi.readthedocs.io/en/latest/' target='_blank'>HDX Humanitarian API</a> by showing a selection of key figures, charts and maps generated from data provided by the API.</p>
  </header>
  
  <div class='select-wrapper'>
    <select class='country-select' bind:value={selectedCountry} on:change={onCountryChange}>
      {#each countries as country}
        <option value={country.code}>{country.name}</option>
      {/each}
    </select>
  </div>
  
  <h2 class='header'>Country Overview</h2>
  
    {#if overviewLoading}
      <div class='col-12 no-data-msg'>Loading...</div>
    {:else}
      <div class='grid-container key-figure-container'>
        <Overview data={keyFiguresData} iso3={selectedCountry} />
      </div>
    {/if}

  <h2 class='header details'>Country Details</h2>

  <div class='tabs'>
    {#each views as {name, id}, index}
      <div class='tab' class:active={selectedTab === index} on:click={() => selectTab(index)}><a title={name}>{name}</a></div>
    {/each}
  </div>

  <div class='tab-content'>
    {#if detailsLoading}
      <p class='no-data-msg'>Loading...</p>
    {:else}
      {#if selectedTab === 0}
        <PopulationView {...viewsData[selectedTab]} iso3={selectedCountry} />
      {:else if selectedTab === 1}
        <OrgsView {...viewsData[selectedTab]} iso3={selectedCountry} />
      {:else if selectedTab === 2}
        <HNOView {...viewsData[selectedTab]} iso3={selectedCountry} />
      {:else if selectedTab === 3}
        <IPCView {...viewsData[selectedTab]} iso3={selectedCountry} />
      {/if}
    {/if}
  </div>
</main>


<style lang='scss'>
  header {
    display: flex;
    flex-flow: row;
    margin-top: 20px;
  }
  header img {
    height: 30px;
    margin-right: 30px;
  }
  header p {
    margin-top: 0;
    width: 60%;
  }
  h2.details {
    margin-top: 5px;
  }
  .main-content  {
    margin: 0;
  }
  select {
    font-size: 20px;
  }
  .tab-content {
    min-height: 621px;
  }

  @media (max-width: 768px) {
    header {
      flex-flow: column;
      img {
        height: 20px;
      }
      p {
        width: 100%;
      }
    }
    .select-wrapper {
      margin-left: 20px;
    }
  }
</style>

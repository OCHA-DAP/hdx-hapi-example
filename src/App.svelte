<script>
  import * as d3 from 'd3';
  import Papa from 'papaparse'
  import { onMount } from 'svelte';
  import KeyFigure from './lib/KeyFigure.svelte'
  import Bar from './lib/Charts/Bar.svelte'
  import Map from './lib/Map.svelte'
  import Pyramid from './lib/Charts/Pyramid.svelte'
  import Population from './lib/Population.svelte'

  const randomData = (seriesCount) => {
    return d3.range(seriesCount).map(function (d) {
      return {
        date: d,
        value: Math.random(d)*100
      };
    })
  };


  const base_url = 'https://hapiapi.humdata.org/api/v1/';
  const app_indentifier = 'app_identifier=aGFwaS1kYXNoYm9hcmQ6ZXJpa2Eud2VpQHVuLm9yZw==';

  let countryData = [];
  Papa.parse(`https://hapi-testing.innovation.humdata.org/api/location?output_format=csv&limit=1000&offset=0`, {
    header: true,
    download: true,
    complete: function(results) {
      countryData = results.data;
    }
  })

  // const url = 'https://stage.hapi-humdata-org.ahconu.org/api/admin1?location_code=afg&output_format=json&offset=0';
  // let admin1Data = [];

  //dummy pie data
  // let requirement = 90;
  // let funded = 15;
  // let fundedPercent = funded/requirement;
  // let pieData = [1-fundedPercent, fundedPercent];

  //dummy key figures
  //let keyFigureData = [
    // {title: 'Key figure', value: '1,200,000', series: randomData(10)},
    // {title: 'Key figure', value: '300000', series: randomData(10)},
    // {title: 'Key figure', value: '1100000000', valueFormat:'$.2s'},
    // {title: 'Key figure', value: '1100', series: randomData(5), seriesType: 'column'},
    // {title: 'Key figure', value: '500'},
    // {title: 'Key figure', value: '500', series: pieData, seriesType: 'pie'},
  //];

  let tabs = [
    {tabName: 'Population', id: 'population'},
    {tabName: 'Operational Presence', id: 'orgs'},
    {tabName: 'Humanitarian Needs', id: 'hno'},
  ];

  let sidebarWidth, scrollingWrapperHeight, scrollingWrapper;

  let popData = {};
  let orgData = {};
  let hnoData = {};

  let countrySelect = {code:'AFG', name:'Afghanistan'};

  $: selected = countryData.find(c => {
    return c.code === countrySelect.code
  });

  //Total key figure
  $: totalValue = 0;

  $: keyFigureData = new Array(6);
  $: mapData = [];
  $: chartData = [];
  $: ageData = [];
  $: metadata = {};
  $: currentLayer = 'population';
  $: rankingTitle = 'Population';



  function getCountryData(iso3) {
    keyFigureData = [];
    const sources = [
      `${base_url}population-social/population?location_code=${iso3}&admin_level=1&output_format=csv&limit=10000&offset=0&${app_indentifier}`,
      `${base_url}coordination-context/operational-presence?location_code=${iso3}&admin_level=2&output_format=csv&limit=10000&offset=0&${app_indentifier}`,
      `${base_url}affected-people/humanitarian-needs?gender=%2A&age_range=ALL&location_code=${iso3}&admin_level=1&output_format=csv&limit=10000&offset=0&${app_indentifier}`
    ];
    console.log(sources)

    const dataPromises = sources.map(source => {
      return new Promise((resolve, reject) => {
        Papa.parse(source, {
          download: true,
          header: true,
          complete: function(results) {
            resolve(results.data);
          },
          error: function(error) {
            reject(error);
          }
        });
      });
    });

    Promise.all(dataPromises)
      .then(allData => {
        console.log('All data:', allData);

        countrySelect.name = allData[0][0].location_name;

        //format data
        formatPopulationData(allData[0]);
        formatOrgsData(allData[1]);
        formatHnoData(allData[2]);

        //create keyfigures
        createKeyFigures(iso3);

        //init pop layer
        onLayerChange(currentLayer);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });      
  }

  /***************************
   * Population data
   ***************************/
  function formatPopulationData(data) {
    //get metadata
    if (data[0] !== undefined) {
      popData.metadata = getMetadata(data[0].resource_hdx_id);
      popData.hdx_id = data[0].resource_hdx_id;
    }

    //format data for pop pyramid chart
    const filteredData = data.filter(row => row.gender !== '*' && row.age_range !== '*' && row.gender !== undefined && row.age_range !== undefined);
    const ages = filteredData.reduce((acc, { gender, age_range, population }) => {
      //create unique key for each gender/age combo
      const key = `${gender}_${age_range}`;

      //create accumulator if it doesnt exist for this age/gender combo
      if (!acc[key]) {
        acc[key] = {
          gender,
          age_range,
          total_population: 0
        };
      }

      //get total pop for this age/gender combo
      acc[key].total_population += +population;
      return acc;
    }, {});
    ageData = Object.values(ages);


    //get population per adm area
    let popByAdm = d3.rollup(
      data,
      v => {
        const aggregatedData = v.filter(d => d.age_range === '*' && d.gender === '*');
        return {
          admin1_code: aggregatedData[0] ? aggregatedData[0].admin1_code : null,
          population: d3.sum(aggregatedData, d => d.population)
        };
      },
      d => d.admin1_name
    );

    //convert rollup result to array
    let popByAdmArray = Array.from(popByAdm, ([admin1_name, values]) => {
      if (admin1_name !== undefined) {
        return {
          admin1_name: admin1_name,
          admin1_code: values.admin1_code,
          value: values.population
        };
      }
    }).filter(d => d !== undefined);

    //save pop data
    popData.map = popByAdmArray;
    popData.chart = popByAdmArray;
    popData.totalValue = d3.sum(popByAdmArray, d => d.value);
  }

  /***************************
   * Operational presence data
   ***************************/
  function formatOrgsData(data) {
    console.log('formatOrgsData', data)
    if (data[0] !== undefined) {
      metadata = getMetadata(data[0].resource_hdx_id);
    }

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

    orgData.map = Object.values(admOrgsArray);
    orgData.totalValue = allOrgs.size;

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

    orgData.chart = sectorCountArray;
  }

  /***************************
   * Humanitarian needs data
   ***************************/
  function formatHnoData(data) {
    console.log('formatHnoData', data);

    //format pin by adm1 for map
    // const pinAdm1 = data.filter(row => row.sector_code === '*' && row.disabled_marker === '*' && row.population_group === '*' && row.population_status === 'INN');
    // let pinArray = [];
    // pinAdm1.forEach(row => {
    //   console.log(row)
    //   pinArray.push({
    //     admin1_code: row.admin1_code,
    //     admin1_name: row.admin1_name,
    //     value: +row.population
    //   })
    // });
    // hnoData.map = pinArray;
    // hnoData.totalValue = d3.sum(pinArray, d => d.value);
    const pinAdm1Object = {};
    data.forEach(item => {
      let { admin1_code, admin1_name, population_status, population_group, disabled_marker, sector_code, population } = item;
      population = +population;

      if (admin1_code!==undefined) {

        // Initialize admin1_code group if not already present
        if (!pinAdm1Object[admin1_code]) {
          pinAdm1Object[admin1_code] = {
            admin1_name: admin1_name,
            populationInnAll: 0,
            populationTgtAll: 0,
            populationReaAll: 0,
            populationInnIdp: 0,
            populationInnRef: 0
          };
        }

        // Check conditions and accumulate populations
        if (population_group === '*' && disabled_marker === '*' && sector_code === '*') {
          if (population_status === 'INN') {
            pinAdm1Object[admin1_code].populationInnAll += population;
          } else if (population_status === 'TGT') {
            pinAdm1Object[admin1_code].populationTgtAll += population;
          } else if (population_status === 'REA') {
            pinAdm1Object[admin1_code].populationReaAll += population;
          }
        }

        if (population_status === 'INN' && disabled_marker === '*' && sector_code === '*') {
          if (population_group === 'IDP') {
            pinAdm1Object[admin1_code].populationInnIdp += population;
          } else if (population_group === 'REF') {
            pinAdm1Object[admin1_code].populationInnRef += population;
          }
        }
      }
    });
    console.log('-------',pinAdm1Object)

    //convert to array of objects
    const pinAdm1 = {};
    for (const [admin1_code, attr] of Object.entries(pinAdm1Object)) {
      pinAdm1[admin1_code] = {
        admin1_code: admin1_code,
        admin1_name: attr.admin1_name,
        value: attr.populationInnAll,
        targeted: attr.populationTgtAll,
        reached: attr.populationReaAll,
        idp: attr.populationInnIdp,
        ref: attr.populationInnRef,
      };
    }
    hnoData.map = Object.values(pinAdm1);
    console.log(pinAdm1Object)

    //get pin key figures
    const idpPin = data.filter(row => row.sector_code === '*' && row.disabled_marker === '*' && row.population_group === 'IDP' && row.population_status === 'INN');
    hnoData.totalValue1 = d3.sum(idpPin, d => d.population);

    const refPin = data.filter(row => row.sector_code === '*' && row.disabled_marker === '*' && row.population_group === 'REF' && row.population_status === 'INN');
    hnoData.totalValue2 = d3.sum(refPin, d => d.population);

    //get pin by sector for bar chart
    const pinSector = {};
    data.forEach(d => {
      if (d.location_code === 'AFG' && d.population_status === 'INN' && d.sector_code !== '*' && d.disabled_marker === '*') {
        const sector = d.sector_name;
        const population = +d.population;
        
        if (!isNaN(population)) {
          if (pinSector[sector]) {
            pinSector[sector] += population;
          } 
          else {
            pinSector[sector] = population;
          }
        }
      }
    });

    //convert to array
    let sectorPinArray = [];
    for (const sector in pinSector) {
      sectorPinArray.push({
        name: sector,
        value: pinSector[sector]
      });
    }
    
    hnoData.chart = sectorPinArray;

    // // Iterate over each row in the CSV
    // data.forEach(row => {
    //   if (row['gender'] === '*' && row['age_range'] === '*' && row['disabled_marker'] === '*' && row['sector_code'] === '*') {
    //     const admin1Code = row['admin1_code'];
    //     const admin1Name = row['admin1_name'];
    //     const status = row['population_status'];
    //     const group = row['population_group'];
    //     const population = +row['population'];

    //     //init admin1 if doesnt exist
    //     if (!adminHno[admin1Code]) {
    //       adminHno[admin1Code] = {
    //         name: admin1Name,
    //         population: {}
    //       };
    //     }

    //     //init status if doesnt exist
    //     if (!adminHno[admin1Code].population[status]) {
    //       adminHno[admin1Code].population[status] = {};
    //     }

    //     //sum pop
    //     if (adminHno[admin1Code].population[status][group]) {
    //       adminHno[admin1Code].population[status][group] += population;
    //     } else {
    //       adminHno[admin1Code].population[status][group] = population;
    //     }
    //   }
    // });

    // console.log('adminHno',adminHno)
    // const pinArray = [];
    // for (const admin in adminHno) {
    //   pinArray.push({
    //     admin1_code: admin,
    //     admin1_name: adminHno[admin].name,
    //     value: adminHno[admin].population.inneed.total,
    //     idps: adminHno[admin].population.inneed.idps,
    //     returnees: adminHno[admin].population.inneed.returnees,
    //     refugees: adminHno[admin].population.inneed.refugees,
    //   });
    // }

    // hnoData.map = pinArray;
    // hnoData.totalValue = d3.sum(pinArray, d => d.value);
    // console.log('pin array', pinArray)
    // console.log('pin total', hnoData.totalValue)
  }

  function getPinBySector(iso3) {
    const hnoURL = `${base_url}affected-people/humanitarian-needs?gender=%2A&age_range=ALL&disabled_marker=%2A&population_group=%2A&population_status=INN&location_code=${iso3}&admin_level=0&output_format=csv&limit=10000&offset=0&${app_indentifier}`
    Papa.parse(hnoURL, {
      header: true,
      download: true,
      complete: function(results) {

      }
    });
  }

  function createKeyFigures(iso3) {
    // let keyFigureData = [
    //   {title: 'Key figure', value: '1,200,000', series: randomData(10)},
    //   {title: 'Key figure', value: '300000', series: randomData(10)},
    //   {title: 'Key figure', value: '1100000000', valueFormat:'$.2s'},
    //   {title: 'Key figure', value: '1100', series: randomData(5), seriesType: 'column'},
    //   {title: 'Key figure', value: '500'},
    //   {title: 'Key figure', value: '500', series: pieData, seriesType: 'pie'},
    // ];

    //hno data
    const hnoURL = `${base_url}affected-people/humanitarian-needs?gender=%2A&age_range=ALL&disabled_marker=%2A&sector_name=ALL&location_code=${iso3}&admin_level=0&output_format=csv&limit=10000&offset=0&${app_indentifier}`
    Papa.parse(hnoURL, {
      header: true,
      download: true,
      complete: function(results) {
        const pop = results.data.filter(row => row.population_group === '*' && row.population_status === 'POP');
        updateKeyFigureData({title: 'Population', value: +pop[0].population}, pop[0].resource_hdx_id, 0);

        const hno = results.data.filter(row => row.population_group === '*' && row.population_status === 'INN');
        updateKeyFigureData({title: 'People in Need', value: +hno[0].population}, hno[0].resource_hdx_id, 1);

        const rea = results.data.filter(row => row.population_group === '*' && row.population_status === 'REA');
        updateKeyFigureData({title: 'People Reached', value: +rea[0].population}, rea[0].resource_hdx_id, 2);
      }
    });

    //funding data
    const fundingURL = `${base_url}coordination-context/funding?location_code=${iso3}&output_format=csv&offset=0&${app_indentifier}`;
    Papa.parse(fundingURL, {
      header: true,
      download: true,
      complete: function(results) {
        const funding = results.data.filter(row => row.appeal_name === 'Afghanistan Humanitarian Response Plan 2024');
        const requirement = +funding[0].requirements_usd;
        const fundedPercent = funding[0].funding_pct / 100;
        const pieData = [1-fundedPercent, fundedPercent];

        updateKeyFigureData({title: funding[0].appeal_type+' requirement', value: requirement, valueFormat:'$.2s', series: pieData, seriesType: 'pie'}, funding[0].resource_hdx_id, 3);
      }
    });
  }

  async function updateKeyFigureData(keyfig, hdx_id, order_id) {
    try {
      keyfig.metadata = await getMetadata(hdx_id);
      keyFigureData[order_id] = keyfig;
    } 
    catch (error) {
      console.error('error getting key figure metadata:', error);
    }
  }

  function getMetadata(hdx_id) {
    return new Promise((resolve, reject) => {
      const metadataURL = `${base_url}metadata/resource?hdx_id=${hdx_id}&output_format=csv&${app_indentifier}`;
      Papa.parse(metadataURL, {
        header: true,
        download: true,
        complete: function(results) {
          if (results && results.data && results.data.length > 0) {
            let metadata = {
              date: results.data[0].update_date,
              datasetURL: results.data[0].dataset_hdx_link,
              provider: results.data[0].dataset_hdx_provider_name
            };
            resolve(metadata);
          } 
          else {
            reject(new Error('error getting metadata'));
          }
        },
        error: function(err) {
          reject(err);
        }
      });
    });
  }

  function onLayerChange(id) {
    currentLayer = id;
    let currentData = {};

    if (currentLayer === 'orgs') {
      currentData = orgData;
    }
    else if (currentLayer === 'hno') {
      currentData = hnoData;
    }
    else {
      currentData = popData;
    }

    mapData = currentData.map;
    chartData = currentData.chart;
    totalValue = currentData.totalValue;
  }

  onMount(async() => {
    getCountryData(countrySelect.code)

    //calculate available space for ranking chart
    scrollingWrapperHeight = 500;//window.innerHeight - scrollingWrapper.getBoundingClientRect().top - 80;
    scrollingWrapper.style.height = scrollingWrapperHeight + 'px';
  });
</script>

<Population />

<main>
  <div class='select-wrapper'>
    <select class='country-select' bind:value={countrySelect.code} on:change={() => getCountryData(countrySelect.code)}>
      {#each countryData as {code, name}}
        {#if code!=''}
          <option value={code}>{name}</option>
        {/if}
      {/each}
    </select>
  </div> 

  
  <h2 class='header'>Header</h2>
  <div class='grid-container key-figure-container'>
    {#if keyFigureData.length>0}
    {#each keyFigureData as keyFigure}
      <div class='col-2'>
        <KeyFigure {...keyFigure} />
      </div>
    {/each}
    {/if}
  </div>

  <h2 class='header'>Header</h2>

  <div class='tabs'>
    {#each tabs as {tabName, id}, i}
      <div class='tab' class:active={id === currentLayer} on:click={() => onLayerChange(id)}><a href='#' {tabName}>{tabName}</a></div>
    {/each}
  </div>

  <div class='content grid-container'>
    <div class='sidebar col-5' bind:clientWidth={sidebarWidth}>

      {#if currentLayer==='orgs'}
        <KeyFigure title={'Humanitarian Organizations Present'} value={totalValue} metadata={metadata} />
        <hr>
      {:else if currentLayer==='hno'}
        <div class='grid-container key-figure-container'>
          <div class='col-6'>
            <KeyFigure title={'Internally Displaced People'} value={hnoData.totalValue1} metadata={metadata} valueFormat={'.3s'} />
          </div>
          <div class='col-6'>
            <KeyFigure title={'Refugees'} value={hnoData.totalValue2} metadata={metadata} />
          </div>
        </div>
        <hr>
      {:else}<!-- currentLayer==='population' -->
        <!-- <div class='grid-container key-figure-container'>
          <div class='col-6'>
            <KeyFigure title={'Total'} value={totalValue} metadata={metadata} />
          </div>
          <div class='col-6'>
            <KeyFigure title={'Total'} value={totalValue} metadata={metadata} />
          </div>
        </div> -->
      {/if}

      <div class='scrolling-wrapper' bind:this={scrollingWrapper}>
        {#if sidebarWidth>0}
          {#if currentLayer==='orgs'}
            <h3 class='chart-title'>Humanitarian Organizations by Sector</h3>
            <div class='ranking-container'>
              <Bar data={chartData} width={sidebarWidth} />
            </div>
          {:else if currentLayer==='hno'}
            <h3 class='chart-title'>People in Need by Sector</h3>
            <div class='ranking-container'>
              <Bar data={chartData} width={sidebarWidth} />
            </div>
          {:else}<!-- currentLayer==='population' -->
            <Pyramid data={ageData} title={'Population Demographics'} width={sidebarWidth} />
          {/if}
        {/if}
      </div>

    </div>
    <div class='main-content col-7'>
      {#if mapData.length>0}
        <Map mapData={mapData} THEME={currentLayer} LOCATION={countrySelect} />
      {/if}
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
  .select-wrapper {
    margin-top: 20px;
  }
  select {
    font-size: 20px;
  }
</style>

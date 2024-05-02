<script>
  import * as d3 from 'd3';
  import Papa from 'papaparse';
  import { onMount } from 'svelte';

  const THEME = 'population';
  const LOCATION = 'AFG';
  const AGE_RANGE_CODE = '80%2B';
  const GENDER = 'f';

  const BASE_URL = `https://hapi-testing.innovation.humdata.org/api/themes/${THEME}?output_format=json&location_code=${LOCATION}&age_range_code=${AGE_RANGE_CODE}&gender=${GENDER}&admin1_is_unspecified=false&admin2_is_unspecified=true`;
  const LIMIT = 1000;

  async function fetch_data(base_url, limit = 1000) {
    let idx = 0;
    let results = [];

    while (true) {
      const offset = idx * limit;
      const url = `${base_url}&offset=${offset}&limit=${limit}`;

      console.log(`Getting results ${offset} to ${offset + limit - 1}`);
      const response = await fetch(url);
      const json_response = await response.json();

      results = results.concat(json_response);

      if (json_response.length < limit) {
        break;
      }
      idx += 1;
    }
    return results;
  }

  async function download_geojson(geojson_url) {
    console.log('Downloading GeoJSON data...');
    const response = await fetch(geojson_url);
    return response.json();
  }

  function append_population_to_geojson(geojson, indicator_data) {
    geojson.features.forEach(feature => {
      const feature_id = feature.properties.ADM1_PCODE;
      const corresponding_data = indicator_data.find(item => item.admin1_code === feature_id);
      if (corresponding_data) {
        feature.properties.indicator_name = THEME;
        feature.properties.indicator_value = corresponding_data[THEME];
      }
    });
    return geojson;
  }

  // function save_geojson(geojson, filename) {
  //   const file = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
  //   const a = document.createElement('a');
  //   a.href = URL.createObjectURL(file);
  //   a.download = filename;
  //   a.click();
  //   console.log(`GeoJSON saved to ${filename}`);
  // }  


  onMount(async() => {
    const results = await fetch_data(BASE_URL, LIMIT);
    const geojson_url = `https://apps.itos.uga.edu/codv2api/api/v1/themes/cod-ab/locations/${LOCATION}/versions/current/geoJSON/1`;
    const geojson_data = await download_geojson(geojson_url);
    const updated_geojson = append_population_to_geojson(geojson_data, results);
    console.log(updated_geojson)
  });
</script>
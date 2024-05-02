<script>
  import * as d3 from 'd3';
  import Papa from 'papaparse'

  // Using Fetch API for network requests
  async function fetchData(baseUrl, limit = 1000) {
      let idx = 0;
      let results = [];

      while (true) {
          const offset = idx * limit;
          const url = `${baseUrl}&offset=${offset}&limit=${limit}`;
          console.log(`Getting results ${offset} to ${offset + limit - 1}`);

          try {
              const response = await fetch(url);
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              const jsonResponse = await response.json();

              results = results.concat(jsonResponse);

              if (jsonResponse.length < limit) {
                  break;
              }

              idx++;
          } catch (error) {
              console.error('Fetch error:', error);
              break;
          }
      }

      return results;
  }

  async function downloadGeoJson(geojsonUrl) {
      console.log("Downloading GeoJSON data...");

      try {
          const response = await fetch(geojsonUrl);
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
      } catch (error) {
          console.error('Download error:', error);
          return null;
      }
  }

  function appendPopulationToGeoJson(geojson, populationData) {
      geojson.features.forEach((feature) => {
          const featureId = feature.properties['ADM1_PCODE'];
          const correspondingData = populationData.find(item => item['admin1_code'] === featureId);

          if (correspondingData) {
              feature.properties['population_f_80+'] = correspondingData['population'];
          }
      });

      return geojson;
  }

  function saveGeoJson(geojson, filename) {
      // In a browser environment, you cannot directly save files to the local filesystem.
      // This will instead offer the user to download the file.
      // const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
      // const href = URL.createObjectURL(blob);
      // const link = document.createElement('a');
      // link.href = href;
      // link.download = filename;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      // URL.revokeObjectURL(href);
      // console.log(`GeoJSON saved to ${filename}`);
      console.log('pop geojson', geojson)
  }

  // Main Logic
  const THEME = "population";
  const LOCATION = "AFG";
  const AGE_RANGE_CODE = "80%2B";
  const GENDER = "f";
  const BASE_URL = `https://hapi-testing.innovation.humdata.org/api/themes/${THEME}?output_format=json&location_code=${LOCATION}&age_range_code=${AGE_RANGE_CODE}&gender=${GENDER}&admin1_is_unspecified=false&admin2_is_unspecified=true`;
  const LIMIT = 1000;

  async function main() {
      d3.json(`${BASE_URL}&offset=0&limit=1000`, function(err, json) {
        console.log(err);
        console.log('yo', json)
      });
      const results = await fetchData(BASE_URL, LIMIT);

      const geojsonUrl = "https://apps.itos.uga.edu/codv2api/api/v1/themes/cod-ab/locations/AFG/versions/current/geoJSON/1";
      d3.json(geojsonUrl, function(err, geojson) {
        console.log(err);
        console.log('hey', geojson)
      });
      // const geojsonData = await downloadGeoJson(geojsonUrl);
      // const updatedGeojson = appendPopulationToGeoJson(geojsonData, results);
      // saveGeoJson(updatedGeojson, 'updated_data.geojson');
  }

  main();
</script>

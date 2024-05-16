<script>
	import { onMount, onDestroy } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import * as d3 from 'd3';
	import { legendColor } from 'd3-svg-legend';
	import * as turf from '@turf/turf';
	import '../../node_modules/mapbox-gl/dist/mapbox-gl.css';

	mapboxgl.baseApiUrl = 'https://data.humdata.org/mapbox';
	mapboxgl.accessToken = 'cacheToken';

	export let center = [67, 33];
	export let zoom = 4.8;
	export let rankingData = [];
	export let THEME;
  export let LOCATION;

	let map, mapContainer, geojson, mapLegend, colorScale, currentFeatures;
	let orgsObject = {};
	let sectorsObject = {};

	let colorRange = ['#CCE5F9','#99C4E7','#66A4D6','#3383C4','#0063B3'];
	let tooltip = d3.select('.tooltip');
	let numFormat = d3.format(',');
	let shortFormat = d3.format('.2s');


	let data = rankingData;
	$: if (data != rankingData) {  
		data = rankingData;
    updateFeatures();
	}


	onMount(() => {
		//calculate available space for map
		let mapHeight = 600;//window.innerHeight - mapContainer.getBoundingClientRect().top - 80;
		mapContainer.style.height = mapHeight + 'px';

		//init map
	  map = new mapboxgl.Map({
	    container: mapContainer,
	    style: 'mapbox://styles/humdata/cl3lpk27k001k15msafr9714b',
	    center: center,
	    zoom: zoom
	  });

	  map.addControl(new mapboxgl.NavigationControl({showCompass: false}))
	     .addControl(new mapboxgl.AttributionControl(), 'bottom-left');

	  tooltip = new mapboxgl.Popup({
			closeButton: false,
			closeOnClick: false,
			className: 'map-tooltip'
		});

	  map.on('load', function() {
	    console.log('Map loaded')
	  });

	  loadFeatures();
	});


	async function get_geojson(geojson_url) {
    console.log('Getting ITOS geojson...');
    const response = await fetch(geojson_url);
    return response.json();
  }

  function match_geojson(geojson, indicator_data) {
  	console.log('indicator_data',indicator_data)
    geojson.features.forEach(feature => {
      const props = feature.properties;
      const matched_data = indicator_data.find(item => item.admin1_code === props.ADM1_PCODE);
      if (matched_data) {
      	props.ADM1_NAME = matched_data.admin1_name;
        props.indicator_value = matched_data.value;
        props.indicator_name = THEME;
        if (THEME==='3w') {
        	orgsObject[props.ADM1_PCODE] = matched_data.orgs;
        	sectorsObject[props.ADM1_PCODE] = matched_data.sectors;
        }
      }
    });
    return geojson;
  }

  function save_geojson(geojson, filename) {
    const file = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
    console.log(`GeoJSON saved to ${filename}`);
  }

	async function loadFeatures() {
		//to do: run script nightly to get geosjon from itos
    // const itos_url = `https://apps.itos.uga.edu/codv2api/api/v1/themes/cod-ab/locations/${LOCATION}/versions/current/geoJSON/1`;
    // const geojson_data = await get_geojson(itos_url);
    // save_geojson(currentFeatures, 'updated_data.geojson');

		//for demo, used local copies of geojson
		const response = await fetch(`itos-${LOCATION}.geojson`, {
			body: JSON.stringify()
		});
	  const geojson_data = await response.json();
	  currentFeatures = match_geojson(geojson_data, data);
    console.log('loaded features',currentFeatures)

  	const max = d3.max(currentFeatures.features, function(d) { return +d.properties.indicator_value; });
  	colorScale = d3.scaleQuantize().domain([0, max]).range(colorRange);


	  currentFeatures.features.forEach(function(f) {
	    let prop = f.properties;
	    prop['color'] = colorScale(+prop.indicator_value)
	  });

	  map.addSource('indicator-data', {
	    type: 'geojson',
	    data: currentFeatures
	  });

	  map.addLayer({
	    id: 'indicator-layer',
	    source: 'indicator-data',
	    type: 'fill',
	    paint: {
      	'fill-color': ['get', 'color'],
	      'fill-outline-color': '#FFFFFF'
	    }
	  }, 'Countries 2-4');

	   //mouse events
	  map.on('mouseenter', 'indicator-layer', onMouseEnter);
	  map.on('mouseleave', 'indicator-layer', onMouseLeave);
	  map.on('mousemove', 'indicator-layer', function(e) {
	    map.getCanvas().style.cursor = 'pointer';

	    const title = (THEME==='3w') ? 'Number of Organizations' : THEME;
	    const prop = e.features[0].properties;
	    let content = `<h2>${prop.ADM1_NAME}, ${prop.ADM0_EN}</h2><span class='theme'>${title}:</span><div class="stat">${shortFormat(prop.indicator_value)}</div>`;
	    if (THEME == '3w') {
	    	content += `<hr><h5>Top 5 Organizations</h5>`;
  			let orgs = Object.entries(orgsObject[prop.ADM1_PCODE]);
  			orgs.sort((a,b) => b[1] - a[1]);

				orgs.slice(0, 5).forEach((org, i) => {
					content += org[0];
					if (i<4) content += ', '
				});

	    	content += `<br><br><h5>Top 5 Sectors</h5>`;
  			let sectors = Object.entries(sectorsObject[prop.ADM1_PCODE]);
  			sectors.sort((a,b) => b[1] - a[1]);

				sectors.slice(0, 5).forEach((sector, i) => {
					content += sector[0];
					if (i<4) content += ', '
				});
	    }
	    else {
	    }

	    tooltip.setHTML(content);
	    tooltip
	      .addTo(map)
	      .setLngLat(e.lngLat);
	  });

	  zoomToBounds();

	  //create map legend
	  //createMapLegend();
	}

	function updateFeatures() {
		if (map.getSource('indicator-data')) {
			map.removeLayer('indicator-layer');
			map.removeSource('indicator-data');
			loadFeatures();
		}
	}

	function zoomToBounds() {
		//zoom map to bounds
		if (currentFeatures !== undefined) {
			let bbox = turf.bbox(currentFeatures);
			map.fitBounds(bbox, {padding: {top: 50, right: 50, bottom: 50, left: 50}, duration: 500});
		}
	}


	function createMapLegend() {
	  var svg = d3.select(mapLegend);

		var colorLegend = legendColor()
	    .labelFormat(d3.format('.2s'))
	    .scale(colorScale);

		d3.select(".legendQuant")
		  .call(colorLegend);
	}

	//mouse event/leave events
	function onMouseEnter(e) {
	  map.getCanvas().style.cursor = 'pointer';
	  tooltip.addTo(map);
	}
	function onMouseLeave(e) {
	  map.getCanvas().style.cursor = '';
	  tooltip.remove();
	}

	onDestroy(() => {
	  map.remove();
	});
</script>


<div bind:this={mapContainer} />
<div bind:this={mapLegend}>
	<svg>
		<g class='legendQuant'></g>
	</svg>
</div>

<style lang='scss'>
	div {
		margin-bottom: 20px;
	}
</style>
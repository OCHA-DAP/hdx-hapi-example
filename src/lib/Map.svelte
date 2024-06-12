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
	export let mapData = [];
	export let THEME;
  export let LOCATION;

	let map, mapContainer, geojson, mapLegend, colorScale, currentFeatures;
	let orgsObject = {};
	let sectorsObject = {};

	let popColorRange = ['#D5EFE6','#C5E1DB','#91C4BB','#81AAA4','#6B8883'];
	let orgsColorRange = ['#D1E3EA','#BBD1E6','#ADBCE3','#B2B3E0','#A99BC6'];
	let hnoColorRange = ['#ffcdb2','#f2b8aa','#e4989c','#b87e8b','#925b7a'];//['#CCE5F9','#99C4E7','#66A4D6','#3383C4','#0063B3'];
	let ipcColorRange = ['#F6D2AA', '#F2BB7F', '#EEA555', '#EA8E2A', '#E67800'];
	let colorRange = [];
	
	let tooltip = d3.select('.tooltip');
	let numFormat = d3.format(',');
	let shortFormat = d3.format('.2s');

	//map humanitarian icons to sector clusters
  let humIcons = {
    'Child Protection': 'humanitarianicons-Child-protection',
    'Camp Coordination / Management': 'humanitarianicons-Camp-Coordination-and-Camp-Management',
    'Coordination and Common Services': 'humanitarianicons-Coordination',
    'Early Recovery': 'humanitarianicons-Early-Recovery',
    'Education': 'humanitarianicons-Education',
    'Emergency Shelter and NFI': 'humanitarianicons-Shelter',
    'Emergency Telecommunications': 'humanitarianicons-Emergency-Telecommunications',
    'Food Security': 'humanitarianicons-Food-Security',
    'Gender Based Violence': 'humanitarianicons-Gender-based-violence',
    'Protection': 'humanitarianicons-Protection',
    'Health': 'humanitarianicons-Health',
    'Logistics': 'humanitarianicons-Logistics',
    'Mine Action': 'humanitarianicons-Mine',
    'Multi-Purpose Cash': 'humanitarianicons-Fund',
    'Nutrition': 'humanitarianicons-Nutrition',
    'Water Sanitation Hygiene': 'humanitarianicons-Water-Sanitation-and-Hygiene',
  };


	let data = mapData;
	$: if (data != mapData) {
		data = mapData;
    updateFeatures();
	}

	export const isMobile = () => {
    const userAgentCheck = /Mobi|Android/i.test(navigator.userAgent);
    const screenSizeCheck = window.matchMedia("(max-width: 767px)").matches;
    return userAgentCheck || screenSizeCheck;
	}

	onMount(() => {
		let mapHeight = 600;
		mapContainer.style.height = mapHeight + 'px';

		//init map
	  map = new mapboxgl.Map({
	    container: mapContainer,
	    style: 'mapbox://styles/humdata/cl3lpk27k001k15msafr9714b',
	    //center: center,
	    zoom: zoom,
	    minZoom: 3
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
	  	loadFeatures();
	  });
	});


	async function get_geojson(geojson_url) {
    console.log('Getting ITOS geojson...');
    const response = await fetch(geojson_url);
    return response.json();
  }

  function findAdm0Name(props) {
	  const keysToFind = ['ADM0_EN', 'ADM0_ES', 'ADM0_FR', 'ADM0_PT'];

	  for (let key of keysToFind) {
	    if (props.hasOwnProperty(key)) {
	      return props[key];
	    }
	  }
	  return null;
	}

  function findAdm1Name(props) {
	  const keysToFind = ['ADM1_EN', 'ADM1_ES', 'ADM1_FR', 'ADM1_PT'];

	  for (let key of keysToFind) {
	    if (props.hasOwnProperty(key)) {
	      return props[key];
	    }
	  }
	  return null;
	}

  function match_geojson(geojson, indicator_data) {
    geojson.features.forEach(feature => {
      const props = feature.properties;
      const matched_data = indicator_data.find(item => item.admin1_code === props.ADM1_PCODE);
      if (matched_data) {
      	props.ADM1_NAME = matched_data.admin1_name;
        props.indicator_value = matched_data.value;
        props.indicator_name = THEME;
        if (THEME==='orgs') {
        	orgsObject[props.ADM1_PCODE] = matched_data.org_names;
        	sectorsObject[props.ADM1_PCODE] = matched_data.sector_names;
        }
        if (THEME==='hno') {
        	props.idp = matched_data.idp;
        	props.refugees = matched_data.ref;
        	props.targeted = matched_data.targeted;
        	props.reached = matched_data.reached;
        }
        if (THEME==='ipc') {
        	props.percentInPhase = matched_data.percentInPhase;
        	props.referencePeriod = matched_data.referencePeriod;
        }
      }
      else {
      	props.ADM1_NAME = findAdm1Name(props);
        props.indicator_value = 'NA';
        props.indicator_name = THEME;
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
		//to do: run script nightly to get geojson from itos
    // const itos_url = `https://apps.itos.uga.edu/codv2api/api/v1/themes/cod-ab/locations/${LOCATION}/versions/current/geoJSON/1`;
    // const geojson_data = await get_geojson(itos_url);
    // save_geojson(currentFeatures, 'updated_data.geojson');

		if (THEME === 'orgs')
			colorRange = orgsColorRange
		else if (THEME === 'hno')
		  colorRange = hnoColorRange;
		else if (THEME === 'ipc')
		  colorRange = ipcColorRange;
		else 
			colorRange = popColorRange;

		//for demo, used local copies of geojson
		const response = await fetch(`itos-${LOCATION}.geojson`, {
			body: JSON.stringify()
		});
	  const geojson_data = await response.json();
	  currentFeatures = match_geojson(geojson_data, data);
    //console.log('loaded features',currentFeatures)

  	const max = d3.max(currentFeatures.features, function(d) { return +d.properties.indicator_value; });
  	colorScale = d3.scaleQuantize().domain([0, max]).range(colorRange);


	  currentFeatures.features.forEach(function(f) {
	    let prop = f.properties;
	    prop['color'] = (prop.indicator_value==='NA') ? '#CCC' : colorScale(+prop.indicator_value)
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

	    const prop = e.features[0].properties;
	    let adm0_name = findAdm0Name(prop);
	    let content = `<h2>${prop.ADM1_NAME}, ${adm0_name}</h2>`;

	    if (THEME === 'population') {
	    	content += `<span class='theme'>Population:</span><div class="stat">${shortFormat(prop.indicator_value)}</div>`;
	    }
	    else if (THEME === 'orgs') {
	    	let val = (prop.indicator_value==='NA') ? 'No data' : shortFormat(prop.indicator_value);
	    	content += `<span class='theme'>Humanitarian organizations present:</span><div class="stat">${val}</div>`;
	    	if (sectorsObject[prop.ADM1_PCODE]) {
	    		content += `<hr>Clusters present: ${sectorsObject[prop.ADM1_PCODE].length}`;
		    	let sectors = sectorsObject[prop.ADM1_PCODE].sort();

		    	content += `<ul class="sector-list">`;
					sectors.forEach((sector, i) => {
						content += `<li><i class="${humIcons[sector]}"></i> ${sector}</li>`;
					});
					content += `</ul>`;
				}
	    }
	    else if (THEME === 'hno') {
	    	if (prop.indicator_value==='NA') {
		    	content += `<span class='theme'>People in need:</span><div class="stat">No data</div>`;
	    	}
	    	else {
		    	content += `<span class='theme'>People in need:</span><div class="stat">${shortFormat(prop.indicator_value)}</div>`;
		    	content += `<hr><ul class="sector-list">`;
		    	content += `<li>People Targeted: ${numFormat(prop.targeted)}</li>`;
		    	content += `<li>Internally Displaced People: ${numFormat(prop.idp)}</li>`;
		    	content += `<li>Refugees: ${numFormat(prop.refugees)}</li>`;
		    	content += `</ul>`;
	    	}
	    }
	    else if (THEME === 'ipc') {
	    	let val = (prop.indicator_value===0) ? 0 : shortFormat(prop.indicator_value);
	    	content += `<span class='theme'>Population in IPC Phase 3+:</span><br><span class="stat">${val}</span> (${d3.format(".0%")(prop.percentInPhase)})`;
	    }
	    else {
	    	content += `<span class='theme'>${THEME}:</span><div class="stat">${shortFormat(prop.indicator_value)}</div>`;
	    }

	    tooltip.setHTML(content);
	    tooltip
	      .addTo(map)
	      .setLngLat(e.lngLat);
	  });

	  zoomToBounds();

	  //create map legend
	  createMapLegend();
	}

	function updateFeatures() {
		//clear indicator layer on map
		if (map.getSource('indicator-data')) {
			map.removeLayer('indicator-layer');
			map.removeSource('indicator-data');
			loadFeatures();
		}

		//update legend
		d3.select('.legend-body').selectAll('*').remove();
		createMapLegend();
	}

	function zoomToBounds() {
		//zoom map to bounds
		const pad = isMobile() ? {top: 20, right: 20, bottom: 50, left: 20} : {top: 50, right: 50, bottom: 125, left: 50};
		if (currentFeatures !== undefined) {
			let bbox = turf.bbox(currentFeatures);
			map.fitBounds(bbox, {padding: pad, duration: 100});
		}
	}


	function createMapLegend() {
		let legendTitle = THEME;
		if (THEME==='population') legendTitle = 'Population';
		if (THEME==='orgs') legendTitle = 'Number of Organizations';
		if (THEME==='hno') legendTitle = 'Number of People in Need';
		if (THEME==='ipc') legendTitle = 'Population in IPC Phase 3+';
		d3.select('.legend-title').text(legendTitle);

	  var svg = d3.select(mapLegend);

		var colorLegend = legendColor()
	    .labelFormat(d3.format('.2s'))
	    .scale(colorScale);

		d3.select('.legend-body')
		  .call(colorLegend);

		//no data
	  var nodata = svg.append('svg')
	    .attr('class', 'no-data-key');

	  nodata.append('rect')
	    .attr('width', 15)
	    .attr('height', 15);

	  nodata.append('text')
	    .attr('class', 'label')
	    .text('No Data');
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


<div class='right-content'>
	<div bind:this={mapContainer} />
	<div class='map-legend' bind:this={mapLegend}>
		<h4 class='legend-title'>Map Legend</h4>
		<svg>
			<g class='legend-body'></g>
		</svg>
	</div>
</div>

<style lang='scss'>
</style>
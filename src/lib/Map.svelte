<script>
	import mapboxgl from 'mapbox-gl';
	import * as d3 from 'd3';
	import { onMount, onDestroy } from 'svelte';
	import '../../node_modules/mapbox-gl/dist/mapbox-gl.css'

	mapboxgl.baseApiUrl = 'https://data.humdata.org/mapbox';
	mapboxgl.accessToken = 'cacheToken';

	export let center = [67, 33];
	export let zoom = 4.8;

	let map, mapContainer, geojson;

	let colorRange = ['#F7FCB9', '#D9F0A3', '#ADDD8E', '#78C679', '#41AB5D'];
	let tooltip = d3.select('.tooltip');
	let numFormat = d3.format(',');

	onMount(() => {
		//calculate available space for map
		let mapHeight = window.innerHeight - mapContainer.getBoundingClientRect().top - 30;
		mapContainer.style.height = mapHeight + 'px';

		//init map
	  map = new mapboxgl.Map({
	    container: mapContainer,
	    style: `mapbox://styles/humdata/cl3lpk27k001k15msafr9714b`,
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

	async function loadFeatures() {
		const response = await fetch('updated_data.geojson', {
			body: JSON.stringify()
		});
	  geojson = await response.json();

  	const max = d3.max(geojson.features, function(d) { return +d.properties['population_f_80+']; });
  	const colorScale = d3.scaleQuantize().domain([0, max]).range(colorRange);

	  geojson.features.forEach(function(f) {
	    let prop = f.properties;
	    prop['color'] = colorScale(+prop['population_f_80+'])
	  });

	  map.addSource('population-data', {
	    type: 'geojson',
	    data: geojson
	  });

	  map.addLayer({
	    id: 'population-layer',
	    source: 'population-data',
	    type: 'fill',
	    paint: {
      	'fill-color': ['get', 'color'],
	      'fill-outline-color': '#E0E0E0'
	    }
	  });

	   //mouse events
	  map.on('mouseenter', 'population-layer', onMouseEnter);
	  map.on('mouseleave', 'population-layer', onMouseLeave);
	  map.on('mousemove', 'population-layer', function(e) {
	    map.getCanvas().style.cursor = 'pointer';
	    const content = `<h2>${e.features[0].properties.ADM1_EN}, ${e.features[0].properties.ADM0_EN}</h2>Population of Females 80+:<div class="stat">${numFormat(e.features[0].properties['population_f_80+'])}</div>`;
	    tooltip.setHTML(content);
	    tooltip
	      .addTo(map)
	      .setLngLat(e.lngLat);
	  });
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

<style lang='scss'>
</style>
<script>
	import { onMount, onDestroy } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import * as d3 from 'd3';
	import { legendColor } from 'd3-svg-legend';
	import '../../node_modules/mapbox-gl/dist/mapbox-gl.css';

	mapboxgl.baseApiUrl = 'https://data.humdata.org/mapbox';
	mapboxgl.accessToken = 'cacheToken';

	export let center = [67, 33];
	export let zoom = 4.8;

	let map, mapContainer, geojson, mapLegend, colorScale;

	let colorRange = ['#CCE5F9','#99C4E7','#66A4D6','#3383C4','#0063B3'];
	let tooltip = d3.select('.tooltip');
	let numFormat = d3.format(',');

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

	async function loadFeatures() {
		// d3.json("updated_data.geojson", function(err, geojson) { 

		// 	console.log('geojson loaded')

		// })


		const response = await fetch('updated_data.geojson', {
			body: JSON.stringify()
		});
	  geojson = await response.json();

  	const max = d3.max(geojson.features, function(d) { return +d.properties['population_f_80+']; });
  	colorScale = d3.scaleQuantize().domain([0, max]).range(colorRange);


	  //createMapLegend();

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
	      'fill-outline-color': '#FFFFFF'
	    }
	  }, 'Countries 2-4');

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

	function createMapLegend() {
	  var svg = d3.select(mapLegend);

		svg.append("g")
		  .attr("class", "legendQuant")
		  .attr("transform", "translate(20,20)");

		var colorLegend = legendColor()
	    //.labelFormat(d3.format(".2f"))
	    //.useClass(true)
	    .scale(colorScale);

		svg.select(".legendQuant")
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
<div bind:this={mapLegend} class='help' />

<style lang='scss'>
	div {
		margin-bottom: 20px;
	}
</style>
<script>
	import mapboxgl from 'mapbox-gl';
	import { onMount, onDestroy } from 'svelte';
	import '../../node_modules/mapbox-gl/dist/mapbox-gl.css'

	mapboxgl.baseApiUrl = 'https://data.humdata.org/mapbox';
	mapboxgl.accessToken = 'cacheToken';

	export let center = [18, 15];
	export let zoom = 4.8;

	let map, mapContainer;

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
	     .addControl(new mapboxgl.AttributionControl(), 'bottom-right');

	  map.on('load', function() {
	    console.log('Map loaded')
	  });
	});

	onDestroy(() => {
	  map.remove();
	});
</script>


<div bind:this={mapContainer} />


<style lang='scss'>
</style>
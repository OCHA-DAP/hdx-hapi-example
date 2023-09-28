<script>
	import { Map } from 'mapbox-gl';
	import { onMount, onDestroy } from 'svelte';
	import '../../node_modules/mapbox-gl/dist/mapbox-gl.css'

	let map;
	let mapContainer;

	// mapboxgl.baseApiUrl='https://data.humdata.org/mapbox';
	// mapboxgl.accessToken = 'cacheToken';

	onMount(() => {
		//calculate available space for map
		let mapHeight = window.innerHeight - document.getElementsByClassName('map')[0].getBoundingClientRect().top - 30;
		document.getElementsByClassName('map-container')[0].style.height = mapHeight + 'px';

	  map = new Map({
	    container: mapContainer,
	    accessToken: 'pk.eyJ1IjoiaHVtZGF0YSIsImEiOiJja2FvMW1wbDIwMzE2MnFwMW9teHQxOXhpIn0.Uri8IURftz3Jv5It51ISAA',
	    style: `mapbox://styles/humdata/cl3lpk27k001k15msafr9714b`,
	    center: [18, 15],
	    zoom: 4.8
	  });
	});

	onDestroy(() => {
	  map.remove();
	});
</script>

<div class='map-container'>
  <div class='map' bind:this={mapContainer} />
</div>

<style lang='scss'>
	.map {
  	height: 100%;
	}
</style>
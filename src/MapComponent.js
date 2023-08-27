import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

function MapComponent() {

  useEffect(() => {
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://api.maptiler.com/maps/streets/style.json?key=6jk9aonLicRFoRqvljrc',
      center: [-106.3468, 56.1304],
      zoom: 4,
    });

    const fetchData = () => {
      const bounds = map.getBounds();
      const minLng = bounds.getWest();
      const minLat = bounds.getSouth();
      const maxLng = bounds.getEast();
      const maxLat = bounds.getNorth();

      fetch(`https://575qjd8cuk.execute-api.us-east-1.amazonaws.com/prod/trees/search?min_lat=${minLat}&max_lat=${maxLat}&min_lng=${minLng}&max_lng=${maxLng}&limit=4000&return_all=true&count=false&count_only=false`)
        .then(response => response.json())
        .then(fetchedData => {
          if (map.getSource('points')) {
            map.getSource('points').setData(fetchedData);
          } else {
            map.addSource('points', {
              'type': 'geojson',
              'data': fetchedData
            });

            map.addLayer({
              'id': 'points',
              'type': 'circle',
              'source': 'points',
              'paint': {
                'circle-radius': 6,
                'circle-color': '#B42222'
              }
            });
          }
        });
    };

    map.on('load', fetchData); // Fetch data when the map is loaded
    map.on('moveend', fetchData); // Fetch data when the user stops panning/zooming

    return () => map.remove();
  }, []);

  return <div id="map" style={{ width: '100vw', height: '100vh' }}></div>;
}

export default MapComponent;

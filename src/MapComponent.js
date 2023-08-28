import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Select from 'react-select';

function MapComponent() {
    const [data, setData] = useState(null);
    const [selectedGenus, setSelectedGenus] = useState(null);
    const mapRef = useRef(null);

    useEffect(() => {
        mapRef.current = new maplibregl.Map({
            container: 'map',
            style: 'https://api.maptiler.com/maps/streets/style.json?key=6jk9aonLicRFoRqvljrc',
            center: [-106.3468, 56.1304],
            zoom: 4,
        });

        mapRef.current.on('load', () => {
            fetchDataForMap();
        });

        mapRef.current.on('moveend', () => {
            fetchDataForMap();
        });

        return () => mapRef.current && mapRef.current.remove();
    }, []);

    const fetchDataForMap = () => {
        if (mapRef.current) {
            const bounds = mapRef.current.getBounds();
            const minLng = bounds.getWest();
            const minLat = bounds.getSouth();
            const maxLng = bounds.getEast();
            const maxLat = bounds.getNorth();
            let url = `https://575qjd8cuk.execute-api.us-east-1.amazonaws.com/prod/trees/search?min_lat=${minLat}&max_lat=${maxLat}&min_lng=${minLng}&max_lng=${maxLng}&limit=5000&return_all=true&count=false&count_only=false`;

            if (selectedGenus) {
                url += `&botanical_genus=${selectedGenus}`;
            }

            fetch(url)
                .then(response => response.json())
                .then(fetchedData => {
                    if (mapRef.current.getSource('points')) {
                        mapRef.current.getSource('points').setData(fetchedData);
                    } else {
                        mapRef.current.addSource('points', {
                            'type': 'geojson',
                            'data': fetchedData
                        });
                        mapRef.current.addLayer({
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
        }
    };

    useEffect(() => {
        // You already have fetchDataForMap inside the first useEffect.
        fetch('https://575qjd8cuk.execute-api.us-east-1.amazonaws.com/prod/data/overview')
            .then(response => response.json())
            .then(overviewData => setData(overviewData.botanical_name_genus));
    }, [selectedGenus]);    

    const handleGenusClick = (genus) => {
        setSelectedGenus(genus);
    };

    const genusOptions = data ? data.filter(name => name && name.trim() !== '').map(name => ({ value: name, label: name })) : [];

    return (
        <div style={{ display: 'flex' }}>
            <div style={{ width: '20%', overflowY: 'auto', maxHeight: '100vh', borderRight: '1px solid gray' }}>
                <Select
                    options={genusOptions}
                    onChange={(selectedOption) => handleGenusClick(selectedOption.value)}
                    placeholder="Select a genus..."
                    isSearchable
                />
            </div>
            <div id="map" style={{ flex: 1, height: '100vh' }}></div>
        </div>
    );
}

export default MapComponent;

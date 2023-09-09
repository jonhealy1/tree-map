import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Select from 'react-select';

function MapComponent() {
    const [data, setData] = useState({});
    const [genusType, setGenusType] = useState(null);
    const [selectedGenus, setSelectedGenus] = useState(null);
    const [info, setInfo] = useState({ count: 0, limit: 0 });
    const mapRef = useRef(null);
    const selectedGenusRef = useRef(selectedGenus);
    const genusTypeRef = useRef(genusType);

    useEffect(() => {
        selectedGenusRef.current = selectedGenus;
        genusTypeRef.current = genusType;
    }, [selectedGenus, genusType]);

    const fetchDataForMap = () => {
        if (!mapRef.current) return;
    
        const map = mapRef.current;
        const bounds = map.getBounds();
        const minLng = bounds.getWest();
        const minLat = bounds.getSouth();
        const maxLng = bounds.getEast();
        const maxLat = bounds.getNorth();
        let url = `https://575qjd8cuk.execute-api.us-east-1.amazonaws.com/prod/trees/search?min_lat=${minLat}&max_lat=${maxLat}&min_lng=${minLng}&max_lng=${maxLng}&limit=10000&return_all=false&count=true&count_only=false`;
    
        if (genusTypeRef.current && selectedGenusRef.current) {
            url += `&${genusTypeRef.current.value}=${selectedGenusRef.current}`;
        }
    
        fetch(url)
            .then(response => response.json())
            .then(fetchedData => {
                setInfo({ count: fetchedData.count, limit: fetchedData.limit });
                if (!map.isStyleLoaded()) return; // Ensure the map's style is loaded
    
                // Adjust circle size based on zoom level
                const zoom = map.getZoom();
                const circleSize = zoom < 5 ? 4 : zoom < 10 ? 8 : 12;
                
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
                            'circle-radius': circleSize,
                            'circle-color': '#000000'
                        }
                    });
                }
            });
    };
    

    useEffect(() => {
        mapRef.current = new maplibregl.Map({
            container: 'map',
            style: 'https://api.maptiler.com/maps/streets/style.json?key=6jk9aonLicRFoRqvljrc',
            center: [-106.3468, 56.1304],
            zoom: 4,
        });

        mapRef.current.on('load', () => {
            fetchDataForMap();
            fetch('https://575qjd8cuk.execute-api.us-east-1.amazonaws.com/prod/data/overview')
                .then(response => response.json())
                .then(overviewData => setData(overviewData));
        });

        mapRef.current.on('moveend', fetchDataForMap);

        return () => mapRef.current.remove();
    }, []); 

    useEffect(() => {
        fetchDataForMap();
    }, [genusType, selectedGenus]);

    const options = [
        { value: 'botanical_genus', label: 'Botanical Genus', key: 'botanical_name_genus' },
        { value: 'common_genus', label: 'Common Genus', key: 'common_genus' }
    ];

    const genusOptions = genusType ? data[genusType.key].filter(name => name && name.trim() !== '').map(name => ({ value: name, label: name })) : [];

    return (
        <div style={{ display: 'flex' }}>
            <div style={{ width: '20%', overflowY: 'auto', maxHeight: '100vh', borderRight: '1px solid gray' }}>
                <Select
                    options={options}
                    onChange={(selectedOption) => setGenusType(selectedOption)}
                    placeholder="Select a genus type..."
                    isSearchable
                />
                <Select
                    options={genusOptions}
                    onChange={(selectedOption) => setSelectedGenus(selectedOption.value)}
                    placeholder={`Select a ${genusType ? genusType.label : ''}...`}
                    isSearchable
                    isDisabled={!genusType}
                />
            </div>
            <div id="map" style={{ flex: 1, height: '100vh' }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    padding: '5px',
                    borderRadius: '3px',
                    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.3)'
                }}>
                    <p><strong>Limit:</strong> {info.limit}</p>
                    <p><strong>Count:</strong> {info.count}</p>
            </div>
        </div>
    );
}

export default MapComponent;

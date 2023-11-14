import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapComponent.css'; 
import Select from 'react-select';
import logo from './assets/tree-map-high-white.png'; 

function MapComponent() {
    const [data, setData] = useState({});
    const [genusType, setGenusType] = useState(null);
    const [selectedGenus, setSelectedGenus] = useState(null);
    const [selectedTree, setSelectedTree] = useState(null);
    const [speciesType, setSpeciesType] = useState(null);
    const [selectedSpecies, setSelectedSpecies] = useState(null);
    const [info, setInfo] = useState({ count: 0 });
    const [zoomLevel, setZoomLevel] = useState(10);
    const mapRef = useRef(null);
    const selectedGenusRef = useRef(selectedGenus);
    const genusTypeRef = useRef(genusType);
    const selectedSpeciesRef = useRef(selectedSpecies);
    const mapStyles = [
        { value: 'https://api.maptiler.com/maps/outdoor/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Outdoor' },
        { value: 'https://api.maptiler.com/maps/streets/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Streets' },
        { value: 'https://api.maptiler.com/maps/basic/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Basic' },
        { value: 'https://api.maptiler.com/maps/darkmatter/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Dark Matter' },
        { value: 'https://api.maptiler.com/maps/positron/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Positron' },
        { value: 'https://api.maptiler.com/maps/pastel/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Pastel' },
        { value: 'https://api.maptiler.com/maps/topo/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Topo' },
        { value: 'https://api.maptiler.com/maps/hybrid/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Hybrid' },
        { value: 'https://api.maptiler.com/maps/satellite/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Satellite' },
        { value: 'https://api.maptiler.com/maps/voyager/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Voyager' },
        { value: 'https://api.maptiler.com/maps/toner/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Toner' },
        { value: 'https://api.maptiler.com/maps/backdrop/style.json?key=6jk9aonLicRFoRqvljrc', label: 'Backdrop' }
    ];
    const provinces = [
        { value: 'Alberta', label: 'Alberta' },
        { value: 'British Columbia', label: 'British Columbia' },
        { value: 'Nova Scotia', label: 'Nova Scotia' },
        { value: 'Ontario', label: 'Ontario' },
        { value: 'Quebec', label: 'Quebec' },
    ];

    const provinceCoordinates = {
        'Alberta': [-113.8147, 52.2681],
        'British Columbia': [-121.9526, 50.9892],
        'Nova Scotia': [-63.57, 44.65],
        'Ontario': [-80.9937, 44.4917],
        "Quebec": [-71.2002, 46.8129],
    };

    const hardcodedSpecies = {
        'Acer': [
            { value: 'Acer pseudoplatanus', label: 'Acer pseudoplatanus' },
            { value: 'Acer platanoides', label: 'Acer platanoides' },
            // Add more species as needed
        ],
        'Maple': [
            { value: 'Red maple', label: 'Red Maple' },
            { value: 'Sugar maple', label: 'Sugar Maple' },
            // Add more species as needed
        ],
    };

    const MARGIN = 100;

    const handleProvinceSelect = (selectedOption) => {
        const coords = provinceCoordinates[selectedOption.value];
        if (coords && mapRef.current) {
            mapRef.current.flyTo({
                center: coords,
                zoom: 5.8 // Adjust zoom level as needed
            });
        }
    };
    
    useEffect(() => {
        selectedGenusRef.current = selectedGenus;
        genusTypeRef.current = genusType;
        selectedSpeciesRef.current = selectedSpecies;
    }, [selectedGenus, genusType, selectedSpecies]);

    const fetchDataForMap = () => {
        if (!mapRef.current) return;
    
        const map = mapRef.current;
        const topLeft = map.unproject([MARGIN, MARGIN]);
        const bottomRight = map.unproject([map.getContainer().clientWidth - MARGIN, map.getContainer().clientHeight - MARGIN]);

        const bounds = new maplibregl.LngLatBounds(topLeft, bottomRight);

        const minLng = bounds.getWest();
        const minLat = bounds.getSouth();
        const maxLng = bounds.getEast();
        const maxLat = bounds.getNorth();
        const returnAll = map.getZoom() > 15 ? 'true' : 'false';  // Check the zoom level here
        
        let url = `https://575qjd8cuk.execute-api.us-east-1.amazonaws.com/prod/trees/search?min_lat=${minLat}&max_lat=${maxLat}&min_lng=${minLng}&max_lng=${maxLng}&limit=10000&return_all=${returnAll}&count=true&count_only=false`;

        if (genusTypeRef.current && selectedGenusRef.current) {
            url += `&${genusTypeRef.current.value}=${selectedGenusRef.current}`;
        }

        if (selectedSpeciesRef.current) { // Add this check for selected species
            url += `&${genusTypeRef.current.value === 'botanical_genus' ? 'botanical_species' : 'common_species'}=${encodeURIComponent(selectedSpeciesRef.current)}`;
        }

        console.log(url);
    
        fetch(url)
            .then(response => response.json())
            .then(fetchedData => {
                setInfo({ count: fetchedData.count });
                if (!map.isStyleLoaded()) return; // Ensure the map's style is loaded
    
                // Adjust circle size based on zoom level
                const zoom = map.getZoom();
                const circleSize = zoom < 5 ? 3 : zoom < 12 ? 7 : 9;
                
                if (map.getSource('points')) {
                    map.getSource('points').setData(fetchedData);
                } else {
                    map.addSource('points', {
                        'type': 'geojson',
                        'data': fetchedData,
                        'cluster': true,
                        'clusterMaxZoom': 16, // Max zoom to cluster points
                        'clusterRadius': 50 // Radius of each cluster
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

                    // Display clusters by circle layer
                    map.addLayer({
                        id: 'clusters',
                        type: 'circle',
                        source: 'points',
                        filter: ['has', 'point_count'],
                        paint: {
                            'circle-color': [
                                'step',
                                ['get', 'point_count'],
                                '#51bbd6',
                                100,
                                '#f1f075',
                                750,
                                '#f28cb1'
                            ],
                            'circle-radius': [
                                'step',
                                ['get', 'point_count'],
                                20,
                                100,
                                30,
                                750,
                                40
                            ]
                        }
                    });

                    // Display the number of points in each cluster
                    map.addLayer({
                        id: 'cluster-count',
                        type: 'symbol',
                        source: 'points',
                        filter: ['has', 'point_count'],
                        layout: {
                            'text-field': '{point_count_abbreviated}',
                            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                            'text-size': 12
                        }
                    });

                    // Display points that aren't part of a cluster
                    map.addLayer({
                        id: 'unclustered-points',
                        type: 'circle',
                        source: 'points',
                        filter: ['!', ['has', 'point_count']],
                        paint: {
                            'circle-color': '#000000',
                            'circle-radius': 4,
                            'circle-stroke-width': 1,
                            'circle-stroke-color': '#fff'
                        }
                    });

                    // After you've added the layers...

                    map.on('click', 'clusters', function (e) {
                        const features = map.queryRenderedFeatures(e.point, {
                            layers: ['clusters']
                        });
                        const clusterId = features[0].properties.cluster_id;
                        map.getSource('points').getClusterExpansionZoom(clusterId, function (err, zoom) {
                            if (err) return;

                            map.flyTo({
                                center: features[0].geometry.coordinates,
                                zoom: zoom
                            });
                        });
                    });          
                }
            });
    };

    const onGenusTypeChange = (selectedOption) => {
        setGenusType(selectedOption);
        setSelectedGenus(null);
        setSelectedSpecies(null);
        setSpeciesType(null);
    };
    
    // const onGenusChange = (selectedOption) => {
    //     setSelectedGenus(selectedOption.value);
    //     setSelectedSpecies(null);
    //     setSpeciesType(genusType); // This line might need adjustment based on your API structure

    //     // Check if the selected genus is "Acer" or "Maple" and set hardcoded species
    //     if (selectedOption.value === 'Acer' || selectedOption.value === 'Maple') {
    //         setData(prevData => ({
    //             ...prevData,
    //             'species': hardcodedSpecies[selectedOption.value]
    //         }));
    //     } else {
    //         // Fetch species for other genera
    //         // Your existing code for fetching species from API can be placed here
    //     }
    // };

    const onGenusChange = (selectedOption) => {
        setSelectedGenus(selectedOption.value);
        setSelectedSpecies(null);
        setSpeciesType(genusType); // This line might need adjustment based on your API structure
    
        // Always use hardcoded species for now
        setData(prevData => ({
            ...prevData,
            'species': hardcodedSpecies[selectedOption.value] || []
        }));
    };

    useEffect(() => {
        mapRef.current = new maplibregl.Map({
            container: 'map',
            style: 'https://api.maptiler.com/maps/outdoor/style.json?key=6jk9aonLicRFoRqvljrc',
            center: [-123.1216, 49.2827],
            zoom: 10,
        });

        const nav = new maplibregl.NavigationControl();
        mapRef.current.addControl(nav, 'bottom-right');

        mapRef.current.on('load', () => {
            fetchDataForMap();
            fetch('https://575qjd8cuk.execute-api.us-east-1.amazonaws.com/prod/data/overview')
                .then(response => response.json())
                .then(overviewData => setData(overviewData));

            // Update zoom level state when the map moves
            mapRef.current.on('moveend', () => {
                setZoomLevel(mapRef.current.getZoom().toFixed(2));
            });

            mapRef.current.on('click', 'points', (e) => {
                if (mapRef.current.getZoom() > 15) {
                    const treeData = e.features[0].properties; 
                    console.log(e.features[0]);
                    e.preventDefault();
                    setSelectedTree(treeData);
                }
            });

            mapRef.current.on('click', 'clusters', function (e) {
                const features = mapRef.current.queryRenderedFeatures(e.point, {
                    layers: ['clusters']
                });
                const clusterId = features[0].properties.cluster_id;
                mapRef.current.getSource('points').getClusterExpansionZoom(clusterId, function (err, zoom) {
                    if (err) return;
            
                    mapRef.current.flyTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                });
            });

            // Add cursor styling for clusters
            mapRef.current.on('mouseenter', 'clusters', function () {
                mapRef.current.getCanvas().style.cursor = 'pointer';
            });
            
            mapRef.current.on('mouseleave', 'clusters', function () {
                mapRef.current.getCanvas().style.cursor = '';
            });

        });

        mapRef.current.on('moveend', fetchDataForMap);

        return () => mapRef.current.remove();
    }, []); 

    useEffect(() => {
        fetchDataForMap();
    }, [genusType, selectedGenus, selectedSpecies]);

    const options = [
        { value: 'botanical_genus', label: 'Botanical Genus', key: 'botanical_name_genus' },
        { value: 'common_genus', label: 'Common Genus', key: 'common_genus' }
    ];

    const genusOptions = genusType && data[genusType.key] 
        ? data[genusType.key].filter(name => name && name.trim() !== '').map(name => ({ value: name, label: name }))
        : [];

    const speciesOptions = selectedGenus && data['species']
        ? data['species']
        : [];

    // const speciesOptions = [
    //     { value: 'species1', label: 'Species 1' },
    //     { value: 'species2', label: 'Species 2' },
    //     { value: 'species3', label: 'Species 3' },
    // ];

    return (
        <div style={{ position: 'relative', height: '100vh' }}>
            <div className="left-sidebar">
            {/* Logo Box */}
            <div className="logo-box">
                <img src={logo} alt="Logo" className="logo" />
            </div>
            
            {/* Genus Selectors */}
            
                <div className="selection-menus">
                    <Select
                        options={options}
                        onChange={onGenusTypeChange}
                        placeholder="Select a genus type..."
                        isSearchable
                    />
                    <Select
                        options={genusOptions}
                        onChange={onGenusChange}
                        placeholder="Select a genus..."
                        isSearchable
                        isDisabled={!genusType}
                    />
                    <Select
                        options={speciesOptions}
                        onChange={(selectedOption) => setSelectedSpecies(selectedOption.value)}
                        placeholder="Select a species..."
                        isSearchable
                        isDisabled={!selectedGenus}
                    />

                    {/* Province Selector */}
                    <Select
                        options={provinces}
                        onChange={handleProvinceSelect}
                        placeholder="Select a province..."
                    />
                </div>
            </div>
            
            {/* Main map area */}
            <div id="map" style={{ width: '100%', height: '100%' }}></div>
        
            {/* Map style selector */}
            <Select
                options={mapStyles}
                defaultValue={mapStyles[0]}
                onChange={(selectedOption) => {
                    if (mapRef.current) {
                        mapRef.current.setStyle(selectedOption.value);
                    }
                }}
                isSearchable={false}
                className="map-style-selector"
            />
            <div className="info-box">
            {/* Info box at the bottom left */}
                <p><strong>Count:</strong> {info.count}</p>
                <p><strong>Zoom:</strong> {zoomLevel}</p>
                {selectedTree && (
                    <div>
                        {/* <p><strong>Tree Id:</strong> {selectedTree.Id}</p> 
                        <p><strong>Address:</strong> {selectedTree.Address}</p>
                        <p><strong>DBH (CM):</strong> {selectedTree['DBH (DHP) (CM)']}</p> */}
                        <p><strong>Common Species:</strong> {selectedTree['Common Species']}</p>
                        <p><strong>Botanical Species:</strong> {selectedTree['Botanical Name Species']}</p>
                    </div>
                )}
            </div>
        </div>
    );
    
    
}

export default MapComponent;

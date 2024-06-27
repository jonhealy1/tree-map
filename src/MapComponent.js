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
    const [info, setInfo] = useState({ count: 0 });
    const [zoomLevel, setZoomLevel] = useState(11);
    const mapRef = useRef(null);
    const selectedGenusRef = useRef(selectedGenus);
    const genusTypeRef = useRef(genusType);

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

    const MARGIN = 100;

    const handleProvinceSelect = (selectedOption) => {
        const coords = provinceCoordinates[selectedOption.value];
        if (coords && mapRef.current) {
            mapRef.current.flyTo({ center: coords, zoom: 6 });
        }
    };

    useEffect(() => {
        selectedGenusRef.current = selectedGenus;
        genusTypeRef.current = genusType;
    }, [selectedGenus, genusType]);

    const fetchDataForMap = async () => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        const topLeft = map.unproject([MARGIN, MARGIN]);
        const bottomRight = map.unproject([map.getContainer().clientWidth - MARGIN, map.getContainer().clientHeight - MARGIN]);
        const bounds = new maplibregl.LngLatBounds(topLeft, bottomRight);

        const minLng = bounds.getWest();
        const minLat = bounds.getSouth();
        const maxLng = bounds.getEast();
        const maxLat = bounds.getNorth();
        const returnAll = map.getZoom() > 15 ? 'true' : 'false';

        let url = `https://5p9hyrnb5a.execute-api.us-east-1.amazonaws.com/prod/trees/search?min_lat=${minLat}&max_lat=${maxLat}&min_lng=${minLng}&max_lng=${maxLng}&limit=30000&return_all=${returnAll}&count=true&count_only=false`;
        if (genusTypeRef.current && selectedGenusRef.current) {
            url += `&${genusTypeRef.current.value}=${selectedGenusRef.current}`;
        }

        try {
            const response = await fetch(url);
            const fetchedData = await response.json();
            setInfo({ count: fetchedData.count });
            if (!map.isStyleLoaded()) return;

            const zoom = map.getZoom();
            const circleSize = zoom < 5 ? 3 : zoom < 12 ? 7 : 9;

            if (map.getSource('points')) {
                map.getSource('points').setData(fetchedData);
            } else {
                map.addSource('points', {
                    'type': 'geojson',
                    'data': fetchedData,
                    'cluster': true,
                    'clusterMaxZoom': 16,
                    'clusterRadius': 50,
                });

                map.addLayer({
                    'id': 'points',
                    'type': 'circle',
                    'source': 'points',
                    'paint': {
                        'circle-radius': circleSize,
                        'circle-color': '#000000',
                    },
                });

                map.addLayer({
                    'id': 'clusters',
                    'type': 'circle',
                    'source': 'points',
                    'filter': ['has', 'point_count'],
                    'paint': {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#51bbd6',
                            100,
                            '#f1f075',
                            750,
                            '#f28cb1',
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,
                            100,
                            30,
                            750,
                            40,
                        ],
                    },
                });

                map.addLayer({
                    'id': 'cluster-count',
                    'type': 'symbol',
                    'source': 'points',
                    'filter': ['has', 'point_count'],
                    'layout': {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12,
                    },
                });

                map.addLayer({
                    'id': 'unclustered-points',
                    'type': 'circle',
                    'source': 'points',
                    'filter': ['!', ['has', 'point_count']],
                    'paint': {
                        'circle-color': '#000000',
                        'circle-radius': 4,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff',
                    },
                });

                map.on('click', 'clusters', function (e) {
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: ['clusters'],
                    });
                    const clusterId = features[0].properties.cluster_id;
                    map.getSource('points').getClusterExpansionZoom(clusterId, function (err, zoom) {
                        if (err) return;

                        map.flyTo({ center: features[0].geometry.coordinates, zoom: zoom });
                    });
                });

                map.on('click', 'points', (e) => {
                    if (map.getZoom() > 15) {
                        const treeData = e.features[0].properties;
                        setSelectedTree(treeData);
                    }
                });

                map.on('mouseenter', 'clusters', function () {
                    map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', 'clusters', function () {
                    map.getCanvas().style.cursor = '';
                });
            }
        } catch (error) {
            console.error("Failed to fetch map data:", error);
        }
    };

    const fetchOverviewData = async () => {
        let url = 'https://5p9hyrnb5a.execute-api.us-east-1.amazonaws.com/prod/data/overview';
        if (genusTypeRef.current) {
            url += `?${genusTypeRef.current.value}=true`;
        }
        try {
            const response = await fetch(url);
            const overviewData = await response.json();
            setData(overviewData);
        } catch (error) {
            console.error("Failed to fetch overview data:", error);
        }
    };

    useEffect(() => {
        const map = new maplibregl.Map({
            container: 'map',
            style: 'https://api.maptiler.com/maps/outdoor/style.json?key=6jk9aonLicRFoRqvljrc',
            center: [-123.1216, 49.2827],
            zoom: 11,
        });
        mapRef.current = map;

        const nav = new maplibregl.NavigationControl();
        map.addControl(nav, 'bottom-right');

        map.on('load', async () => {
            await fetchDataForMap();
            await fetchOverviewData();

            map.on('moveend', () => {
                setZoomLevel(map.getZoom().toFixed(2));
                fetchDataForMap();
            });
        });

        return () => map.remove();
    }, []);

    useEffect(() => {
        fetchDataForMap();
    }, [genusType, selectedGenus]);

    useEffect(() => {
        fetchOverviewData();
    }, [genusType]);

    const options = [
        { value: 'botanical_name_genus', label: 'Botanical Genus', key: 'botanical_name_genus' },
        { value: 'common_genus', label: 'Common Genus', key: 'common_genus' },
    ];

    const genusOptions = genusType && data[genusType.key]
        ? data[genusType.key].filter(name => name && name.trim() !== '').map(name => ({ value: name, label: name }))
        : [];

    return (
        <div style={{ position: 'relative', height: '100vh' }}>
            <div className="left-sidebar">
                <div className="logo-box">
                    <img src={logo} alt="Logo" className="logo" />
                </div>
                <div className="selection-menus">
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
                    <Select
                        options={provinces}
                        onChange={handleProvinceSelect}
                        placeholder="Select a province..."
                    />
                </div>
            </div>
            <div id="map" style={{ width: '100%', height: '100%' }}></div>
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
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                padding: '5px',
                borderRadius: '3px',
                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.3)',
            }}>
                <p><strong>Count:</strong> {info.count}</p>
                <p><strong>Zoom Level:</strong> {zoomLevel}</p>
                {selectedTree && (
                    <div>
                        <p><strong>Tree Id:</strong> {selectedTree.Id}</p>
                        <p><strong>Address:</strong> {selectedTree.Address}</p>
                        <p><strong>DBH (CM):</strong> {selectedTree['DBH (DHP) (CM)']}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MapComponent;

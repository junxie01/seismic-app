export const getLeafletHtml = (earthquakeData = []) => {
  const initialData = JSON.stringify(earthquakeData);
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; background: #f4f4f4; }
        #map { height: 100vh; width: 100vw; }
        .leaflet-control-attribution { display: none; }
        .leaflet-control-zoom { right: 10px; top: 10px; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', {
            center: [35, 105],
            zoom: 4,
            zoomControl: true
        });

        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1', '2', '3', '4'],
            minZoom: 3,
            maxZoom: 18
        }).addTo(map);

        var earthquakeMarkers = [];
        var initialData = ${initialData};

        function getColor(mag) {
            if (mag >= 6.0) return '#FF3B30';
            if (mag >= 5.0) return '#FF9500';
            return '#34C759';
        }

        function renderEarthquakes(features) {
            earthquakeMarkers.forEach(function(marker) {
                map.removeLayer(marker);
            });
            earthquakeMarkers = [];
            
            if (!features || !Array.isArray(features) || features.length === 0) {
                return;
            }

            features.forEach(function(feat) {
                try {
                    if (!feat.geometry || !feat.geometry.coordinates || feat.geometry.coordinates.length < 2) {
                        return;
                    }
                    
                    var lng = feat.geometry.coordinates[0];
                    var lat = feat.geometry.coordinates[1];
                    var mag = (feat.properties && feat.properties.mag) || 0;
                    var place = (feat.properties && feat.properties.place) || '';
                    
                    var circle = L.circle([lat, lng], {
                        radius: mag * 25000,
                        fillColor: getColor(mag),
                        color: '#ffffff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.7
                    });
                    
                    circle.bindPopup('<b>M ' + mag + '</b><br/>' + place);
                    
                    circle.on('click', function() {
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'SELECT_EVENT',
                                payload: feat
                            }));
                        }
                    });
                    
                    circle.addTo(map);
                    earthquakeMarkers.push(circle);
                } catch (e) {
                    console.error('Error:', e);
                }
            });
            
            if (earthquakeMarkers.length > 0) {
                var group = L.featureGroup(earthquakeMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        }

        if (initialData && initialData.length > 0) {
            renderEarthquakes(initialData);
        }

        function handleMessage(event) {
            try {
                var message = JSON.parse(event.data);
                if (message.type === 'render_earthquakes') {
                    renderEarthquakes(message.data);
                }
            } catch (e) {
                console.error('Message error:', e);
            }
        }

        window.addEventListener('message', handleMessage);
        
        setTimeout(function() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
            }
        }, 1500);
    </script>
</body>
</html>
`;
};

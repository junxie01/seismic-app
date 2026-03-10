import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const SimpleMapComponent = ({ style, earthquakes = [] }) => {
  const mapData = earthquakes.map(e => {
    try {
      const place = e.properties.place || '未知位置';
      const time = e.properties.time ? new Date(e.properties.time).toLocaleString() : '未知时间';
      return {
        lat: e.geometry.coordinates[1],
        lng: e.geometry.coordinates[0],
        mag: e.properties.mag || e.properties.magnitude || 0,
        place: place.replace(/'/g, "\\'"),
        time: time
      };
    } catch (err) {
      console.error('Error mapping earthquake data:', err);
      return {
        lat: 0,
        lng: 0,
        mag: 0,
        place: '数据错误',
        time: '未知'
      };
    }
  }).filter(item => !isNaN(item.lat) && !isNaN(item.lng));

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://lib.baomitu.com/leaflet/1.9.4/leaflet.css" />
      <script src="https://lib.baomitu.com/leaflet/1.9.4/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; background: #F2F2F7; }
        #map { height: 100vh; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          try {
            const map = L.map('map', { 
              zoomControl: true, 
              attributionControl: false,
              dragging: true,
              touchZoom: true,
              scrollWheelZoom: true
            }).setView([20, 100], 3);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19
            }).addTo(map);
            
            const data = ${JSON.stringify(mapData)};
            if (data && data.length > 0) {
              data.forEach(function(item) {
                if (!isNaN(item.lat) && !isNaN(item.lng)) {
                  const color = item.mag >= 6.0 ? '#FF3B30' : (item.mag >= 5.0 ? '#FF9500' : '#34C759');
                  const marker = L.circleMarker([item.lat, item.lng], {
                    color: color, 
                    fillColor: color, 
                    fillOpacity: 0.6, 
                    weight: 1.5, 
                    radius: Math.max(5, Math.min(20, item.mag * 2.5))
                  }).bindPopup("<b>" + item.mag + " 级</b><br>" + item.place + "<br>" + item.time);
                  marker.addTo(map);
                }
              });
            }
          } catch (e) {
            console.error('Map initialization error:', e);
          }
        }, false);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
        scrollEnabled={true}
        javaScriptEnabledAndroid={true}
        mixedContentMode="always"
        androidHardwareAccelerationDisabled={false}
        onError={(syntheticEvent) => {
          console.error('WebView error:', syntheticEvent.nativeEvent);
        }}
        onMessage={(event) => {
          console.log('WebView message:', event.nativeEvent.data);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  map: { flex: 1 }
});

export default SimpleMapComponent;

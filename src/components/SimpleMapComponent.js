import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const SimpleMapComponent = ({ style, earthquakes = [] }) => {
  // 转换地震数据为地图可读格式
  const mapData = earthquakes.map(e => ({
    lat: e.geometry.coordinates[1],
    lng: e.geometry.coordinates[0],
    mag: e.properties.mag || e.properties.magnitude || 0,
    place: e.properties.place.replace(/'/g, "\\'"),
    time: new Date(e.properties.time).toLocaleString()
  }));

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
        .leaflet-popup-content-wrapper { border-radius: 10px; padding: 5px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        window.onload = function() {
          // 初始化全球地图
          const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([20, 100], 3);

          // 使用完全免费的 OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          const data = ${JSON.stringify(mapData)};
          data.forEach(item => {
            const color = item.mag >= 6.0 ? '#FF3B30' : (item.mag >= 5.0 ? '#FF9500' : '#34C759');
            const marker = L.circleMarker([item.lat, item.lng], {
              color: color, fillColor: color, fillOpacity: 0.5, weight: 1,
              radius: Math.max(6, item.mag * 2.5)
            }).addTo(map);

            marker.bindPopup("<b>" + item.mag + " 级地震</b><br>" + item.place + "<br><small>" + item.time + "</small>");
          });
        };
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
        androidHardwareAccelerationDisabled={false} // 启用硬件加速解决 Android 不渲染问题
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', overflow: 'hidden' },
  map: { flex: 1 }
});

export default SimpleMapComponent;

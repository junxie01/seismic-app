import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

// 对于原生Android平台，使用WebView渲染地图
const MapViewComponent = ({ 
  style, 
  initialRegion, 
  children,
  onRegionChange,
  ...props 
}) => {
  const childrenArray = React.Children.toArray(children);

  // 生成地图HTML
  const generateMapHTML = () => {
    const markers = childrenArray.map(child => {
      if (!child || !child.props) return null;
      const { coordinate, title, magnitude, time, place } = child.props;
      return {
        lat: coordinate.latitude,
        lng: coordinate.longitude,
        title: title || magnitude?.toString() || '地震',
        magnitude: magnitude || 0,
        time: time || '',
        place: place || '',
      };
    }).filter(Boolean);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://lib.baomitu.com/leaflet/1.9.4/leaflet.css" />
        <script src="https://lib.baomitu.com/leaflet/1.9.4/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; }
          body { background: #F2F2F7; }
          #map { height: 100vh; width: 100vw; }
          .info { 
            padding: 8px 12px; 
            font-size: 12px; 
            max-width: 200px;
            line-height: 1.4;
          }
          .info-title { 
            font-weight: bold; 
            margin-bottom: 4px; 
            color: #333;
          }
          .info-detail { 
            color: #666; 
            margin: 2px 0;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          window.onload = function() {
            // 初始化地图中心
            const centerLat = ${initialRegion?.latitude || 20};
            const centerLng = ${initialRegion?.longitude || 100};
            const zoomLevel = ${initialRegion?.latitudeDelta ? Math.max(2, Math.round(10 - Math.log2(initialRegion.latitudeDelta))) : 3};
            
            const map = L.map('map', { 
              zoomControl: true, 
              attributionControl: false,
              dragging: true,
              touchZoom: true,
              scrollWheelZoom: true
            }).setView([centerLat, centerLng], zoomLevel);
            
            // 使用OpenStreetMap瓦片
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // 添加标记
            const markers = ${JSON.stringify(markers)};
            markers.forEach(item => {
              const magnitude = item.magnitude || 0;
              let color = '#34C759'; // 绿色 (弱地震)
              if (magnitude >= 6.0) {
                color = '#FF3B30'; // 红色 (强地震)
              } else if (magnitude >= 5.0) {
                color = '#FF9500'; // 橙色 (中等地震)
              } else if (magnitude >= 4.0) {
                color = '#FFCC00'; // 黄色 (较弱地震)
              }
              
              const popup = "<div class='info'>" +
                "<div class='info-title'>" + magnitude + " 级地震</div>" +
                "<div class='info-detail'><strong>位置:</strong> " + item.place + "</div>" +
                "<div class='info-detail'><strong>时间:</strong> " + item.time.substring(0, 16) + "</div>" +
                "</div>";
              
              L.circleMarker([item.lat, item.lng], {
                color: color, 
                fillColor: color, 
                fillOpacity: 0.6, 
                weight: 1.5, 
                radius: Math.max(5, Math.min(20, magnitude * 2))
              }).addTo(map).bindPopup(popup);
            });
          };
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        scalesPageToFit={true}
        scrollEnabled={true}
        startInLoadingState={true}
        javaScriptEnabled={true}
        injectedJavaScript="true;"
      />
    </View>
  );
};

// Marker component for MapView
const MarkerComponent = ({ 
  coordinate, 
  title, 
  magnitude,
  time,
  place,
  children,
  onPress 
}) => {
  // Marker data is handled in parent MapView component
  return null;
};

export const MapView = MapViewComponent;
export const Marker = MarkerComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  webview: {
    flex: 1,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 动态导入react-native-maps
let MapView, Marker;
try {
  console.log('Attempting to import react-native-maps...');
  const RNMaps = require('react-native-maps');
  console.log('react-native-maps imported successfully:', RNMaps);
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
  console.log('MapView and Marker assigned:', !!MapView, !!Marker);
} catch (error) {
  console.error('Error importing react-native-maps:', error);
  MapView = null;
  Marker = null;
}

const TestMap = () => {
  // 检查MapView是否可用
  console.log('MapView and Marker availability:', !!MapView, !!Marker);
  
  if (!MapView || !Marker) {
    console.log('MapView or Marker not available, showing placeholder');
    return (
      <View style={styles.mapPlaceholder}>
        <Ionicons name="earth-outline" size={80} color="#007AFF" />
        <Text style={styles.mapPlaceholderText}>地图功能暂时不可用</Text>
        <Text style={styles.mapPlaceholderSubtext}>当前平台不支持地图显示</Text>
      </View>
    );
  }

  try {
    console.log('Rendering map...');
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 39.9042,
            longitude: 116.4074,
            latitudeDelta: 10,
            longitudeDelta: 10,
          }}
          onLoad={() => {
            console.log('Map loaded successfully');
          }}
          onError={(error) => {
            console.error('Map error:', error);
          }}
        >
          <Marker
            coordinate={{ latitude: 39.9042, longitude: 116.4074 }}
            title="北京"
            description="中国首都"
          />
        </MapView>
      </View>
    );
  } catch (error) {
    console.error('Map component error:', error);
    return (
      <View style={styles.mapPlaceholder}>
        <Ionicons name="earth-outline" size={80} color="#007AFF" />
        <Text style={styles.mapPlaceholderText}>地图加载失败</Text>
        <Text style={styles.mapPlaceholderSubtext}>{error.message}</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  mapPlaceholderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  mapPlaceholderSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default TestMap;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 动态导入react-native-maps
let MapView, Marker;

try {
  console.log('Attempting to import react-native-maps in StationMapScreen...');
  const RNMaps = require('react-native-maps');
  console.log('react-native-maps imported successfully:', RNMaps);
  
  // 尝试不同的导出方式
  MapView = RNMaps.default || RNMaps.MapView;
  Marker = RNMaps.Marker;
  
  console.log('MapView and Marker assigned:', !!MapView, !!Marker);
} catch (error) {
  console.error('Error importing react-native-maps:', error);
  MapView = null;
  Marker = null;
}

// Mock station data for testing
const mockStations = [
  {
    geometry: { coordinates: [-122.4194, 37.7749] },
    properties: { code: 'SF', network: 'US', site: 'San Francisco' }
  },
  {
    geometry: { coordinates: [-118.2437, 34.0522] },
    properties: { code: 'LA', network: 'US', site: 'Los Angeles' }
  },
  {
    geometry: { coordinates: [138.2529, 36.2048] },
    properties: { code: 'TK', network: 'JP', site: 'Tokyo' }
  },
  {
    geometry: { coordinates: [104.0665, 30.5728] },
    properties: { code: 'CD', network: 'CN', site: 'Chengdu' }
  },
  {
    geometry: { coordinates: [-74.0060, 40.7128] },
    properties: { code: 'NY', network: 'US', site: 'New York' }
  },
];

// From IRIS fetch station data function
const fetchStationData = async () => {
  try {
    // IRIS station service API
    const response = await fetch(
      'https://service.iris.edu/fdsnws/station/1/query?format=geojson&level=station&limit=1000'
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.features;
  } catch (error) {
    console.error('Error fetching station data:', error);
    // Return mock data if API fails
    return mockStations;
  }
};

export default function StationMapScreen() {
  const insets = useSafeAreaInsets();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadStationData = async () => {
    try {
      setError(null);
      const data = await fetchStationData();
      setStations(data);
    } catch (err) {
      setError('获取台站数据失败，显示模拟数据');
      // Use mock data on error
      setStations(mockStations);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStationData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStationData();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>正在加载台站数据...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 0,
          longitude: 0,
          latitudeDelta: 180,
          longitudeDelta: 360,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        {stations.map((station, index) => {
          const { coordinates } = station.geometry;
          const [longitude, latitude] = coordinates;
          const { code, network, site } = station.properties;
          
          return (
            <Marker
              key={index}
              coordinate={{ latitude, longitude }}
              title={`${network}.${code}`}
              description={site || '台站'}
            >
              <View style={styles.markerContainer}>
                <Ionicons name="radio-tower" size={12} color="white" style={{ position: 'absolute', top: 5, left: -6 }} />
              </View>
            </Marker>
          );
        })}
      </MapView>
      
      {error && (
        <View style={[styles.errorContainer, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={[styles.infoContainer, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.infoHeader}>
          <View style={styles.markerMini}>
            <Ionicons name="radio-tower" size={8} color="white" style={{ position: 'absolute', top: 4, left: -4 }} />
          </View>
          <Text style={styles.infoTitle}>台站分布</Text>
        </View>
        <Text style={styles.stationCount}>共 {stations.length} 个台站</Text>
        <Text style={styles.dataSource}>数据来源: IRIS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  markerContainer: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 17.32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    transform: [{ rotate: '180deg' }],
  },
  markerInner: {
    position: 'absolute',
    top: 6,
    left: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10.39,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerMini: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 13.86,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    transform: [{ rotate: '180deg' }],
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stationCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dataSource: {
    fontSize: 12,
    color: '#999',
  },
});

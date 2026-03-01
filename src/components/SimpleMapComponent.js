import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 尝试导入react-native-maps
let MapView, Marker;

try {
  console.log('Attempting to import react-native-maps...');
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

// 辅助函数
const getMagnitudeColor = (magnitude) => {
  if (magnitude >= 6.0) return '#FF3B30';
  if (magnitude >= 5.0) return '#FF9500';
  return '#34C759';
};

// 简单地图组件
const SimpleMapComponent = ({ 
  style, 
  initialRegion, 
  earthquakes = [], 
  onMarkerPress 
}) => {
  console.log('SimpleMapComponent props:', { style, initialRegion, earthquakesCount: earthquakes.length });
  console.log('MapView and Marker availability:', !!MapView, !!Marker);
  
  // 创建动画值
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // 启动闪烁动画
  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.5,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);
    
    const loop = Animated.loop(pulse);
    loop.start();
    
    return () => {
      loop.stop();
    };
  }, [pulseAnim]);
  
  // 获取最新地震的时间
  const getLatestEarthquakeTime = () => {
    if (earthquakes.length === 0) return 0;
    return Math.max(...earthquakes.map(e => e.properties.time || e.properties.timestamp || 0));
  };
  
  // 判断是否是最新的地震
  const isLatestEarthquake = (earthquake) => {
    const latestTime = getLatestEarthquakeTime();
    const earthquakeTime = earthquake.properties.time || earthquake.properties.timestamp || 0;
    return earthquakeTime === latestTime;
  };
  
  if (!MapView || !Marker) {
    console.log('MapView or Marker not available, showing placeholder');
    return (
      <View style={[styles.mapPlaceholder, style]}>
        <Ionicons name="earth-outline" size={80} color="#007AFF" />
        <Text style={styles.mapPlaceholderText}>地震分布地图</Text>
        <Text style={styles.mapPlaceholderSubtext}>当前平台不支持地图显示</Text>
        <Text style={styles.mapPlaceholderSubtext}>平台: {Platform.OS}</Text>
        {earthquakes.length > 0 && (
          <View style={styles.earthquakeInfo}>
            <Text style={styles.earthquakeCount}>已加载 {earthquakes.length} 条地震数据</Text>
            <Text style={styles.earthquakeStats}>
              最大震级: {Math.max(...earthquakes.map(e => e.properties.mag || e.properties.magnitude || 0))}
            </Text>
          </View>
        )}
      </View>
    );
  }

  try {
    // 转换初始区域
    const mapInitialRegion = initialRegion ? {
      latitude: initialRegion.latitude,
      longitude: initialRegion.longitude,
      latitudeDelta: initialRegion.latitudeDelta,
      longitudeDelta: initialRegion.longitudeDelta,
    } : {
      latitude: 39.9042,
      longitude: 116.4074,
      latitudeDelta: 10,
      longitudeDelta: 10,
    };

    console.log('Rendering simple map with', earthquakes.length, 'earthquakes');
    console.log('MapView initial region:', mapInitialRegion);

    return (
      <View style={[styles.mapContainer, style]}>
        <MapView
          style={styles.map}
          initialRegion={mapInitialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
        >
          {earthquakes.map((earthquake, index) => {
            try {
              const { geometry, properties } = earthquake;
              const [longitude, latitude] = geometry.coordinates;
              const magnitude = properties.mag || properties.magnitude || 0;
              const color = getMagnitudeColor(magnitude);
              const isLatest = isLatestEarthquake(earthquake);

              return (
                <Marker
                  key={`earthquake-${index}`}
                  coordinate={{ latitude, longitude }}
                  onPress={() => onMarkerPress && onMarkerPress(earthquake)}
                >
                  {isLatest ? (
                    <Animated.View style={[
                      styles.markerContainer, 
                      { 
                        backgroundColor: color + '80',
                        transform: [{ scale: pulseAnim }]
                      }
                    ]}>
                      <View style={[styles.markerInner, { backgroundColor: color }]} />
                    </Animated.View>
                  ) : (
                    <View style={[styles.markerContainer, { backgroundColor: color + '80' }]}>
                      <View style={[styles.markerInner, { backgroundColor: color }]} />
                    </View>
                  )}
                </Marker>
              );
            } catch (error) {
              console.error('Marker error:', error);
              return null;
            }
          })}
        </MapView>
      </View>
    );
  } catch (error) {
    console.error('Map component error:', error);
    return (
      <View style={[styles.mapPlaceholder, style]}>
        <Ionicons name="earth-outline" size={80} color="#007AFF" />
        <Text style={styles.mapPlaceholderText}>地图加载失败</Text>
        <Text style={styles.mapPlaceholderSubtext}>{error.message}</Text>
        <Text style={styles.mapPlaceholderSubtext}>平台: {Platform.OS}</Text>
        {earthquakes.length > 0 && (
          <Text style={styles.earthquakeCount}>已加载 {earthquakes.length} 条地震数据</Text>
        )}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  earthquakeInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  earthquakeCount: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  earthquakeStats: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  markerContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default SimpleMapComponent;
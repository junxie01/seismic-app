import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  map: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  mapErrorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  mapErrorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

let MapView = null;
let Marker = null;

// 定义降级组件
const FallbackMapView = ({ children, ...props }) => (
  <View style={[styles.map, props.style]}>
    <Text style={styles.mapErrorText}>地图功能暂不可用</Text>
    <Text style={styles.mapErrorSubtext}>请在移动设备上使用地图功能</Text>
  </View>
);

// 初始化降级组件
MapView = FallbackMapView;
Marker = () => null;

// 只有在非web平台上才尝试导入react-native-maps
if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
  } catch (error) {
    console.error('Error importing react-native-maps:', error);
    // 保持降级组件
  }
}

export { MapView, Marker };

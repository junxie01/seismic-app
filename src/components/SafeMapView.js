import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

// 定义降级组件
const FallbackMapView = ({ children, ...props }) => (
  <View style={[styles.map, props.style]}>
    <Text style={styles.mapErrorText}>地图功能暂不可用</Text>
    <Text style={styles.mapErrorSubtext}>请在移动设备上使用地图功能</Text>
  </View>
);

// 导出固定的降级组件
export const MapView = FallbackMapView;
export const Marker = () => null;

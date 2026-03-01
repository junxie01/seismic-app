import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 安全的地图组件实现
let MapViewComponent = null;
let MarkerComponent = null;

// 尝试导入react-native-maps
try {
  const RNMaps = require('react-native-maps');
  MapViewComponent = RNMaps.default;
  MarkerComponent = RNMaps.Marker;
} catch (error) {
  console.error('Error importing react-native-maps:', error);
  // 提供降级组件
  MapViewComponent = ({ children, ...props }) => (
    <View style={[styles.container, props.style]}>
      <Text style={styles.errorText}>地图加载失败</Text>
      <Text style={styles.errorSubtext}>请检查网络连接或重新安装应用</Text>
    </View>
  );
  MarkerComponent = () => null;
}

// 导出安全的组件
export const MapView = MapViewComponent;
export const Marker = MarkerComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { API_KEYS } from '../config/apiKeys';

// 安全的地图组件实现
let MapViewComponent = null;
let MarkerComponent = null;

// 检查是否有有效的高德地图API key
const hasValidAmapKey = () => {
  return API_KEYS.amap && API_KEYS.amap.apiKey && API_KEYS.amap.apiKey !== 'your_amap_api_key_here';
};

// 尝试导入react-native-amap3d
try {
  if (hasValidAmapKey()) {
    const RNAMap = require('react-native-amap3d');
    MapViewComponent = RNAMap.MapView;
    MarkerComponent = RNAMap.Marker;
  } else {
    throw new Error('高德地图API key未配置');
  }
} catch (error) {
  console.error('Error importing react-native-amap3d:', error);
  // 提供降级组件
  MapViewComponent = ({ children, ...props }) => (
    <View style={[styles.container, props.style]}>
      <Text style={styles.errorText}>地图功能需要配置API密钥</Text>
      <Text style={styles.errorSubtext}>请在config/apiKeys.js中设置有效的高德地图API key</Text>
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

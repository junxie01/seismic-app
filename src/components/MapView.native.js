import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';

// Safe MapView wrapper: delays mounting native map, provides error boundary and fallbacks
let MapViewComponent = null;
let MarkerComponent = null;
let CalloutComponent = null;
let _requireError = null;
try {
  if (Platform.OS === 'android') {
    // Prefer AMap on Android (better in China)
    const RNAMap = require('react-native-amap3d');
    MapViewComponent = RNAMap.MapView;
    MarkerComponent = RNAMap.Marker;
    CalloutComponent = RNAMap.Callout || null;
  } else {
    const RNMaps = require('react-native-maps');
    MapViewComponent = RNMaps.default;
    MarkerComponent = RNMaps.Marker;
    CalloutComponent = RNMaps.Callout;
  }
} catch (error) {
  console.warn('Preferred native map not available, falling back to web/mock MapView:', error?.message || error);
  _requireError = error;
  try {
    const WebMap = require('./MapView.web');
    MapViewComponent = WebMap.MapView;
    MarkerComponent = WebMap.Marker;
    CalloutComponent = WebMap.Callout || null;
    _requireError = null;
  } catch (webErr) {
    console.error('Fallback MapView.web also failed:', webErr);
  }
}

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('MapErrorBoundary caught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || '地图初始化出错';
      return (
        <View style={[styles.container, this.props.style]}>
          <Text style={styles.errorText}>地图加载失败</Text>
          <Text style={styles.errorSubtext}>{message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const SafeMapView = ({ children, style, ...props }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  if (_requireError) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>地图依赖缺失</Text>
        <Text style={styles.errorSubtext}>{_requireError.message || '请安装 react-native-maps'}</Text>
      </View>
    );
  }

  if (!ready || !MapViewComponent) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.errorSubtext, { marginTop: 8 }]}>正在准备地图...</Text>
      </View>
    );
  }

  return (
    <MapErrorBoundary style={style}>
      <MapViewComponent style={style} {...props}>
        {children}
      </MapViewComponent>
    </MapErrorBoundary>
  );
};

export const MapView = SafeMapView;
export const Marker = MarkerComponent || (() => null);
export const Callout = typeof CalloutComponent !== 'undefined' ? CalloutComponent : (() => null);

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

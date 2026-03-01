import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Web implementation - use a simple view with map-like appearance
export const MapView = ({ children, style, initialRegion }) => {
  const childrenArray = React.Children.toArray(children);
  const markerCount = childrenArray.length;
  
  return (
    <View style={[styles.map, style]}>
      <View style={styles.mapContent}>
        <Text style={styles.mapTitle}>地震分布地图</Text>
        <Text style={styles.mapSubtitle}>当前显示: {initialRegion ? `经度 ${initialRegion.longitude.toFixed(2)}, 纬度 ${initialRegion.latitude.toFixed(2)}` : '全球视图'}</Text>
        <Text style={styles.debugText}>标记数量: {markerCount}</Text>
        <View style={styles.mapGrid}>
          {/* Simple grid to模拟地图 */}
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.gridRow}>
              {Array.from({ length: 10 }).map((_, j) => (
                <View key={j} style={styles.gridCell} />
              ))}
            </View>
          ))}
          {children}
        </View>
      </View>
    </View>
  );
};

export const Marker = ({ coordinate, title, description, children, onPress }) => {
  // Calculate position based on coordinates (simplified)
  const left = ((coordinate.longitude + 180) / 360) * 100;
  const top = ((90 - coordinate.latitude) / 180) * 100;
  
  const handlePress = () => {
    console.log('Marker pressed!');
    if (onPress) {
      onPress();
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.marker, 
        {
          left: `${left}%`,
          top: `${top}%`,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      testID="earthquake-marker"
    >
      <View style={styles.markerContent}>
        {children}
        {title && <Text style={styles.markerTitle}>{title}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  mapContent: {
    flex: 1,
    padding: 20,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  mapGrid: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#DDD',
  },
  marker: {
    position: 'absolute',
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContent: {
    alignItems: 'center',
  },
  markerTitle: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    backgroundColor: 'white',
    padding: 2,
    borderRadius: 3,
  },
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

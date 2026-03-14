import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SimpleMapComponent = ({ style, earthquakes = [], onMarkerPress, initialRegion }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapData, setMapData] = useState([]);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    try {
      if (earthquakes && earthquakes.length > 0) {
        const processedData = earthquakes.map(e => {
          try {
            if (!e || !e.geometry || !e.geometry.coordinates || !e.properties) {
              return null;
            }
            const place = e.properties.place || '未知位置';
            const time = e.properties.time ? new Date(e.properties.time).toLocaleString() : '未知时间';
            return {
              id: Math.random().toString(),
              lat: e.geometry.coordinates[1],
              lng: e.geometry.coordinates[0],
              mag: e.properties.mag || e.properties.magnitude || 0,
              place: place,
              time: time,
              depth: e.geometry.coordinates[2] || 0,
              original: e
            };
          } catch (err) {
            console.error('Error processing earthquake data:', err);
            return null;
          }
        }).filter(item => item && !isNaN(item.lat) && !isNaN(item.lng));
        
        setMapData(processedData);
        setLoading(false);
      } else {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError('数据处理出错');
      setLoading(false);
    }
  }, [earthquakes]);

  const getMagColor = (mag) => {
    if (mag >= 6.0) return '#FF3B30';
    if (mag >= 5.0) return '#FF9500';
    return '#34C759';
  };

  const getMagSize = (mag) => {
    return Math.max(8, Math.min(24, mag * 4));
  };

  const getMagLevel = (mag) => {
    if (mag >= 6.0) return '强震';
    if (mag >= 5.0) return '中强震';
    if (mag >= 4.0) return '有感地震';
    return '轻微地震';
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载地震数据中...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setUseFallback(true);
              setError(null);
            }}
          >
            <Text style={styles.retryButtonText}>显示数据列表</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 备用方案：数据列表
  if (useFallback || mapData.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {/* 标题卡片 */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>地震数据分布</Text>
          <Text style={styles.headerSubtitle}>基于 {mapData.length} 个地震数据点</Text>
        </View>

        {/* 统计信息 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="earth-outline" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{mapData.length}</Text>
            <Text style={styles.statLabel}>总数据点</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="warning-outline" size={24} color="#FF3B30" />
            <Text style={styles.statNumber}>{mapData.filter(item => item.mag >= 5.0).length}</Text>
            <Text style={styles.statLabel}>5.0级以上</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{mapData.filter(item => item.mag >= 4.0 && item.mag < 5.0).length}</Text>
            <Text style={styles.statLabel}>4.0-4.9级</Text>
          </View>
        </View>

        {/* 图例 */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>震级图例</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.legendText}>≥6.0级</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendText}>5.0-5.9级</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendText}>{'<5.0级'}</Text>
            </View>
          </View>
        </View>

        {/* 地震数据列表 */}
        <ScrollView 
          style={styles.listContainer}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.listContent}
        >
          {mapData.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.earthquakeCard}
              activeOpacity={0.7}
              onPress={() => onMarkerPress && onMarkerPress(item.original)}
            >
              <View style={styles.earthquakeHeader}>
                <View style={[
                  styles.magIndicator, 
                  { 
                    backgroundColor: getMagColor(item.mag),
                    width: getMagSize(item.mag),
                    height: getMagSize(item.mag),
                    borderRadius: getMagSize(item.mag) / 2
                  }
                ]}>
                  <Text style={styles.magText}>{item.mag.toFixed(1)}</Text>
                </View>
                <View style={styles.earthquakeInfo}>
                  <Text style={styles.earthquakePlace}>{item.place}</Text>
                  <Text style={styles.earthquakeLevel}>{getMagLevel(item.mag)}</Text>
                </View>
                <Text style={styles.earthquakeTime}>{item.time}</Text>
              </View>
              <View style={styles.earthquakeDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    纬度: {item.lat.toFixed(4)}, 经度: {item.lng.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="water-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>震源深度: {item.depth} km</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {mapData.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>暂无地震数据</Text>
              <Text style={styles.emptySubtext}>请尝试调整时间范围或震级筛选</Text>
            </View>
          )}
        </ScrollView>

        {/* 底部信息 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>数据来源: USGS 地震数据</Text>
          <Text style={styles.footerSubtext}>
            更新时间: {new Date().toLocaleString()}
          </Text>
        </View>
      </View>
    );
  }

  // 尝试使用 MapLibre
  try {
    const MapView = require('@maplibre/maplibre-react-native').MapView;
    const Camera = require('@maplibre/maplibre-react-native').Camera;
    const PointAnnotation = require('@maplibre/maplibre-react-native').PointAnnotation;

    const mapStyle = {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    };

    return (
      <View style={[styles.container, style]}>
        <MapView
          style={styles.map}
          styleURL={JSON.stringify(mapStyle)}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <Camera
            centerCoordinate={initialRegion ? [initialRegion.longitude, initialRegion.latitude] : [105.0, 35.0]}
            zoomLevel={initialRegion ? 4 : 4}
            animationDuration={0}
          />
          
          {mapData.map((item) => (
            <PointAnnotation
              key={item.id}
              coordinate={[item.lng, item.lat]}
              title={`${item.mag.toFixed(1)} 级`}
              subtitle={`${item.place}\n震源深度: ${item.depth}km\n${item.time}`}
              onPress={() => onMarkerPress && onMarkerPress(item.original)}
            >
              <View 
                style={[
                  styles.marker,
                  {
                    backgroundColor: getMagColor(item.mag),
                    width: getMagSize(item.mag),
                    height: getMagSize(item.mag),
                    borderRadius: getMagSize(item.mag) / 2
                  }
                ]}
              >
                <Text style={styles.markerText}>{item.mag.toFixed(1)}</Text>
              </View>
            </PointAnnotation>
          ))}
        </MapView>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>地震数据</Text>
          <Text style={styles.infoSubtitle}>共 {mapData.length} 个地震数据点</Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.legendText}>≥6.0级</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendText}>5.0-5.9级</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendText}>{'<5.0级'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.fallbackButton}
            onPress={() => setUseFallback(true)}
          >
            <Ionicons name="list-outline" size={16} color="#007AFF" />
            <Text style={styles.fallbackButtonText}>切换到列表视图</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  } catch (mapError) {
    console.error('Error loading MapLibre:', mapError);
    setUseFallback(true);
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>地图加载失败</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => setUseFallback(true)}
          >
            <Text style={styles.retryButtonText}>显示数据列表</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  map: {
    flex: 1
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 10
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  },
  marker: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)'
  },
  markerText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  legendText: {
    fontSize: 12,
    color: '#666'
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    marginTop: 8
  },
  fallbackButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600'
  },
  headerCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  legendContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 16
  },
  listContent: {
    paddingBottom: 20
  },
  earthquakeCard: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  earthquakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  magIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  magText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  earthquakeInfo: {
    flex: 1
  },
  earthquakePlace: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  earthquakeLevel: {
    fontSize: 14,
    color: '#666'
  },
  earthquakeTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right'
  },
  earthquakeDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    gap: 8
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4
  }
});

export default SimpleMapComponent;

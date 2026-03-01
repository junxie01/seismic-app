import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import SimpleMapComponent from '../components/SimpleMapComponent';
import { initDatabase, storeEarthquakes, getEarthquakes, hasEarthquakeData } from '../utils/DatabaseManager';

// 辅助函数
const getMagnitudeColor = (magnitude) => {
  if (magnitude >= 6.0) return '#FF3B30';
  if (magnitude >= 5.0) return '#FF9500';
  return '#34C759';
};

// 固定屏幕尺寸值
const screenWidth = 375;
const screenHeight = 667;

const EarthquakeScreen = () => {
  const [timeRange, setTimeRange] = useState(7);
  const [minMagnitude, setMinMagnitude] = useState(4.0);
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const [showMagnitudeDropdown, setShowMagnitudeDropdown] = useState(false);
  const [earthquakes, setEarthquakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEarthquake, setSelectedEarthquake] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  // 使用useCallback避免每次渲染都创建新的函数
  const fetchEarthquakeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 初始化数据库
      await initDatabase();
      
      // 尝试从API获取新数据
      try {
        const endTime = new Date();
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - timeRange);

        const startStr = startTime.toISOString();
        const endStr = endTime.toISOString();

        const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startStr}&endtime=${endStr}&minmagnitude=${minMagnitude}&limit=20000`;
        console.log('Fetching earthquake data from USGS API:', url);

        const response = await fetch(url);
        console.log('USGS API response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('USGS API error response:', errorText);
          throw new Error(`Failed to fetch earthquake data: ${response.status} ${errorText}`);
        }
        const apiData = await response.json();
        console.log('USGS API response data:', apiData);
        const features = apiData.features || [];
        console.log('USGS API features count:', features.length);
        
        // 存储数据到数据库
        if (features.length > 0) {
          await storeEarthquakes(features);
        }
        
        setEarthquakes(features);
      } catch (apiError) {
        console.error('Error fetching from API, trying to load from database:', apiError);
        
        // 检查数据库中是否有数据
        const hasData = await hasEarthquakeData();
        if (hasData) {
          // 从数据库加载数据
          const storedEarthquakes = await getEarthquakes();
          console.log('Loaded earthquakes from database:', storedEarthquakes.length);
          setEarthquakes(storedEarthquakes);
          setError('网络连接失败，显示本地缓存数据');
        } else {
          throw apiError;
        }
      }
    } catch (err) {
      setError('获取地震数据失败，请检查网络连接');
      console.error('Error fetching earthquake data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, minMagnitude]);

  useEffect(() => {
    fetchEarthquakeData();
  }, [fetchEarthquakeData]);

  // 使用useCallback避免每次渲染都创建新的函数
  const handleEarthquakePress = useCallback((feature) => {
    setSelectedEarthquake(feature);
    setShowDetailModal(true);
  }, []);

  // 使用useCallback避免每次渲染都创建新的函数
  const handleTimeRangeChange = useCallback((days) => {
    setTimeRange(days);
    setShowTimeRangeDropdown(false);
    setShowSummary(true);
  }, []);

  // 使用useCallback避免每次渲染都创建新的函数
  const handleMagnitudeChange = useCallback((magnitude) => {
    setMinMagnitude(magnitude);
    setShowMagnitudeDropdown(false);
    setShowSummary(true);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
            >
              <Text style={styles.dropdownLabel}>时间范围:</Text>
              <Text style={styles.dropdownValue}>{timeRange}天</Text>
              <Ionicons name={showTimeRangeDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#007AFF" />
            </TouchableOpacity>
            {showTimeRangeDropdown && (
              <View style={styles.dropdownMenu}>
                {[1, 3, 7, 14, 30].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={styles.dropdownMenuItem}
                    onPress={() => handleTimeRangeChange(days)}
                  >
                    <Text style={styles.dropdownMenuItemText}>{days}天</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowMagnitudeDropdown(!showMagnitudeDropdown)}
            >
              <Text style={styles.dropdownLabel}>最小震级:</Text>
              <Text style={styles.dropdownValue}>{minMagnitude}</Text>
              <Ionicons name={showMagnitudeDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#007AFF" />
            </TouchableOpacity>
            {showMagnitudeDropdown && (
              <View style={styles.dropdownMenu}>
                {[3.0, 4.0, 5.0, 6.0].map((magnitude) => (
                  <TouchableOpacity
                    key={magnitude}
                    style={styles.dropdownMenuItem}
                    onPress={() => handleMagnitudeChange(magnitude)}
                  >
                    <Text style={styles.dropdownMenuItemText}>{magnitude}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>加载地震数据中...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchEarthquakeData}>
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SimpleMapComponent 
            earthquakes={earthquakes} 
            onMarkerPress={handleEarthquakePress} 
            initialRegion={{ 
              latitude: 45, 
              longitude: 85, 
              latitudeDelta: 50, 
              longitudeDelta: 90 
            }} 
          />
        )}

        {showSummary && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>地震数据摘要</Text>
              <TouchableOpacity onPress={() => setShowSummary(false)}>
                <Ionicons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>时间范围:</Text>
                <Text style={styles.summaryValue}>{timeRange}天</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>最小震级:</Text>
                <Text style={styles.summaryValue}>{minMagnitude}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>地震数量:</Text>
                <Text style={styles.summaryValue}>{earthquakes.length} 条</Text>
              </View>
              {earthquakes.length > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>最大震级:</Text>
                  <Text style={[styles.summaryValue, { color: getMagnitudeColor(Math.max(...earthquakes.map(e => e.properties.mag || e.properties.magnitude || 0)))}]}>
                    {Math.max(...earthquakes.map(e => e.properties.mag || e.properties.magnitude || 0))}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {showDetailModal && selectedEarthquake && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>地震详细信息</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {(() => {
                const { properties, geometry } = selectedEarthquake;
                const { mag, place, time, url, felt, cdi, mmi, alert, status, tsunami, sig, net, code, nst, dmin, rms, gap, magType, type } = properties;
                const [longitude, latitude, depthValue] = geometry.coordinates;
                
                return (
                  <>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>震级:</Text>
                      <Text style={[styles.detailValue, { color: getMagnitudeColor(mag) }]}>{mag}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>位置:</Text>
                      <Text style={styles.detailValue}>{place}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>时间:</Text>
                      <Text style={styles.detailValue}>{new Date(time).toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>深度:</Text>
                      <Text style={styles.detailValue}>{depthValue.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>坐标:</Text>
                      <Text style={styles.detailValue}>经度: {longitude.toFixed(4)}, 纬度: {latitude.toFixed(4)}</Text>
                    </View>
                    {felt && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>有感人数:</Text>
                        <Text style={styles.detailValue}>{felt} 人</Text>
                      </View>
                    )}
                    {alert && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>预警级别:</Text>
                        <Text style={styles.detailValue}>{alert}</Text>
                      </View>
                    )}
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>状态:</Text>
                      <Text style={styles.detailValue}>{status}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>海啸:</Text>
                      <Text style={styles.detailValue}>{tsunami ? '是' : '否'}</Text>
                    </View>
                    {url && (
                      <TouchableOpacity style={styles.urlButton} onPress={() => Linking.openURL(url)}>
                        <Ionicons name="open-outline" size={16} color="#007AFF" />
                        <Text style={styles.urlButtonText}>查看USGS详细信息</Text>
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    color: '#000',
  },
  filterContainer: {
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dropdownWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    minWidth: 140,
  },
  dropdownLabel: {
    fontSize: 15,
    color: '#666',
    marginRight: 6,
  },
  dropdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginRight: 6,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  dropdownMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  dropdownMenuItemText: {
    fontSize: 15,
    color: '#000',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
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
  earthquakeCount: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  earthquakeList: {
    flex: 1,
    padding: 16,
  },
  earthquakeCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  magnitudeContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  magnitudeText: {
    fontSize: 22,
    fontWeight: '700',
  },
  earthquakeInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  depthText: {
    fontSize: 13,
    color: '#999',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalBody: {
    padding: 20,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 80,
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  urlButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  summaryContent: {
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
});

export default EarthquakeScreen;
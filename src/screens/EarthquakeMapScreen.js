import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Platform,
  LogBox,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SimpleMapComponent from '../components/SimpleMapComponent';

// 忽略某些警告
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
]);

// Mock earthquake data for testing
const mockEarthquakes = [
  {
    geometry: { coordinates: [-122.4194, 37.7749] },
    properties: { magnitude: 4.5, time: new Date().toISOString() }
  },
  {
    geometry: { coordinates: [-118.2437, 34.0522] },
    properties: { magnitude: 5.2, time: new Date().toISOString() }
  },
  {
    geometry: { coordinates: [138.2529, 36.2048] },
    properties: { magnitude: 6.1, time: new Date().toISOString() }
  },
  {
    geometry: { coordinates: [104.0665, 30.5728] },
    properties: { magnitude: 4.8, time: new Date().toISOString() }
  },
  {
    geometry: { coordinates: [-74.0060, 40.7128] },
    properties: { magnitude: 3.9, time: new Date().toISOString() }
  },
];

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

// 防抖函数
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// 缓存键生成函数
const generateCacheKey = (days, magnitude) => {
  return `earthquake_data_${days}_${magnitude}`;
};

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟

// Fetch earthquake data function with caching
const fetchEarthquakeData = async (days, magnitude) => {
  try {
    // 生成缓存键
    const cacheKey = generateCacheKey(days, magnitude);
    
    // 尝试从缓存加载数据
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      const cachedExpiry = await AsyncStorage.getItem(`${cacheKey}_expiry`);
      
      if (cachedData && cachedExpiry) {
        try {
          const expiryTime = parseInt(cachedExpiry);
          const currentTime = Date.now();
          
          if (currentTime < expiryTime) {
            console.log('Using cached earthquake data');
            return JSON.parse(cachedData);
          }
        } catch (parseError) {
          console.error('Error parsing cached data:', parseError);
          // 解析失败，继续从API获取数据
        }
      }
    } catch (cacheError) {
      console.error('Error reading from cache:', cacheError);
      // 缓存读取失败，继续从API获取数据
    }
    
    // Calculate start time in ISO format
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateISO = startDate.toISOString();
    
    // Use USGS API with user-selected parameters
    console.log('Fetching earthquake data from USGS API with starttime=' + startDateISO + ', minmagnitude=' + magnitude);
    try {
      const response = await fetch(
        `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDateISO}&minmagnitude=${magnitude}&orderby=time-asc`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.status);
      }
      const data = await response.json();
      console.log('Successfully fetched ' + data.features.length + ' earthquakes from USGS API');
      
      // Check data structure
      let transformedData;
      if (data.features && data.features.length > 0) {
        console.log('First feature properties:', data.features[0].properties);
        console.log('Available properties:', Object.keys(data.features[0].properties));
        console.log('Magnitude property:', data.features[0].properties.mag || data.features[0].properties.magnitude);
        
        // Transform data to ensure consistent structure
        transformedData = data.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            magnitude: feature.properties.mag || feature.properties.magnitude || 0
          }
        }));
        
        console.log('Transformed first feature magnitude:', transformedData[0].properties.magnitude);
      } else {
        transformedData = [];
      }
      
      // 保存到缓存
      try {
        const expiryTime = Date.now() + CACHE_EXPIRY;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(transformedData));
        await AsyncStorage.setItem(`${cacheKey}_expiry`, expiryTime.toString());
        console.log('Earthquake data cached successfully');
      } catch (cacheError) {
        console.error('Error writing to cache:', cacheError);
        // 缓存写入失败，不影响返回数据
      }
      
      return transformedData;
    } catch (apiError) {
      console.error('Error fetching from API:', apiError);
      // API失败，返回模拟数据
      console.log('Using mock earthquake data due to API failure');
      return mockEarthquakes;
    }
  } catch (error) {
    console.error('Error in fetchEarthquakeData:', error);
    // 任何其他错误，返回模拟数据
    console.log('Using mock earthquake data due to unexpected error');
    return mockEarthquakes;
  }
};

// 防抖版本的fetchEarthquakeData
const debouncedFetchEarthquakeData = debounce(fetchEarthquakeData, 500);

// Fetch station data function
const fetchStationData = async () => {
  try {
    // Use a simpler station API or return mock data
    // For now, we'll return mock data since station APIs often require complex queries
    console.log('Using mock station data');
    return mockStations;
  } catch (error) {
    console.error('Error fetching station data:', error);
    // Return mock data if API fails
    return mockStations;
  }
};

export default function EarthquakeMapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [earthquakeData, setEarthquakeData] = useState(mockEarthquakes);
  const [stationData, setStationData] = useState(mockStations);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(7); // Default 7 days
  const [minMagnitude, setMinMagnitude] = useState(4.0); // Default 4.0 magnitude
  const [showInfoWindow, setShowInfoWindow] = useState(true); // Control info window visibility
  const [lastUpdated, setLastUpdated] = useState(null); // Last update time
  // Dropdown states
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const [showMagnitudeDropdown, setShowMagnitudeDropdown] = useState(false);

  // 防抖版本的loadData函数
  const debouncedLoadData = debounce(async () => {
    await loadData();
  }, 500);

  const loadData = async () => {
    try {
      setError(null);
      
      // 生成缓存键
      const cacheKey = `earthquakes_${timeRange}_${minMagnitude}`;
      const stationCacheKey = 'stations';
      
      // 尝试从API获取新数据
      try {
        const [earthquakes, stations] = await Promise.all([
          fetchEarthquakeData(timeRange, minMagnitude),
          fetchStationData()
        ]);
        
        console.log('Loaded earthquake data:', earthquakes.length, 'earthquakes');
        console.log('Loaded station data:', stations.length, 'stations');
        
        // 检查数据有效性
        if (Array.isArray(earthquakes) && earthquakes.length > 0) {
          // 保存到缓存
          try {
            const now = new Date().toISOString();
            await AsyncStorage.setItem(cacheKey, JSON.stringify(earthquakes));
            await AsyncStorage.setItem('lastUpdated', now);
            setLastUpdated(now);
          } catch (storageError) {
            console.error('Error saving to storage:', storageError);
            // 存储失败不影响应用运行
          }
          setEarthquakeData(earthquakes);
        }
        
        if (Array.isArray(stations) && stations.length > 0) {
          try {
            await AsyncStorage.setItem(stationCacheKey, JSON.stringify(stations));
          } catch (storageError) {
            console.error('Error saving to storage:', storageError);
            // 存储失败不影响应用运行
          }
          setStationData(stations);
        }
      } catch (apiError) {
        console.error('Error loading from API:', apiError);
        setError('网络连接失败，显示缓存数据');
        
        // 尝试从缓存加载数据
        try {
          const cachedEarthquakes = await AsyncStorage.getItem(cacheKey);
          const cachedStations = await AsyncStorage.getItem(stationCacheKey);
          
          if (cachedEarthquakes) {
            try {
              const parsedEarthquakes = JSON.parse(cachedEarthquakes);
              if (Array.isArray(parsedEarthquakes)) {
                setEarthquakeData(parsedEarthquakes);
                console.log('Loaded earthquake data from cache:', parsedEarthquakes.length, 'earthquakes');
              } else {
                // 解析失败，使用模拟数据
                setEarthquakeData(mockEarthquakes);
              }
            } catch (parseError) {
              console.error('Error parsing cached data:', parseError);
              // 解析失败，使用模拟数据
              setEarthquakeData(mockEarthquakes);
            }
          } else {
            // 缓存不存在，使用模拟数据
            setEarthquakeData(mockEarthquakes);
          }
          
          if (cachedStations) {
            try {
              const parsedStations = JSON.parse(cachedStations);
              if (Array.isArray(parsedStations)) {
                setStationData(parsedStations);
                console.log('Loaded station data from cache:', parsedStations.length, 'stations');
              } else {
                // 解析失败，使用模拟数据
                setStationData(mockStations);
              }
            } catch (parseError) {
              console.error('Error parsing cached data:', parseError);
              // 解析失败，使用模拟数据
              setStationData(mockStations);
            }
          } else {
            // 缓存不存在，使用模拟数据
            setStationData(mockStations);
          }
        } catch (cacheError) {
          console.error('Error loading from cache:', cacheError);
          // 缓存也失败，使用模拟数据
          console.log('Using mock data:', mockEarthquakes.length, 'earthquakes');
          setEarthquakeData(mockEarthquakes);
          setStationData(mockStations);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('获取数据失败，显示模拟数据');
      console.log('Using mock data:', mockEarthquakes.length, 'earthquakes');
      setEarthquakeData(mockEarthquakes);
      setStationData(mockStations);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    debouncedLoadData();
  }, [timeRange, minMagnitude]);

  // 移除自动隐藏计时器，改为手动控制

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculate marker style based on magnitude
  const getMarkerStyle = (magnitude) => {
    const size = Math.max(10, Math.min(30, magnitude * 3));
    let color = '#34C759'; // Green - small earthquake
    
    if (magnitude >= 6.0) {
      color = '#FF3B30'; // Red - large earthquake
    } else if (magnitude >= 5.0) {
      color = '#FF9500'; // Orange - medium earthquake
    }
    
    return { size, color };
  };



  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.filterContainer}>
          {/* Dropdown filters */}
          <View style={styles.dropdownContainer}>
            {/* Time range dropdown */}
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
              >
                <Text style={styles.dropdownLabel}>时间范围:</Text>
                <Text style={styles.dropdownValue}>{timeRange}天</Text>
                <Ionicons name={showTimeRangeDropdown ? "chevron-up" : "chevron-down"} size={16} color="#007AFF" />
              </TouchableOpacity>
              {showTimeRangeDropdown && (
                <View style={styles.dropdownMenu}>
                  {[1, 3, 7, 14, 30].map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setTimeRange(days);
                        setShowTimeRangeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownMenuItemText}>{days}天</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Magnitude dropdown */}
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowMagnitudeDropdown(!showMagnitudeDropdown)}
              >
                <Text style={styles.dropdownLabel}>最小震级:</Text>
                <Text style={styles.dropdownValue}>{minMagnitude}</Text>
                <Ionicons name={showMagnitudeDropdown ? "chevron-up" : "chevron-down"} size={16} color="#007AFF" />
              </TouchableOpacity>
              {showMagnitudeDropdown && (
                <View style={styles.dropdownMenu}>
                  {[3.0, 4.0, 5.0, 6.0].map((magnitude) => (
                    <TouchableOpacity
                      key={magnitude}
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setMinMagnitude(magnitude);
                        setShowMagnitudeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownMenuItemText}>{magnitude}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            

          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>正在加载地震数据...</Text>
          <Text style={styles.loadingSubtext}>请稍候，数据加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Filter container */}
      <View style={styles.filterContainer}>
        {/* Dropdown filters */}
        <View style={styles.dropdownContainer}>
          {/* Time range dropdown */}
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
            >
              <Text style={styles.dropdownLabel}>时间范围:</Text>
              <Text style={styles.dropdownValue}>{timeRange}天</Text>
              <Ionicons name={showTimeRangeDropdown ? "chevron-up" : "chevron-down"} size={16} color="#007AFF" />
            </TouchableOpacity>
            {showTimeRangeDropdown && (
              <View style={styles.dropdownMenu}>
                {[1, 3, 7, 14, 30].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setTimeRange(days);
                      setShowTimeRangeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownMenuItemText}>{days}天</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {/* Magnitude dropdown */}
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowMagnitudeDropdown(!showMagnitudeDropdown)}
            >
              <Text style={styles.dropdownLabel}>最小震级:</Text>
              <Text style={styles.dropdownValue}>{minMagnitude}</Text>
              <Ionicons name={showMagnitudeDropdown ? "chevron-up" : "chevron-down"} size={16} color="#007AFF" />
            </TouchableOpacity>
            {showMagnitudeDropdown && (
              <View style={styles.dropdownMenu}>
                {[3.0, 4.0, 5.0, 6.0].map((magnitude) => (
                  <TouchableOpacity
                    key={magnitude}
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setMinMagnitude(magnitude);
                      setShowMagnitudeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownMenuItemText}>{magnitude}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          

        </View>
      </View>

      {/* Map */}
      <SimpleMapComponent
        style={styles.map}
        initialRegion={{
          latitude: 0,
          longitude: 0,
          latitudeDelta: 180,
          longitudeDelta: 360,
        }}
        earthquakes={earthquakeData}
        onMarkerPress={(item) => {
          try {
            console.log('Navigation to EarthquakeDetail triggered');
            // 检查navigation是否存在
            if (navigation) {
              navigation.navigate('EarthquakeDetail', { earthquake: item });
            } else {
              console.error('Navigation is not available');
            }
          } catch (navError) {
            console.error('Navigation error:', navError);
            Alert.alert('导航错误', '无法导航到详情页面');
          }
        }}
      />
      
      {/* Error message */}
      {error && (
        <View style={[styles.errorContainer, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Info container */}
      {showInfoWindow && (
        <View style={[styles.infoContainer, { paddingBottom: insets.bottom + 10 }]}>
          {/* Earthquake info */}
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>地震分布</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowInfoWindow(false)}
            >
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.debugText}>地震数据数量: {Array.isArray(earthquakeData) ? earthquakeData.length : 0}</Text>
            <View style={styles.infoItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.legendText}>6.0+</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendText}>5.0-5.9</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendText}>4.0-4.9</Text>
            </View>
          </View>
          <Text style={styles.dataSummary}>地震: {Array.isArray(earthquakeData) ? earthquakeData.length : 0} 个</Text>
          <Text style={styles.dataSource}>数据来源: USGS (过去{timeRange}天 M≥{minMagnitude})</Text>
          {lastUpdated && (
            <Text style={styles.lastUpdated}>最后更新: {new Date(lastUpdated).toLocaleString()}</Text>
          )}
        </View>
      )}
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
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
  dataSource: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  lastUpdated: {
    marginTop: 5,
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  debugText: {
    fontSize: 14,
    color: '#333',
    marginRight: 10,
    fontWeight: 'bold',
  },
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterText: {
    textAlign: 'center',
  },
  // New styles for filters
  filterContainer: {
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
  },
  selectedViewButton: {
    backgroundColor: '#007AFF',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedViewButtonText: {
    color: 'white',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  selectedFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedFilterButtonText: {
    color: 'white',
  },
  // Station marker styles
  stationMarker: {
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
    transform: [{ rotate: '180deg' }],
  },
  // Station info styles
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  stationMarkerMini: {
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
  // Dropdown styles
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dropdownWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    minWidth: 120,
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: '#333',
  },
  // Station toggle styles
  stationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  stationToggleActive: {
    backgroundColor: '#007AFF',
  },
  stationToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  stationToggleTextActive: {
    color: 'white',
  },
  // Legend row styles
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  // Data summary styles
  dataSummary: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  // Debug container styles
  debugContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  debugInfo: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  mapErrorContainer: {
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
  },
  mapErrorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

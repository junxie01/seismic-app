import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Portal, Modal, Text, Card, ActivityIndicator, IconButton, Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { wgs84togcj02 } from '../utils/coords';
import { getLeafletHtml } from '../utils/mapHtml';

const USGS_BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson';

const EarthquakeScreen = () => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedEq, setSelectedEq] = useState(null);
  const [timeRange, setTimeRange] = useState('7');
  const [minMag, setMinMag] = useState('4');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showMagDropdown, setShowMagDropdown] = useState(false);
  const [earthquakes, setEarthquakes] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showSummary, setShowSummary] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const fetchAndShowData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString();
      const url = `${USGS_BASE_URL}&starttime=${startTime}&minmagnitude=${minMag}`;
      
      const response = await axios.get(url);
      const features = response.data.features || [];

      const transformedFeatures = features.map((f) => {
        const [lng, lat] = f.geometry.coordinates;
        const [nlng, nlat] = wgs84togcj02(lng, lat);
        return {
          ...f,
          geometry: {
            ...f.geometry,
            coordinates: [nlng, nlat, f.geometry.coordinates[2]]
          }
        };
      });

      setEarthquakes(transformedFeatures);
      setLastUpdate(now);

    } catch (error) {
      console.error('Fetch USGS error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchAndShowData();
    }, 500);
    return () => clearTimeout(timer);
  }, [timeRange, minMag]);

  useEffect(() => {
    if (mapReady && earthquakes.length > 0) {
      console.log('Sending earthquakes to map:', earthquakes.length);
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'render_earthquakes',
        data: earthquakes
      }));
    }
  }, [mapReady, earthquakes]);

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received from WebView:', data.type);
      if (data.type === 'SELECT_EVENT') {
        setSelectedEq(data.payload);
      } else if (data.type === 'MAP_READY') {
        console.log('Map is ready');
        setMapReady(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getMagnitudeColor = (magnitude) => {
    if (magnitude >= 6.0) return '#FF3B30';
    if (magnitude >= 5.0) return '#FF9500';
    return '#34C759';
  };

  const countByMagnitude = () => {
    const counts = { great: 0, major: 0, moderate: 0 };
    earthquakes.forEach(eq => {
      const mag = eq.properties?.mag || 0;
      if (mag >= 6.0) counts.great++;
      else if (mag >= 5.0) counts.major++;
      else counts.moderate++;
    });
    return counts;
  };

  const counts = countByMagnitude();
  const maxMag = earthquakes.length > 0 
    ? Math.max(...earthquakes.map(eq => eq.properties?.mag || 0)) 
    : 0;

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowTimeDropdown(!showTimeDropdown);
                  setShowMagDropdown(false);
                }}
              >
                <Text style={styles.dropdownLabel}>时间范围:</Text>
                <Text style={styles.dropdownValue}>{timeRange}天</Text>
                <Ionicons name={showTimeDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#007AFF" />
              </TouchableOpacity>
              {showTimeDropdown && (
                <View style={styles.dropdownMenu}>
                  {[1, 7, 30].map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setTimeRange(String(days));
                        setShowTimeDropdown(false);
                      }}
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
                onPress={() => {
                  setShowMagDropdown(!showMagDropdown);
                  setShowTimeDropdown(false);
                }}
              >
                <Text style={styles.dropdownLabel}>最小震级:</Text>
                <Text style={styles.dropdownValue}>{minMag}</Text>
                <Ionicons name={showMagDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#007AFF" />
              </TouchableOpacity>
              {showMagDropdown && (
                <View style={styles.dropdownMenu}>
                  {[3, 4, 5].map((magnitude) => (
                    <TouchableOpacity
                      key={magnitude}
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setMinMag(String(magnitude));
                        setShowMagDropdown(false);
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

        <WebView
          key={earthquakes.length}
          cacheEnabled={false}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: getLeafletHtml(earthquakes) }}
          style={styles.map}
          onMessage={onMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator animating={true} color="#2C3E50" size="large" />
          </View>
        )}

        {showSummary && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>地震分布</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSummary(false)}
              >
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>地震数据数量:</Text>
                <Text style={styles.summaryValue}>{earthquakes.length}</Text>
                <View style={[styles.colorDot, { backgroundColor: '#FF3B30' }]} />
                <Text style={styles.legendText}>6.0+</Text>
                <View style={[styles.colorDot, { backgroundColor: '#FF9500' }]} />
                <Text style={styles.legendText}>5.0-5.9</Text>
                <View style={[styles.colorDot, { backgroundColor: '#34C759' }]} />
                <Text style={styles.legendText}>4.0-4.9</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>地震:</Text>
                <Text style={styles.summaryValue}>{earthquakes.length} 个</Text>
              </View>
              <View style={styles.summaryFooter}>
                <Text style={styles.footerText}>数据来源: USGS (过去{timeRange}天 M≥{minMag})</Text>
                {lastUpdate && (
                  <Text style={styles.footerText}>最后更新: {lastUpdate.toLocaleString()}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {!showSummary && (
          <TouchableOpacity
            style={styles.showSummaryButton}
            onPress={() => setShowSummary(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}

        <Portal>
          <Modal
            visible={!!selectedEq}
            onDismiss={() => setSelectedEq(null)}
            contentContainerStyle={styles.detailModal}
          >
            {selectedEq && (
              <Card style={styles.card}>
                <Card.Title
                  title={`M ${selectedEq.properties.mag} - ${selectedEq.properties.place}`}
                  subtitle={new Date(selectedEq.properties.time).toLocaleString()}
                  right={(props) => <IconButton {...props} icon="close" onPress={() => setSelectedEq(null)} />}
                />
                <Card.Content>
                  <View style={styles.detailRow}>
                    <Text variant="bodyMedium" style={styles.detailLabel}>深度:</Text>
                    <Text variant="bodyLarge">{selectedEq.geometry.coordinates[2]} km</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text variant="bodyMedium" style={styles.detailLabel}>状态:</Text>
                    <Text variant="bodyLarge">{selectedEq.properties.status}</Text>
                  </View>
                </Card.Content>
              </Card>
            )}
          </Modal>
        </Portal>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  filterContainer: {
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dropdownWrapper: {
    position: 'relative',
    marginRight: 12,
    zIndex: 1001,
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
    elevation: 20,
    zIndex: 1002,
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
  map: { flex: 1, zIndex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 50,
  },
  summaryHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
    marginRight: 8,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  summaryFooter: {
    marginTop: 8,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  showSummaryButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 51,
  },
  detailModal: {
    padding: 0,
    margin: 20,
    justifyContent: 'flex-end',
    marginBottom: 80
  },
  card: { borderRadius: 12, elevation: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  detailLabel: { color: '#888' }
});

export default EarthquakeScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapView, Marker } from '../components/MapView';

export default function EarthquakeDetailScreen({ route, navigation }) {
  const { earthquake } = route.params;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [additionalData, setAdditionalData] = useState(null);

  // 格式化时间
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleString();
  };

  // 计算距离（简化版，实际应用中需要更精确的计算）
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(2);
  };

  // 打开USGS详情页面
  const openUSGSDetails = async () => {
    try {
      const url = `https://earthquake.usgs.gov/earthquakes/eventpage/${earthquake.id}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening USGS details:', error);
    }
  };

  // 渲染震级颜色
  const getMagnitudeColor = (magnitude) => {
    if (magnitude >= 6.0) {
      return '#FF3B30'; // Red - large earthquake
    } else if (magnitude >= 5.0) {
      return '#FF9500'; // Orange - medium earthquake
    }
    return '#34C759'; // Green - small earthquake
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>地震详情</Text>
        <TouchableOpacity
          style={styles.usgsButton}
          onPress={openUSGSDetails}
        >
          <Ionicons name="open-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 地震基本信息 */}
        <View style={styles.infoCard}>
          <View style={styles.magnitudeContainer}>
            <Text style={[styles.magnitudeText, { color: getMagnitudeColor(earthquake.properties.magnitude) }]}>
              {earthquake.properties.magnitude}
            </Text>
            <Text style={styles.magnitudeLabel}>震级</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              位置: {earthquake.properties.place || '未知位置'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              时间: {formatTime(earthquake.properties.time)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="navigate" size={20} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              坐标: {earthquake.geometry.coordinates[1].toFixed(4)}, {earthquake.geometry.coordinates[0].toFixed(4)}
            </Text>
          </View>
          
          {earthquake.geometry.coordinates[2] && (
            <View style={styles.infoRow}>
              <Ionicons name="water" size={20} color="#666" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                深度: {earthquake.geometry.coordinates[2].toFixed(2)} 公里
              </Text>
            </View>
          )}
        </View>

        {/* 地图 */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>震中位置</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: earthquake.geometry.coordinates[1],
              longitude: earthquake.geometry.coordinates[0],
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            }}
          >
            <Marker
              coordinate={{
                latitude: earthquake.geometry.coordinates[1],
                longitude: earthquake.geometry.coordinates[0],
              }}
              title={`震级: ${earthquake.properties.magnitude}`}
              description={earthquake.properties.place}
            >
              <View style={[
                styles.markerContainer, 
                { 
                  width: 30, 
                  height: 30, 
                  borderRadius: 15, 
                  backgroundColor: getMagnitudeColor(earthquake.properties.magnitude) + '80'
                }
              ]}>
                <View style={[
                  styles.markerInner, 
                  { 
                    width: 18, 
                    height: 18, 
                    borderRadius: 9, 
                    backgroundColor: getMagnitudeColor(earthquake.properties.magnitude)
                  }
                ]} />
              </View>
            </Marker>
          </MapView>
        </View>

        {/* 地震详情 */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>详细信息</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>震级类型:</Text>
            <Text style={styles.detailValue}>{earthquake.properties.magType || '未知'}</Text>
          </View>
          
          {earthquake.properties.gap && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>方位角差距:</Text>
              <Text style={styles.detailValue}>{earthquake.properties.gap.toFixed(1)}°</Text>
            </View>
          )}
          
          {earthquake.properties.dmin && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>最小距离:</Text>
              <Text style={styles.detailValue}>{(earthquake.properties.dmin * 111).toFixed(2)} 公里</Text>
            </View>
          )}
          
          {earthquake.properties.rms && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>均方根:</Text>
              <Text style={styles.detailValue}>{earthquake.properties.rms.toFixed(2)}</Text>
            </View>
          )}
          
          {earthquake.properties.net && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>网络:</Text>
              <Text style={styles.detailValue}>{earthquake.properties.net}</Text>
            </View>
          )}
          
          {earthquake.properties.id && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>事件ID:</Text>
              <Text style={styles.detailValue}>{earthquake.properties.id}</Text>
            </View>
          )}
        </View>

        {/* 影响评估 */}
        <View style={styles.impactCard}>
          <Text style={styles.sectionTitle}>影响评估</Text>
          
          <View style={styles.impactRow}>
            <Ionicons name="people" size={20} color="#666" style={styles.impactIcon} />
            <Text style={styles.impactText}>
              预计影响区域: 约 {Math.pow(10, earthquake.properties.magnitude - 4) * 1000} 平方公里
            </Text>
          </View>
          
          <View style={styles.impactRow}>
            <Ionicons name="alert-circle" size={20} color="#666" style={styles.impactIcon} />
            <Text style={styles.impactText}>
              震感强度: {getIntensityDescription(earthquake.properties.magnitude)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// 根据震级获取震感描述
function getIntensityDescription(magnitude) {
  if (magnitude >= 7.0) {
    return '极强 - 广泛破坏，建筑物严重损坏';
  } else if (magnitude >= 6.0) {
    return '强 - 建筑物损坏，人人有感';
  } else if (magnitude >= 5.0) {
    return '中强 - 大多数人有感，部分建筑物轻微损坏';
  } else if (magnitude >= 4.0) {
    return '有感 - 室内有感，悬挂物摆动';
  }
  return '轻微 - 部分人有感';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  usgsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  magnitudeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  magnitudeText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  magnitudeLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  mapContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  map: {
    height: 200,
    borderRadius: 8,
  },
  detailsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  impactCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  impactIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  impactText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
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

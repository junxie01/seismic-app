import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 固定屏幕尺寸值
const width = 375;
const height = 667;

// 关系图谱数据
const relationshipData = {
  nodes: [
    // 中心节点
    { id: 'central', name: '地震学', type: 'central', x: width / 2, y: height / 2, radius: 40, color: '#007AFF' },
    
    // 地震学家
    { id: 'richter', name: '查尔斯·里克特', type: 'scientist', x: width * 0.7, y: height * 0.3, radius: 25, color: '#FF9500' },
    { id: 'gutenberg', name: '贝诺·古腾堡', type: 'scientist', x: width * 0.3, y: height * 0.3, radius: 25, color: '#FF9500' },
    { id: 'kanamori', name: '金森博雄', type: 'scientist', x: width * 0.8, y: height * 0.5, radius: 25, color: '#FF9500' },
    { id: 'brune', name: 'James Brune', type: 'scientist', x: width * 0.2, y: height * 0.5, radius: 25, color: '#FF9500' },
    { id: 'scholz', name: 'Chris Scholz', type: 'scientist', x: width * 0.6, y: height * 0.7, radius: 25, color: '#FF9500' },
    
    // 地震学名词
    { id: 'magnitude', name: '震级', type: 'term', x: width * 0.5, y: height * 0.2, radius: 20, color: '#34C759' },
    { id: 'fault', name: '断层', type: 'term', x: width * 0.9, y: height * 0.4, radius: 20, color: '#34C759' },
    { id: 'seismic_wave', name: '地震波', type: 'term', x: width * 0.1, y: height * 0.4, radius: 20, color: '#34C759' },
    { id: 'epicenter', name: '震中', type: 'term', x: width * 0.5, y: height * 0.8, radius: 20, color: '#34C759' },
    { id: 'hypocenter', name: '震源', type: 'term', x: width * 0.7, y: height * 0.9, radius: 20, color: '#34C759' },
    
    // 关系类型
    { id: 'developed', name: '提出', type: 'relationship', x: width * 0.6, y: height * 0.4, radius: 15, color: '#FF3B30' },
    { id: 'studied', name: '研究', type: 'relationship', x: width * 0.4, y: height * 0.4, radius: 15, color: '#FF3B30' },
    { id: 'improved', name: '改进', type: 'relationship', x: width * 0.7, y: height * 0.6, radius: 15, color: '#FF3B30' },
  ],
  
  links: [
    // 中心到科学家的连接
    { source: 'central', target: 'richter', label: '相关' },
    { source: 'central', target: 'gutenberg', label: '相关' },
    { source: 'central', target: 'kanamori', label: '相关' },
    { source: 'central', target: 'brune', label: '相关' },
    { source: 'central', target: 'scholz', label: '相关' },
    
    // 中心到名词的连接
    { source: 'central', target: 'magnitude', label: '包含' },
    { source: 'central', target: 'fault', label: '包含' },
    { source: 'central', target: 'seismic_wave', label: '包含' },
    { source: 'central', target: 'epicenter', label: '包含' },
    { source: 'central', target: 'hypocenter', label: '包含' },
    
    // 科学家到名词的连接
    { source: 'richter', target: 'magnitude', label: '提出' },
    { source: 'gutenberg', target: 'magnitude', label: '合作' },
    { source: 'kanamori', target: 'magnitude', label: '改进' },
    { source: 'brune', target: 'seismic_wave', label: '研究' },
    { source: 'scholz', target: 'fault', label: '研究' },
  ],
  
  // 推荐节点
  recommendedScientists: [
    '查尔斯·里克特', '贝诺·古腾堡', '金森博雄', 'James Brune', 'Chris Scholz', 'Harold Jeffreys', 'Inge Lehmann'
  ],
  
  recommendedTerms: [
    '震级', '断层', '地震波', '震中', '震源', '地震矩', '面波', '体波', '余震', '前震'
  ],
};

export default function RelationshipMapScreen() {
  const insets = useSafeAreaInsets();
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 模拟加载数据
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 处理节点点击
  const handleNodePress = (node) => {
    setSelectedNode(node);
  };

  // 渲染节点
  const renderNode = (node) => {
    return (
      <TouchableOpacity
        key={node.id}
        style={[
          styles.node,
          {
            left: node.x - node.radius,
            top: node.y - node.radius,
            width: node.radius * 2,
            height: node.radius * 2,
            borderRadius: node.radius,
            backgroundColor: node.color,
          },
        ]}
        onPress={() => handleNodePress(node)}
        activeOpacity={0.7}
      >
        <Text style={[styles.nodeText, { fontSize: node.radius * 0.4 }]}>
          {node.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // 渲染连接线
  const renderLinks = () => {
    return relationshipData.links.map((link, index) => {
      const source = relationshipData.nodes.find(n => n.id === link.source);
      const target = relationshipData.nodes.find(n => n.id === link.target);

      if (!source || !target) return null;

      // 计算连线路径
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // 计算标签位置
      const labelX = source.x + dx * 0.5;
      const labelY = source.y + dy * 0.5;

      return (
        <View key={index} style={styles.linkContainer}>
          <View
            style={[
              styles.link,
              {
                left: source.x,
                top: source.y,
                width: length,
                transform: [{ rotate: `${angle * 180 / Math.PI}deg` }],
              },
            ]}
          />
          <Text
            style={[
              styles.linkLabel,
              {
                left: labelX - 30,
                top: labelY - 10,
              },
            ]}
          >
            {link.label}
          </Text>
        </View>
      );
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载关系图谱...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>关系图谱</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>搜索地震学家或术语</Text>
      </View>

      {/* 推荐部分 */}
      <ScrollView style={styles.recommendedContainer} showsVerticalScrollIndicator={false}>
        {/* 推荐科学家 */}
        <View style={styles.recommendedSection}>
          <Text style={styles.sectionTitle}>推荐地震学家</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendedScroll}>
            {relationshipData.recommendedScientists.map((scientist, index) => (
              <TouchableOpacity key={index} style={styles.recommendedItem}>
                <Text style={styles.recommendedItemText}>{scientist}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 推荐术语 */}
        <View style={styles.recommendedSection}>
          <Text style={styles.sectionTitle}>推荐术语</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendedScroll}>
            {relationshipData.recommendedTerms.map((term, index) => (
              <TouchableOpacity key={index} style={styles.recommendedItem}>
                <Text style={styles.recommendedItemText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* 关系图谱 */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapTitle}>地震学关系图谱</Text>
        <View style={styles.map}>
          {/* 渲染连接线 */}
          {renderLinks()}
          
          {/* 渲染节点 */}
          {relationshipData.nodes.map(node => renderNode(node))}
        </View>
      </View>

      {/* 选中节点信息 */}
      {selectedNode && (
        <View style={[styles.selectedInfo, { paddingBottom: insets.bottom + 10 }]}>
          <Text style={styles.selectedTitle}>{selectedNode.name}</Text>
          <Text style={styles.selectedType}>
            类型: {selectedNode.type === 'central' ? '中心主题' : 
                   selectedNode.type === 'scientist' ? '地震学家' : '地震学术语'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedNode(null)}>
            <Text style={styles.closeButtonText}>关闭</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  recommendedContainer: {
    maxHeight: 150,
  },
  recommendedSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  recommendedScroll: {
    marginHorizontal: 12,
  },
  recommendedItem: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  recommendedItemText: {
    fontSize: 14,
    color: '#333',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    overflow: 'hidden',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  map: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  linkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  link: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  linkLabel: {
    position: 'absolute',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  node: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nodeText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  selectedType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
});

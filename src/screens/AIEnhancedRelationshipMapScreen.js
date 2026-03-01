import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 固定屏幕尺寸值
const width = 375;
const height = 667;

// AI 增强的关系图谱数据
const generateAIData = () => {
  // 计算中心位置
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3;
  
  // 基础数据
  const baseData = {
    nodes: [
      // 中心节点
      { id: 'central', name: '地震学', type: 'central', x: centerX, y: centerY, radius: 40, color: '#007AFF' },
      
      // 地震学家（放射状分布）
      { id: 'richter', name: '查尔斯·里克特', type: 'scientist', x: centerX + radius * Math.cos(0), y: centerY - radius * Math.sin(0), radius: 25, color: '#FF9500' },
      { id: 'gutenberg', name: '贝诺·古腾堡', type: 'scientist', x: centerX + radius * Math.cos(Math.PI/4), y: centerY - radius * Math.sin(Math.PI/4), radius: 25, color: '#FF9500' },
      { id: 'kanamori', name: '金森博雄', type: 'scientist', x: centerX + radius * Math.cos(Math.PI/2), y: centerY - radius * Math.sin(Math.PI/2), radius: 25, color: '#FF9500' },
      { id: 'brune', name: 'James Brune', type: 'scientist', x: centerX + radius * Math.cos(3*Math.PI/4), y: centerY - radius * Math.sin(3*Math.PI/4), radius: 25, color: '#FF9500' },
      { id: 'scholz', name: 'Chris Scholz', type: 'scientist', x: centerX + radius * Math.cos(Math.PI), y: centerY - radius * Math.sin(Math.PI), radius: 25, color: '#FF9500' },
      
      // 地震学名词（放射状分布）
      { id: 'magnitude', name: '震级', type: 'term', x: centerX + radius * Math.cos(5*Math.PI/4), y: centerY - radius * Math.sin(5*Math.PI/4), radius: 20, color: '#34C759' },
      { id: 'fault', name: '断层', type: 'term', x: centerX + radius * Math.cos(3*Math.PI/2), y: centerY - radius * Math.sin(3*Math.PI/2), radius: 20, color: '#34C759' },
      { id: 'seismic_wave', name: '地震波', type: 'term', x: centerX + radius * Math.cos(7*Math.PI/4), y: centerY - radius * Math.sin(7*Math.PI/4), radius: 20, color: '#34C759' },
      { id: 'epicenter', name: '震中', type: 'term', x: centerX + radius * Math.cos(2*Math.PI/3), y: centerY - radius * Math.sin(2*Math.PI/3), radius: 20, color: '#34C759' },
      { id: 'hypocenter', name: '震源', type: 'term', x: centerX + radius * Math.cos(4*Math.PI/3), y: centerY - radius * Math.sin(4*Math.PI/3), radius: 20, color: '#34C759' },
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
  };
  
  // AI 增强：添加更多节点和连接
  const aiEnhancedNodes = [
    // 更多地震学家（放射状分布）
    { id: 'jeffreys', name: 'Harold Jeffreys', type: 'scientist', x: centerX + radius * Math.cos(Math.PI/6), y: centerY - radius * Math.sin(Math.PI/6), radius: 25, color: '#FF9500' },
    { id: 'lehmann', name: 'Inge Lehmann', type: 'scientist', x: centerX + radius * Math.cos(3*Math.PI/6), y: centerY - radius * Math.sin(3*Math.PI/6), radius: 25, color: '#FF9500' },
    
    // 更多术语（放射状分布）
    { id: 'seismic_moment', name: '地震矩', type: 'term', x: centerX + radius * Math.cos(5*Math.PI/6), y: centerY - radius * Math.sin(5*Math.PI/6), radius: 20, color: '#34C759' },
    { id: 'surface_wave', name: '面波', type: 'term', x: centerX + radius * Math.cos(7*Math.PI/6), y: centerY - radius * Math.sin(7*Math.PI/6), radius: 20, color: '#34C759' },
    { id: 'body_wave', name: '体波', type: 'term', x: centerX + radius * Math.cos(9*Math.PI/6), y: centerY - radius * Math.sin(9*Math.PI/6), radius: 20, color: '#34C759' },
  ];
  
  const aiEnhancedLinks = [
    // 新连接
    { source: 'central', target: 'jeffreys', label: '相关' },
    { source: 'central', target: 'lehmann', label: '相关' },
    { source: 'central', target: 'seismic_moment', label: '包含' },
    { source: 'central', target: 'surface_wave', label: '包含' },
    { source: 'central', target: 'body_wave', label: '包含' },
    { source: 'lehmann', target: 'body_wave', label: '发现' },
    { source: 'kanamori', target: 'seismic_moment', label: '发展' },
  ];
  
  // 合并数据
  return {
    nodes: [...baseData.nodes, ...aiEnhancedNodes],
    links: [...baseData.links, ...aiEnhancedLinks],
  };
};

// AI 搜索功能模拟
const aiSearch = async (query) => {
  // 模拟 AI 处理时间
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 搜索结果
  const results = {
    '里克特': {
      type: 'scientist',
      info: '查尔斯·里克特（1900-1985），美国地震学家，1935年与古腾堡共同提出里克特震级标度。',
      related: ['震级', '古腾堡', '地震学'],
    },
    '查尔斯·里克特': {
      type: 'scientist',
      info: '查尔斯·里克特（1900-1985），美国地震学家，1935年与古腾堡共同提出里克特震级标度。',
      related: ['震级', '古腾堡', '地震学'],
    },
    'richter': {
      type: 'scientist',
      info: 'Charles Richter（1900-1985），American seismologist，co-developed the Richter magnitude scale with Gutenberg in 1935.',
      related: ['Magnitude', 'Gutenberg', 'Seismology'],
    },
    '震级': {
      type: 'term',
      info: '震级是衡量地震大小的标度，常见的有里克特震级、矩震级等。',
      related: ['里克特', '古腾堡', '金森博雄'],
    },
    'magnitude': {
      type: 'term',
      info: 'Magnitude is a measure of the size of an earthquake, commonly including Richter magnitude and moment magnitude.',
      related: ['Richter', 'Gutenberg', 'Kanamori'],
    },
    '地震波': {
      type: 'term',
      info: '地震波是地震时从震源发出的弹性波，包括体波和面波。',
      related: ['Inge Lehmann', 'James Brune', '地震学'],
    },
    'seismic wave': {
      type: 'term',
      info: 'Seismic waves are elastic waves that propagate from the earthquake source, including body waves and surface waves.',
      related: ['Inge Lehmann', 'James Brune', 'Seismology'],
    },
    '断层': {
      type: 'term',
      info: '断层是地壳中岩石破裂并发生相对位移的面。',
      related: ['Chris Scholz', '地震学', '地震'],
    },
    'fault': {
      type: 'term',
      info: 'A fault is a fracture in the Earth\'s crust where rocks on either side have moved relative to each other.',
      related: ['Chris Scholz', 'Seismology', 'Earthquake'],
    },
    '古腾堡': {
      type: 'scientist',
      info: '贝诺·古腾堡（1889-1960），德国地震学家，与里克特共同提出里克特震级标度。',
      related: ['里克特', '震级', '地震学'],
    },
    'gutenberg': {
      type: 'scientist',
      info: 'Beno Gutenberg（1889-1960），German seismologist，co-developed the Richter magnitude scale with Richter.',
      related: ['Richter', 'Magnitude', 'Seismology'],
    },
    '金森博雄': {
      type: 'scientist',
      info: '金森博雄（1936-），日本地震学家，提出了矩震级标度。',
      related: ['震级', '地震矩', '地震学'],
    },
    'kanamori': {
      type: 'scientist',
      info: 'Hiroo Kanamori（1936-），Japanese seismologist，developed the moment magnitude scale.',
      related: ['Magnitude', 'Seismic Moment', 'Seismology'],
    },
    '地震学': {
      type: 'field',
      info: '地震学是研究地震的科学，包括地震的发生机制、传播规律、预测方法等。',
      related: ['地震', '地震波', '震级'],
    },
    'seismology': {
      type: 'field',
      info: 'Seismology is the scientific study of earthquakes, including their mechanisms, propagation规律, and prediction methods.',
      related: ['Earthquake', 'Seismic Waves', 'Magnitude'],
    },
    '地震': {
      type: 'term',
      info: '地震是地壳快速释放能量过程中造成的振动，期间会产生地震波。',
      related: ['地震波', '震级', '断层'],
    },
    'earthquake': {
      type: 'term',
      info: 'An earthquake is the shaking of the surface of the Earth resulting from a sudden release of energy in the Earth\'s lithosphere that creates seismic waves.',
      related: ['Seismic Waves', 'Magnitude', 'Fault'],
    },
  };
  
  // 转换查询为小写
  const lowerQuery = query.toLowerCase();
  
  // 精确匹配
  if (results[lowerQuery]) {
    return results[lowerQuery];
  }
  
  // 模糊匹配
  for (const [key, value] of Object.entries(results)) {
    if (key.toLowerCase().includes(lowerQuery)) {
      return value;
    }
  }
  
  // 未找到结果
  return null;
};

// AI 推荐功能模拟
const aiRecommend = async () => {
  // 模拟 AI 处理时间
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 推荐结果
  return {
    scientists: ['Charles Richter', 'Beno Gutenberg', 'Hiroo Kanamori', 'Inge Lehmann', 'Harold Jeffreys'],
    terms: ['地震矩', '面波', '体波', '地震序列', '地震能量'],
    relationships: ['Richter-Gutenberg 震级标度', 'Lehmann 不连续面', 'Kanamori 矩震级'],
  };
};

export default function AIEnhancedRelationshipMapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [relationshipData, setRelationshipData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const mapRef = useRef(null);

  // 模拟 AI 数据加载
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 生成 AI 增强的数据
        const aiData = generateAIData();
        setRelationshipData(aiData);
        
        // 获取 AI 推荐
        const recs = await aiRecommend();
        setRecommendations(recs);
        
        // 生成 AI 洞察
        setAiInsights('AI 洞察：地震学中的震级标度经历了从 Richter 震级到矩震级的发展，反映了人类对地震能量释放的理解不断深入。');
        
        // 模拟加载时间
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error('Error loading AI data:', error);
        Alert.alert('错误', '加载 AI 数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 处理搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('提示', '请输入搜索内容');
      return;
    }
    
    try {
      setSearchLoading(true);
      const results = await aiSearch(searchQuery);
      if (results) {
        setSearchResults(results);
      } else {
        Alert.alert('提示', '未找到相关结果，请尝试其他关键词');
      }
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('错误', '搜索失败，请重试');
    } finally {
      setSearchLoading(false);
    }
  };

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
    if (!relationshipData) return null;
    
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
          <Text style={styles.loadingText}>AI 正在分析地震学关系...</Text>
          <Text style={styles.loadingSubtext}>这可能需要几秒钟时间</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI 增强关系图谱</Text>
        <TouchableOpacity style={styles.aiButton}>
          <Ionicons name="sparkles" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {/* AI 洞察 */}
      {aiInsights && (
        <View style={styles.aiInsightsContainer}>
          <Ionicons name="bulb" size={20} color="#FFD700" style={styles.aiInsightsIcon} />
          <Text style={styles.aiInsightsText}>{aiInsights}</Text>
        </View>
      )}

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索地震学家或术语..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchLoading ? (
          <ActivityIndicator size="small" color="#007AFF" style={styles.searchLoading} />
        ) : (
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Ionicons name="send" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* 搜索结果 */}
      {searchResults && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsTitle}>AI 搜索结果</Text>
          <Text style={styles.searchResultsType}>{searchResults.type === 'scientist' ? '地震学家' : '地震学术语'}</Text>
          <Text style={styles.searchResultsInfo}>{searchResults.info}</Text>
          <Text style={styles.searchResultsRelated}>相关概念:</Text>
          <View style={styles.searchResultsRelatedList}>
            {searchResults.related.map((item, index) => (
              <TouchableOpacity key={index} style={styles.relatedItem}>
                <Text style={styles.relatedItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.closeResultsButton} onPress={() => setSearchResults(null)}>
            <Text style={styles.closeResultsButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 推荐部分 - 三列布局 */}
      {recommendations && (
        <View style={styles.recommendationsContainer}>
          {/* 推荐科学家 */}
          <View style={styles.recommendationColumn}>
            <Text style={styles.sectionTitle}>AI 推荐专家</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.columnScroll}>
              {recommendations.scientists.map((scientist, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.recommendedItem}
                  onPress={() => navigation.navigate('RelationshipDetail', { selectedItem: { type: 'scientist', name: scientist } })}
                >
                  <Text style={styles.recommendedItemText}>{scientist}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 推荐术语 */}
          <View style={styles.recommendationColumn}>
            <Text style={styles.sectionTitle}>AI 推荐术语</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.columnScroll}>
              {recommendations.terms.map((term, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.recommendedItem}
                  onPress={() => navigation.navigate('RelationshipDetail', { selectedItem: { type: 'term', name: term } })}
                >
                  <Text style={styles.recommendedItemText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 推荐关系 */}
          <View style={styles.recommendationColumn}>
            <Text style={styles.sectionTitle}>AI 推荐关系</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.columnScroll}>
              {recommendations.relationships.map((relationship, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.recommendedItem, styles.relationshipItem]}
                  onPress={() => navigation.navigate('RelationshipDetail', { selectedItem: { type: 'relationship', name: relationship } })}
                >
                  <Text style={styles.recommendedItemText}>{relationship}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}



      {/* 选中节点信息 */}
      {selectedNode && (
        <View style={[styles.selectedInfo, { paddingBottom: insets.bottom + 10 }]}>
          <Text style={styles.selectedTitle}>{selectedNode.name}</Text>
          <Text style={styles.selectedType}>
            类型: {selectedNode.type === 'central' ? '中心主题' : 
                   selectedNode.type === 'scientist' ? '地震学家' : '地震学术语'}
          </Text>
          {selectedNode.type === 'scientist' && (
            <Text style={styles.selectedDescription}>
              点击了解更多关于这位地震学家的贡献
            </Text>
          )}
          {selectedNode.type === 'term' && (
            <Text style={styles.selectedDescription}>
              点击了解更多关于这个地震学术语的定义和应用
            </Text>
          )}
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
  aiButton: {
    padding: 8,
  },
  aiInsightsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  aiInsightsIcon: {
    marginRight: 8,
  },
  aiInsightsText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  searchButton: {
    padding: 4,
  },
  searchLoading: {
    marginLeft: 8,
  },
  searchResultsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  searchResultsType: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  searchResultsInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  searchResultsRelated: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  searchResultsRelatedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  relatedItem: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  relatedItemText: {
    fontSize: 12,
    color: '#333',
  },
  closeResultsButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  closeResultsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  recommendationsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  recommendationColumn: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 10,
  },
  columnScroll: {
    maxHeight: 150,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },

  recommendedItem: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  relationshipItem: {
    backgroundColor: '#E3F2FD',
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
    marginBottom: 8,
  },
  selectedDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
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
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

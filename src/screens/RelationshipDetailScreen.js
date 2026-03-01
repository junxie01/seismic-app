// 修改 RelationshipDetailScreen.js 文件
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 固定屏幕尺寸值
const width = 375;
const height = 667;

// 生成关系数据
const generateRelationshipData = (selectedItem) => {
  if (selectedItem.type === 'scientist') {
    return {
      centralNode: {
        id: 'central',
        name: selectedItem.name,
        type: 'scientist',
        color: '#007AFF',
      },
      relationships: [
        {
          category: '单位',
          color: '#FF9500',
          items: [
            { id: 'univ1', name: '加州理工学院', type: 'affiliation' },
          ],
        },
        {
          category: '师承',
          color: '#FF9500',
          items: [
            { id: 'mentor1', name: '宾诺·古登堡', type: 'scientist' },
          ],
        },
        {
          category: '弟子',
          color: '#FF9500',
          items: [
            { id: 'student1', name: '布鲁斯·博尔特', type: 'scientist' },
          ],
        },
        {
          category: '研究领域',
          color: '#5856D6',
          items: [
            { id: 'field1', name: '地震学', type: 'field' },
            { id: 'field2', name: '震级测定', type: 'field' },
          ],
        },
        {
          category: '成就',
          color: '#FF2D55',
          items: [
            { id: 'ach1', name: '里克特震级', type: 'achievement' },
            { id: 'ach2', name: '古腾堡-里克特定律', type: 'achievement' },
          ],
        },
        {
          category: '主要论文',
          color: '#34AADC',
          items: [
            { id: 'paper1', name: '震级标度', type: 'paper' },
            { id: 'paper2', name: '地震能量', type: 'paper' },
          ],
        },
      ],
    };
  } else if (selectedItem.type === 'term') {
    return {
      centralNode: {
        id: 'central',
        name: selectedItem.name,
        type: 'term',
        color: '#4ECDC4',
      },
      relationships: [
        {
          category: '定义',
          color: '#34C759',
          items: [
            { id: 'def1', name: '基本定义', type: 'detail' },
          ],
        },
        {
          category: '关联',
          color: '#34C759',
          items: [
            { id: 'rel1', name: '相关术语', type: 'term' },
          ],
        },
        {
          category: '影响',
          color: '#34C759',
          items: [
            { id: 'imp1', name: '科学影响', type: 'detail' },
          ],
        },
        {
          category: '主要论文',
          color: '#34AADC',
          items: [
            { id: 'paper1', name: '相关研究', type: 'paper' },
          ],
        },
      ],
    };
  }
  return {
    centralNode: {
      id: 'central',
      name: selectedItem.name,
      type: 'relationship',
      color: '#45B7D1',
    },
    relationships: [
      {
        category: '背景',
        color: '#5856D6',
        items: [
          { id: 'bg1', name: '历史背景', type: 'detail' },
        ],
      },
      {
        category: '意义',
        color: '#5856D6',
        items: [
          { id: 'sig1', name: '重要性', type: 'detail' },
        ],
      },
    ],
  };
};

export default function RelationshipDetailScreen({ route, navigation }) {
  const { selectedItem } = route.params;
  const insets = useSafeAreaInsets();
  const [relationshipData, setRelationshipData] = useState(null);

  useEffect(() => {
    const data = generateRelationshipData(selectedItem);
    setRelationshipData(data);
  }, [selectedItem]);

  // 处理节点点击
  const handleNodePress = (node) => {
    const newSelectedItem = {
      name: node.name,
      type: node.type,
    };
    navigation.replace('RelationshipDetail', { selectedItem: newSelectedItem });
  };

  if (!relationshipData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载关系数据中...</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>{selectedItem.name} 关系网络</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 关系图谱 */}
      <ScrollView style={styles.graphContainer}>
        {/* 中心节点 */}
        <View style={styles.centralNodeContainer}>
          <View
            style={[
              styles.node,
              { backgroundColor: relationshipData.centralNode.color },
            ]}
          >
            <Text style={styles.nodeText}>{relationshipData.centralNode.name}</Text>
          </View>
        </View>

        {/* 关系类别 */}
        {relationshipData.relationships.map((category, index) => (
          <View key={index} style={styles.categoryContainer}>
            <View
              style={[
                styles.categoryHeader,
                { backgroundColor: category.color },
              ]}
            >
              <Text style={styles.categoryText}>{category.category}</Text>
            </View>
            <View style={styles.itemsContainer}>
              {category.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.itemNode}
                  onPress={() => handleNodePress(item)}
                >
                  <Text style={styles.itemText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
  },
  graphContainer: {
    flex: 1,
    padding: 16,
  },
  centralNodeContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  node: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 20,
  },
  itemNode: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  itemText: {
    color: '#fff',
    fontSize: 12,
  },
});
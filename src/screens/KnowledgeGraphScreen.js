import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 固定屏幕尺寸值
const width = 375;
const height = 667;

export default function KnowledgeGraphScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // 调用千问AI API进行智能搜索理解
  const callQianwenAI = async (query) => {
    try {
      // 千问AI API调用（实际使用时需要替换为真实API调用）
      console.log('Calling Qianwen AI for:', query);
      
      // 构建千问AI的提示
      const prompt = `请分析以下用户查询，识别其意图和实体，并返回结构化的JSON数据：

用户查询：${query}

意图类型包括：
- scholar_search：搜索学者
- term_search：搜索术语
- relationship_query：查询关系（如师承、合作）
- general_search：通用搜索

请返回以下格式的JSON：
{
  "intent": "意图类型",
  "entities": {
    "scholar": "学者名称",
    "term": "术语名称",
    "relationship": "关系类型",
    "subject": "主体"
  },
  "confidence": 0.95,
  "suggestions": [
    "建议1",
    "建议2",
    "建议3"
  ]
}

请严格按照JSON格式返回，不要包含其他内容。`;
      
      // 模拟千问AI API响应（实际使用时替换为真实API调用）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟千问AI解析结果
      const mockResponse = {
        intent: query.includes('院士') || query.includes('教授') || query.includes('学者') ? 'scholar_search' : 
                query.includes('术语') || query.includes('概念') ? 'term_search' :
                query.includes('关系') || query.includes('学生') || query.includes('导师') ? 'relationship_query' :
                'general_search',
        entities: {
          scholar: query.includes('院士') || query.includes('教授') ? query : null,
          term: query.includes('术语') || query.includes('概念') ? query : null,
          relationship: query.includes('关系') || query.includes('学生') || query.includes('导师') ? '师承关系' : null,
          subject: query
        },
        confidence: 0.95,
        suggestions: [
          `${query}的学术网络`,
          `${query}的代表作`,
          `${query}的师承关系`
        ]
      };
      
      return mockResponse;
    } catch (error) {
      console.error('Error calling Qianwen AI:', error);
      return null;
    }
  };

  // 解析AI结果
  const parseAIResult = (aiResult) => {
    if (!aiResult) return null;
    
    // 提取实体和意图
    const intent = aiResult.intent || 'general_search';
    const entities = aiResult.entities || {};
    
    return {
      intent,
      entities,
      confidence: aiResult.confidence || 0.5,
      suggestions: aiResult.suggestions || []
    };
  };

  // 处理搜索
  const handleSearch = async () => {
    if (searchQuery) {
      setLoading(true);
      try {
        console.log('Searching for:', searchQuery);
        
        // 1. 调用千问AI理解用户查询
        const aiResult = await callQianwenAI(searchQuery);
        
        if (aiResult) {
          // 2. 解析AI结果
          const structuredResult = parseAIResult(aiResult);
          console.log('AI解析结果:', structuredResult);
          
          // 3. 根据AI解析的意图执行不同的搜索策略
          if (structuredResult.intent === 'scholar_search' && structuredResult.entities.scholar) {
            // 搜索学者
            navigation.navigate('KnowledgeGraphDetail', {
              searchQuery: structuredResult.entities.scholar,
              aiEnhanced: true,
              context: structuredResult
            });
          } else if (structuredResult.intent === 'term_search' && structuredResult.entities.term) {
            // 搜索术语
            navigation.navigate('KnowledgeGraphDetail', {
              searchQuery: structuredResult.entities.term,
              aiEnhanced: true,
              context: structuredResult
            });
          } else if (structuredResult.intent === 'relationship_query') {
            // 查询关系（如师承、合作）
            navigation.navigate('KnowledgeGraphDetail', {
              searchQuery: structuredResult.entities.subject || searchQuery,
              aiEnhanced: true,
              relationship: structuredResult.entities.relationship,
              context: structuredResult
            });
          } else {
            // 通用搜索
            navigation.navigate('KnowledgeGraphDetail', {
              searchQuery,
              aiEnhanced: true,
              context: structuredResult
            });
          }
        } else {
          // AI失败时回退到传统搜索
          navigation.navigate('KnowledgeGraphDetail', { searchQuery });
        }
      } catch (error) {
        console.error('Error in AI-enhanced search:', error);
        // 错误时回退到传统搜索
        navigation.navigate('KnowledgeGraphDetail', { searchQuery });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>


      {/* 搜索区域 */}
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>智能搜索</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索学者、术语或研究方向..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="send" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.searchHint}>例如: 陈颙院士、李四光、钱学森</Text>
      </View>



      {/* 学者信息功能 */}
      <TouchableOpacity 
        style={styles.teacherStudentChainSection} 
        onPress={() => {
          // 导航到学者信息详情页，并传入默认学者陈颙院士
          navigation.navigate('KnowledgeGraphDetail', { 
            searchQuery: '陈颙院士',
            aiEnhanced: true,
            feature: 'teacherStudentChain'
          });
        }}
      >
        <View style={styles.teacherStudentChainContent}>
          <View style={styles.teacherStudentChainIconContainer}>
            <Ionicons name="people" size={48} color="#9C27B0" />
          </View>
          <View style={styles.teacherStudentChainInfo}>
            <Text style={styles.teacherStudentChainTitle}>学者信息</Text>
            <Text style={styles.teacherStudentChainDescription}>探索学者信息，管理学者间的关系网络，支持编辑和添加新学者</Text>
            <View style={styles.teacherStudentChainButton}>
              <Text style={styles.teacherStudentChainButtonText}>开始探索</Text>
              <Ionicons name="arrow-forward" size={20} color="#9C27B0" />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* 底部说明 */}
      <View style={styles.footer}>

      </View>
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
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  aiButton: {
    padding: 8,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  searchButton: {
    padding: 8,
  },
  searchHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  quickAccessSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#F2F2F7',
  },
  quickAccessScroll: {
    marginHorizontal: -4,
  },
  quickAccessItem: {
    alignItems: 'center',
    marginRight: 24,
    width: 100,
  },
  quickAccessIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickAccessSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  featureItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  teacherStudentChainSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  teacherStudentChainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherStudentChainIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  teacherStudentChainInfo: {
    flex: 1,
  },
  teacherStudentChainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9C27B0',
    marginBottom: 8,
  },
  teacherStudentChainDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  teacherStudentChainButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherStudentChainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9C27B0',
    marginRight: 8,
  },
});

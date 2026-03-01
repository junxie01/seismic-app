import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockScholars } from '../constants/mockData';
import ScholarGraph from '../components/ScholarGraph';

const KnowledgeScreen = () => {
  const [viewMode, setViewMode] = useState('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [scholars, setScholars] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentScholar, setCurrentScholar] = useState(null);
  const [expandedScholarId, setExpandedScholarId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    affiliation: '',
    research: '',
    bio: '',
    papers: '',
    citations: '',
    advisor: '',
    students: '',
  });
  const [loading, setLoading] = useState(true);

  // 从AsyncStorage加载学者数据
  useEffect(() => {
    const loadScholars = async () => {
      try {
        const storedScholars = await AsyncStorage.getItem('scholars');
        if (storedScholars) {
          setScholars(JSON.parse(storedScholars));
        } else {
          // 首次加载时使用默认数据
          setScholars(mockScholars);
          await AsyncStorage.setItem('scholars', JSON.stringify(mockScholars));
        }
      } catch (error) {
        console.error('Error loading scholars:', error);
        setScholars(mockScholars);
      } finally {
        setLoading(false);
      }
    };

    loadScholars();
  }, []);

  // 保存学者数据到AsyncStorage
  const saveScholarsToStorage = async (updatedScholars) => {
    try {
      await AsyncStorage.setItem('scholars', JSON.stringify(updatedScholars));
    } catch (error) {
      console.error('Error saving scholars:', error);
    }
  };

  const handleEditPress = (scholar) => {
    setCurrentScholar(scholar);
    setEditForm({
      name: scholar.name,
      affiliation: scholar.affiliation,
      research: scholar.research,
      bio: scholar.bio,
      papers: scholar.papers.toString(),
      citations: scholar.citations.toString(),
      advisor: scholar.advisor || '',
      students: scholar.students || '',
    });
    setShowEditModal(true);
  };

  const handleDeletePress = (scholarId) => {
    const updatedScholars = scholars.filter(scholar => scholar.id !== scholarId);
    setScholars(updatedScholars);
    saveScholarsToStorage(updatedScholars);
  };

  const handleAddScholar = () => {
    const newScholar = {
      id: scholars.length + 1,
      name: '新学者',
      affiliation: '未知机构',
      research: '研究方向',
      bio: '学者简介',
      papers: 0,
      citations: 0,
      advisor: '',
      students: '',
    };
    const updatedScholars = [...scholars, newScholar];
    setScholars(updatedScholars);
    saveScholarsToStorage(updatedScholars);
    handleEditPress(newScholar);
  };

  const handleSaveEdit = () => {
    if (currentScholar) {
      const updatedScholars = scholars.map(scholar => 
        scholar.id === currentScholar.id ? {
          ...scholar,
          ...editForm,
          papers: parseInt(editForm.papers) || 0,
          citations: parseInt(editForm.citations) || 0,
        } : scholar
      );
      setScholars(updatedScholars);
      saveScholarsToStorage(updatedScholars);
    }
    setShowEditModal(false);
  };

  const handleInputChange = (field, value) => {
    setEditForm({
      ...editForm,
      [field]: value,
    });
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewButton, styles.selectedViewButton]}
          onPress={() => setViewMode(viewMode === 'graph' ? 'list' : 'graph')}
        >
          <Ionicons name={viewMode === 'graph' ? "list-outline" : "grid-outline"} size={16} color="white" />
          <Text style={styles.selectedViewButtonText}>{viewMode === 'graph' ? '列表' : '图谱'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewButton} onPress={handleAddScholar}>
          <Ionicons name="person-add-outline" size={16} color="#666" />
          <Text style={styles.viewButtonText}>添加学者</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'list' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="输入学者姓名进行搜索"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Ionicons name="search" size={28} color="#992683" style={styles.searchActionIcon} />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载学者数据...</Text>
        </View>
      ) : viewMode === 'graph' ? (
        <View style={styles.graphContainer}>
          <Text style={styles.graphTitle}>学者关系图谱</Text>
          <ScholarGraph scholars={scholars} onEditScholar={handleEditPress} />
        </View>
      ) : (
        <ScrollView style={styles.scholarList}>
          {/* 按姓氏拼音排序 */}
          {[...scholars].sort((a, b) => {
            // 确保使用中文排序
            return new Intl.Collator('zh-CN').compare(a.name, b.name);
          }).map((scholar) => (
            <TouchableOpacity 
              key={scholar.id} 
              style={styles.scholarCard}
              onPress={() => setExpandedScholarId(expandedScholarId === scholar.id ? null : scholar.id)}
              activeOpacity={0.7}
            >
              <View style={styles.scholarHeader}>
                <View style={styles.scholarInfo}>
                  <Text style={styles.scholarName}>{scholar.name}</Text>
                  <Text style={styles.scholarAffiliation}>{scholar.affiliation}</Text>
                </View>
                <View style={styles.scholarActions}>
                  <TouchableOpacity 
                    style={styles.scholarActionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditPress(scholar);
                    }}
                  >
                    <Ionicons name="create-outline" size={24} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.scholarActionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeletePress(scholar.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                  <Ionicons 
                    name={expandedScholarId === scholar.id ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color="#999" 
                  />
                </View>
              </View>
              
              {expandedScholarId === scholar.id && (
                <View style={styles.scholarDetailsContainer}>
                  <View style={styles.scholarStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{scholar.papers}</Text>
                      <Text style={styles.statLabel}>论文</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{scholar.citations}</Text>
                      <Text style={styles.statLabel}>引用</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.scholarBio}>{scholar.bio}</Text>
                  
                  <View style={styles.scholarDetails}>
                    <Text style={styles.scholarDetail}>研究方向: {scholar.research}</Text>
                    <Text style={styles.scholarDetail}>所属机构: {scholar.affiliation}</Text>
                    {scholar.advisor && <Text style={styles.scholarDetail}>导师: {scholar.advisor}</Text>}
                    {scholar.students && <Text style={styles.scholarDetail}>弟子: {scholar.students}</Text>}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {showEditModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{currentScholar ? '编辑学者信息' : '添加学者'}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>姓名</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="输入学者姓名"
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>所属机构</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.affiliation}
                  onChangeText={(value) => handleInputChange('affiliation', value)}
                  placeholder="输入所属机构"
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>研究方向</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.research}
                  onChangeText={(value) => handleInputChange('research', value)}
                  placeholder="输入研究方向"
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>简介</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={editForm.bio}
                  onChangeText={(value) => handleInputChange('bio', value)}
                  placeholder="输入学者简介"
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>论文数量</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.papers}
                  onChangeText={(value) => handleInputChange('papers', value)}
                  placeholder="输入论文数量"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>引用次数</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.citations}
                  onChangeText={(value) => handleInputChange('citations', value)}
                  placeholder="输入引用次数"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>导师</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.advisor}
                  onChangeText={(value) => handleInputChange('advisor', value)}
                  placeholder="输入导师姓名"
                />
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>弟子</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={editForm.students}
                  onChangeText={(value) => handleInputChange('students', value)}
                  placeholder="输入弟子姓名，多个用逗号分隔"
                  multiline
                  numberOfLines={3}
                />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexWrap: 'wrap',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    minWidth: 140,
    marginRight: 12,
    marginBottom: 8,
  },
  selectedViewButton: {
    backgroundColor: '#007AFF',
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginLeft: 6,
  },
  selectedViewButtonText: {
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  searchActionIcon: {
    marginLeft: 12,
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
  graphContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  scholarNetwork: {
    flex: 1,
    position: 'relative',
  },
  scholarNode: {
    position: 'absolute',
    alignItems: 'center',
  },
  scholarCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#992683',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scholarCircleText: {
    fontSize: 26,
    fontWeight: '700',
    color: 'white',
  },
  scholarNodeName: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  scholarList: {
    flex: 1,
  },
  scholarCard: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  scholarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scholarInfo: {
    flex: 1,
  },
  scholarName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  scholarAffiliation: {
    fontSize: 15,
    color: '#666',
  },
  scholarResearch: {
    fontSize: 15,
    color: '#FF3B30',
    marginBottom: 16,
  },
  scholarActions: {
    flexDirection: 'row',
    gap: 16,
  },
  scholarActionButton: {
    padding: 8,
  },
  scholarStats: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scholarBio: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
  },
  scholarDetails: {
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  scholarDetail: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  scholarDetailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
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
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  modalBody: {
    padding: 20,
  },
  formItem: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#000',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default KnowledgeScreen;

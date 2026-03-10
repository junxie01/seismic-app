import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase, getScholars, storeScholars } from '../utils/DatabaseManager';
import { mockScholars } from '../constants/mockData';
import ScholarGraph from '../components/ScholarGraph';

const KnowledgeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scholars, setScholars] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentScholar, setCurrentScholar] = useState(null);
  const [selectedScholarId, setSelectedScholarId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editForm, setEditForm] = useState({
    name: '', affiliation: '', research: '', bio: '',
    papers: '', citations: '', advisor: '', students: '',
    influence: '', career: '', relationship: '', other: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await initDatabase();
      const data = await getScholars();
      setScholars(data.length > 0 ? data : mockScholars);
    } catch (e) { Alert.alert('错误', '无法加载数据'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveEdit = async () => {
    if (!editForm.name) { Alert.alert('提示', '姓名不能为空'); return; }
    const updatedScholar = {
      ...currentScholar,
      ...editForm,
      id: currentScholar?.id || Date.now().toString(),
      papers: parseInt(editForm.papers) || 0,
      citations: parseInt(editForm.citations) || 0,
    };
    const newScholars = currentScholar
      ? scholars.map(s => s.id === currentScholar.id ? updatedScholar : s)
      : [...scholars, updatedScholar];
    try {
      await storeScholars(newScholars);
      setScholars(newScholars);
      setShowEditModal(false);
    } catch (e) { Alert.alert('保存失败'); }
  };

  const openEdit = (s = null) => {
    const scholarToEdit = s || scholars.find(sc => sc.id === selectedScholarId);
    setCurrentScholar(scholarToEdit);
    setEditForm({
      name: scholarToEdit?.name || '',
      affiliation: scholarToEdit?.affiliation || '',
      research: scholarToEdit?.research || '',
      bio: scholarToEdit?.bio || '',
      papers: scholarToEdit?.papers?.toString() || '0',
      citations: scholarToEdit?.citations?.toString() || '0',
      advisor: scholarToEdit?.advisor || '',
      students: scholarToEdit?.students || '',
      influence: scholarToEdit?.influence || '',
      career: scholarToEdit?.career || '',
      relationship: scholarToEdit?.relationship || '',
      other: scholarToEdit?.other || ''
    });
    setShowEditModal(true);
  };

  const filteredScholars = scholars.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* 纠正：调整搜索框高度和边距，使其不显宽 */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={14} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="查找学者"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => openEdit()}>
          <Ionicons name="add-circle" size={30} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" style={{marginTop: 50}} /> :
        selectedScholarId ? (
          <View style={styles.graphView}>
            <View style={styles.graphHeader}>
              <TouchableOpacity style={styles.graphBtn} onPress={() => setSelectedScholarId(null)}>
                <Ionicons name="arrow-back" size={18} color="#007AFF" /><Text style={styles.btnText}>返回列表</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.graphBtn} onPress={() => openEdit()}>
                <Ionicons name="create-outline" size={18} color="#007AFF" /><Text style={styles.btnText}>编辑学者</Text>
              </TouchableOpacity>
            </View>
            <ScholarGraph scholars={scholars} selectedScholarId={selectedScholarId} onEditScholar={openEdit} />
          </View>
        ) : (
          <ScrollView style={styles.list}>
            {filteredScholars.map(s => (
              <TouchableOpacity key={s.id} style={styles.card} onPress={() => setSelectedScholarId(s.id)}>
                <View style={{flex:1}}>
                  <Text style={styles.name}>{s.name}</Text>
                  <Text style={styles.sub}>{s.affiliation} · {s.research}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CCC" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      }

      <Modal visible={showEditModal} animationType="slide">
        {/* 纠正：增加头部 Padding 防止被刘海遮挡 */}
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{currentScholar ? '编辑学者' : '新增学者'}</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.form}>
            <Text style={styles.label}>基础信息</Text>
            <TextInput style={styles.input} placeholder="姓名" value={editForm.name} onChangeText={t => setEditForm({...editForm, name: t})} />
            <TextInput style={styles.input} placeholder="机构" value={editForm.affiliation} onChangeText={t => setEditForm({...editForm, affiliation: t})} />
            <TextInput style={styles.input} placeholder="研究方向" value={editForm.research} onChangeText={t => setEditForm({...editForm, research: t})} />

            <Text style={styles.label}>图谱核心维度</Text>
            <TextInput style={styles.input} placeholder="师承 (Advisor)" value={editForm.advisor} onChangeText={t => setEditForm({...editForm, advisor: t})} />
            <TextInput style={styles.input} placeholder="弟子 (Students)" value={editForm.students} onChangeText={t => setEditForm({...editForm, students: t})} />
            <TextInput style={[styles.input, styles.area]} placeholder="影响 (Influence)" multiline value={editForm.influence} onChangeText={t => setEditForm({...editForm, influence: t})} />
            <TextInput style={[styles.input, styles.area]} placeholder="事业 (Career)" multiline value={editForm.career} onChangeText={t => setEditForm({...editForm, career: t})} />
            <TextInput style={[styles.input, styles.area]} placeholder="关系 (Relationship)" multiline value={editForm.relationship} onChangeText={t => setEditForm({...editForm, relationship: t})} />
            <TextInput style={[styles.input, styles.area]} placeholder="其他 (Other)" multiline value={editForm.other} onChangeText={t => setEditForm({...editForm, other: t})} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}><Text style={styles.saveBtnText}>保存信息</Text></TouchableOpacity>
            <View style={{height: 40}} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  // 纠正：固定高度 36，内边距缩小，视觉对齐
  searchBox: { width: 140, height: 36, flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, paddingHorizontal: 10, alignItems: 'center' },
  searchInput: { flex: 1, marginLeft: 5, fontSize: 13, color: '#333', padding: 0 },
  addBtn: { marginLeft: 'auto' },
  list: { padding: 15 },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  name: { fontSize: 15, fontWeight: 'bold' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  graphView: { flex: 1, backgroundColor: '#FFF' },
  graphHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  graphBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  btnText: { marginLeft: 5, color: '#007AFF', fontSize: 13, fontWeight: '600' },

  modalContent: { flex: 1, backgroundColor: '#F8F8F8' },
  // 纠正：添加 40px 的 paddingTop，解决按钮顶格无法点击的问题
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, paddingTop: 45, backgroundColor: '#FFF', borderBottomWidth: 0.5, borderBottomColor: '#DDD', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: 'bold' },
  cancelText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
  form: { padding: 20 },
  label: { fontSize: 12, color: '#999', marginBottom: 8, marginTop: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 14, borderWidth: 0.5, borderColor: '#DDD' },
  area: { height: 60, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#007AFF', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 15 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

export default KnowledgeScreen;

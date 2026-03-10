import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase, storeJournalData, getJournalData } from '../utils/DatabaseManager';

// 核心期刊列表：应用启动时立刻显示
const TARGET_JOURNALS = [
  { id: 'jgr', name: 'JGR: Solid Earth', abbr: 'JGR', issn: '2169-9313' },
  { id: 'grl', name: 'Geophysical Research Letters', abbr: 'GRL', issn: '1944-8007' },
  { id: 'epsl', name: 'Earth and Planetary Science Letters', abbr: 'EPSL', issn: '0012-821X' },
  { id: 'gji', name: 'Geophysical Journal International', abbr: 'GJI', issn: '1365-246X' }
];

const JournalScreen = () => {
  const [journals, setJournals] = useState(TARGET_JOURNALS);
  const [papers, setPapers] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(TARGET_JOURNALS[0]);
  const [loadingStates, setLoadingStates] = useState({}); // 分别跟踪每个期刊的加载状态
  const [selectedPaper, setSelectedPaper] = useState(null); // 当前选中的论文
  const [showDetailModal, setShowDetailModal] = useState(false); // 详情模态框
  const [showLinkModal, setShowLinkModal] = useState(false); // 链接确认模态框
  const [linkToOpen, setLinkToOpen] = useState(null); // 待打开的链接

  // 新的数据同步引擎：为每个期刊独立发起精准请求
  const syncJournals = useCallback(async () => {
    const newLoadingStates = {};
    TARGET_JOURNALS.forEach(j => { newLoadingStates[j.id] = true; });
    setLoadingStates(newLoadingStates);

    try {
      const fetchPromises = TARGET_JOURNALS.map(journal =>
        fetch(`https://api.crossref.org/journals/${journal.issn}/works?rows=10&sort=published&order=desc`)
          .then(res => res.ok ? res.json() : Promise.reject('API Error'))
      );

      const results = await Promise.allSettled(fetchPromises);
      const allPapers = [];

      results.forEach((result, index) => {
        const journalId = TARGET_JOURNALS[index].id;
        if (result.status === 'fulfilled') {
          const fetchedPapers = result.value.message.items.map((item, pIndex) => ({
            id: `${journalId}-${pIndex}`,
            journalId: journalId,
            title: item.title?.[0] || 'Untitled',
            authors: item.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()).join(', ') || 'Unknown',
            date: item.published?.['date-parts']?.[0]?.join('-') || 'N/A',
            abstract: (item.abstract || '暂无摘要').replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
            url: item.URL || `https://doi.org/${item.DOI}`,
            doi: item.DOI || 'N/A',
            citations: item['is-referenced-by-count'] || 0,
            volume: item.volume || 'N/A',
            issue: item.issue || 'N/A',
            pages: item.page || 'N/A',
          }));
          allPapers.push(...fetchedPapers);
        }
        // 更新加载状态
        setLoadingStates(prev => ({ ...prev, [journalId]: false }));
      });

      if (allPapers.length > 0) {
        setPapers(allPapers);
        await storeJournalData(TARGET_JOURNALS, allPapers);
      }

    } catch (error) {
      Alert.alert("网络错误", "无法从学术网络同步最新文章，请稍后重试。");
      setLoadingStates({});
    }
  }, []);

  // 初始化时加载本地数据，然后尝试同步
  useEffect(() => {
    const loadInitialData = async () => {
      await initDatabase();
      const stored = await getJournalData();
      if (stored.papers.length > 0) {
        setJournals(stored.journals);
        setPapers(stored.papers);
      }
      // 无论如何都去同步一次
      syncJournals();
    };
    loadInitialData();
  }, [syncJournals]);

  const currentPapers = papers.filter(p => p.journalId === selectedJournal?.id);
  const isLoading = loadingStates[selectedJournal?.id];

  // 处理论文卡片点击  
  const handlePaperPress = (paper) => {
    setSelectedPaper(paper);
    setShowDetailModal(true);
  };

  // 处理打开链接  
  const handleOpenLink = (url) => {
    setLinkToOpen(url);
    setShowLinkModal(true);
  };

  // 确认打开链接
  const confirmOpenLink = async () => {
    if (linkToOpen) {
      try {
        const canOpen = await Linking.canOpenURL(linkToOpen);
        if (canOpen) {
          await Linking.openURL(linkToOpen);
        } else {
          Alert.alert("无法打开链接", "您的设备无法打开此链接");
        }
      } catch (error) {
        Alert.alert("错误", "打开链接时出错: " + error.message);
      }
    }
    setShowLinkModal(false);
    setLinkToOpen(null);
  };

  return (
    <View style={styles.container}>
      {/* 期刊标签栏 */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {journals.map(j => (
            <TouchableOpacity
              key={j.id}
              style={[styles.tab, selectedJournal?.id === j.id && styles.activeTab]}
              onPress={() => {
                setSelectedJournal(j);
                setShowDetailModal(false);
              }}>
              <Text style={[styles.tabText, selectedJournal?.id === j.id && styles.activeTabText]}>{j.abbr}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 论文列表 */}
      <ScrollView style={styles.contentList}>
        {selectedJournal && (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{selectedJournal.name}</Text>
            {isLoading && <ActivityIndicator size="small" color="#1E90FF" />}
          </View>
        )}

        {currentPapers.length > 0 ? (
          currentPapers.map(p => (
            <TouchableOpacity 
              key={p.id} 
              style={styles.paperCard} 
              onPress={() => handlePaperPress(p)}
              activeOpacity={0.7}>
              <View style={styles.paperCardContent}>
                <Text style={styles.paperDate}>{p.date}</Text>
                <Text style={styles.paperTitle} numberOfLines={2}>{p.title}</Text>
                <Text style={styles.paperAuthors} numberOfLines={1}>{p.authors}</Text>
                <View style={styles.cardFooter}>
                  <View />
                  <Ionicons name="chevron-forward" size={18} color="#1E90FF" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyView}>
            {isLoading ?
              <Text style={styles.emptyText}>正在连接学术网络，请稍候...</Text> :
              <Text style={styles.emptyText}>该期刊暂无在线文章或网络连接失败</Text>}
          </View>
        )}
      </ScrollView>

      {/* 论文详情模态框 */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>论文详情</Text>
            <View style={styles.closeButton} />
          </View>
          
          {selectedPaper && (
            <ScrollView style={styles.modalContent}>
              {/* 标题 */}
              <Text style={styles.detailTitle}>{selectedPaper.title}</Text>
              
              {/* 作者和日期 */}
              <View style={styles.detailMeta}>
                <Text style={styles.metaLabel}>作者：</Text>
                <Text style={styles.metaValue}>{selectedPaper.authors}</Text>
              </View>
              
              <View style={styles.detailMeta}>
                <Text style={styles.metaLabel}>发布时间：</Text>
                <Text style={styles.metaValue}>{selectedPaper.date}</Text>
              </View>
              
              {/* 期刊信息 */}
              <View style={styles.detailRow}>
                <View style={styles.detailColumn}>
                  <Text style={styles.metaLabel}>卷号</Text>
                  <Text style={styles.metaValue}>{selectedPaper.volume}</Text>
                </View>
                <View style={styles.detailColumn}>
                  <Text style={styles.metaLabel}>期号</Text>
                  <Text style={styles.metaValue}>{selectedPaper.issue}</Text>
                </View>
                <View style={styles.detailColumn}>
                  <Text style={styles.metaLabel}>页码</Text>
                  <Text style={styles.metaValue}>{selectedPaper.pages}</Text>
                </View>
              </View>

              {/* POI */}
              {selectedPaper.doi !== 'N/A' && (
                <View style={styles.doiView}>
                  <Text style={styles.metaLabel}>DOI:</Text>
                  <Text style={styles.doiValue}>{selectedPaper.doi}</Text>
                </View>
              )}

              {/* 摘要 */}
              <View style={styles.abstractSection}>
                <Text style={styles.sectionTitle}>摘要</Text>
                <Text style={styles.abstractText}>
                  {selectedPaper.abstract === '暂无摘要' 
                    ? selectedPaper.abstract 
                    : selectedPaper.abstract}
                </Text>
              </View>

              {/* 打开链接按钮 */}
              <TouchableOpacity 
                style={styles.openLinkButton}
                onPress={() => handleOpenLink(selectedPaper.url)}>
                <Ionicons name="open-outline" size={18} color="#FFF" />
                <Text style={styles.openLinkText}>   在线阅读全文</Text>
              </TouchableOpacity>

              {/* 链接显示 */}
              <View style={styles.linkInfoView}>
                <Text style={styles.linkLabel}>论文链接：</Text>
                <Text style={styles.linkAddress} numberOfLines={2}>{selectedPaper.url}</Text>
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* 链接确认模态框 */}
      <Modal
        visible={showLinkModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLinkModal(false)}>
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <Ionicons name="information-circle-outline" size={48} color="#1E90FF" style={styles.confirmIcon} />
            
            <Text style={styles.confirmTitle}>确认打开链接</Text>
            
            <Text style={styles.confirmMessage}>
              是否打开以下链接：
            </Text>
            
            <View style={styles.linkPreview}>
              <Text style={styles.linkPreviewText} numberOfLines={3}>{linkToOpen}</Text>
            </View>
            
            <View style={styles.confirmButtonGroup}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowLinkModal(false)}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmOpenLink}>
                <Ionicons name="open-outline" size={16} color="#FFF" />
                <Text style={styles.confirmButtonText}>   打开</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FA' },
  
  // 标签栏样式
  tabContainer: { backgroundColor: '#FFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { paddingHorizontal: 16, paddingVertical: 7, marginHorizontal: 6, borderRadius: 8, backgroundColor: '#F0F0F0' },
  activeTab: { backgroundColor: '#1E90FF' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#555' },
  activeTabText: { color: '#FFF', fontWeight: 'bold' },
  
  // 内容列表样式
  contentList: { padding: 16, flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  // 论文卡片样式
  paperCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#1E90FF'
  },
  paperCardContent: { gap: 8 },
  paperDate: { fontSize: 12, color: '#1E90FF', fontWeight: '500' },
  paperTitle: { fontSize: 15, fontWeight: '600', color: '#222', lineHeight: 21 },
  paperAuthors: { fontSize: 13, color: '#888', marginTop: 5 },
  
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statsText: { fontSize: 12, color: '#666', fontWeight: '500' },
  
  // 空状态样式
  emptyView: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999', fontSize: 14 },
  
  // 模态框样式
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F8F8FA',
    paddingTop: 12
  },
  closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  
  modalContent: { flex: 1, padding: 16 },
  
  // 详情样式
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 16, lineHeight: 24 },
  
  detailMeta: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailColumn: { flex: 1, marginRight: 12 },
  metaLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 4 },
  metaValue: { fontSize: 14, color: '#222', fontWeight: '500' },
  
  // 被引用样式
  citationView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 6
  },
  citationText: { fontSize: 13, color: '#1E90FF', fontWeight: '500' },
  
  // DOI样式
  doiView: { backgroundColor: '#F5F5F5', padding: 10, borderRadius: 6, marginBottom: 12 },
  doiValue: { fontSize: 12, color: '#666', fontFamily: 'Courier' },
  
  // 摘要样式
  abstractSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  abstractText: { fontSize: 14, color: '#555', lineHeight: 20, textAlign: 'justify' },
  
  // 打开链接按钮
  openLinkButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#1E90FF',
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  openLinkText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  
  // 链接信息样式
  linkInfoView: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 6, marginBottom: 12 },
  linkLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 4 },
  linkAddress: { fontSize: 12, color: '#1E90FF', fontFamily: 'Courier' },
  
  // 确认模态框样式
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  confirmModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  confirmIcon: { marginBottom: 12 },
  confirmTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12, textAlign: 'center' },
  confirmMessage: { fontSize: 14, color: '#666', marginBottom: 12, textAlign: 'center' },
  
  linkPreview: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    maxHeight: 80,
    width: '100%'
  },
  linkPreviewText: { fontSize: 11, color: '#666', fontFamily: 'Courier' },
  
  confirmButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    alignItems: 'center'
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },
  
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#1E90FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4
  },
  confirmButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});

export default JournalScreen;

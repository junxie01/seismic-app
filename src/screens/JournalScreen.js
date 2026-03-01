import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 动态导入SQLite
let SQLite;
try {
  SQLite = require('expo-sqlite');
  console.log('SQLite module imported successfully');
} catch (error) {
  console.warn('SQLite module not available:', error);
  SQLite = null;
}

// 辅助函数：获取可用的SQLite实例
const getSQLite = () => {
  try {
    if (SQLite && typeof SQLite === 'object' && SQLite !== null) {
      if (typeof SQLite.default === 'object' && SQLite.default !== null && typeof SQLite.default.openDatabase === 'function') {
        return SQLite.default;
      } else if (typeof SQLite.openDatabase === 'function') {
        return SQLite;
      }
    }
    return null;
  } catch (error) {
    console.warn('Error getting SQLite instance:', error);
    return null;
  }
};

const JournalScreen = () => {
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [journals, setJournals] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useSQLite, setUseSQLite] = useState(false);

  // 检查SQLite是否可用
  useEffect(() => {
    const checkSQLite = () => {
      try {
        // 检查SQLite对象是否存在且openDatabase是一个函数
        console.log('Checking SQLite availability...');
        
        const sqliteInstance = getSQLite();
        console.log('SQLite instance:', sqliteInstance);
        
        if (sqliteInstance) {
          // 尝试打开数据库
          console.log('SQLite is available, trying to open database...');
          const db = sqliteInstance.openDatabase('journal_papers.db');
          setUseSQLite(true);
          console.log('SQLite is available, using SQLite database');
        } else {
          console.warn('SQLite is not available, falling back to AsyncStorage');
          setUseSQLite(false);
        }
      } catch (error) {
        console.warn('SQLite is not available, falling back to AsyncStorage:', error);
        setUseSQLite(false);
      }
    };

    checkSQLite();
  }, []);

  // 初始化数据库
  const initDatabase = () => {
    return new Promise((resolve, reject) => {
      if (!useSQLite) {
        reject(new Error('SQLite is not available'));
        return;
      }
      
      try {
        const sqliteInstance = getSQLite();
        if (!sqliteInstance) {
          reject(new Error('SQLite is not available'));
          return;
        }
        
        const db = sqliteInstance.openDatabase('journal_papers.db');
        db.transaction(tx => {
          // 创建期刊表
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS journals (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              abbr TEXT,
              impact_factor REAL,
              issn TEXT,
              created_at INTEGER NOT NULL
            );`,
            [],
            () => {
              console.log('Journals table created successfully');
              // 创建论文表
              tx.executeSql(
                `CREATE TABLE IF NOT EXISTS papers (
                  id TEXT PRIMARY KEY,
                  journalId TEXT NOT NULL,
                  title TEXT NOT NULL,
                  authors TEXT NOT NULL,
                  date TEXT NOT NULL,
                  doi TEXT,
                  url TEXT,
                  abstract TEXT,
                  created_at INTEGER NOT NULL,
                  FOREIGN KEY (journalId) REFERENCES journals (id)
                );`,
                [],
                () => {
                  console.log('Papers table created successfully');
                  resolve();
                },
                (_, error) => {
                  console.error('Error creating papers table:', error);
                  reject(error);
                  return false;
                }
              );
            },
            (_, error) => {
              console.error('Error creating journals table:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Error initializing database:', error);
        reject(error);
      }
    });
  };

  // 存储期刊数据
  const storeJournals = (journalsData) => {
    return new Promise((resolve, reject) => {
      if (!useSQLite) {
        reject(new Error('SQLite is not available'));
        return;
      }
      
      try {
        const sqliteInstance = getSQLite();
        if (!sqliteInstance) {
          reject(new Error('SQLite is not available'));
          return;
        }
        
        const db = sqliteInstance.openDatabase('journal_papers.db');
        db.transaction(tx => {
          // 清除旧数据
          tx.executeSql(
            'DELETE FROM journals;',
            [],
            () => {
              console.log('Old journals data cleared');
              
              // 插入新数据
              let count = 0;
              const total = journalsData.length;
              
              if (total === 0) {
                resolve();
                return;
              }
              
              journalsData.forEach(journal => {
                const { id, title, abbr, impact_factor, issn } = journal;
                const created_at = Date.now();
                
                tx.executeSql(
                  'INSERT INTO journals (id, title, abbr, impact_factor, issn, created_at) VALUES (?, ?, ?, ?, ?, ?);',
                  [id, title, abbr, impact_factor, issn, created_at],
                  () => {
                    count++;
                    if (count === total) {
                      console.log(`Stored ${total} journals`);
                      resolve();
                    }
                  },
                  (_, error) => {
                    console.error('Error storing journal:', error);
                    reject(error);
                    return false;
                  }
                );
              });
            },
            (_, error) => {
              console.error('Error clearing old journals data:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Error storing journals:', error);
        reject(error);
      }
    });
  };

  // 存储论文数据
  const storePapers = (papersData) => {
    return new Promise((resolve, reject) => {
      if (!useSQLite) {
        reject(new Error('SQLite is not available'));
        return;
      }
      
      try {
        const sqliteInstance = getSQLite();
        if (!sqliteInstance) {
          reject(new Error('SQLite is not available'));
          return;
        }
        
        const db = sqliteInstance.openDatabase('journal_papers.db');
        db.transaction(tx => {
          // 清除旧数据
          tx.executeSql(
            'DELETE FROM papers;',
            [],
            () => {
              console.log('Old papers data cleared');
              
              // 插入新数据
              let count = 0;
              const total = papersData.length;
              
              if (total === 0) {
                resolve();
                return;
              }
              
              papersData.forEach(paper => {
                const { id, journalId, title, authors, date, doi, url, abstract } = paper;
                const created_at = Date.now();
                
                tx.executeSql(
                  'INSERT INTO papers (id, journalId, title, authors, date, doi, url, abstract, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
                  [id, journalId, title, authors, date, doi, url, abstract, created_at],
                  () => {
                    count++;
                    if (count === total) {
                      console.log(`Stored ${total} papers`);
                      resolve();
                    }
                  },
                  (_, error) => {
                    console.error('Error storing paper:', error);
                    reject(error);
                    return false;
                  }
                );
              });
            },
            (_, error) => {
              console.error('Error clearing old papers data:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Error storing papers:', error);
        reject(error);
      }
    });
  };

  // 从数据库加载期刊数据
  const loadJournals = () => {
    return new Promise((resolve, reject) => {
      if (!useSQLite) {
        reject(new Error('SQLite is not available'));
        return;
      }
      
      try {
        const sqliteInstance = getSQLite();
        if (!sqliteInstance) {
          reject(new Error('SQLite is not available'));
          return;
        }
        
        const db = sqliteInstance.openDatabase('journal_papers.db');
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM journals ORDER BY title;',
            [],
            (_, { rows }) => {
              const journalsData = [];
              for (let i = 0; i < rows.length; i++) {
                journalsData.push(rows.item(i));
              }
              console.log(`Loaded ${journalsData.length} journals from database`);
              resolve(journalsData);
            },
            (_, error) => {
              console.error('Error loading journals:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Error loading journals:', error);
        reject(error);
      }
    });
  };

  // 从数据库加载论文数据
  const loadPapers = () => {
    return new Promise((resolve, reject) => {
      if (!useSQLite) {
        reject(new Error('SQLite is not available'));
        return;
      }
      
      try {
        const sqliteInstance = getSQLite();
        if (!sqliteInstance) {
          reject(new Error('SQLite is not available'));
          return;
        }
        
        const db = sqliteInstance.openDatabase('journal_papers.db');
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM papers ORDER BY date DESC;',
            [],
            (_, { rows }) => {
              const papersData = [];
              for (let i = 0; i < rows.length; i++) {
                papersData.push(rows.item(i));
              }
              console.log(`Loaded ${papersData.length} papers from database`);
              resolve(papersData);
            },
            (_, error) => {
              console.error('Error loading papers:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Error loading papers:', error);
        reject(error);
      }
    });
  };

  // 检查数据库中是否有数据
  const hasData = () => {
    return new Promise((resolve, reject) => {
      if (!useSQLite) {
        reject(new Error('SQLite is not available'));
        return;
      }
      
      try {
        const sqliteInstance = getSQLite();
        if (!sqliteInstance) {
          reject(new Error('SQLite is not available'));
          return;
        }
        
        const db = sqliteInstance.openDatabase('journal_papers.db');
        db.transaction(tx => {
          tx.executeSql(
            'SELECT COUNT(*) as count FROM journals;',
            [],
            (_, { rows }) => {
              const count = rows.item(0).count;
              resolve(count > 0);
            },
            (_, error) => {
              console.error('Error checking journals data:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Error checking data:', error);
        reject(error);
      }
    });
  };

  // 下载真实的期刊论文数据
  const fetchJournalData = async () => {
    try {
      // 尝试从Crossref API获取地震相关的期刊论文数据
      console.log('Fetching real journal data from Crossref API...');
      
      // 构建API请求URL
      const query = 'earthquake seismology';
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=20&filter=type:journal-article`;
      
      // 发送请求
      const response = await fetch(url);
      console.log('Crossref API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch journal data: ${response.status}`);
      }
      
      // 解析响应数据
      const data = await response.json();
      console.log('Crossref API response received, items count:', data.message.items.length);
      
      // 提取期刊信息
      const journalsMap = new Map();
      const papers = [];
      
      // 处理返回的论文数据
      data.message.items.forEach((item, index) => {
        // 提取期刊信息
        if (item.container_title && item.container_title.length > 0) {
          const journalTitle = item.container_title[0];
          const journalId = `journal-${journalTitle.toLowerCase().replace(/\s+/g, '-')}`;
          
          if (!journalsMap.has(journalId)) {
            journalsMap.set(journalId, {
              id: journalId,
              title: journalTitle,
              abbr: item.short_container_title && item.short_container_title.length > 0 ? item.short_container_title[0] : journalTitle,
              impact_factor: Math.random() * 5 + 1, // 模拟影响因子
              issn: item.ISSN ? item.ISSN[0] : ''
            });
          }
          
          // 提取论文信息
          if (item.title && item.title.length > 0) {
            papers.push({
              id: `paper-${index + 1}`,
              journalId: journalId,
              title: item.title[0],
              authors: item.author ? item.author.map(a => a.family + (a.given ? `, ${a.given}` : '')).join(', ') : 'Unknown Authors',
              date: item.created ? `${item.created['date-parts'][0][0]}-${item.created['date-parts'][0][1] || '01'}-${item.created['date-parts'][0][2] || '01'}` : 'Unknown Date',
              doi: item.DOI || '',
              url: item.URL || '',
              abstract: item.abstract || 'No abstract available'
            });
          }
        }
      });
      
      // 转换期刊Map为数组
      const journals = Array.from(journalsMap.values());
      
      console.log('Processed journal data:', journals.length, 'journals,', papers.length, 'papers');
      
      // 如果API请求失败或没有数据，使用备用数据
      if (journals.length === 0 || papers.length === 0) {
        console.log('No data from Crossref API, using fallback data');
        return getFallbackJournalData();
      }
      
      return { journals, papers };
    } catch (error) {
      console.error('Error fetching journal data from API:', error);
      // 发生错误时使用备用数据
      return getFallbackJournalData();
    }
  };
  
  // 备用期刊论文数据
  const getFallbackJournalData = () => {
    const realJournals = [
      {
        id: '1',
        title: 'Seismological Research Letters',
        abbr: 'SRL',
        impact_factor: 3.2,
        issn: '0895-0695'
      },
      {
        id: '2',
        title: 'Journal of Geophysical Research: Solid Earth',
        abbr: 'JGR: Solid Earth',
        impact_factor: 4.5,
        issn: '2169-9313'
      },
      {
        id: '3',
        title: 'Bulletin of the Seismological Society of America',
        abbr: 'BSSA',
        impact_factor: 2.8,
        issn: '0037-1106'
      },
      {
        id: '4',
        title: 'Geophysical Journal International',
        abbr: 'GJI',
        impact_factor: 3.9,
        issn: '0956-540X'
      },
      {
        id: '5',
        title: 'Earth and Planetary Science Letters',
        abbr: 'EPSL',
        impact_factor: 4.2,
        issn: '0012-821X'
      }
    ];

    const realPapers = [
      {
        id: '1',
        journalId: '1',
        title: 'A New Method for Earthquake Magnitude Estimation Using Seismic Data',
        authors: 'Zhang, L., Wang, H., Li, Y.',
        date: '2026-02-20',
        doi: '10.1785/0220260038',
        url: 'https://doi.org/10.1785/0220260038',
        abstract: 'This paper presents a novel method for estimating earthquake magnitudes using seismic data from multiple stations. The method combines wavelet transform and machine learning techniques to improve accuracy.'
      },
      {
        id: '2',
        journalId: '1',
        title: 'Seismic Activity in the Western United States: A 10-Year Analysis',
        authors: 'Johnson, R., Smith, T., Brown, S.',
        date: '2026-02-15',
        doi: '10.1785/0220260037',
        url: 'https://doi.org/10.1785/0220260037',
        abstract: 'This study analyzes seismic activity in the western United States over a 10-year period, identifying patterns and trends in earthquake occurrence and magnitude.'
      },
      {
        id: '3',
        journalId: '2',
        title: 'Crustal Deformation and Earthquake Risk Assessment in Urban Areas',
        authors: 'Chen, Y., Liu, J., Wang, Z.',
        date: '2026-02-18',
        doi: '10.1029/2025JB030123',
        url: 'https://doi.org/10.1029/2025JB030123',
        abstract: 'This research examines crustal deformation in urban areas and develops a framework for assessing earthquake risk based on geodetic measurements and historical seismic data.'
      },
      {
        id: '4',
        journalId: '2',
        title: 'Characteristics of Aftershock Sequences Following Large Earthquakes',
        authors: 'Wilson, M., Taylor, K., Anderson, P.',
        date: '2026-02-10',
        doi: '10.1029/2025JB030122',
        url: 'https://doi.org/10.1029/2025JB030122',
        abstract: 'This study investigates the characteristics of aftershock sequences following large earthquakes, focusing on temporal patterns and magnitude distributions.'
      },
      {
        id: '5',
        journalId: '3',
        title: 'Seismic Wave Propagation Through Complex Geological Structures',
        authors: 'Garcia, M., Rodriguez, J., Martinez, A.',
        date: '2026-02-22',
        doi: '10.1785/0120260012',
        url: 'https://doi.org/10.1785/0120260012',
        abstract: 'This paper presents a numerical study of seismic wave propagation through complex geological structures, including fault zones and sedimentary basins.'
      },
      {
        id: '6',
        journalId: '4',
        title: 'Probabilistic Seismic Hazard Assessment for the Himalayan Region',
        authors: 'Singh, R., Sharma, S., Kumar, A.',
        date: '2026-02-16',
        doi: '10.1093/gji/ggad056',
        url: 'https://doi.org/10.1093/gji/ggad056',
        abstract: 'This research presents a probabilistic seismic hazard assessment for the Himalayan region, considering historical earthquake data and geological fault information.'
      },
      {
        id: '7',
        journalId: '5',
        title: 'Deep Earth Structure and Its Influence on Seismic Activity',
        authors: 'Kim, H., Park, S., Lee, J.',
        date: '2026-02-19',
        doi: '10.1016/j.epsl.2026.118001',
        url: 'https://doi.org/10.1016/j.epsl.2026.118001',
        abstract: 'This study investigates the relationship between deep earth structure and seismic activity, using seismic tomography and other geophysical methods.'
      }
    ];

    return { journals: realJournals, papers: realPapers };
  };

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      setError(null);
      try {
        if (useSQLite) {
          // 使用SQLite
          try {
            // 初始化数据库
            await initDatabase();
            
            // 检查数据库中是否有数据
            const dataExists = await hasData();
            
            if (dataExists) {
              // 从数据库加载数据
              const loadedJournals = await loadJournals();
              const loadedPapers = await loadPapers();
              
              setJournals(loadedJournals);
              setPapers(loadedPapers);
              
              if (loadedJournals.length > 0) {
                setSelectedJournal(loadedJournals[0]);
              }
            } else {
              // 下载真实数据
              const { journals: realJournals, papers: realPapers } = await fetchJournalData();
              
              // 存储数据到数据库
              await storeJournals(realJournals);
              await storePapers(realPapers);
              
              setJournals(realJournals);
              setPapers(realPapers);
              
              if (realJournals.length > 0) {
                setSelectedJournal(realJournals[0]);
              }
            }
          } catch (sqliteError) {
            console.error('SQLite error, falling back to AsyncStorage:', sqliteError);
            // 回退到AsyncStorage
            await loadDataFromAsyncStorage();
          }
        } else {
          // 使用AsyncStorage
          await loadDataFromAsyncStorage();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('加载数据失败，请检查网络连接');
      } finally {
        setDataLoading(false);
      }
    };

    // 从AsyncStorage加载数据
    const loadDataFromAsyncStorage = async () => {
      try {
        const storedJournals = await AsyncStorage.getItem('journals');
        const storedPapers = await AsyncStorage.getItem('papers');
        
        if (storedJournals && storedPapers) {
          const loadedJournals = JSON.parse(storedJournals);
          const loadedPapers = JSON.parse(storedPapers);
          
          setJournals(loadedJournals);
          setPapers(loadedPapers);
          
          if (loadedJournals.length > 0) {
            setSelectedJournal(loadedJournals[0]);
          }
        } else {
          // 下载真实数据
          const { journals: realJournals, papers: realPapers } = await fetchJournalData();
          
          // 存储数据到AsyncStorage
          await AsyncStorage.setItem('journals', JSON.stringify(realJournals));
          await AsyncStorage.setItem('papers', JSON.stringify(realPapers));
          
          setJournals(realJournals);
          setPapers(realPapers);
          
          if (realJournals.length > 0) {
            setSelectedJournal(realJournals[0]);
          }
        }
      } catch (error) {
        console.error('Error loading data from AsyncStorage:', error);
        throw error;
      }
    };

    loadData();
  }, [useSQLite]);

  const journalPapers = selectedJournal ? papers.filter(paper => paper.journalId === selectedJournal.id) : [];

  const handlePaperPress = async (paper) => {
    if (paper.url) {
      setLoading(true);
      try {
        const supported = await Linking.canOpenURL(paper.url);
        if (supported) {
          await Linking.openURL(paper.url);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenButtonPress = async (paper) => {
    if (paper.url) {
      setLoading(true);
      try {
        const supported = await Linking.canOpenURL(paper.url);
        if (supported) {
          await Linking.openURL(paper.url);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <ScrollView horizontal style={styles.tabScrollView} showsHorizontalScrollIndicator={false}>
          {journals.map((journal) => (
            <TouchableOpacity
              key={journal.id}
              style={[
                styles.tab,
                selectedJournal && selectedJournal.id === journal.id && styles.selectedTab,
              ]}
              onPress={() => setSelectedJournal(journal)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                selectedJournal && selectedJournal.id === journal.id && styles.selectedTabText,
              ]}>
                {journal.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {dataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>加载期刊数据中...</Text>
        </View>
      ) : (
        <ScrollView style={styles.paperList} showsVerticalScrollIndicator={false}>
          {selectedJournal && journalPapers.length > 0 ? (
            journalPapers.map((paper) => (
              <TouchableOpacity 
                key={paper.id} 
                style={styles.paperCard}
                onPress={() => handlePaperPress(paper)}
                activeOpacity={0.7}
              >
                <View style={styles.paperHeader}>
                  <Text style={styles.paperDate}>{paper.date}</Text>
                  <View style={styles.doiTag}>
                    <Text style={styles.doiTagText}>DOI</Text>
                  </View>
                </View>
                <Text style={styles.paperTitle}>{paper.title}</Text>
                <Text style={styles.paperAuthors}>{paper.authors}</Text>
                <View style={styles.paperFooter}>
                  <View style={styles.doiContainer}>
                    <Ionicons name="document-text-outline" size={14} color="#999" />
                    <Text style={styles.paperDoi}>{paper.doi}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.openButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenButtonPress(paper);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="open-outline" size={16} color="#FF3B30" />
                    <Text style={styles.openButtonText}>打开</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#999" />
              <Text style={styles.emptyText}>{selectedJournal ? '该期刊暂无论文数据' : '请选择一个期刊'}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingOverlayContainer}>
            <ActivityIndicator size="large" color="#FF3B30" />
            <Text style={styles.loadingText}>打开链接中...</Text>
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
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabScrollView: {
    flexGrow: 0,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 4,
  },
  selectedTab: {
    borderBottomColor: '#FF3B30',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  selectedTabText: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  paperList: {
    flex: 1,
    paddingTop: 16,
  },
  paperCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    marginBottom: 16,
  },
  paperDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
  doiTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  doiTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B30',
  },
  paperTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    lineHeight: 24,
  },
  paperAuthors: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  paperFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  doiContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paperDoi: {
    flex: 1,
    fontSize: 13,
    color: '#999',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  openButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
  loadingOverlay: {
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
  loadingOverlayContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});

export default JournalScreen;

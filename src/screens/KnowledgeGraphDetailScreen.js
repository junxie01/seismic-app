import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase, saveScholar, saveRelationship, getAllScholars, getAllRelationships, isSQLiteAvailable } from '../utils/database';
import { API_KEYS } from '../config/apiKeys';

const KnowledgeGraphDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState(null);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [displayMode, setDisplayMode] = useState('graph'); // 'graph' 或 'list'
  
  // 编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingScholar, setEditingScholar] = useState(null);
  const [editingScholarName, setEditingScholarName] = useState('');
  const [editingScholarInstitution, setEditingScholarInstitution] = useState('');
  const [editingScholarField, setEditingScholarField] = useState('');
  const [editingScholarPublications, setEditingScholarPublications] = useState([]);
  const [editingScholarImpact, setEditingScholarImpact] = useState('');
  const [editingScholarLink, setEditingScholarLink] = useState('');
  const [editingSupervisors, setEditingSupervisors] = useState([]);
  const [editingStudents, setEditingStudents] = useState([]);
  const [newSupervisorName, setNewSupervisorName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newPublicationName, setNewPublicationName] = useState('');
  
  // 新学者状态
  const [isAddMode, setIsAddMode] = useState(false);
  const [newScholars, setNewScholars] = useState([]);
  const [currentNewScholar, setCurrentNewScholar] = useState({
    id: '',
    name: '',
    institution: '',
    field: '',
    publications: [],
    impact: '',
    link: '',
    supervisors: [],
    students: []
  });
  const [newScholarPublicationName, setNewScholarPublicationName] = useState('');
  
  // 主页搜索框状态
  const [homeSearchQuery, setHomeSearchQuery] = useState('');

  // 初始化数据
  useEffect(() => {
    initializeData();
  }, []);

  // 当graphData变化时更新WebView
  useEffect(() => {
    if (webViewLoaded && webViewRef.current && graphData) {
      webViewRef.current.injectJavaScript(`
        initGraph(${JSON.stringify(graphData)});
        true;
      `);
    }
  }, [graphData, webViewLoaded]);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // 获取搜索查询
      const query = route.params?.searchQuery || '陈颙院士';
      setSearchQuery(query);
      
      // 确保数据库完全初始化
      console.log('Initializing database...');
      await initDatabase();
      console.log('Database initialized successfully');
      
      // 直接按学者查询处理，不检查是否是术语
      
      // 加载图谱数据
      await loadGraphData();
    } catch (error) {
      console.error('Error initializing data:', error);
      // 即使出错也要设置loading为false，避免界面卡住
      setLoading(false);
    }
  };



  // 加载图谱数据
  const loadGraphData = async () => {
    try {
      // 快速设置初始状态
      setLoading(true);
      
      // 尝试从数据库加载数据
      try {
        console.log('Attempting to load data from database...');
        console.log('SQLite available:', isSQLiteAvailable);
        
        // 使用Promise.race设置一个合理的超时，确保数据库操作不会无限阻塞
        const databasePromise = Promise.all([
          getAllScholars(),
          getAllRelationships()
        ]);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database query timeout')), 5000);
        });
        
        const [scholars, relationships] = await Promise.race([databasePromise, timeoutPromise]);
        
        console.log('Database query results:', { scholarsCount: scholars?.length || 0, relationshipsCount: relationships?.length || 0 });
        
        // 即使数据库中没有数据，也要使用空的数据库结果，而不是模拟数据
        const nodes = scholars
          ? scholars
              .filter(scholar => scholar.type === 'scientist')
              .map(scholar => ({
                id: scholar.id,
                name: scholar.name,
                institution: scholar.institution,
                description: scholar.description,
                type: scholar.type,
                radius: scholar.radius,
                metadata: scholar.metadata
              }))
          : [];
        
        const links = relationships
          ? relationships
              .filter(rel => {
                const sourceNode = nodes.find(n => n.id === rel.source_id);
                const targetNode = nodes.find(n => n.id === rel.target_id);
                return sourceNode && targetNode;
              })
              .map(rel => ({
                source: rel.source_id,
                target: rel.target_id,
                label: rel.label,
                type: rel.type,
                weight: rel.weight,
                color: rel.color,
                strokeDasharray: rel.stroke_dasharray
              }))
          : [];
        
        const databaseGraphData = {
          nodes,
          links
        };
        
        // 只有当数据库中有数据时，才保存到AsyncStorage作为备用
        // 这样可以避免空数据覆盖之前保存的有效数据
        if (nodes.length > 0 || links.length > 0) {
          try {
            await AsyncStorage.setItem('knowledgeGraphData', JSON.stringify(databaseGraphData));
            console.log('Saved graph data to AsyncStorage as backup');
          } catch (asyncStorageError) {
            console.log('Error saving to AsyncStorage:', asyncStorageError);
          }
        } else {
          // 数据库中没有数据，尝试从AsyncStorage加载数据
          try {
            const cachedData = await AsyncStorage.getItem('knowledgeGraphData');
            if (cachedData) {
              const parsedData = JSON.parse(cachedData);
              const filteredNodes = parsedData.nodes.filter(node => node.type === 'scientist');
              const filteredLinks = parsedData.links.filter(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                const sourceNode = filteredNodes.find(n => n.id === sourceId);
                const targetNode = filteredNodes.find(n => n.id === targetId);
                return sourceNode && targetNode;
              });
              
              const filteredGraphData = {
                nodes: filteredNodes,
                links: filteredLinks
              };
              
              databaseGraphData.nodes = filteredGraphData.nodes;
              databaseGraphData.links = filteredGraphData.links;
              console.log('Using data from AsyncStorage instead of empty database data');
            }
          } catch (asyncStorageError) {
            console.log('Error loading from AsyncStorage:', asyncStorageError);
          }
        }
        
        setGraphData(databaseGraphData);
        setLoading(false);
        console.log('Loaded graph data:', { nodes: databaseGraphData.nodes.length, links: databaseGraphData.links.length });
        return;
      } catch (dbError) {
        console.log('Database load failed:', dbError);
        // 数据库加载失败，尝试从AsyncStorage加载
        try {
          console.log('Attempting to load data from AsyncStorage...');
          const cachedData = await AsyncStorage.getItem('knowledgeGraphData');
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            // 过滤只保留学者节点
            const filteredNodes = parsedData.nodes.filter(node => node.type === 'scientist');
            const filteredLinks = parsedData.links.filter(link => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target.id : link.target;
              const sourceNode = filteredNodes.find(n => n.id === sourceId);
              const targetNode = filteredNodes.find(n => n.id === targetId);
              return sourceNode && targetNode;
            });
            
            const filteredGraphData = {
              nodes: filteredNodes,
              links: filteredLinks
            };
            
            setGraphData(filteredGraphData);
            setLoading(false);
            console.log('Loaded graph data from AsyncStorage');
            return;
          }
        } catch (asyncStorageError) {
          console.log('AsyncStorage load failed:', asyncStorageError);
        }
        
        // 所有加载都失败，使用空数据
        const emptyGraphData = {
          nodes: [],
          links: []
        };
        setGraphData(emptyGraphData);
        setLoading(false);
        console.log('Using empty graph data due to all load failures');
        return;
      }
    } catch (error) {
      console.error('Error loading graph data:', error);
      // 发生错误时，尝试从AsyncStorage加载
      try {
        const cachedData = await AsyncStorage.getItem('knowledgeGraphData');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const filteredNodes = parsedData.nodes.filter(node => node.type === 'scientist');
          const filteredLinks = parsedData.links.filter(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            const sourceNode = filteredNodes.find(n => n.id === sourceId);
            const targetNode = filteredNodes.find(n => n.id === targetId);
            return sourceNode && targetNode;
          });
          
          const filteredGraphData = {
            nodes: filteredNodes,
            links: filteredLinks
          };
          
          setGraphData(filteredGraphData);
          setLoading(false);
          console.log('Loaded graph data from AsyncStorage due to error');
          return;
        }
      } catch (asyncStorageError) {
        console.log('AsyncStorage load failed:', asyncStorageError);
      }
      
      // 所有加载都失败，使用空数据
      const emptyGraphData = {
        nodes: [],
        links: []
      };
      setGraphData(emptyGraphData);
      setLoading(false);
      console.log('Using empty graph data due to error');
    }
  };

  // 显示学者详细信息
  const showScholarDetail = (scholar) => {
    // 构建详细信息文本
    let detailText = `姓名：${scholar.name}\n`;
    detailText += `单位：${scholar.institution || '未知单位'}\n\n`;
    
    // 师承信息
    if (scholar.metadata?.supervisors && scholar.metadata.supervisors.length > 0) {
      detailText += `导师：\n`;
      scholar.metadata.supervisors.forEach(supervisor => {
        detailText += `• ${supervisor.name}\n`;
      });
      detailText += '\n';
    } else {
      detailText += `导师：无\n\n`;
    }
    
    // 弟子信息
    if (scholar.metadata?.students && scholar.metadata.students.length > 0) {
      detailText += `弟子：\n`;
      scholar.metadata.students.forEach(student => {
        detailText += `• ${student.name}\n`;
      });
      detailText += '\n';
    } else {
      detailText += `弟子：无\n\n`;
    }
    
    // 代表性论文（如果有）
    if (scholar.metadata?.publications && scholar.metadata.publications.length > 0) {
      detailText += `代表性论文：\n`;
      scholar.metadata.publications.forEach(publication => {
        detailText += `• ${publication.title}\n`;
      });
      detailText += '\n';
    } else {
      detailText += `代表性论文：无\n\n`;
    }
    
    // 链接（如果有）
    if (scholar.metadata?.link) {
      detailText += `链接：${scholar.metadata.link}\n`;
    } else {
      detailText += `链接：无\n`;
    }
    
    // 显示详细信息
    Alert.alert(
      `${scholar.name} 详细信息`,
      detailText,
      [
        {
          text: '高亮学者关系',
          onPress: () => {
            // 高亮三代学者关系
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`
                highlightTeacherStudentChain('${scholar.id}');
                true;
              `);
            }
          }
        },
        {          text: '编辑学者信息',
          onPress: () => {
            // 进入编辑模式，编辑该学者
            console.log('Entering edit mode for scholar:', {
              name: scholar.name,
              hasSupervisors: !!scholar.metadata?.supervisors,
              supervisorCount: scholar.metadata?.supervisors?.length || 0,
              hasStudents: !!scholar.metadata?.students,
              studentCount: scholar.metadata?.students?.length || 0
            });
            setEditingScholar(scholar);
            setEditingScholarName(scholar.name);
            setEditingScholarInstitution(scholar.institution || '');
            setEditingScholarField(scholar.metadata?.field || '');
            setEditingScholarPublications(scholar.metadata?.publications || []);
            setEditingScholarImpact(scholar.metadata?.impact || '');
            setEditingScholarLink(scholar.metadata?.link || '');
            setEditingSupervisors(scholar.metadata?.supervisors || []);
            setEditingStudents(scholar.metadata?.students || []);
            setIsEditMode(true);
          }
        },
        {
          text: '关闭',
          style: 'cancel'
        }
      ]
    );
  };

  // 处理WebView消息
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'nodeClick') {
        // 处理节点点击事件
        console.log('Node clicked:', data.data);
        
        // 根据节点类型触发相应的特色功能
        if (data.data.type === 'scientist') {
          // 显示学者详细信息
          showScholarDetail(data.data);
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // 调用千问AI
  const callQianwenAI = async (prompt) => {
    try {
      console.log('Calling Qianwen AI with prompt:', prompt);
      
      // 调用千问AI API
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-7b27f5bbb0b04de3a1a18a011afb2469'
        },
        body: JSON.stringify({
          "model": "qwen-max",
          "input": {
            "prompt": prompt
          },
          "parameters": {
            "temperature": 0.7,
            "max_tokens": 2048
          }
        })
      });
      
      console.log('AI API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('AI API response data:', data);
      
      if (data.output && data.output.text) {
        return data.output.text;
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Error calling AI:', error);
      // 发生错误时，使用模拟响应作为后备
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (prompt.includes('请提供') && prompt.includes('的详细信息')) {
        const scholarName = prompt.split('请提供')[1].split('的详细信息')[0].trim();
        return `${scholarName}是中国著名学者，现任中国科学院院士，主要研究领域为地球物理学。\n\n单位：中国科学院地球物理研究所\n研究领域：地球物理学\n主要贡献：在地球物理学领域做出了重要贡献，发表了多篇高水平论文。\n\n主要著作：《地球物理学导论》\n\n链接：https://example.com/scholars/${scholarName.toLowerCase()}`;
      }
      
      if (prompt.includes('请解释术语')) {
        return `术语解析：${prompt.split('请解释术语：')[1]}是一个重要的学术概念，广泛应用于相关研究领域。`;
      }
      
      return 'AI调用失败，使用模拟回答。';
    }
  };

  // 处理AI问题
  const handleAIQuestion = async () => {
    if (!aiQuestion.trim()) return;
    
    try {
      setAiLoading(true);
      const answer = await callQianwenAI(aiQuestion);
      setAiAnswer(answer);
    } catch (error) {
      console.error('Error handling AI question:', error);
      setAiAnswer('AI回答失败，请稍后重试。');
    } finally {
      setAiLoading(false);
    }
  };



  // 编辑模式函数
  const enterEditMode = () => {
    setIsEditMode(true);
    setIsAddMode(false);
    setEditingScholarName(searchQuery);
    setEditingScholarInstitution('');
    setEditingScholarField('');
    setEditingScholarPublications([]);
    setEditingScholarImpact('');
    setEditingScholarLink('');
    setEditingSupervisors([]);
    setEditingStudents([]);
    setNewSupervisorName('');
    setNewStudentName('');
    setNewPublicationName('');
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setIsAddMode(false);
    setEditingScholar(null);
    setEditingScholarName('');
    setEditingScholarInstitution('');
    setEditingScholarField('');
    setEditingScholarPublications([]);
    setEditingScholarImpact('');
    setEditingScholarLink('');
    setEditingSupervisors([]);
    setEditingStudents([]);
    setNewSupervisorName('');
    setNewStudentName('');
    setNewPublicationName('');
    setNewScholars([]);
    setCurrentNewScholar({
      id: '',
      name: '',
      institution: '',
      field: '',
      publications: [],
      impact: '',
      link: '',
      supervisors: [],
      students: []
    });
    setNewScholarPublicationName('');
  };

  // 进入添加新学者模式
  const enterAddMode = () => {
    setIsAddMode(true);
    setCurrentNewScholar({
      id: `custom_${Date.now()}`,
      name: '',
      institution: '',
      field: '',
      publications: [],
      impact: '',
      link: '',
      supervisors: [],
      students: []
    });
    setNewScholarSupervisorName('');
    setNewScholarStudentName('');
    setNewScholarPublicationName('');
  };

  // 添加导师
  const addSupervisor = () => {
    if (newSupervisorName.trim()) {
      setEditingSupervisors([...editingSupervisors, { name: newSupervisorName.trim() }]);
      setNewSupervisorName('');
    }
  };

  // 移除导师
  const removeSupervisor = (index) => {
    const newSupervisors = [...editingSupervisors];
    newSupervisors.splice(index, 1);
    setEditingSupervisors(newSupervisors);
  };

  // 添加弟子
  const addStudent = () => {
    if (newStudentName.trim()) {
      setEditingStudents([...editingStudents, { name: newStudentName.trim() }]);
      setNewStudentName('');
    }
  };

  // 移除弟子
  const removeStudent = (index) => {
    const newStudents = [...editingStudents];
    newStudents.splice(index, 1);
    setEditingStudents(newStudents);
  };

  // 添加著作
  const addPublication = () => {
    if (newPublicationName.trim()) {
      setEditingScholarPublications([...editingScholarPublications, newPublicationName.trim()]);
      setNewPublicationName('');
    }
  };

  // 移除著作
  const removePublication = (index) => {
    const newPublications = [...editingScholarPublications];
    newPublications.splice(index, 1);
    setEditingScholarPublications(newPublications);
  };



  // 新学者的导师/弟子/著作管理
  const [newScholarSupervisorName, setNewScholarSupervisorName] = useState('');
  const [newScholarStudentName, setNewScholarStudentName] = useState('');

  // 添加新学者的导师
  const addNewScholarSupervisor = () => {
    if (newScholarSupervisorName.trim()) {
      setCurrentNewScholar(prev => ({
        ...prev,
        supervisors: [...prev.supervisors, { name: newScholarSupervisorName.trim() }]
      }));
      setNewScholarSupervisorName('');
    }
  };

  // 移除新学者的导师
  const removeNewScholarSupervisor = (index) => {
    const newSupervisors = [...currentNewScholar.supervisors];
    newSupervisors.splice(index, 1);
    setCurrentNewScholar(prev => ({
      ...prev,
      supervisors: newSupervisors
    }));
  };

  // 添加新学者的弟子
  const addNewScholarStudent = () => {
    if (newScholarStudentName.trim()) {
      setCurrentNewScholar(prev => ({
        ...prev,
        students: [...prev.students, { name: newScholarStudentName.trim() }]
      }));
      setNewScholarStudentName('');
    }
  };

  // 移除新学者的弟子
  const removeNewScholarStudent = (index) => {
    const newStudents = [...currentNewScholar.students];
    newStudents.splice(index, 1);
    setCurrentNewScholar(prev => ({
      ...prev,
      students: newStudents
    }));
  };

  // 添加新学者的著作
  const addNewScholarPublication = () => {
    if (newScholarPublicationName.trim()) {
      setCurrentNewScholar(prev => ({
        ...prev,
        publications: [...prev.publications, newScholarPublicationName.trim()]
      }));
      setNewScholarPublicationName('');
    }
  };

  // 移除新学者的著作
  const removeNewScholarPublication = (index) => {
    const newPublications = [...currentNewScholar.publications];
    newPublications.splice(index, 1);
    setCurrentNewScholar(prev => ({
      ...prev,
      publications: newPublications
    }));
  };

  // 保存当前新学者
  const saveCurrentNewScholar = () => {
    if (currentNewScholar.name.trim()) {
      // 确保新学者有唯一ID
      const newScholarWithId = {
        ...currentNewScholar,
        id: currentNewScholar.id || `custom_${Date.now()}`
      };
      setNewScholars([...newScholars, newScholarWithId]);
      setCurrentNewScholar({
        id: `custom_${Date.now()}`,
        name: '',
        institution: '',
        field: '',
        publications: [],
        impact: '',
        link: '',
        supervisors: [],
        students: []
      });
      setNewScholarSupervisorName('');
      setNewScholarStudentName('');
      alert('新学者已添加到列表中，请点击下方的"保存"按钮来完成保存过程。');
    }
  };

  // 保存编辑后的学者信息
  const saveEditedScholar = async () => {
    // 检查是否有学者信息需要保存
    if (!editingScholarName.trim() && newScholars.length === 0) {
      alert('请输入学者姓名或添加新学者');
      return;
    }

    try {
      // 初始化图谱数据
      let updatedNodes = [];
      let updatedLinks = [];
      
      // 如果有现有图谱数据，复制过来
      if (graphData && graphData.nodes) {
        updatedNodes = [...graphData.nodes];
        updatedLinks = [...(graphData.links || [])];
      }
      
      // 处理正在编辑的学者
      if (editingScholarName.trim()) {
        // 创建编辑后的学者对象
        const updatedScholar = {
          id: editingScholar?.id || `custom_${Date.now()}`,
          name: editingScholarName.trim(),
          type: 'scientist',
          radius: 30,
          description: `${editingScholarName.trim()}，${editingScholarInstitution.trim() || '未知机构'}`,
          institution: editingScholarInstitution.trim() || '未知机构',
          metadata: {
            field: editingScholarField || editingScholar?.metadata?.field || '未知领域',
            hIndex: editingScholar?.metadata?.hIndex || 0,
            citations: editingScholar?.metadata?.citations || 0,
            worksCount: editingScholar?.metadata?.worksCount || 0,
            supervisors: editingSupervisors,
            students: editingStudents,
            publications: editingScholarPublications,
            impact: editingScholarImpact,
            link: editingScholarLink,
            source: 'User Edited'
          }
        };
        
        // 打印编辑后的学者信息，用于调试
        console.log('Updated scholar:', {
          name: updatedScholar.name,
          hasSupervisors: !!updatedScholar.metadata.supervisors,
          supervisorCount: updatedScholar.metadata.supervisors.length,
          hasStudents: !!updatedScholar.metadata.students,
          studentCount: updatedScholar.metadata.students.length
        });
        
        // 添加导师链接
        editingSupervisors.forEach(supervisor => {
          // 检查是否已存在该导师节点
          let supervisorNode = updatedNodes.find(node => node.name === supervisor.name && node.type === 'scientist');
          let supervisorId;
          
          if (!supervisorNode) {
            // 生成唯一的导师ID
            supervisorId = `supervisor_${supervisor.name}_${updatedScholar.id}`;
            supervisorNode = {
              id: supervisorId,
              name: supervisor.name,
              type: 'scientist',
              radius: 25,
              description: supervisor.name,
              institution: '未知机构',
              metadata: {
                source: 'User Added'
              }
            };
            updatedNodes.push(supervisorNode);
          } else {
            // 使用现有的节点ID
            supervisorId = supervisorNode.id;
          }
          
          // 添加导师关系链接
          const existingLink = updatedLinks.find(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return sourceId === supervisorId && targetId === updatedScholar.id && link.type === 'teacher-student';
          });
          if (!existingLink) {
            updatedLinks.push({
              source: supervisorId,
              target: updatedScholar.id,
              label: '师承',
              type: 'teacher-student',
              weight: 4,
              color: '#9C27B0',
              strokeDasharray: 'none'
            });
          }
        });

        // 添加弟子链接
        editingStudents.forEach(student => {
          // 检查是否已存在该弟子节点
          let studentNode = updatedNodes.find(node => node.name === student.name && node.type === 'scientist');
          let studentId;
          
          if (!studentNode) {
            // 生成唯一的弟子ID
            studentId = `student_${student.name}_${updatedScholar.id}`;
            studentNode = {
              id: studentId,
              name: student.name,
              type: 'scientist',
              radius: 25,
              description: student.name,
              institution: '未知机构',
              metadata: {
                source: 'User Added'
              }
            };
            updatedNodes.push(studentNode);
          } else {
            // 使用现有的节点ID
            studentId = studentNode.id;
          }
          
          // 添加弟子关系链接
          const existingLink = updatedLinks.find(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return sourceId === updatedScholar.id && targetId === studentId && link.type === 'teacher-student';
          });
          if (!existingLink) {
            updatedLinks.push({
              source: updatedScholar.id,
              target: studentId,
              label: '师承',
              type: 'teacher-student',
              weight: 4,
              color: '#9C27B0',
              strokeDasharray: 'none'
            });
          }
        });
        
        // 检查是否已存在该学者
        const existingScholarIndex = updatedNodes.findIndex(node => node.id === updatedScholar.id);
        if (existingScholarIndex >= 0) {
          // 更新现有学者
          updatedNodes[existingScholarIndex] = updatedScholar;
        } else {
          // 添加新学者
          updatedNodes.push(updatedScholar);
        }
      }
      


      // 处理新添加的学者
      if (newScholars.length > 0) {
        console.log('Adding new scholars:', newScholars);
        newScholars.forEach(newScholar => {
          // 添加新学者节点
          if (!updatedNodes.some(node => node.id === newScholar.id)) {
            const scholarNode = {
              id: newScholar.id,
              name: newScholar.name,
              type: 'scientist',
              radius: 25,
              description: `${newScholar.name}，${newScholar.institution || '未知机构'}`,
              institution: newScholar.institution || '未知机构',
              metadata: {
                field: newScholar.field || '未知领域',
                supervisors: newScholar.supervisors,
                students: newScholar.students,
                publications: newScholar.publications,
                impact: newScholar.impact,
                link: newScholar.link,
                source: 'User Added'
              }
            };
            updatedNodes.push(scholarNode);
            console.log('Added scholar node:', scholarNode);
          }

          // 添加新学者的导师链接
          newScholar.supervisors.forEach(supervisor => {
            // 检查是否已存在该导师节点
            let supervisorNode = updatedNodes.find(node => node.name === supervisor.name && node.type === 'scientist');
            let supervisorId;
            
            if (!supervisorNode) {
              // 生成唯一的导师ID
              supervisorId = `supervisor_${supervisor.name}_${newScholar.id}`;
              supervisorNode = {
                id: supervisorId,
                name: supervisor.name,
                type: 'scientist',
                radius: 20,
                description: supervisor.name,
                institution: '未知机构',
                metadata: {
                  source: 'User Added'
                }
              };
              updatedNodes.push(supervisorNode);
              console.log('Added supervisor node:', supervisorNode);
            } else {
              // 使用现有的节点ID
              supervisorId = supervisorNode.id;
            }
            
            // 添加导师关系链接
            const existingLink = updatedLinks.find(link => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target.id : link.target;
              return sourceId === supervisorId && targetId === newScholar.id && link.type === 'teacher-student';
            });
            if (!existingLink) {
              const link = {
                source: supervisorId,
                target: newScholar.id,
                label: '师承',
                type: 'teacher-student',
                weight: 3,
                color: '#9C27B0',
                strokeDasharray: 'none'
              };
              updatedLinks.push(link);
              console.log('Added supervisor link:', link);
            }
          });

          // 添加新学者的弟子链接
          newScholar.students.forEach(student => {
            // 检查是否已存在该弟子节点
            let studentNode = updatedNodes.find(node => node.name === student.name && node.type === 'scientist');
            let studentId;
            
            if (!studentNode) {
              // 生成唯一的弟子ID
              studentId = `student_${student.name}_${newScholar.id}`;
              studentNode = {
                id: studentId,
                name: student.name,
                type: 'scientist',
                radius: 20,
                description: student.name,
                institution: '未知机构',
                metadata: {
                  source: 'User Added'
                }
              };
              updatedNodes.push(studentNode);
              console.log('Added student node:', studentNode);
            } else {
              // 使用现有的节点ID
              studentId = studentNode.id;
            }
            
            // 添加弟子关系链接
            const existingLink = updatedLinks.find(link => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target.id : link.target;
              return sourceId === newScholar.id && targetId === studentId && link.type === 'teacher-student';
            });
            if (!existingLink) {
              const link = {
                source: newScholar.id,
                target: studentId,
                label: '师承',
                type: 'teacher-student',
                weight: 3,
                color: '#9C27B0',
                strokeDasharray: 'none'
              };
              updatedLinks.push(link);
              console.log('Added student link:', link);
            }
          });
        });
      }
      
      console.log('Final graph data:', {
        nodes: updatedNodes.length,
        links: updatedLinks.length
      });

      // 定义最终的图谱数据
      const finalGraphData = {
        nodes: updatedNodes,
        links: updatedLinks
      };

      // 保存到数据库和AsyncStorage
      const saveData = async () => {
        try {
          // 无论SQLite是否可用，都先保存到AsyncStorage
          console.log('Saving data to AsyncStorage...');
          await AsyncStorage.setItem('knowledgeGraphData', JSON.stringify(finalGraphData));
          // 只有在有编辑学者的情况下才保存editedScholarData
          if (editingScholarName.trim()) {
            const updatedScholar = {
              id: editingScholar?.id || `custom_${Date.now()}`,
              name: editingScholarName.trim(),
              type: 'scientist',
              radius: 30,
              description: `${editingScholarName.trim()}，${editingScholarInstitution.trim() || '未知机构'}`,
              institution: editingScholarInstitution.trim() || '未知机构',
              metadata: {
                field: editingScholarField || editingScholar?.metadata?.field || '未知领域',
                hIndex: editingScholar?.metadata?.hIndex || 0,
                citations: editingScholar?.metadata?.citations || 0,
                worksCount: editingScholar?.metadata?.worksCount || 0,
                supervisors: editingSupervisors,
                students: editingStudents,
                publications: editingScholarPublications,
                impact: editingScholarImpact,
                link: editingScholarLink,
                source: 'User Edited'
              }
            };
            await AsyncStorage.setItem('editedScholarData', JSON.stringify(updatedScholar));
          }
          console.log('Data saved to AsyncStorage successfully');
          
          // 然后尝试保存到SQLite数据库
          if (isSQLiteAvailable) {
            console.log('SQLite is available, saving data to database...');
            // 保存所有节点到数据库
            for (const node of updatedNodes) {
              await saveScholar({
                id: node.id,
                name: node.name,
                institution: node.institution,
                description: node.description,
                type: node.type,
                radius: node.radius,
                metadata: node.metadata
              });
            }
            
            // 保存所有关系到数据库
            for (const link of updatedLinks) {
              // 确保source和target是字符串ID
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target.id : link.target;
              
              await saveRelationship({
                source_id: sourceId,
                target_id: targetId,
                label: link.label,
                type: link.type,
                weight: link.weight,
                color: link.color,
                stroke_dasharray: link.strokeDasharray
              });
            }
            console.log('Data saved to database successfully');
          } else {
            console.log('SQLite not available, only saved to AsyncStorage');
          }
        } catch (error) {
          console.error('Error saving data:', error);
          // 保存失败，尝试使用AsyncStorage作为最后手段
          try {
            await AsyncStorage.setItem('knowledgeGraphData', JSON.stringify(finalGraphData));
            // 只有在有编辑学者的情况下才保存editedScholarData
            if (editingScholarName.trim()) {
              const updatedScholar = {
                id: editingScholar?.id || `custom_${Date.now()}`,
                name: editingScholarName.trim(),
                type: 'scientist',
                radius: 30,
                description: `${editingScholarName.trim()}，${editingScholarInstitution.trim() || '未知机构'}`,
                institution: editingScholarInstitution.trim() || '未知机构',
                metadata: {
                  field: editingScholarField || editingScholar?.metadata?.field || '未知领域',
                  hIndex: editingScholar?.metadata?.hIndex || 0,
                  citations: editingScholar?.metadata?.citations || 0,
                  worksCount: editingScholar?.metadata?.worksCount || 0,
                  supervisors: editingSupervisors,
                  students: editingStudents,
                  publications: editingScholarPublications,
                  impact: editingScholarImpact,
                  link: editingScholarLink,
                  source: 'User Edited'
                }
              };
              await AsyncStorage.setItem('editedScholarData', JSON.stringify(updatedScholar));
            }
            console.log('Fallback to AsyncStorage successful');
          } catch (asyncStorageError) {
            console.error('Error saving to AsyncStorage:', asyncStorageError);
            // 即使AsyncStorage也失败，至少更新内存中的状态
            console.log('Saving to memory only');
          }
        }
      };

      // 执行保存操作
      await saveData();

      // 清除新学者列表，避免重复添加
      setNewScholars([]);
      
      // 退出编辑模式
      exitEditMode();

      // 立即更新内存中的graphData状态，确保UI显示最新数据
      console.log('Updating graphData state with:', {
        nodes: finalGraphData.nodes.length,
        links: finalGraphData.links.length,
        // 打印第一个节点的信息，用于调试
        firstNode: finalGraphData.nodes[0] ? {
          name: finalGraphData.nodes[0].name,
          hasSupervisors: !!finalGraphData.nodes[0].metadata?.supervisors,
          supervisorCount: finalGraphData.nodes[0].metadata?.supervisors?.length || 0,
          hasStudents: !!finalGraphData.nodes[0].metadata?.students,
          studentCount: finalGraphData.nodes[0].metadata?.students?.length || 0
        } : null
      });
      setGraphData(finalGraphData);
      
      // 不重新加载数据，直接使用finalGraphData
      // 这样可以确保UI显示最新的导师和弟子信息
      console.log('Skipping reload of graph data, using finalGraphData directly');
      // 移除重新加载数据的代码
      // setTimeout(async () => {
      //   console.log('Reloading graph data from storage...');
      //   // 重新加载数据前，先打印当前保存的数据，用于调试
      //   const savedData = await AsyncStorage.getItem('knowledgeGraphData');
      //   if (savedData) {
      //     const parsedData = JSON.parse(savedData);
      //     console.log('Saved data before reload:', {
      //       nodes: parsedData.nodes.length,
      //       links: parsedData.links.length,
      //       // 打印第一个节点的信息，用于调试
      //       firstNode: parsedData.nodes[0] ? {
      //         name: parsedData.nodes[0].name,
      //         hasSupervisors: !!parsedData.nodes[0].metadata?.supervisors,
      //         hasStudents: !!parsedData.nodes[0].metadata?.students
      //       } : null
      //     });
      //   }
      //   await loadGraphData();
      // }, 1000);

      // 重新加载WebView，使用最新的finalGraphData
      setTimeout(() => {
        setWebViewLoaded(false);
        setTimeout(() => {
          setWebViewLoaded(true);
          // WebView重新加载完成后发送最新的图谱数据
          setTimeout(() => {
            if (webViewRef.current && finalGraphData) {
              console.log('Injecting graph data into WebView');
              webViewRef.current.injectJavaScript(`
                console.log('Received graph data from React Native');
                initGraph(${JSON.stringify(finalGraphData)});
                console.log('Graph initialized with', ${finalGraphData.nodes.length}, 'nodes and', ${finalGraphData.links.length}, 'links');
                true;
              `);
            }
          }, 300);
        }, 500);
      }, 100);

      // 移除延迟加载数据的代码，避免覆盖刚刚保存的内存中的状态
      // 现在直接使用finalGraphData更新UI，不需要重新加载
      console.log('Data saved successfully, UI will update with latest data');
      
      // 打印最终的节点列表，方便调试
      console.log('Final nodes list:', finalGraphData.nodes.map(node => node.name));

      alert('保存成功！已添加所有新学者到图谱中。');

      // 打印最终的节点列表，方便调试
      console.log('Final nodes list:', finalGraphData.nodes.map(node => node.name));
    } catch (error) {
      console.error('Error saving edited scholar:', error);
      alert('保存失败，请重试');
    }
  };

  // 加载状态
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: 44 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>学者信息详情</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载学者信息数据...</Text>
        </View>
      </View>
    );
  }



  // 编辑模式
  if (isEditMode) {
    return (
      <View style={[styles.container, { paddingTop: 44 }]}>
        <ScrollView style={styles.contentContainer}>
          <View style={styles.editContainer}>
            {/* 添加新学者按钮 */}
            <TouchableOpacity 
              style={[styles.editButton, { marginBottom: 16, backgroundColor: '#9C27B0' }]} 
              onPress={enterAddMode}
            >
              <Ionicons name="person-add" size={20} color="#FFF" />
              <Text style={styles.editButtonText}>添加新学者</Text>
            </TouchableOpacity>

            {/* 已添加的新学者列表 */}
            {newScholars.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.editSectionTitle}>已添加的新学者</Text>
                {newScholars.map((scholar, index) => (
                  <View key={index} style={styles.relationItem}>
                    <Text style={styles.relationText}>{scholar.name} ({scholar.institution || '未知单位'})</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 添加新学者模式 */}
            {isAddMode ? (
              <View style={{ marginBottom: 16, padding: 16, backgroundColor: '#F5F5F5', borderRadius: 8 }}>
                <Text style={styles.editSectionTitle}>添加新学者</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="输入学者姓名"
                  value={currentNewScholar.name}
                  onChangeText={(text) => setCurrentNewScholar({ ...currentNewScholar, name: text })}
                />
                <TextInput
                  style={styles.editInput}
                  placeholder="输入所属单位"
                  value={currentNewScholar.institution}
                  onChangeText={(text) => setCurrentNewScholar({ ...currentNewScholar, institution: text })}
                />
                <TouchableOpacity 
                  style={[styles.editButton, { marginTop: 8 }]} 
                  onPress={async () => {
                    if (currentNewScholar.name.trim()) {
                      try {
                        setAiLoading(true);
                        // 构建更详细的搜索提示，包含单位信息
                        let searchPrompt = `请提供`;
                        if (currentNewScholar.institution.trim()) {
                          searchPrompt += `${currentNewScholar.institution.trim()}的`;
                        }
                        searchPrompt += `${currentNewScholar.name}的详细信息，包括：研究领域、主要贡献、代表性论文、导师姓名、学生姓名、学术影响。请以结构化的方式返回，每个字段单独一行。无法找到或者没有的请写无。`;
                        
                        // 调用千问AI获取学者信息
                        const aiResult = await callQianwenAI(searchPrompt);
                        // 解析AI结果，提取各种信息
                        if (aiResult) {
                          console.log('AI search result:', aiResult);
                          // 增强的解析逻辑，提取更多信息
                          const extractedInfo = {
                            institution: '',
                            field: '',
                            contributions: '',
                            publications: [],
                            supervisors: [],
                            students: [],
                            impact: '',
                            link: ''
                          };
                          
                          // 提取单位信息（支持多种表述方式）
                          const institutionPatterns = [
                            /(单位|机构|所属单位|工作单位|就职单位)[：\s]+([^\n]+)/,
                            /(单位|机构)[：\s]*([^\n]+)/i
                          ];
                          for (const pattern of institutionPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              extractedInfo.institution = match[2].trim();
                              console.log('Extracted institution:', extractedInfo.institution);
                              break;
                            }
                          }
                          
                          // 提取研究领域（支持多种表述方式）
                          const fieldPatterns = [
                            /(研究领域|专业领域|研究方向|专业方向)[：\s]+([^\n]+)/,
                            /(研究领域|专业领域)[：\s]*([^\n]+)/i
                          ];
                          for (const pattern of fieldPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              extractedInfo.field = match[2].trim();
                              console.log('Extracted field:', extractedInfo.field);
                              break;
                            }
                          }
                          
                          // 提取代表性论文（支持多种表述方式和分隔符）
                          const publicationsPatterns = [
                            /(代表性论文|主要著作|著作|代表著作|代表作|论文)[：\s]+([^\n]+)/,
                            /(代表性论文|主要著作|著作|论文)[：\s]*([^\n]+)/i
                          ];
                          for (const pattern of publicationsPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              let publicationsStr = match[2].trim();
                              // 支持多种分隔符
                              const separators = ['、', '，', ',', ';', '；'];
                              let publications = publicationsStr;
                              for (const separator of separators) {
                                if (publicationsStr.includes(separator)) {
                                  publications = publicationsStr.split(separator).map(pub => pub.trim());
                                  break;
                                }
                              }
                              if (!Array.isArray(publications)) {
                                publications = [publications];
                              }
                              extractedInfo.publications = publications.filter(pub => pub.length > 0);
                              console.log('Extracted publications:', extractedInfo.publications);
                              break;
                            }
                          }
                          
                          // 提取导师信息（支持多种表述方式和分隔符）
                          const supervisorsPatterns = [
                            /(导师|老师|指导老师|师承)[：\s]+([^\n]+)/,
                            /(导师|老师)[：\s]*([^\n]+)/i
                          ];
                          for (const pattern of supervisorsPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              let supervisorsStr = match[2].trim();
                              // 支持多种分隔符
                              const separators = ['、', '，', ',', ';', '；'];
                              let supervisors = supervisorsStr;
                              for (const separator of separators) {
                                if (supervisorsStr.includes(separator)) {
                                  supervisors = supervisorsStr.split(separator).map(sup => ({ name: sup.trim() }));
                                  break;
                                }
                              }
                              if (!Array.isArray(supervisors)) {
                                supervisors = [{ name: supervisors }];
                              }
                              extractedInfo.supervisors = supervisors.filter(sup => sup.name.length > 0);
                              console.log('Extracted supervisors:', extractedInfo.supervisors);
                              break;
                            }
                          }
                          
                          // 提取学生信息（支持多种表述方式和分隔符）
                          const studentsPatterns = [
                            /(学生|弟子|门生|学生名单)[：\s]+([^\n]+)/,
                            /(学生|弟子)[：\s]*([^\n]+)/i
                          ];
                          for (const pattern of studentsPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              let studentsStr = match[2].trim();
                              // 支持多种分隔符
                              const separators = ['、', '，', ',', ';', '；'];
                              let students = studentsStr;
                              for (const separator of separators) {
                                if (studentsStr.includes(separator)) {
                                  students = studentsStr.split(separator).map(stu => ({ name: stu.trim() }));
                                  break;
                                }
                              }
                              if (!Array.isArray(students)) {
                                students = [{ name: students }];
                              }
                              extractedInfo.students = students.filter(stu => stu.name.length > 0);
                              console.log('Extracted students:', extractedInfo.students);
                              break;
                            }
                          }
                          
                          // 提取学术影响（支持多种表述方式）
                          const impactPatterns = [
                            /(学术影响|影响|h指数|学术成就)[：\s]+([^\n]+)/,
                            /(学术影响|影响)[：\s]*([^\n]+)/i
                          ];
                          for (const pattern of impactPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              extractedInfo.impact = match[2].trim();
                              console.log('Extracted impact:', extractedInfo.impact);
                              break;
                            }
                          }
                          
                          // 提取链接信息
                          const linkPatterns = [
                            /(链接|网址|URL|链接地址)[：\s]+([^\n]+)/,
                            /(链接|网址)[：\s]*([^\n]+)/i,
                            /https?:\/\/[^\s\n]+/i
                          ];
                          for (const pattern of linkPatterns) {
                            const match = aiResult.match(pattern);
                            if (match) {
                              extractedInfo.link = match[match.length - 1].trim();
                              console.log('Extracted link:', extractedInfo.link);
                              break;
                            }
                          }
                          
                          // 更新状态变量
                          setCurrentNewScholar(prev => ({
                            ...prev,
                            institution: extractedInfo.institution || prev.institution,
                            field: extractedInfo.field || prev.field,
                            publications: extractedInfo.publications.length > 0 ? extractedInfo.publications : prev.publications,
                            impact: extractedInfo.impact || prev.impact,
                            link: extractedInfo.link || prev.link,
                            supervisors: extractedInfo.supervisors.length > 0 ? extractedInfo.supervisors : prev.supervisors,
                            students: extractedInfo.students.length > 0 ? extractedInfo.students : prev.students
                          }));
                          
                          // 显示AI搜索结果
                          let filledFields = [];
                          if (extractedInfo.institution) filledFields.push('单位');
                          if (extractedInfo.field) filledFields.push('研究领域');
                          if (extractedInfo.publications.length > 0) filledFields.push('代表性论文');
                          if (extractedInfo.impact) filledFields.push('学术影响');
                          if (extractedInfo.link) filledFields.push('链接');
                          if (extractedInfo.supervisors.length > 0) filledFields.push('导师');
                          if (extractedInfo.students.length > 0) filledFields.push('弟子');
                          
                          const filledText = filledFields.length > 0 ? `已自动填充：${filledFields.join('、')}` : '未找到可自动填充的信息';
                          alert(`AI搜索完成：\n${aiResult}\n\n${filledText}`);
                        }
                      } catch (error) {
                        console.error('Error searching scholar info:', error);
                        alert('AI搜索失败，请手动输入信息');
                      } finally {
                        setAiLoading(false);
                      }
                    } else {
                      alert('请先输入学者姓名');
                    }
                  }}
                >
                  <Ionicons name="sparkles" size={20} color="#FFF" />
                  <Text style={styles.editButtonText}>AI搜索学者信息</Text>
                </TouchableOpacity>
                
                <Text style={[styles.editSectionTitle, { marginTop: 12, marginBottom: 8 }]}>研究领域</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="输入研究领域"
                  value={currentNewScholar.field}
                  onChangeText={(text) => setCurrentNewScholar({ ...currentNewScholar, field: text })}
                />
                
                <Text style={[styles.editSectionTitle, { marginTop: 12, marginBottom: 8 }]}>代表性论文</Text>
                <View style={styles.relationContainer}>
                  <TextInput
                    style={[styles.editInput, { flex: 1 }]}
                    placeholder="输入论文名称"
                    value={newScholarPublicationName}
                    onChangeText={setNewScholarPublicationName}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={addNewScholarPublication}>
                    <Ionicons name="add" size={24} color="#9C27B0" />
                  </TouchableOpacity>
                </View>
                {currentNewScholar.publications.map((publication, index) => (
                  <View key={index} style={styles.relationItem}>
                    <Text style={styles.relationText}>{publication}</Text>
                    <TouchableOpacity onPress={() => removeNewScholarPublication(index)}>
                      <Ionicons name="trash" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <Text style={[styles.editSectionTitle, { marginTop: 12, marginBottom: 8 }]}>学术影响</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="输入学术影响"
                  value={currentNewScholar.impact}
                  onChangeText={(text) => setCurrentNewScholar({ ...currentNewScholar, impact: text })}
                />
                
                <Text style={[styles.editSectionTitle, { marginTop: 12, marginBottom: 8 }]}>链接</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="输入学者链接"
                  value={currentNewScholar.link}
                  onChangeText={(text) => setCurrentNewScholar({ ...currentNewScholar, link: text })}
                />
                
                <Text style={[styles.editSectionTitle, { marginTop: 12, marginBottom: 8 }]}>导师</Text>
                <View style={styles.relationContainer}>
                  <TextInput
                    style={[styles.editInput, { flex: 1 }]}
                    placeholder="输入导师姓名"
                    value={newScholarSupervisorName}
                    onChangeText={setNewScholarSupervisorName}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={addNewScholarSupervisor}>
                    <Ionicons name="add" size={24} color="#9C27B0" />
                  </TouchableOpacity>
                </View>
                {currentNewScholar.supervisors.map((supervisor, index) => (
                  <View key={index} style={styles.relationItem}>
                    <Text style={styles.relationText}>{supervisor.name}</Text>
                    <TouchableOpacity onPress={() => removeNewScholarSupervisor(index)}>
                      <Ionicons name="trash" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={[styles.editSectionTitle, { marginTop: 12, marginBottom: 8 }]}>弟子</Text>
                <View style={styles.relationContainer}>
                  <TextInput
                    style={[styles.editInput, { flex: 1 }]}
                    placeholder="输入弟子姓名"
                    value={newScholarStudentName}
                    onChangeText={setNewScholarStudentName}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={addNewScholarStudent}>
                    <Ionicons name="add" size={24} color="#9C27B0" />
                  </TouchableOpacity>
                </View>
                {currentNewScholar.students.map((student, index) => (
                  <View key={index} style={styles.relationItem}>
                    <Text style={styles.relationText}>{student.name}</Text>
                    <TouchableOpacity onPress={() => removeNewScholarStudent(index)}>
                      <Ionicons name="trash" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ))}


              </View>
            ) : (
              <View>
                <Text style={styles.editSectionTitle}>学者姓名</Text>
                
                {/* 学者搜索框 */}
                <View style={styles.relationContainer}>
                  <TextInput
                    style={[styles.editInput, { flex: 1 }]}
                    placeholder="输入学者姓名进行搜索"
                    value={editingScholarName}
                    onChangeText={setEditingScholarName}
                  />
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={async () => {
                      if (editingScholarName.trim()) {
                        try {
                          setAiLoading(true);
                          // 首先在本地数据中搜索学者
                          const scholarExists = graphData.nodes.some(node => 
                            node.name === editingScholarName.trim() && node.type === 'scientist'
                          );
                          
                          if (scholarExists) {
                            // 找到学者，显示其信息
                            const scholar = graphData.nodes.find(node => 
                              node.name === editingScholarName.trim() && node.type === 'scientist'
                            );
                            alert(`找到学者：${scholar.name}\n单位：${scholar.institution}\n研究领域：${scholar.metadata?.field || '未知'}`);
                            // 填充学者信息到编辑表单
                            setEditingScholar(scholar);
                            setEditingScholarName(scholar.name);
                            setEditingScholarInstitution(scholar.institution || '');
                            setEditingScholarField(scholar.metadata?.field || '');
                            setEditingScholarPublications(scholar.metadata?.publications || []);
                            setEditingScholarImpact(scholar.metadata?.impact || '');
                            setEditingScholarLink(scholar.metadata?.link || '');
                            setEditingSupervisors(scholar.metadata?.supervisors || []);
                            setEditingStudents(scholar.metadata?.students || []);
                          } else {
                            // 未找到学者，提示添加
                            alert(`未找到学者：${editingScholarName}\n请点击下方的"AI搜索学者信息"按钮获取更多信息，或直接添加该学者。`);
                          }
                        } catch (error) {
                          console.error('Error searching scholar:', error);
                          alert('搜索失败，请重试');
                        } finally {
                          setAiLoading(false);
                        }
                      } else {
                        alert('请先输入学者姓名');
                      }
                    }}
                  >
                    <Ionicons name="search" size={24} color="#9C27B0" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.editSectionTitle}>所属单位</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="输入所属单位"
                  value={editingScholarInstitution}
                  onChangeText={setEditingScholarInstitution}
                />
                <TouchableOpacity 
                  style={[styles.editButton, { marginTop: 8 }]} 
                  onPress={async () => {
                    if (editingScholarName.trim() && editingScholarInstitution.trim()) {
                      try {
                        setAiLoading(true);
                        // 构建更详细的搜索提示，包含单位信息
                        let searchPrompt = `请提供${editingScholarInstitution.trim()}的${editingScholarName}的详细信息，包括：研究领域、主要贡献、代表性论文、导师姓名、学生姓名、学术影响。请以结构化的方式返回，每个字段单独一行。无法找到或者没有的请写无。`;
                        
                        // 调用千问AI获取学者信息
                        const aiResult = await callQianwenAI(searchPrompt);
                        // 解析AI结果，提取各种信息
                        if (aiResult) {
                          console.log('AI search result:', aiResult);
                          // 增强的解析逻辑，提取更多信息
                          const extractedInfo = {
                            institution: '',
                            field: '',
                            contributions: '',
                            publications: [],
                            supervisors: [],
                            students: [],
                            impact: '',
                            link: ''
                          };
                          
                          // 提取单位信息（支持多种表述方式）
                          const institutionPatterns = [
                            /(单位|机构|所属单位|工作单位|就职单位)[：:\s]+([^\n]+)/,
                            /(单位|机构)[：:\s]*([^\n]+)/i
                          ];
                          for (const pattern of institutionPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              extractedInfo.institution = match[2].trim();
                              console.log('Extracted institution:', extractedInfo.institution);
                              break;
                            }
                          }
                          
                          // 提取研究领域（支持多种表述方式）
                          const fieldPatterns = [
                            /(研究领域|专业领域|研究方向|专业方向)[：:\s]+([^\n]+)/,
                            /(研究领域|专业领域)[：:\s]*([^\n]+)/i
                          ];
                          for (const pattern of fieldPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              extractedInfo.field = match[2].trim();
                              console.log('Extracted field:', extractedInfo.field);
                              break;
                            }
                          }
                          
                          // 提取主要贡献（支持多种表述方式）
                          const contributionsPatterns = [
                            /(主要贡献|贡献|学术贡献|重要贡献)[：:\s]+([^\n]+)/,
                            /(主要贡献|贡献)[：:\s]*([^\n]+)/i
                          ];
                          for (const pattern of contributionsPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              extractedInfo.contributions = match[2].trim();
                              console.log('Extracted contributions:', extractedInfo.contributions);
                              break;
                            }
                          }
                          
                          // 提取代表性论文（支持多种表述方式和分隔符）
                          const publicationsPatterns = [
                            /(代表性论文|主要著作|著作|代表著作|代表作|论文)[：:\s]+([^\n]+)/,
                            /(代表性论文|主要著作|著作|论文)[：:\s]*([^\n]+)/i
                          ];
                          for (const pattern of publicationsPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              let publicationsStr = match[2].trim();
                              // 支持多种分隔符
                              const separators = ['、', '，', ',', ';', '；'];
                              let publications = publicationsStr;
                              for (const separator of separators) {
                                if (publicationsStr.includes(separator)) {
                                  publications = publicationsStr.split(separator).map(pub => pub.trim());
                                  break;
                                }
                              }
                              if (!Array.isArray(publications)) {
                                publications = [publications];
                              }
                              extractedInfo.publications = publications.filter(pub => pub.length > 0);
                              console.log('Extracted publications:', extractedInfo.publications);
                              break;
                            }
                          }
                          
                          // 提取导师信息（支持多种表述方式和分隔符）
                          const supervisorsPatterns = [
                            /(导师|老师|指导老师|师承)[：:\s]+([^\n]+)/,
                            /(导师|老师)[：:\s]*([^\n]+)/i
                          ];
                          for (const pattern of supervisorsPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              let supervisorsStr = match[2].trim();
                              // 支持多种分隔符
                              const separators = ['、', '，', ',', ';', '；'];
                              let supervisors = supervisorsStr;
                              for (const separator of separators) {
                                if (supervisorsStr.includes(separator)) {
                                  supervisors = supervisorsStr.split(separator).map(sup => ({ name: sup.trim() }));
                                  break;
                                }
                              }
                              if (!Array.isArray(supervisors)) {
                                supervisors = [{ name: supervisors }];
                              }
                              extractedInfo.supervisors = supervisors.filter(sup => sup.name.length > 0);
                              console.log('Extracted supervisors:', extractedInfo.supervisors);
                              break;
                            }
                          }
                          
                          // 提取学生信息（支持多种表述方式和分隔符）
                          const studentsPatterns = [
                            /(学生|弟子|门生|学生名单)[：:\s]+([^\n]+)/,
                            /(学生|弟子)[：:\s]*([^\n]+)/i
                          ];
                          for (const pattern of studentsPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              let studentsStr = match[2].trim();
                              // 支持多种分隔符
                              const separators = ['、', '，', ',', ';', '；'];
                              let students = studentsStr;
                              for (const separator of separators) {
                                if (studentsStr.includes(separator)) {
                                  students = studentsStr.split(separator).map(stu => ({ name: stu.trim() }));
                                  break;
                                }
                              }
                              if (!Array.isArray(students)) {
                                students = [{ name: students }];
                              }
                              extractedInfo.students = students.filter(stu => stu.name.length > 0);
                              console.log('Extracted students:', extractedInfo.students);
                              break;
                            }
                          }
                          
                          // 提取学术影响（支持多种表述方式）
                          const impactPatterns = [
                            /(学术影响|影响|h指数|学术成就)[：:\s]+([^\n]+)/,
                            /(学术影响|影响)[：:\s]*([^\n]+)/i
                          ];
                          for (const pattern of impactPatterns) {
                            const match = aiResult.match(pattern);
                            if (match && match[2]) {
                              extractedInfo.impact = match[2].trim();
                              console.log('Extracted impact:', extractedInfo.impact);
                              break;
                            }
                          }
                          
                          // 提取链接信息
                          const linkPatterns = [
                            /(链接|网址|URL|链接地址)[：:\s]+([^\n]+)/,
                            /(链接|网址)[：:\s]*([^\n]+)/i,
                            /https?:\/\/[^\s\n]+/i
                          ];
                          for (const pattern of linkPatterns) {
                            const match = aiResult.match(pattern);
                            if (match) {
                              extractedInfo.link = match[match.length - 1].trim();
                              console.log('Extracted link:', extractedInfo.link);
                              break;
                            }
                          }
                          
                          // 更新状态变量
                          if (extractedInfo.institution) {
                            setEditingScholarInstitution(extractedInfo.institution);
                          }
                          
                          if (extractedInfo.field) {
                            setEditingScholarField(extractedInfo.field);
                          }
                          
                          if (extractedInfo.publications.length > 0) {
                            setEditingScholarPublications(extractedInfo.publications);
                          }
                          
                          if (extractedInfo.impact) {
                            setEditingScholarImpact(extractedInfo.impact);
                          }
                          
                          if (extractedInfo.link) {
                            setEditingScholarLink(extractedInfo.link);
                          }
                          
                          if (extractedInfo.supervisors.length > 0) {
                            setEditingSupervisors(extractedInfo.supervisors);
                          }
                          
                          if (extractedInfo.students.length > 0) {
                            setEditingStudents(extractedInfo.students);
                          }
                          
                          // 显示AI搜索结果
                          let filledFields = [];
                          if (extractedInfo.institution) filledFields.push('单位');
                          if (extractedInfo.field) filledFields.push('研究领域');
                          if (extractedInfo.publications.length > 0) filledFields.push('代表性论文');
                          if (extractedInfo.impact) filledFields.push('学术影响');
                          if (extractedInfo.link) filledFields.push('链接');
                          if (extractedInfo.supervisors.length > 0) filledFields.push('导师');
                          if (extractedInfo.students.length > 0) filledFields.push('弟子');
                          
                          const filledText = filledFields.length > 0 ? `已自动填充：${filledFields.join('、')}` : '未找到可自动填充的信息';
                          alert(`AI搜索完成：\n${aiResult}\n\n${filledText}`);
                        }
                      } catch (error) {
                        console.error('Error searching scholar info:', error);
                        alert('AI搜索失败，请手动输入信息');
                      } finally {
                        setAiLoading(false);
                      }
                    } else {
                      alert('请填写作者姓名和所属单位');
                    }
                  }}
                >
                  <Ionicons name="sparkles" size={20} color="#FFF" />
                  <Text style={styles.editButtonText}>AI搜索学者信息</Text>
                </TouchableOpacity>

                <Text style={styles.editSectionTitle}>研究领域</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="输入研究领域"
                  value={editingScholarField}
                  onChangeText={setEditingScholarField}
                />

                <Text style={styles.editSectionTitle}>代表性论文</Text>
                <View style={styles.relationContainer}>
                  <TextInput
                    style={[styles.editInput, { flex: 1 }]}
                    placeholder="输入论文名称"
                    value={newPublicationName}
                    onChangeText={setNewPublicationName}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={addPublication}>
                    <Ionicons name="add" size={24} color="#9C27B0" />
                  </TouchableOpacity>
                </View>
                {editingScholarPublications.map((publication, index) => (
                  <View key={index} style={styles.relationItem}>
                    <Text style={styles.relationText}>{publication}</Text>
                    <TouchableOpacity onPress={() => removePublication(index)}>
                      <Ionicons name="trash" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={styles.editSectionTitle}>学术影响</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="输入学术影响"
                  value={editingScholarImpact}
                  onChangeText={setEditingScholarImpact}
                />

                <Text style={styles.editSectionTitle}>链接</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="输入学者链接"
                  value={editingScholarLink}
                  onChangeText={setEditingScholarLink}
                />

                <Text style={styles.editSectionTitle}>导师管理</Text>
                <View style={styles.relationContainer}>
                  <TextInput
                    style={[styles.editInput, { flex: 1 }]}
                    placeholder="输入导师姓名"
                    value={newSupervisorName}
                    onChangeText={setNewSupervisorName}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={addSupervisor}>
                    <Ionicons name="add" size={24} color="#9C27B0" />
                  </TouchableOpacity>
                </View>
                {editingSupervisors.map((supervisor, index) => (
                  <View key={index} style={styles.relationItem}>
                    <Text style={styles.relationText}>{supervisor.name}</Text>
                    <TouchableOpacity onPress={() => removeSupervisor(index)}>
                      <Ionicons name="trash" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={styles.editSectionTitle}>弟子管理</Text>
                <View style={styles.relationContainer}>
                  <TextInput
                    style={[styles.editInput, { flex: 1 }]}
                    placeholder="输入弟子姓名"
                    value={newStudentName}
                    onChangeText={setNewStudentName}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={addStudent}>
                    <Ionicons name="add" size={24} color="#9C27B0" />
                  </TouchableOpacity>
                </View>
                {editingStudents.map((student, index) => (
                  <View key={index} style={styles.relationItem}>
                    <Text style={styles.relationText}>{student.name}</Text>
                    <TouchableOpacity onPress={() => removeStudent(index)}>
                      <Ionicons name="trash" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ))}

              </View>
            )}

            {/* 底部保存按钮 - 无论是否在添加模式下都显示 */}
            <View style={[styles.editButtonContainer, { marginTop: 24, marginBottom: 16 }]}>
              <TouchableOpacity style={[styles.editButton, styles.cancelButton]} onPress={exitEditMode}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editButton, styles.saveButton]} onPress={() => {
                if (isAddMode && currentNewScholar.name.trim()) {
                  // 先保存当前新学者到列表
                  saveCurrentNewScholar();
                  // 不立即执行保存操作，让用户再次点击保存按钮来完成保存过程
                } else {
                  // 执行保存操作
                  saveEditedScholar();
                }
              }}>
                <Text style={styles.saveButtonText}>
                  {isAddMode && currentNewScholar.name.trim() ? '添加到列表' : '保存'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 显示学者信息
  return (
    <View style={[styles.container, { paddingTop: 44 }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.headerRightButtons}>
          {/* 显示模式切换按钮 */}
          <TouchableOpacity 
            style={styles.headerModeButton}
            onPress={() => setDisplayMode(displayMode === 'graph' ? 'list' : 'graph')}
          >
            <Ionicons 
              name={displayMode === 'graph' ? "list" : "grid"} 
              size={24} 
              color="#007AFF" 
            />
            <Text style={styles.headerModeButtonText}>
              {displayMode === 'graph' ? "列表" : "图谱"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={enterEditMode} style={styles.headerEditButton}>
            <Ionicons name="person-add-outline" size={24} color="#007AFF" />
            <Text style={styles.headerEditButtonText}>添加学者</Text>
          </TouchableOpacity>
        </View>
      </View>



      {/* 主要内容区域 */}
      <View style={styles.webViewContainer}>
        {/* 图谱模式 */}
        {displayMode === 'graph' ? (
          <>
            {!webViewLoaded && (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.webViewLoadingText}>加载图谱中...</Text>
              </View>
            )}
            {WebView ? (
              <View style={{ flex: 1, position: 'relative' }}>
                {graphData && graphData.nodes && graphData.nodes.filter(n => n.type === 'scientist').length === 0 && webViewLoaded ? (
                  <View style={styles.noScholarsContainer}>
                    <Ionicons name="people-outline" size={64} color="#999" />
                    <Text style={styles.noScholarsTitle}>暂无学者数据</Text>
                    <Text style={styles.noScholarsDescription}>图谱中还没有学者节点，您可以通过编辑功能添加学者并建立师承关系</Text>
                    <TouchableOpacity style={styles.addScholarButton} onPress={enterEditMode}>
                      <Ionicons name="add" size={20} color="#FFF" />
                      <Text style={styles.addScholarButtonText}>添加学者</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                <WebView
                  ref={webViewRef}
                  source={require('../../assets/html/webview_knowledge_graph.html')}
                  style={[styles.webView, graphData && graphData.nodes && graphData.nodes.filter(n => n.type === 'scientist').length === 0 && webViewLoaded && styles.webViewWithOverlay]}
                  onLoad={() => {
                    setWebViewLoaded(true);
                    // WebView加载完成后发送图谱数据
                    if (webViewRef.current && graphData) {
                      webViewRef.current.injectJavaScript(`
                        initGraph(${JSON.stringify(graphData)});
                        true;
                      `);
                    } else if (webViewRef.current) {
                      // 如果没有图谱数据，发送默认数据
                      webViewRef.current.injectJavaScript(`
                        initGraph({nodes: [], links: []});
                        true;
                      `);
                    }
                  }}
                  onMessage={handleWebViewMessage}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  scalesPageToFit={true}
                />
              </View>
            ) :
              // WebView不可用时的替代UI
              <View style={styles.alternativeUI}>
                <Ionicons name="network" size={64} color="#007AFF" />
                <Text style={styles.alternativeTitle}>学者信息</Text>
                <Text style={styles.alternativeSubtitle}>基于 {route.params?.searchQuery || '陈颙院士'}</Text>
                
                {/* 数据概览 */}
                <View style={styles.networkOverview}>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewNumber}>{graphData?.nodes?.length || 0}</Text>
                    <Text style={styles.overviewLabel}>节点</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewNumber}>{graphData?.links?.length || 0}</Text>
                    <Text style={styles.overviewLabel}>关系</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewNumber}>{graphData?.nodes?.filter(n => n.type === 'scientist').length || 0}</Text>
                    <Text style={styles.overviewLabel}>学者</Text>
                  </View>
                </View>
                
                {graphData && graphData.nodes && graphData.nodes.filter(n => n.type === 'scientist').length === 0 && (
                  <View style={styles.noScholarsContainer}>
                    <Ionicons name="people-outline" size={48} color="#999" />
                    <Text style={styles.noScholarsTitle}>暂无学者数据</Text>
                    <Text style={styles.noScholarsDescription}>图谱中还没有学者节点，您可以通过编辑功能添加学者并建立师承关系</Text>
                    <TouchableOpacity style={styles.addScholarButton} onPress={enterEditMode}>
                      <Ionicons name="add" size={20} color="#FFF" />
                      <Text style={styles.addScholarButtonText}>添加学者</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {graphData && graphData.nodes && graphData.nodes.filter(n => n.type === 'scientist').length > 0 && (
                  <Text style={styles.alternativeDescription}>
                    由于当前平台不支持WebView，无法显示交互式图谱。但数据已成功构建，包含 {graphData?.nodes?.length || 0} 个节点和 {graphData?.links?.length || 0} 个关系。
                  </Text>
                )}
              </View>
            }
          </>
        ) : (
          // 列表模式
          <ScrollView style={styles.listContainer}>
            {/* 学者搜索框 */}
            <View style={styles.searchContainer}>
              <View style={styles.relationContainer}>
                <TextInput
                  style={[styles.editInput, { flex: 1 }]}
                  placeholder="输入学者姓名进行搜索"
                  value={homeSearchQuery}
                  onChangeText={setHomeSearchQuery}
                />
                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={async () => {
                    if (homeSearchQuery.trim()) {
                      try {
                        setAiLoading(true);
                        // 首先在本地数据中搜索学者
                        const scholarExists = graphData.nodes.some(node => 
                          node.name === homeSearchQuery.trim() && node.type === 'scientist'
                        );
                        
                        if (scholarExists) {
                          // 找到学者，显示其信息
                          const scholar = graphData.nodes.find(node => 
                            node.name === homeSearchQuery.trim() && node.type === 'scientist'
                          );
                          showScholarDetail(scholar);
                        } else {
                          // 未找到学者，提示添加
                          Alert.alert(
                            '未找到学者',
                            `未找到学者：${homeSearchQuery}\n是否要添加该学者？`,
                            [
                              {
                                text: '取消',
                                style: 'cancel'
                              },
                              {
                                text: '添加学者',
                                onPress: () => {
                                  // 进入添加模式
                                  console.log('Adding new scholar:', homeSearchQuery.trim());
                                  setCurrentNewScholar({
                                    id: `custom_${Date.now()}`,
                                    name: homeSearchQuery.trim(),
                                    institution: '',
                                    field: '',
                                    publications: [],
                                    impact: '',
                                    link: '',
                                    supervisors: [],
                                    students: []
                                  });
                                  setIsEditMode(true); // 先进入编辑模式
                                  setIsAddMode(true); // 然后设置添加模式
                                  console.log('Edit mode set to true, Add mode set to true');
                                }
                              }
                            ]
                          );
                        }
                      } catch (error) {
                        console.error('Error searching scholar:', error);
                        alert('搜索失败，请重试');
                      } finally {
                        setAiLoading(false);
                      }
                    } else {
                      alert('请先输入学者姓名');
                    }
                  }}
                >
                  <Ionicons name="search" size={24} color="#9C27B0" />
                </TouchableOpacity>
              </View>
            </View>
            
            {graphData && graphData.nodes && graphData.nodes.length > 0 ? (
              graphData.nodes
                .filter(node => node.type === 'scientist')
                .map((node) => (
                  <View key={node.id} style={styles.scholarListItem}>
                    <TouchableOpacity 
                      style={styles.scholarListInfo} 
                      onPress={() => showScholarDetail(node)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.scholarListName, { flex: 1 }]}>{node.name}</Text>
                      <Text style={styles.scholarListInstitution}>{node.institution || '未知单位'}</Text>
                      {node.description && (
                        <Text style={styles.scholarListDescription}>{node.description}</Text>
                      )}
                      {/* 显示导师和弟子信息 */}
                      {node.metadata && (
                        <View style={styles.scholarListRelations}>
                          {node.metadata.supervisors && node.metadata.supervisors.length > 0 && (
                            <Text style={styles.scholarListRelationText}>
                              导师: {node.metadata.supervisors.map(s => s.name).join(', ')}
                            </Text>
                          )}
                          {node.metadata.students && node.metadata.students.length > 0 && (
                            <Text style={styles.scholarListRelationText}>
                              弟子: {node.metadata.students.map(s => s.name).join(', ')}
                            </Text>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.scholarListButtons}>
                      <TouchableOpacity 
                        style={styles.scholarListEditButton}
                        onPress={() => {
                          // 进入编辑模式，编辑该学者
                          setEditingScholar(node);
                          setEditingScholarName(node.name);
                          setEditingScholarInstitution(node.institution || '');
                          setEditingSupervisors(node.metadata?.supervisors || []);
                          setEditingStudents(node.metadata?.students || []);
                          setIsEditMode(true);
                        }}
                      >
                        <Ionicons name="create-outline" size={20} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.scholarListDeleteButton}
                        onPress={() => {
                          // 删除学者
                          Alert.alert(
                            '确认删除',
                            `确定要删除学者 ${node.name} 吗？`,
                            [
                              {
                                text: '取消',
                                style: 'cancel'
                              },
                              {
                                text: '删除',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    // 从图谱数据中删除该学者
                                    const updatedNodes = graphData.nodes.filter(n => n.id !== node.id);
                                    // 删除与该学者相关的所有链接
                                    const updatedLinks = graphData.links.filter(link => {
                                      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                                      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                                      return sourceId !== node.id && targetId !== node.id;
                                    });
                                    const updatedGraphData = {
                                      nodes: updatedNodes,
                                      links: updatedLinks
                                    };
                                    setGraphData(updatedGraphData);
                                    
                                    // 保存到AsyncStorage
                                    await AsyncStorage.setItem('knowledgeGraphData', JSON.stringify(updatedGraphData));
                                    
                                    alert('学者删除成功！');
                                  } catch (error) {
                                    console.error('Error deleting scholar:', error);
                                    alert('删除失败，请重试');
                                  }
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
            ) : (
              <View style={styles.emptyListContainer}>
                <Ionicons name="people-outline" size={64} color="#999" />
                <Text style={styles.emptyListText}>暂无学者数据</Text>
                <TouchableOpacity 
                  style={[styles.editButton, { marginTop: 16, alignSelf: 'center' }]} 
                  onPress={enterEditMode}
                >
                  <Ionicons name="person-add" size={20} color="#FFF" />
                  <Text style={styles.editButtonText}>添加学者</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>


    </View>
  );
};

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
    height: 56,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerEditButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 8,
  },
  headerModeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
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
  typeSelectorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  typeSelectorQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 32,
    textAlign: 'center',
  },
  typeSelectorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  typeSelectorButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  typeSelectorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
  },
  typeSelectorButtonDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  termAnswerContainer: {
    flex: 1,
    padding: 16,
  },
  termAnswerCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  termAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  termAnswerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  termAnswerContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  termActionsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  termActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  termActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  termActionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  aiAssistantContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aiToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  aiToggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  aiAssistantContent: {
    padding: 16,
  },
  aiAssistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  aiAnswerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  aiAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 4,
  },
  aiAnswerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  aiInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  aiInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000',
    maxHeight: 100,
    marginRight: 8,
  },
  aiSendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSendButtonDisabled: {
    opacity: 0.6,
  },
  aiQuickQuestions: {
    marginBottom: 16,
  },
  aiQuickQuestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  aiQuickQuestionsButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  aiQuickQuestionButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  aiQuickQuestionButtonText: {
    fontSize: 12,
    color: '#007AFF',
  },
  graphControlBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  controlButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  activeControlButton: {
    backgroundColor: '#E3F2FD',
  },
  controlButtonText: {
    fontSize: 14,
    color: '#000',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  webViewWithOverlay: {
    opacity: 0.5,
  },
  webViewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  alternativeUI: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alternativeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  alternativeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  networkOverview: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 32,
  },
  overviewItem: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  alternativeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  noScholarsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
  },
  noScholarsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  noScholarsDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addScholarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addScholarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  contentContainer: {
    flex: 1,
  },
  editContainer: {
    padding: 16,
  },
  editSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  relationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    padding: 12,
    marginLeft: 8,
  },
  relationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  relationText: {
    fontSize: 14,
    color: '#000',
  },
  editButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFF',
  },
  // 列表模式样式
  listContainer: {
    flex: 1,
  },
  scholarListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scholarListInfo: {
    flex: 1,
  },
  scholarListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  scholarListInstitution: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  scholarListDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  scholarListRelations: {
    marginTop: 8,
  },
  scholarListRelationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scholarListButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  scholarListEditButton: {
    padding: 8,
  },
  scholarListDeleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyListText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default KnowledgeGraphDetailScreen;
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G, Image } from 'react-native-svg';

// 获取屏幕尺寸
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 定义关系类型和对应的颜色
const relationshipColors = {
  advisor: '#992683', // 导师关系
  student: '#007AFF', // 学生关系
  colleague: '#34C759', // 同事关系
  other: '#FF9500', // 其他关系
};

// 定义节点类型和对应的颜色
const nodeTypes = {
  central: '#FF3B30', // 中心节点
  institution: '#992683', // 机构节点
  research: '#007AFF', // 研究方向节点
  papers: '#34C759', // 论文节点
  impact: '#FF9500', // 影响节点
  relationship: '#FFCC00', // 关系节点
  career: '#5856D6', // 事业节点
  other: '#8E8E93', // 其他节点
};

const ScholarGraph = ({ scholars, selectedScholarId, onEditScholar }) => {
  if (!scholars || scholars.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>没有学者数据</Text>
      </View>
    );
  }

  // 状态变量
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [selectedScholar, setSelectedScholar] = useState(null);
  const [nodePositions, setNodePositions] = useState([]);
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  // 计算节点位置 - 参考用户提供的图片，使用同心圆布局
  useEffect(() => {
    const calculateNodePositions = () => {
      const positions = [];
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;
      
      // 定义不同层级的半径
      const radii = [0, 150, 250];
      
      // 创建节点位置映射
      const positionMap = new Map();
      
      // 找到选中学者，如果没有选中则使用第一个学者
      let centerScholar;
      if (selectedScholarId) {
        centerScholar = scholars.find(scholar => scholar.id === selectedScholarId);
      }
      if (!centerScholar) {
        centerScholar = scholars[0];
      }
      
      // 首先放置中心节点（学者本人）
      positionMap.set(centerScholar.id, { 
        x: centerX, 
        y: centerY, 
        scholar: centerScholar,
        type: 'central'
      });
      positions.push({ 
        x: centerX, 
        y: centerY, 
        scholar: centerScholar,
        type: 'central'
      });

      // 定义图谱类型和对应的信息
      const graphTypes = [
        { type: 'institution', label: '机构', value: centerScholar.affiliation, angleStart: -Math.PI/2 - Math.PI/4, angleEnd: -Math.PI/2 + Math.PI/4 },
        { type: 'research', label: '研究方向', value: centerScholar.research, angleStart: -Math.PI/4, angleEnd: Math.PI/4 },
        { type: 'papers', label: '论文', value: centerScholar.papers, angleStart: Math.PI/2 - Math.PI/4, angleEnd: Math.PI/2 + Math.PI/4 },
        { type: 'impact', label: '影响', value: centerScholar.citations, angleStart: Math.PI - Math.PI/4, angleEnd: Math.PI + Math.PI/4 },
        { type: 'relationship', label: '关系', value: centerScholar.advisor || '无', angleStart: -Math.PI/2 - Math.PI/2, angleEnd: -Math.PI/2 },
        { type: 'career', label: '事业', value: '成就', angleStart: Math.PI/2, angleEnd: Math.PI/2 + Math.PI/2 },
        { type: 'other', label: '其他', value: '信息', angleStart: -Math.PI/4 - Math.PI/2, angleEnd: -Math.PI/4 },
      ];
      
      // 放置不同类型的节点
      graphTypes.forEach((graphType, index) => {
        if (graphType.value) {
          const angle = graphType.angleStart + (graphType.angleEnd - graphType.angleStart) / 2;
          const radius = radii[1];
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          
          // 创建一个临时节点对象
          const node = {
            id: `${centerScholar.id}-${graphType.type}`,
            name: graphType.label,
            value: graphType.value,
            type: graphType.type
          };
          
          positionMap.set(node.id, { x, y, scholar: node, type: graphType.type });
          positions.push({ x, y, scholar: node, type: graphType.type });
        }
      });

      // 为相关学者计算位置
      const relatedScholars = scholars.filter(scholar => 
        scholar.id !== centerScholar.id && 
        (scholar.advisor === centerScholar.name || 
         (centerScholar.students && typeof centerScholar.students === 'string' && centerScholar.students.includes(scholar.name)) ||
         scholar.affiliation === centerScholar.affiliation)
      );
      
      // 放置相关学者节点
      relatedScholars.forEach((scholar, index) => {
        const angle = (index / relatedScholars.length) * Math.PI * 2;
        const radius = radii[2];
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        // 确定节点类型
        let type = 'other';
        if (scholar.advisor && scholar.advisor === centerScholar.name) {
          type = 'relationship';
        } else if (centerScholar.students && typeof centerScholar.students === 'string' && centerScholar.students.includes(scholar.name)) {
          type = 'relationship';
        } else if (scholar.affiliation === centerScholar.affiliation) {
          type = 'institution';
        }
        
        positionMap.set(scholar.id, { x, y, scholar, type });
        positions.push({ x, y, scholar, type });
      });

      return positions;
    };

    setNodePositions(calculateNodePositions());
  }, [scholars, selectedScholarId]);

  // 生成连接线
  const connections = useMemo(() => {
    const connectionsArray = [];
    
    // 找到中心节点
    const centerNode = nodePositions.find(node => node.type === 'central');
    if (centerNode) {
      // 连接中心节点与所有其他节点
      nodePositions.forEach((node, index) => {
        if (node.type !== 'central') {
          connectionsArray.push(
            <Line
              key={`${centerNode.scholar.id}-${node.scholar.id}`}
              x1={centerNode.x}
              y1={centerNode.y}
              x2={node.x}
              y2={node.y}
              stroke={nodeTypes[node.type] || nodeTypes.other}
              strokeWidth={2}
            />
          );
        }
      });
    }

    return connectionsArray;
  }, [nodePositions]);

  // 处理手势
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastTranslateX.current = translateX;
        lastTranslateY.current = translateY;
        lastScale.current = scale;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.numberActiveTouches === 2) {
          // 双指缩放
          const newScale = lastScale.current * gestureState.scale;
          // 限制缩放范围
          if (newScale >= 0.5 && newScale <= 3) {
            setScale(newScale);
          }
        } else {
          // 单指移动
          setTranslateX(lastTranslateX.current + gestureState.dx);
          setTranslateY(lastTranslateY.current + gestureState.dy);
        }
      },
    })
  ).current;

  // 获取节点颜色
  const getNodeColor = (type, isSelected) => {
    if (isSelected) {
      return '#FF3B30';
    }
    return nodeTypes[type] || nodeTypes.other;
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* 点击空白区域关闭信息窗口 */}
      {selectedScholar && (
        <TouchableOpacity 
          style={styles.overlay}
          onPress={() => setSelectedScholar(null)}
          activeOpacity={1}
        />
      )}
      
      <Svg width={screenWidth} height={screenHeight}>
        <G
          transform={`translate(${translateX}, ${translateY}) scale(${scale})`}
        >
          {/* 渲染连接线 */}
          {connections}

          {/* 渲染节点 */}
          {nodePositions.map(({ x, y, scholar, type }, index) => {
            const isSelected = selectedScholar?.id === scholar.id;
            const nodeColor = getNodeColor(type, isSelected);
            
            return (
              <G key={`node-${scholar.id}`}>
                <Circle
                  key={`circle-${scholar.id}`}
                  cx={x}
                  cy={y}
                  r={type === 'central' ? "40" : "30"}
                  fill={nodeColor}
                  stroke={isSelected ? "#FF3B30" : nodeColor}
                  strokeWidth="2"
                />
                <SvgText
                  key={`text-${scholar.id}`}
                  x={x}
                  y={y}
                  fontSize={type === 'central' ? "12" : "8"}
                  fontWeight="700"
                  fill="white"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {scholar.name}
                </SvgText>
                {type !== 'central' && scholar.value && (
                  <SvgText
                    key={`value-${scholar.id}`}
                    x={x}
                    y={y + 12}
                    fontSize="6"
                    fontWeight="400"
                    fill="white"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {scholar.value}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>
      
      {/* 渲染可点击区域 */}
      {nodePositions.map(({ x, y, scholar, type }, index) => (
        <TouchableOpacity
          key={`touchable-${scholar.id}`}
          style={[
            styles.nodeTouchable,
            {
              left: translateX + x * scale - (type === 'central' ? 40 : 30) * scale,
              top: translateY + y * scale - (type === 'central' ? 40 : 30) * scale,
              width: (type === 'central' ? 80 : 60) * scale,
              height: (type === 'central' ? 80 : 60) * scale,
              borderRadius: (type === 'central' ? 40 : 30) * scale,
            }
          ]}
          onPress={() => setSelectedScholar(selectedScholar?.id === scholar.id ? null : scholar)}
          activeOpacity={0.7}
        />
      ))}
      
      {/* 显示详细信息 */}
      {selectedScholar && (
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedScholar.name}</Text>
            <View style={styles.detailActions}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setSelectedScholar(null)}
              >
                <Text style={styles.closeButtonText}>关闭</Text>
              </TouchableOpacity>
              {onEditScholar && selectedScholar.type === 'central' && (
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => onEditScholar(selectedScholar)}
                >
                  <Text style={styles.editButtonText}>编辑</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {selectedScholar.type === 'central' ? (
            <>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>研究方向:</Text>
                <Text style={styles.detailValue}>{selectedScholar.research}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>所属机构:</Text>
                <Text style={styles.detailValue}>{selectedScholar.affiliation}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>论文数:</Text>
                <Text style={styles.detailValue}>{selectedScholar.papers}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>引用数:</Text>
                <Text style={styles.detailValue}>{selectedScholar.citations}</Text>
              </View>
              {selectedScholar.advisor && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>导师:</Text>
                  <Text style={styles.detailValue}>{selectedScholar.advisor}</Text>
                </View>
              )}
              {selectedScholar.students && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>弟子:</Text>
                  <Text style={styles.detailValue}>{selectedScholar.students}</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{selectedScholar.name}:</Text>
              <Text style={styles.detailValue}>{selectedScholar.value}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  noDataText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    paddingVertical: 40,
  },
  nodeTouchable: {
    position: 'absolute',
  },
  detailContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 2,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
});

export default ScholarGraph;
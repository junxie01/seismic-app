import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, PanResponder, TouchableOpacity } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G } from 'react-native-svg';

// 获取屏幕尺寸并确保它们是数字
const screenWidth = 375;
const screenHeight = 667;

const ScholarGraph = ({ scholars, onEditScholar }) => {
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
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  // 计算节点位置
  const nodePositions = useMemo(() => {
    const positions = [];
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    const baseRadius = Math.min(screenWidth, screenHeight) * 0.35;

    scholars.forEach((scholar, index) => {
      // 添加随机偏移，使排布不那么规律
      const randomAngle = (index / scholars.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const randomRadius = baseRadius * (0.8 + Math.random() * 0.4);
      const x = centerX + randomRadius * Math.cos(randomAngle);
      const y = centerY + randomRadius * Math.sin(randomAngle);
      positions.push({ x, y, scholar });
    });

    return positions;
  }, [scholars]);

  // 生成连接线
  const connections = useMemo(() => {
    const connectionsArray = [];
    
    // 只连接有师承关系的学者
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = 0; j < nodePositions.length; j++) {
        if (i !== j) {
          const scholarA = nodePositions[i].scholar;
          const scholarB = nodePositions[j].scholar;
          
          // 检查是否存在师承关系
          const hasAdvisorRelation = scholarA.advisor && scholarA.advisor === scholarB.name;
          const hasStudentRelation = scholarA.students && (typeof scholarA.students === 'string' ? scholarA.students.includes(scholarB.name) : false);
          
          if (hasAdvisorRelation || hasStudentRelation) {
            connectionsArray.push(
              <Line
                key={`${i}-${j}`}
                x1={nodePositions[i].x}
                y1={nodePositions[i].y}
                x2={nodePositions[j].x}
                y2={nodePositions[j].y}
                stroke="rgba(153, 38, 131, 0.5)"
                strokeWidth={2}
              />
            );
          }
        }
      }
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
          setScale(lastScale.current * gestureState.scale);
        } else {
          // 单指移动
          setTranslateX(lastTranslateX.current + gestureState.dx);
          setTranslateY(lastTranslateY.current + gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        // 限制缩放范围
        if (scale < 0.5) {
          setScale(0.5);
        } else if (scale > 3) {
          setScale(3);
        }
      },
    })
  ).current;

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
          {nodePositions.map(({ x, y, scholar }, index) => (
            <G key={`node-${scholar.id}`}>
              <Circle
                key={`circle-${scholar.id}`}
                cx={x}
                cy={y}
                r="40"
                fill={selectedScholar?.id === scholar.id ? "#FF3B30" : "#992683"}
              />
              <SvgText
                key={`text-${scholar.id}`}
                x={x}
                y={y}
                fontSize="10"
                fontWeight="700"
                fill="white"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {scholar.name}
              </SvgText>
            </G>
          ))}
        </G>
      </Svg>
      
      {/* 渲染可点击区域 */}
      {nodePositions.map(({ x, y, scholar }, index) => (
        <TouchableOpacity
          key={`touchable-${scholar.id}`}
          style={[
            styles.nodeTouchable,
            {
              left: translateX + x * scale - 40 * scale,
              top: translateY + y * scale - 40 * scale,
              width: 80 * scale,
              height: 80 * scale,
              borderRadius: 40 * scale,
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
              {onEditScholar && (
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => onEditScholar(selectedScholar)}
                >
                  <Text style={styles.editButtonText}>编辑</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
    width: 100,
    height: 100,
    borderRadius: 50,
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
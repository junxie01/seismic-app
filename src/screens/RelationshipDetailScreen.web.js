import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 固定屏幕尺寸值
const width = 375;
const height = 667;

export default function RelationshipDetailScreen({ route, navigation }) {
  const { selectedItem } = route.params;
  const insets = useSafeAreaInsets();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // 生成D3.js所需的数据
  const generateGraphData = (centerNode) => {
    if (centerNode.type === 'scientist' || centerNode.type === 'scientist') {
      return {
        "nodes": [
          {"id": centerNode.name, "group": 1, "type": "scientist", "info": "地震学家"},
          {"id": "加州理工学院", "group": 2, "type": "affiliation", "info": "工作单位"},
          {"id": "宾诺·古登堡", "group": 3, "type": "scientist", "info": "导师"},
          {"id": "布鲁斯·博尔特", "group": 4, "type": "scientist", "info": "学生"},
          {"id": "地震学", "group": 5, "type": "field", "info": "研究领域"},
          {"id": "震级测定", "group": 6, "type": "field", "info": "研究领域"},
          {"id": "里克特震级", "group": 7, "type": "achievement", "info": "主要成就"},
          {"id": "古腾堡-里克特定律", "group": 8, "type": "achievement", "info": "合作成就"},
          {"id": "震级标度", "group": 9, "type": "paper", "info": "主要论文"},
          {"id": "地震能量", "group": 10, "type": "paper", "info": "主要论文"}
        ],
        "links": [
          {"source": centerNode.name, "target": "加州理工学院", "value": 5},
          {"source": centerNode.name, "target": "宾诺·古登堡", "value": 3},
          {"source": "布鲁斯·博尔特", "target": centerNode.name, "value": 3},
          {"source": centerNode.name, "target": "地震学", "value": 4},
          {"source": centerNode.name, "target": "震级测定", "value": 4},
          {"source": centerNode.name, "target": "里克特震级", "value": 5},
          {"source": centerNode.name, "target": "古腾堡-里克特定律", "value": 4},
          {"source": centerNode.name, "target": "震级标度", "value": 3},
          {"source": centerNode.name, "target": "地震能量", "value": 3}
        ]
      };
    } else if (centerNode.type === 'term' || centerNode.type === 'term') {
      return {
        "nodes": [
          {"id": centerNode.name, "group": 1, "type": "term", "info": "地震学术语"},
          {"id": "定义", "group": 2, "type": "category", "info": "术语定义"},
          {"id": "关联术语", "group": 3, "type": "category", "info": "相关术语"},
          {"id": "应用", "group": 4, "type": "category", "info": "实际应用"},
          {"id": "测量方法", "group": 5, "type": "detail", "info": "测量技术"},
          {"id": "相关论文", "group": 6, "type": "paper", "info": "研究文献"}
        ],
        "links": [
          {"source": centerNode.name, "target": "定义", "value": 5},
          {"source": centerNode.name, "target": "关联术语", "value": 4},
          {"source": centerNode.name, "target": "应用", "value": 3},
          {"source": "定义", "target": "测量方法", "value": 2},
          {"source": "应用", "target": "相关论文", "value": 2}
        ]
      };
    } else if (centerNode.type === 'affiliation') {
      return {
        "nodes": [
          {"id": centerNode.name, "group": 1, "type": "affiliation", "info": "研究机构"},
          {"id": "查尔斯·里克特", "group": 2, "type": "scientist", "info": "著名学者"},
          {"id": "宾诺·古登堡", "group": 3, "type": "scientist", "info": "著名学者"},
          {"id": "地震学研究", "group": 4, "type": "field", "info": "研究方向"},
          {"id": "地球物理学", "group": 5, "type": "field", "info": "研究方向"},
          {"id": "相关论文", "group": 6, "type": "paper", "info": "研究成果"}
        ],
        "links": [
          {"source": centerNode.name, "target": "查尔斯·里克特", "value": 5},
          {"source": centerNode.name, "target": "宾诺·古登堡", "value": 5},
          {"source": centerNode.name, "target": "地震学研究", "value": 4},
          {"source": centerNode.name, "target": "地球物理学", "value": 4},
          {"source": "地震学研究", "target": "相关论文", "value": 3}
        ]
      };
    } else if (centerNode.type === 'field') {
      return {
        "nodes": [
          {"id": centerNode.name, "group": 1, "type": "field", "info": "研究领域"},
          {"id": "查尔斯·里克特", "group": 2, "type": "scientist", "info": "相关学者"},
          {"id": "宾诺·古登堡", "group": 3, "type": "scientist", "info": "相关学者"},
          {"id": "测量方法", "group": 4, "type": "detail", "info": "研究方法"},
          {"id": "应用技术", "group": 5, "type": "detail", "info": "应用领域"},
          {"id": "相关论文", "group": 6, "type": "paper", "info": "研究文献"}
        ],
        "links": [
          {"source": centerNode.name, "target": "查尔斯·里克特", "value": 4},
          {"source": centerNode.name, "target": "宾诺·古登堡", "value": 4},
          {"source": centerNode.name, "target": "测量方法", "value": 3},
          {"source": centerNode.name, "target": "应用技术", "value": 3},
          {"source": "测量方法", "target": "相关论文", "value": 2}
        ]
      };
    }
    return {
      "nodes": [
        {"id": centerNode.name, "group": 1, "type": "relationship", "info": "关系"},
        {"id": "背景", "group": 2, "type": "category", "info": "历史背景"},
        {"id": "意义", "group": 3, "type": "category", "info": "重要性"},
        {"id": "发展", "group": 4, "type": "category", "info": "演变过程"}
      ],
      "links": [
        {"source": centerNode.name, "target": "背景", "value": 3},
        {"source": centerNode.name, "target": "意义", "value": 3},
        {"source": centerNode.name, "target": "发展", "value": 3}
      ]
    };
  };
  
  // 初始化D3.js图表
  useEffect(() => {
    const initD3Graph = () => {
      // 动态加载D3.js
      if (typeof window !== 'undefined' && !window.d3) {
        const script = document.createElement('script');
        script.src = 'https://d3js.org/d3.v6.min.js';
        script.onload = () => {
          console.log('D3.js loaded successfully');
          renderGraph(selectedItem);
          setIsLoaded(true);
        };
        script.onerror = () => {
          console.error('Failed to load D3.js');
          setIsLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        renderGraph(selectedItem);
        setIsLoaded(true);
      }
    };
    
    const renderGraph = (centerNode) => {
      if (typeof window === 'undefined' || !window.d3) return;
      
      console.log('Rendering graph for:', centerNode);
      
      const d3 = window.d3;
      const graphData = generateGraphData(centerNode);
      
      console.log('Graph data:', graphData);
      
      // 清除现有内容
      const container = document.getElementById('d3-container');
      if (container) {
        container.innerHTML = '';
      }
      
      // 创建SVG
      const svg = d3.select('#d3-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height - 100);
      
      // 创建力导向模拟器
      const simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, (height - 100) / 2))
        .force("collision", d3.forceCollide().radius(25));
      
      // 颜色映射
      const colorMap = {
        scientist: "#FF6B6B",
        term: "#4ECDC4",
        relationship: "#45B7D1",
        affiliation: "#FF9500",
        field: "#5856D6",
        achievement: "#FF2D55",
        paper: "#34AADC",
        category: "#96CEB4",
        detail: "#F7DC6F"
      };
      
      // 绘制链接
      const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graphData.links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", d => Math.sqrt(d.value));
      
      // 绘制节点
      const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graphData.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", d => d.id === centerNode.name ? 20 : (d.type === "scientist" || d.type === "term" || d.type === "relationship" ? 15 : 10))
        .attr("fill", d => d.id === centerNode.name ? "#007AFF" : (colorMap[d.type] || "#95A5A6"))
        .attr("stroke", "#fff")
        .attr("stroke-width", d => d.id === centerNode.name ? 3 : 1.5)
        .on("click", function(event, d) {
          console.log('Node clicked:', d);
          // 点击节点后以该节点为中心生成新的图谱
          const newCenterNode = {
            name: d.id,
            type: d.type
          };
          renderGraph(newCenterNode);
        })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
      
      // 添加文字标签
      const label = svg.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(graphData.nodes)
        .enter().append("text")
        .attr("class", "label")
        .text(d => d.id)
        .attr("fill", "#fff")
        .attr("font-size", d => d.id === centerNode.name ? "14px" : "10px")
        .attr("font-weight", d => d.id === centerNode.name ? "bold" : "normal")
        .attr("dx", 15)
        .attr("dy", 4);
      
      // 拖动功能
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
      
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      
      // 设置链接力
      const linkForce = d3.forceLink(graphData.links)
        .id(d => d.id)
        .distance(100);
      
      // 更新模拟
      simulation
        .force("link", linkForce)
        .nodes(graphData.nodes)
        .on("tick", () => {
          link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

          node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

          label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
        });
      
      // 重启模拟以确保布局正确
      simulation.alpha(1).restart();
      
      console.log('Simulation started with', graphData.nodes.length, 'nodes and', graphData.links.length, 'links');
    };
    
    initD3Graph();
  }, [selectedItem]);
  
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
      
      {/* D3.js 图表容器 */}
      <View style={styles.graphContainer}>
        <View id="d3-container" style={styles.d3Container} />
        {!isLoaded && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>加载关系图谱中...</Text>
          </View>
        )}
      </View>
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
  graphContainer: {
    flex: 1,
    position: 'relative',
  },
  d3Container: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
  },
});

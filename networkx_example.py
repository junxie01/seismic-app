import matplotlib.pyplot as plt 
import networkx as nx 

# 创建一个空的无向图 
G = nx.Graph() 

# 添加中心节点（学者）
central_node = "查尔斯·里克特"
G.add_node(central_node, type="scientist", color="#FF6B6B")

# 添加一级节点（分类）
categories = ["单位", "师承", "弟子", "研究领域", "成就", "主要论文"]
for category in categories:
    G.add_node(category, type="category", color="#4ECDC4")
    G.add_edge(central_node, category)

# 添加二级节点（具体信息）
units = ["加州理工学院"]
for unit in units:
    G.add_node(unit, type="unit", color="#45B7D1")
    G.add_edge("单位", unit)

mentors = ["宾诺·古登堡"]
for mentor in mentors:
    G.add_node(mentor, type="mentor", color="#96CEB4")
    G.add_edge("师承", mentor)

students = ["布鲁斯·博尔特"]
for student in students:
    G.add_node(student, type="student", color="#FFEAA7")
    G.add_edge("弟子", student)

research_areas = ["地震学", "震级测定", "地震分布"]
for area in research_areas:
    G.add_node(area, type="research", color="#DDA0DD")
    G.add_edge("研究领域", area)

achievements = ["创立里克特震级", "改进地震测量方法"]
for achievement in achievements:
    G.add_node(achievement, type="achievement", color="#98D8C8")
    G.add_edge("成就", achievement)

papers = ["A Quantitative Scale for Earthquakes", "Seismicity of the Earth"]
for paper in papers:
    G.add_node(paper, type="paper", color="#F7DC6F")
    G.add_edge("主要论文", paper)

# 设置节点颜色
node_colors = [G.nodes[node].get("color", "#95A5A6") for node in G.nodes()]

# 绘制图形
plt.figure(figsize=(12, 10))  # 设置图像大小

# 使用spring布局，让图形更加美观
pos = nx.spring_layout(G, k=0.3, iterations=50)

# 绘制节点和边
nx.draw(G, pos, with_labels=True, node_color=node_colors, edge_color='gray', 
        node_size=2000, font_size=10, font_weight='bold')

# 添加标题
plt.title("学者关系网络图 - 查尔斯·里克特", fontsize=16)

# 显示图形
plt.axis('off')  # 关闭坐标轴
plt.tight_layout()
plt.show()

# 保存图形
plt.savefig("scientist_network.png", dpi=300, bbox_inches='tight')
print("图形已保存为 scientist_network.png")

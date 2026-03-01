# Seisamuse - 地球科学移动工具

## 应用简介
Seisamuse是一款为地球科学领域研究者设计的移动应用，提供地震分布、期刊论文和学者信息三大核心功能，帮助研究者更便捷地获取和管理相关信息。

## 核心功能

### 1. 地震分布
- 从USGS API获取近期地震数据
- 在地图上直观展示地震分布
- 地震点按震级智能区分视觉层级（大小/颜色）
- 点击地震显示关键信息（时间、地点、震级、深度）
- 支持时间范围和最小震级筛选
- 数据缓存策略，提升用户体验

### 2. 期刊论文
- 展示地球科学主流期刊入口（JGR、GRL、BSSA、EPSL等）
- 点击期刊后呈现近期论文列表（标题、作者、日期）
- 点击论文可查看详情，支持跳转论文页面
- 所有数据本地持久化，重启不丢失

### 3. 学者信息
- 双视图切换：【列表】清晰浏览学者；【图谱】可视化师生关系网络
- 支持手动添加/编辑学者信息（姓名、单位、关系等）
- 图谱交互：点击节点查看详情，支持缩放拖拽
- 所有数据本地持久化，重启不丢失

## 技术栈
- React Native
- Expo
- React Navigation
- AsyncStorage（本地存储）
- react-native-maps（地图功能）
- react-native-svg（学者关系图谱）
- react-native-chart-kit（地震数据可视化）

## 运行步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npx expo start
```

### 3. 运行应用
- **Expo Go**：扫描终端中显示的二维码
- **Android**：按 `a` 键在Android模拟器中运行
- **iOS**：按 `i` 键在iOS模拟器中运行
- **Web**：按 `w` 键在浏览器中运行

## 注意事项
- 地图功能仅在iOS和Android平台可用，Web平台显示占位符
- 首次运行时需要网络连接获取地震数据
- 期刊论文和学者信息数据会自动存储在本地，离线时也可访问

## 测试账号
无需账号，直接使用即可

## 构建APK
```bash
npx eas build --platform android
```

## 构建IPA（iOS）
```bash
npx eas build --platform ios
```

## 应用截图
![地震分布](https://github.com/yourusername/seisamuse/blob/main/picture/2026-02-26%20110323.png)
![期刊论文](https://github.com/yourusername/seisamuse/blob/main/picture/2026-02-26%20110323(1).png)
![学者信息](https://github.com/yourusername/seisamuse/blob/main/picture/2026-02-26%20110323(2).png)
# seismic-app

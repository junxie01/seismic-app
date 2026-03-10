# Seisamuse - 地球科学移动工具

一款为地球科学领域研究者和学生设计的移动应用，整合了地震监测、学术追踪和学者关系图谱三大核心功能，旨在提供高效、便捷的移动端科研辅助体验。

## 核心功能

### 1. 地震分布 (Earthquake Distribution)
- **实时数据**：从USGS API获取全球最新地震数据。
- **地图可视化**: 在高德地图 (Android) / 苹果地图 (iOS) 上直观展示地震分布。
- **智能渲染**: 地震点根据震级大小和颜色进行区分，强震弱震一目了然。
- **交互详情**: 点击地图标记可查看地震时间、地点、震级、深度等关键信息。
- **灵活筛选**: 支持按时间范围（最近1-30天）和最小震级进行筛选。
- **离线缓存**: 智能缓存策略，无网络时也能查看上次同步的数据。

### 2. 期刊论文 (Journal Papers)
- **精准追踪**: 实时从学术网络 (Crossref) 获取 **JGR, GRL, EPSL, GJI** 等核心期刊的最新论文。
- **文章列表**: 清晰展示论文标题、作者、发表日期。
- **原文链接**: 支持点击跳转到 DOI 页面查看论文原文。
- **本地持久化**: 所有同步过的论文数据均使用 `expo-sqlite` 存入本地数据库，离线可用。

### 3. 学者信息 (Scholar Profiles)
- **双视图切换**: 支持【列表模式】清晰浏览学者，以及【图谱模式】可视化师生关系网络。
- **信息管理**: 支持手动添加、编辑、删除学者信息（姓名、单位、研究方向、师承关系等）。
- **图谱交互**: 在图谱中，可以点击节点高亮关系，并支持缩放拖拽。
- **本地持久化**: 学者数据存储在本地数据库，重启不丢失。

## 技术栈
- **核心框架**: React Native, Expo
- **导航**: React Navigation
- **数据存储**: `expo-sqlite`, `@react-native-async-storage/async-storage`
- **地图引擎**: `react-native-maps`, `react-native-amap3d` (Android)
- **图表与可视化**: `react-native-svg`

## 环境配置与运行

### 1. 先决条件 (Prerequisites)
- [Node.js](https://nodejs.org/) (LTS)
- [Watchman](https://facebook.github.io/watchman/) (macOS)
- **Java 17 (JDK 17)**: 本项目原生编译依赖 Java 17，版本过高或过低均会导致编译失败。

### 2. 高德地图 API Key 配置 (Android)
1.  访问[高德开放平台](https://lbs.amap.com/)，创建应用，获取 **Android 平台 Key**。
2.  在应用配置中，**Package Name** 请填写: `com.junxie.seisamuse`。
3.  在应用配置中，**SHA1** 请填写您 APK 签名证书的 SHA1 值。
4.  将获取到的 Key 配置到 `app.json` 的 `react-native-amap3d` 插件中 (此步骤我已为你完成)。

### 3. 安装依赖
```bash
npm install
```

### 4. 启动应用 (开发模式)
此模式需要手机/模拟器与电脑连接。
```bash
npx expo start
```
- 在 Expo Go 或开发版 App 中扫描二维码/连接服务器。

### 5. 生成独立测试版 APK (推荐)
此命令会生成一个**包含所有代码、可离线运行**的 APK，用于真机测试。
```bash
# 确保你已完成高德 Key 的配置
npx expo run:android --variant release
```
- 生成的 APK 位于: `android/app/build/outputs/apk/release/app-release.apk`。

## 注意事项
- **地图功能**: 地图在 Android 端使用高德地图，iOS 端使用苹果地图。在 Web 平台会降级为数据列表。
- **网络**: 首次运行需要网络连接以同步地震和论文数据。
- **证书(SHA1)**: 地图无法显示的首要原因是高德开放平台配置的 SHA1 与您生成的 APK 签名不匹配。请确保二者一致。

## 应用截图
![地震分布](picture/2026-02-26%20110323.png)
![期刊论文](picture/2026-02-26%20110323(1).png)
![学者信息](picture/2026-02-26%20110323(2).png)

# seismic-app

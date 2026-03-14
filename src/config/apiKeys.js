// API密钥配置
export const API_KEYS = {
  // 千问API配置
  qianwen: {
    apiKey: 'sk-7b27f5bbb0b04de3a1a18a011afb2469',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
  },
  // Google Maps API配置
  googleMaps: {
    apiKey: 'YOUR_GOOGLE_MAPS_API_KEY' // 请替换为实际的Google Maps API key
  }
  ,
  // 高德地图API配置（中国首选）
  amap: {
    // 已改为通过 Gradle 环境变量注入到 AndroidManifest，避免在源码中明文保存。
    // 若需要在 JS 中使用 key，请通过安全渠道注入或在 CI 中设置环境变量并生成配置。
    apiKey: ''
  }
  // 其他API key
}

const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAMap(config, { apiKey }) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;
    const mainApplication = androidManifest.application[0];

    // 确保 meta-data 数组存在
    if (!mainApplication['meta-data']) {
      mainApplication['meta-data'] = [];
    }

    // 移除旧的 Key，防止冲突
    mainApplication['meta-data'] = mainApplication['meta-data'].filter(
      (item) => item.$['android:name'] !== 'com.amap.api.v2.apikey'
    );

    // 注入新的高德 Key
    mainApplication['meta-data'].push({
      $: {
        'android:name': 'com.amap.api.v2.apikey',
        'android:value': apiKey,
      },
    });

    // 添加定位服务声明（高德地图需要）
    mainApplication['service'] = mainApplication['service'] || [];
    mainApplication['service'].push({
        $: {
            'android:name': 'com.amap.api.location.APSService',
        },
    });

    return config;
  });
};

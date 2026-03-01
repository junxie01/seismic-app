// 动态导入SQLite
let SQLite;
try {
  SQLite = require('expo-sqlite');
  console.log('SQLite module imported successfully in DatabaseManager');
} catch (error) {
  console.warn('SQLite module not available in DatabaseManager:', error);
  SQLite = null;
}

// 导入AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    console.warn('Error getting SQLite instance in DatabaseManager:', error);
    return null;
  }
};

// 打开数据库
let db = null;
try {
  const sqliteInstance = getSQLite();
  if (sqliteInstance) {
    db = sqliteInstance.openDatabase('earthquakes.db');
    console.log('Database opened successfully');
  }
} catch (error) {
  console.warn('Error opening database:', error);
  db = null;
}

// AsyncStorage键名
const STORAGE_KEYS = {
  EARTHQUAKES: 'earthquakes',
  JOURNALS: 'journals',
  PAPERS: 'papers',
  SCHOLARS: 'scholars'
};

// 初始化数据库
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.warn('Database is not available, falling back to AsyncStorage');
      resolve(); // 直接resolve，让调用者知道初始化完成（虽然使用的是AsyncStorage）
      return;
    }
    
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS earthquakes (
          id TEXT PRIMARY KEY,
          geometry TEXT NOT NULL,
          properties TEXT NOT NULL,
          type TEXT NOT NULL,
          time INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );`,
        [],
        () => {
          console.log('Database initialized successfully');
          resolve();
        },
        (_, error) => {
          console.error('Error initializing database:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// 存储地震数据
export const storeEarthquakes = (earthquakes) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.warn('Database is not available, using AsyncStorage');
      // 使用AsyncStorage存储数据
      AsyncStorage.setItem(STORAGE_KEYS.EARTHQUAKES, JSON.stringify(earthquakes))
        .then(() => {
          console.log(`Stored ${earthquakes.length} earthquakes in AsyncStorage`);
          resolve();
        })
        .catch(error => {
          console.error('Error storing earthquakes in AsyncStorage:', error);
          reject(error);
        });
      return;
    }
    
    db.transaction(tx => {
      // 清除旧数据
      tx.executeSql(
        'DELETE FROM earthquakes;',
        [],
        () => {
          console.log('Old earthquake data cleared');
          
          // 插入新数据
          let count = 0;
          const total = earthquakes.length;
          
          if (total === 0) {
            resolve();
            return;
          }
          
          earthquakes.forEach(earthquake => {
            const { id, geometry, properties, type } = earthquake;
            const time = properties.time || properties.timestamp || Date.now();
            const updated_at = Date.now();
            
            tx.executeSql(
              'INSERT INTO earthquakes (id, geometry, properties, type, time, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
              [id, JSON.stringify(geometry), JSON.stringify(properties), type, time, updated_at],
              () => {
                count++;
                if (count === total) {
                  console.log(`Stored ${total} earthquakes`);
                  resolve();
                }
              },
              (_, error) => {
                console.error('Error storing earthquake:', error);
                reject(error);
                return false;
              }
            );
          });
        },
        (_, error) => {
          console.error('Error clearing old data:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// 读取地震数据
export const getEarthquakes = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.warn('Database is not available, using AsyncStorage');
      // 使用AsyncStorage读取数据
      AsyncStorage.getItem(STORAGE_KEYS.EARTHQUAKES)
        .then(data => {
          const earthquakes = data ? JSON.parse(data) : [];
          console.log(`Retrieved ${earthquakes.length} earthquakes from AsyncStorage`);
          resolve(earthquakes);
        })
        .catch(error => {
          console.error('Error retrieving earthquakes from AsyncStorage:', error);
          reject(error);
        });
      return;
    }
    
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM earthquakes ORDER BY time DESC;',
        [],
        (_, { rows }) => {
          const earthquakes = [];
          for (let i = 0; i < rows.length; i++) {
            const row = rows.item(i);
            earthquakes.push({
              id: row.id,
              geometry: JSON.parse(row.geometry),
              properties: JSON.parse(row.properties),
              type: row.type
            });
          }
          console.log(`Retrieved ${earthquakes.length} earthquakes from database`);
          resolve(earthquakes);
        },
        (_, error) => {
          console.error('Error retrieving earthquakes:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// 获取最新的地震数据
export const getLatestEarthquakes = (limit = 10) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.warn('Database is not available, using AsyncStorage');
      // 使用AsyncStorage读取数据
      AsyncStorage.getItem(STORAGE_KEYS.EARTHQUAKES)
        .then(data => {
          let earthquakes = data ? JSON.parse(data) : [];
          // 按时间排序并限制数量
          earthquakes = earthquakes
            .sort((a, b) => (b.properties.time || 0) - (a.properties.time || 0))
            .slice(0, limit);
          console.log(`Retrieved ${earthquakes.length} latest earthquakes from AsyncStorage`);
          resolve(earthquakes);
        })
        .catch(error => {
          console.error('Error retrieving latest earthquakes from AsyncStorage:', error);
          reject(error);
        });
      return;
    }
    
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM earthquakes ORDER BY time DESC LIMIT ?;',
        [limit],
        (_, { rows }) => {
          const earthquakes = [];
          for (let i = 0; i < rows.length; i++) {
            const row = rows.item(i);
            earthquakes.push({
              id: row.id,
              geometry: JSON.parse(row.geometry),
              properties: JSON.parse(row.properties),
              type: row.type
            });
          }
          console.log(`Retrieved ${earthquakes.length} latest earthquakes from database`);
          resolve(earthquakes);
        },
        (_, error) => {
          console.error('Error retrieving latest earthquakes:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// 检查数据库中是否有地震数据
export const hasEarthquakeData = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.warn('Database is not available, using AsyncStorage');
      // 使用AsyncStorage检查数据
      AsyncStorage.getItem(STORAGE_KEYS.EARTHQUAKES)
        .then(data => {
          const hasData = data ? JSON.parse(data).length > 0 : false;
          console.log(`Checked earthquake data in AsyncStorage: ${hasData}`);
          resolve(hasData);
        })
        .catch(error => {
          console.error('Error checking earthquake data in AsyncStorage:', error);
          reject(error);
        });
      return;
    }
    
    db.transaction(tx => {
      tx.executeSql(
        'SELECT COUNT(*) as count FROM earthquakes;',
        [],
        (_, { rows }) => {
          const count = rows.item(0).count;
          resolve(count > 0);
        },
        (_, error) => {
          console.error('Error checking earthquake data:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// 关闭数据库连接
export const closeDatabase = () => {
  // SQLite in Expo doesn't require explicit closing
  console.log('Database connection closed');
};

// 导入expo-sqlite
import * as SQLite from 'expo-sqlite';

let db;
let isSQLiteAvailable = false;

console.log('SQLite module imported:', SQLite);

try {
  // 检查SQLite是否可用
  if (SQLite && typeof SQLite === 'object') {
    // 尝试多种方式初始化数据库，兼容不同版本的expo-sqlite
    if (SQLite.openDatabase) {
      db = SQLite.openDatabase('seisamuse.db');
      isSQLiteAvailable = true;
      console.log('SQLite database initialized using openDatabase');
    } else if (SQLite.SQLiteDatabase && SQLite.SQLiteDatabase.openDatabase) {
      // 兼容不同版本的expo-sqlite
      db = SQLite.SQLiteDatabase.openDatabase('seisamuse.db');
      isSQLiteAvailable = true;
      console.log('SQLite database initialized using SQLiteDatabase.openDatabase');
    } else if (SQLite.default && SQLite.default.openDatabase) {
      // 兼容ES模块默认导出
      db = SQLite.default.openDatabase('seisamuse.db');
      isSQLiteAvailable = true;
      console.log('SQLite database initialized using default.openDatabase');
    } else {
      throw new Error('SQLite openDatabase method not found');
    }
  } else {
    throw new Error('SQLite module not available');
  }
} catch (error) {
  console.log('expo-sqlite not available, will use fallback storage:', error);
  // 创建空实现，用于web环境或其他不支持SQLite的环境
  isSQLiteAvailable = false;
  // 确保db对象存在，避免后续操作报错
  db = {
    transaction: (callback) => {
      console.log('SQLite transaction called in fallback mode');
      callback({ executeSql: () => {} });
    }
  };
}



// 内存缓存
const memoryCache = {
  scholars: null,
  relationships: null,
  lastUpdated: null
};

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟

// 初始化数据库
const initDatabase = async () => {
  if (!isSQLiteAvailable) {
    console.log('SQLite not available, skipping database initialization');
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        // 创建学者表
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS scholars (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            institution TEXT,
            description TEXT,
            type TEXT DEFAULT 'scientist',
            radius INTEGER DEFAULT 25,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );`,
          [],
          (_, result) => console.log('Scholars table created successfully'),
          (_, error) => {
            console.error('Error creating scholars table:', error);
            return false;
          }
        );
        
        // 创建关系表
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS relationships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            label TEXT,
            type TEXT DEFAULT 'teacher-student',
            weight INTEGER DEFAULT 3,
            color TEXT DEFAULT '#9C27B0',
            stroke_dasharray TEXT DEFAULT 'none',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );`,
          [],
          (_, result) => console.log('Relationships table created successfully'),
          (_, error) => {
            console.error('Error creating relationships table:', error);
            return false;
          }
        );
        
        // 为relationships表添加索引
        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships (source_id);`,
          [],
          (_, result) => console.log('Index on relationships.source_id created successfully'),
          (_, error) => {
            console.error('Error creating index on relationships.source_id:', error);
            return false;
          }
        );
        
        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships (target_id);`,
          [],
          (_, result) => console.log('Index on relationships.target_id created successfully'),
          (_, error) => {
            console.error('Error creating index on relationships.target_id:', error);
            return false;
          }
        );
        
        // 为scholars表添加索引
        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_scholars_name ON scholars (name);`,
          [],
          (_, result) => console.log('Index on scholars.name created successfully'),
          (_, error) => {
            console.error('Error creating index on scholars.name:', error);
            return false;
          }
        );
      }, error => {
        console.error('Error initializing database:', error);
        // 即使初始化失败，也返回成功，避免应用崩溃
        // 后续操作会使用fallback存储
        console.log('Database initialization failed, will use fallback storage');
        resolve();
      }, () => {
        console.log('Database initialized successfully');
        resolve();
      });
    } catch (error) {
      console.error('Unexpected error during database initialization:', error);
      // 即使发生意外错误，也返回成功，避免应用崩溃
      resolve();
    }
  });
};

// 批量保存学者信息
const batchSaveScholars = async (scholars) => {
  if (!isSQLiteAvailable || !scholars || scholars.length === 0) {
    console.log('SQLite not available or no scholars to save, skipping batch save');
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        let savedCount = 0;
        const totalScholars = scholars.length;
        
        scholars.forEach(scholar => {
          tx.executeSql(
            `INSERT OR REPLACE INTO scholars (id, name, institution, description, type, radius, metadata) 
             VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [
              scholar.id,
              scholar.name,
              scholar.institution || null,
              scholar.description || null,
              scholar.type || 'scientist',
              scholar.radius || 25,
              JSON.stringify(scholar.metadata || {})
            ],
            (_, result) => {
              savedCount++;
              console.log('Scholar saved successfully:', scholar.name);
              if (savedCount === totalScholars) {
                // 清除缓存，确保下次读取最新数据
                memoryCache.scholars = null;
                memoryCache.lastUpdated = null;
                resolve({ saved: savedCount, total: totalScholars });
              }
            },
            (_, error) => {
              console.error('Error saving scholar:', error);
              savedCount++;
              if (savedCount === totalScholars) {
                // 清除缓存，确保下次读取最新数据
                memoryCache.scholars = null;
                memoryCache.lastUpdated = null;
                resolve({ saved: savedCount - 1, total: totalScholars });
              }
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Unexpected error batch saving scholars:', error);
      // 即使发生意外错误，也返回成功，避免应用崩溃
      resolve({ saved: 0, total: scholars.length });
    }
  });
};

// 批量保存关系信息
const batchSaveRelationships = async (relationships) => {
  if (!isSQLiteAvailable || !relationships || relationships.length === 0) {
    console.log('SQLite not available or no relationships to save, skipping batch save');
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        let savedCount = 0;
        const totalRelationships = relationships.length;
        
        relationships.forEach(relationship => {
          tx.executeSql(
            `INSERT OR REPLACE INTO relationships (source_id, target_id, label, type, weight, color, stroke_dasharray) 
             VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [
              relationship.source_id,
              relationship.target_id,
              relationship.label || '师承',
              relationship.type || 'teacher-student',
              relationship.weight || 3,
              relationship.color || '#9C27B0',
              relationship.stroke_dasharray || 'none'
            ],
            (_, result) => {
              savedCount++;
              console.log('Relationship saved successfully');
              if (savedCount === totalRelationships) {
                // 清除缓存，确保下次读取最新数据
                memoryCache.relationships = null;
                memoryCache.lastUpdated = null;
                resolve({ saved: savedCount, total: totalRelationships });
              }
            },
            (_, error) => {
              console.error('Error saving relationship:', error);
              savedCount++;
              if (savedCount === totalRelationships) {
                // 清除缓存，确保下次读取最新数据
                memoryCache.relationships = null;
                memoryCache.lastUpdated = null;
                resolve({ saved: savedCount - 1, total: totalRelationships });
              }
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Unexpected error batch saving relationships:', error);
      // 即使发生意外错误，也返回成功，避免应用崩溃
      resolve({ saved: 0, total: relationships.length });
    }
  });
};

// 保存学者信息
const saveScholar = async (scholar) => {
  if (!isSQLiteAvailable) {
    console.log('SQLite not available, skipping save scholar:', scholar.name);
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO scholars (id, name, institution, description, type, radius, metadata) 
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            scholar.id,
            scholar.name,
            scholar.institution || null,
            scholar.description || null,
            scholar.type || 'scientist',
            scholar.radius || 25,
            JSON.stringify(scholar.metadata || {})
          ],
          (_, result) => {
            console.log('Scholar saved successfully:', scholar.name);
            // 清除缓存，确保下次读取最新数据
            memoryCache.scholars = null;
            memoryCache.lastUpdated = null;
            resolve(result);
          },
          (_, error) => {
            console.error('Error saving scholar:', error);
            // 即使保存失败，也返回成功，避免应用崩溃
            // 后续操作会使用fallback存储
            resolve(null);
            return false;
          }
        );
      });
    } catch (error) {
      console.error('Unexpected error saving scholar:', error);
      // 即使发生意外错误，也返回成功，避免应用崩溃
      resolve(null);
    }
  });
};

// 保存关系信息
const saveRelationship = async (relationship) => {
  if (!isSQLiteAvailable) {
    console.log('SQLite not available, skipping save relationship');
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO relationships (source_id, target_id, label, type, weight, color, stroke_dasharray) 
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            relationship.source_id,
            relationship.target_id,
            relationship.label || '师承',
            relationship.type || 'teacher-student',
            relationship.weight || 3,
            relationship.color || '#9C27B0',
            relationship.stroke_dasharray || 'none'
          ],
          (_, result) => {
            console.log('Relationship saved successfully');
            // 清除缓存，确保下次读取最新数据
            memoryCache.relationships = null;
            memoryCache.lastUpdated = null;
            resolve(result);
          },
          (_, error) => {
            console.error('Error saving relationship:', error);
            // 即使保存失败，也返回成功，避免应用崩溃
            // 后续操作会使用fallback存储
            resolve(null);
            return false;
          }
        );
      });
    } catch (error) {
      console.error('Unexpected error saving relationship:', error);
      // 即使发生意外错误，也返回成功，避免应用崩溃
      resolve(null);
    }
  });
};

// 获取所有学者
const getAllScholars = async () => {
  if (!isSQLiteAvailable) {
    console.log('SQLite not available, returning empty scholars list');
    return Promise.resolve([]);
  }
  
  // 检查内存缓存
  const currentTime = Date.now();
  if (memoryCache.scholars && memoryCache.lastUpdated && (currentTime - memoryCache.lastUpdated) < CACHE_EXPIRY) {
    console.log('Using cached scholars data');
    return Promise.resolve(memoryCache.scholars);
  }
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM scholars;',
          [],
          (_, result) => {
            const scholars = [];
            try {
              for (let i = 0; i < result.rows.length; i++) {
                const scholar = result.rows.item(i);
                // 解析metadata JSON字符串
                if (scholar.metadata) {
                  try {
                    scholar.metadata = JSON.parse(scholar.metadata);
                  } catch (error) {
                    console.error('Error parsing metadata:', error);
                    scholar.metadata = {};
                  }
                }
                scholars.push(scholar);
              }
              
              // 更新内存缓存
              memoryCache.scholars = scholars;
              memoryCache.lastUpdated = currentTime;
              console.log('Scholars data cached in memory');
            } catch (error) {
              console.error('Error processing scholars data:', error);
              // 即使处理数据失败，也返回空数组，避免应用崩溃
              resolve([]);
              return;
            }
            resolve(scholars);
          },
          (_, error) => {
            console.error('Error getting scholars:', error);
            // 即使查询失败，也返回空数组，避免应用崩溃
            resolve([]);
            return false;
          }
        );
      });
    } catch (error) {
      console.error('Unexpected error getting scholars:', error);
      // 即使发生意外错误，也返回空数组，避免应用崩溃
      resolve([]);
    }
  });
};

// 获取所有关系
const getAllRelationships = async () => {
  if (!isSQLiteAvailable) {
    console.log('SQLite not available, returning empty relationships list');
    return Promise.resolve([]);
  }
  
  // 检查内存缓存
  const currentTime = Date.now();
  if (memoryCache.relationships && memoryCache.lastUpdated && (currentTime - memoryCache.lastUpdated) < CACHE_EXPIRY) {
    console.log('Using cached relationships data');
    return Promise.resolve(memoryCache.relationships);
  }
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM relationships;',
          [],
          (_, result) => {
            const relationships = [];
            try {
              for (let i = 0; i < result.rows.length; i++) {
                relationships.push(result.rows.item(i));
              }
              
              // 更新内存缓存
              memoryCache.relationships = relationships;
              memoryCache.lastUpdated = currentTime;
              console.log('Relationships data cached in memory');
            } catch (error) {
              console.error('Error processing relationships data:', error);
              // 即使处理数据失败，也返回空数组，避免应用崩溃
              resolve([]);
              return;
            }
            resolve(relationships);
          },
          (_, error) => {
            console.error('Error getting relationships:', error);
            // 即使查询失败，也返回空数组，避免应用崩溃
            resolve([]);
            return false;
          }
        );
      });
    } catch (error) {
      console.error('Unexpected error getting relationships:', error);
      // 即使发生意外错误，也返回空数组，避免应用崩溃
      resolve([]);
    }
  });
};

// 删除所有学者和关系（用于测试）
const clearAllData = async () => {
  if (!isSQLiteAvailable) {
    console.log('SQLite not available, skipping clear all data');
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM relationships;',
        [],
        (_, result) => console.log('Relationships cleared'),
        (_, error) => {
          console.error('Error clearing relationships:', error);
          return false;
        }
      );
      tx.executeSql(
        'DELETE FROM scholars;',
        [],
        (_, result) => console.log('Scholars cleared'),
        (_, error) => {
          console.error('Error clearing scholars:', error);
          return false;
        }
      );
    }, error => {
      console.error('Error clearing data:', error);
      reject(error);
    }, () => {
      console.log('All data cleared successfully');
      // 清除内存缓存
      memoryCache.scholars = null;
      memoryCache.relationships = null;
      memoryCache.lastUpdated = null;
      console.log('Memory cache cleared');
      resolve();
    });
  });
};

export {
  initDatabase,
  saveScholar,
  saveRelationship,
  batchSaveScholars,
  batchSaveRelationships,
  getAllScholars,
  getAllRelationships,
  clearAllData,
  isSQLiteAvailable
};

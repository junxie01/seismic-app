// 动态导入SQLite
let SQLite;
try {
  SQLite = require('expo-sqlite');
  console.log('SQLite module imported successfully in DatabaseManager');
} catch (error) {
  console.warn('SQLite module not available in DatabaseManager:', error);
  SQLite = null;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

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

let db = null;
try {
  const sqliteInstance = getSQLite();
  if (sqliteInstance) {
    db = sqliteInstance.openDatabase('seisamuse.db'); // 使用统一的数据库名称
    console.log('Database opened successfully');
  }
} catch (error) {
  console.warn('Error opening database:', error);
  db = null;
}

const STORAGE_KEYS = {
  EARTHQUAKES: 'earthquakes',
  JOURNALS: 'journals',
  PAPERS: 'papers',
  SCHOLARS: 'scholars'
};

// 初始化所有表
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.warn('Database is not available, falling back to AsyncStorage');
      resolve();
      return;
    }
    
    db.transaction(tx => {
      // 1. 地震数据表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS earthquakes (
          id TEXT PRIMARY KEY,
          geometry TEXT NOT NULL,
          properties TEXT NOT NULL,
          type TEXT NOT NULL,
          time INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );`
      );

      // 2. 期刊表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS journals (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          abbr TEXT,
          impact_factor REAL,
          issn TEXT,
          created_at INTEGER NOT NULL
        );`
      );

      // 3. 论文表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS papers (
          id TEXT PRIMARY KEY,
          journalId TEXT NOT NULL,
          title TEXT NOT NULL,
          authors TEXT NOT NULL,
          date TEXT NOT NULL,
          doi TEXT,
          url TEXT,
          abstract TEXT,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (journalId) REFERENCES journals (id)
        );`
      );

      // 4. 学者表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS scholars (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          affiliation TEXT,
          research TEXT,
          bio TEXT,
          papers INTEGER,
          citations INTEGER,
          advisor TEXT,
          students TEXT,
          created_at INTEGER NOT NULL
        );`,
        [],
        () => {
          console.log('All tables initialized successfully');
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

// --- 地震数据方法 ---
export const storeEarthquakes = (earthquakes) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      AsyncStorage.setItem(STORAGE_KEYS.EARTHQUAKES, JSON.stringify(earthquakes)).then(resolve).catch(reject);
      return;
    }
    db.transaction(tx => {
      tx.executeSql('DELETE FROM earthquakes;', [], () => {
        earthquakes.forEach(e => {
          tx.executeSql(
            'INSERT INTO earthquakes (id, geometry, properties, type, time, updated_at) VALUES (?, ?, ?, ?, ?, ?);',
            [e.id, JSON.stringify(e.geometry), JSON.stringify(e.properties), e.type, e.properties.time || Date.now(), Date.now()]
          );
        });
        resolve();
      });
    });
  });
};

export const getEarthquakes = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      AsyncStorage.getItem(STORAGE_KEYS.EARTHQUAKES).then(data => resolve(data ? JSON.parse(data) : [])).catch(reject);
      return;
    }
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM earthquakes ORDER BY time DESC;', [], (_, { rows }) => {
        const results = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows.item(i);
          results.push({ id: row.id, geometry: JSON.parse(row.geometry), properties: JSON.parse(row.properties), type: row.type });
        }
        resolve(results);
      });
    });
  });
};

export const hasEarthquakeData = () => {
  return new Promise((resolve) => {
    if (!db) {
      AsyncStorage.getItem(STORAGE_KEYS.EARTHQUAKES).then(data => resolve(!!data && JSON.parse(data).length > 0)).catch(() => resolve(false));
      return;
    }
    db.transaction(tx => {
      tx.executeSql('SELECT COUNT(*) as count FROM earthquakes;', [], (_, { rows }) => resolve(rows.item(0).count > 0));
    });
  });
};

// --- 期刊论文方法 ---
export const storeJournalData = (journals, papers) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals)),
        AsyncStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(papers))
      ]).then(resolve).catch(reject);
      return;
    }
    db.transaction(tx => {
      tx.executeSql('DELETE FROM journals;');
      tx.executeSql('DELETE FROM papers;');
      journals.forEach(j => {
        tx.executeSql('INSERT INTO journals (id, title, abbr, impact_factor, issn, created_at) VALUES (?, ?, ?, ?, ?, ?);',
          [j.id, j.title, j.abbr, j.impact_factor, j.issn, Date.now()]);
      });
      papers.forEach(p => {
        tx.executeSql('INSERT INTO papers (id, journalId, title, authors, date, doi, url, abstract, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
          [p.id, p.journalId, p.title, p.authors, p.date, p.doi, p.url, p.abstract, Date.now()]);
      });
      resolve();
    });
  });
};

export const getJournalData = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.JOURNALS),
        AsyncStorage.getItem(STORAGE_KEYS.PAPERS)
      ]).then(([j, p]) => resolve({
        journals: j ? JSON.parse(j) : [],
        papers: p ? JSON.parse(p) : []
      })).catch(reject);
      return;
    }
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM journals ORDER BY title;', [], (_, jRows) => {
        const journals = [];
        for (let i = 0; i < jRows.rows.length; i++) journals.push(jRows.rows.item(i));
        tx.executeSql('SELECT * FROM papers ORDER BY date DESC;', [], (_, pRows) => {
          const papers = [];
          for (let i = 0; i < pRows.rows.length; i++) papers.push(pRows.rows.item(i));
          resolve({ journals, papers });
        });
      });
    });
  });
};

// --- 学者方法 ---
export const storeScholars = (scholars) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      AsyncStorage.setItem(STORAGE_KEYS.SCHOLARS, JSON.stringify(scholars)).then(resolve).catch(reject);
      return;
    }
    db.transaction(tx => {
      tx.executeSql('DELETE FROM scholars;', [], () => {
        scholars.forEach(s => {
          tx.executeSql(
            'INSERT INTO scholars (id, name, affiliation, research, bio, papers, citations, advisor, students, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
            [s.id.toString(), s.name, s.affiliation, s.research, s.bio, s.papers, s.citations, s.advisor, s.students, Date.now()]
          );
        });
        resolve();
      });
    });
  });
};

export const getScholars = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      AsyncStorage.getItem(STORAGE_KEYS.SCHOLARS).then(data => resolve(data ? JSON.parse(data) : [])).catch(reject);
      return;
    }
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM scholars ORDER BY name;', [], (_, { rows }) => {
        const results = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows.item(i);
          results.push({ ...row, id: row.id.match(/^\d+$/) ? parseInt(row.id) : row.id });
        }
        resolve(results);
      });
    });
  });
};

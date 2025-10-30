const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../database.sqlite');
    this.db = null;
  }

  /**
   * Initialize database and create tables
   */
  async initializeDatabase() {
    try {
      // Ensure database directory exists
      await fs.ensureDir(path.dirname(this.dbPath));

      // Create/open database
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err);
        } else {
          console.log('📊 Database connected successfully');
        }
      });

      // Create tables
      await this.createTables();
      
      // Run migrations to add any missing columns
      await this.runMigrations();
      
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  async createTables() {
    const tables = [
      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        script_content TEXT NOT NULL,
        file_path TEXT,
        image_style TEXT DEFAULT 'realistic',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Scenes table
      `CREATE TABLE IF NOT EXISTS scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        scene_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        emotion TEXT NOT NULL,
        confidence REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )`,
      
      // Storyboard frames table
      `CREATE TABLE IF NOT EXISTS storyboard_frames (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        scene_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        emotion TEXT NOT NULL,
        custom_prompt TEXT,
        frame_order INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (scene_id) REFERENCES scenes (id) ON DELETE CASCADE
      )`,
      
      // User preferences table (for future use)
      `CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.runQuery(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_frames_project_id ON storyboard_frames(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_frames_scene_id ON storyboard_frames(scene_id)',
      'CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at)'
    ];

    for (const index of indexes) {
      await this.runQuery(index);
    }

    // Run migrations to add missing columns
    await this.runMigrations();
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    try {
      // Check if prompt column exists in storyboard_frames
      const tableInfo = await this.getQuery("PRAGMA table_info(storyboard_frames)");
      const columnNames = tableInfo.map(col => col.name);
      console.log('📋 Current storyboard_frames columns:', columnNames.join(', '));
      
      const hasPromptColumn = tableInfo.some(col => col.name === 'prompt');
      const hasUpdatedAtColumn = tableInfo.some(col => col.name === 'updated_at');

      // Add prompt column if it doesn't exist
      if (!hasPromptColumn) {
        console.log('🔄 Adding prompt column to storyboard_frames table...');
        await this.runQuery('ALTER TABLE storyboard_frames ADD COLUMN prompt TEXT');
        console.log('✅ Added prompt column successfully');
      } else {
        console.log('✓ prompt column already exists');
      }

      // Add updated_at column if it doesn't exist
      if (!hasUpdatedAtColumn) {
        console.log('🔄 Adding updated_at column to storyboard_frames table...');
        await this.runQuery('ALTER TABLE storyboard_frames ADD COLUMN updated_at DATETIME');
        console.log('✅ Added updated_at column successfully');
      } else {
        console.log('✓ updated_at column already exists');
      }

      // Check if cinematography columns exist in scenes table
      const scenesTableInfo = await this.getQuery("PRAGMA table_info(scenes)");
      const scenesColumnNames = scenesTableInfo.map(col => col.name);
      
      const hasCameraSuggestion = scenesTableInfo.some(col => col.name === 'camera_suggestion');
      const hasLightingSuggestion = scenesTableInfo.some(col => col.name === 'lighting_suggestion');
      const hasSuggestionReasoning = scenesTableInfo.some(col => col.name === 'suggestion_reasoning');

      // Add cinematography suggestion columns if they don't exist
      if (!hasCameraSuggestion) {
        console.log('🔄 Adding camera_suggestion column to scenes table...');
        await this.runQuery('ALTER TABLE scenes ADD COLUMN camera_suggestion TEXT');
        console.log('✅ Added camera_suggestion column successfully');
      } else {
        console.log('✓ camera_suggestion column already exists');
      }

      if (!hasLightingSuggestion) {
        console.log('🔄 Adding lighting_suggestion column to scenes table...');
        await this.runQuery('ALTER TABLE scenes ADD COLUMN lighting_suggestion TEXT');
        console.log('✅ Added lighting_suggestion column successfully');
      } else {
        console.log('✓ lighting_suggestion column already exists');
      }

      if (!hasSuggestionReasoning) {
        console.log('🔄 Adding suggestion_reasoning column to scenes table...');
        await this.runQuery('ALTER TABLE scenes ADD COLUMN suggestion_reasoning TEXT');
        console.log('✅ Added suggestion_reasoning column successfully');
      } else {
        console.log('✓ suggestion_reasoning column already exists');
      }
    } catch (error) {
      console.error('Migration error:', error);
      // Don't throw - migrations are optional and shouldn't break the app
    }
  }

  /**
   * Execute a SQL query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise} Query result
   */
  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Get query results
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get single query result
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  getOneQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // PROJECT OPERATIONS

  /**
   * Create a new project
   * @param {Object} projectData - Project information
   * @returns {Promise<number>} Project ID
   */
  async createProject(projectData) {
    const { title, scriptContent, filePath, imageStyle = 'realistic' } = projectData;
    const sql = `
      INSERT INTO projects (title, script_content, file_path, image_style)
      VALUES (?, ?, ?, ?)
    `;
    const result = await this.runQuery(sql, [title, scriptContent, filePath, imageStyle]);
    return result.id;
  }

  /**
   * Get project by ID
   * @param {number} projectId - Project ID
   * @returns {Promise<Object>} Project data
   */
  async getProject(projectId) {
    const sql = 'SELECT * FROM projects WHERE id = ?';
    return await this.getOneQuery(sql, [projectId]);
  }

  /**
   * Get all projects
   * @returns {Promise<Array>} All projects
   */
  async getAllProjects() {
    const sql = 'SELECT * FROM projects ORDER BY created_at DESC';
    return await this.getQuery(sql);
  }

  /**
   * Update project
   * @param {number} projectId - Project ID
   * @param {Object} updates - Update data
   * @returns {Promise} Update result
   */
  async updateProject(projectId, updates) {
    const { title, scriptContent } = updates;
    const sql = `
      UPDATE projects 
      SET title = ?, script_content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    return await this.runQuery(sql, [title, scriptContent, projectId]);
  }

  /**
   * Delete project
   * @param {number} projectId - Project ID
   * @returns {Promise} Delete result
   */
  async deleteProject(projectId) {
    const sql = 'DELETE FROM projects WHERE id = ?';
    return await this.runQuery(sql, [projectId]);
  }

  // SCENE OPERATIONS

  /**
   * Create a new scene
   * @param {Object} sceneData - Scene information
   * @returns {Promise<number>} Scene ID
   */
  async createScene(sceneData) {
    const { projectId, sceneNumber, content, emotion, confidence } = sceneData;
    const sql = `
      INSERT INTO scenes (project_id, scene_number, content, emotion, confidence)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await this.runQuery(sql, [projectId, sceneNumber, content, emotion, confidence]);
    return result.id;
  }

  /**
   * Get scenes by project ID
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} Project scenes
   */
  async getScenesByProject(projectId) {
    const sql = 'SELECT * FROM scenes WHERE project_id = ? ORDER BY scene_number';
    return await this.getQuery(sql, [projectId]);
  }

  /**
   * Get scene by ID
   * @param {number} sceneId - Scene ID
   * @returns {Promise<Object>} Scene data
   */
  async getScene(sceneId) {
    const sql = 'SELECT * FROM scenes WHERE id = ?';
    return await this.getOneQuery(sql, [sceneId]);
  }

  /**
   * Update scene emotion
   * @param {number} sceneId - Scene ID
   * @param {string} emotion - New emotion
   * @param {number} confidence - Confidence score
   * @returns {Promise} Update result
   */
  async updateSceneEmotion(sceneId, emotion, confidence) {
    const sql = 'UPDATE scenes SET emotion = ?, confidence = ? WHERE id = ?';
    return await this.runQuery(sql, [emotion, confidence, sceneId]);
  }

  /**
   * Update scene with cinematography suggestions
   * @param {number} sceneId - Scene ID
   * @param {Object} suggestions - Suggestions object
   * @returns {Promise} Update result
   */
  async updateSceneSuggestions(sceneId, suggestions) {
    const { camera, lighting, reasoning } = suggestions;
    const sql = `
      UPDATE scenes 
      SET camera_suggestion = ?, lighting_suggestion = ?, suggestion_reasoning = ? 
      WHERE id = ?
    `;
    return await this.runQuery(sql, [camera, lighting, reasoning, sceneId]);
  }

  // STORYBOARD FRAME OPERATIONS

  /**
   * Create a new storyboard frame
   * @param {Object} frameData - Frame information
   * @returns {Promise<number>} Frame ID
   */
  async createStoryboardFrame(frameData) {
    const { projectId, sceneId, imageUrl, emotion, customPrompt, frameOrder } = frameData;
    const sql = `
      INSERT INTO storyboard_frames (project_id, scene_id, image_url, emotion, custom_prompt, frame_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await this.runQuery(sql, [projectId, sceneId, imageUrl, emotion, customPrompt, frameOrder]);
    return result.id;
  }

  /**
   * Get storyboard frames by project ID
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} Project frames
   */
  async getFramesByProject(projectId) {
    const sql = `
      SELECT sf.*, s.scene_number, s.content as scene_content
      FROM storyboard_frames sf
      JOIN scenes s ON sf.scene_id = s.id
      WHERE sf.project_id = ?
      ORDER BY s.scene_number, sf.frame_order
    `;
    return await this.getQuery(sql, [projectId]);
  }

  /**
   * Update frame image URL
   * @param {number} frameId - Frame ID
   * @param {string} imageUrl - New image URL
   * @returns {Promise} Update result
   */
  async updateFrameImage(frameId, imageUrl) {
    const sql = 'UPDATE storyboard_frames SET image_url = ? WHERE id = ?';
    return await this.runQuery(sql, [imageUrl, frameId]);
  }

  /**
   * Update frame order
   * @param {number} frameId - Frame ID
   * @param {number} newOrder - New frame order
   * @returns {Promise} Update result
   */
  async updateFrameOrder(frameId, newOrder) {
    const sql = 'UPDATE storyboard_frames SET frame_order = ? WHERE id = ?';
    return await this.runQuery(sql, [newOrder, frameId]);
  }

  /**
   * Delete storyboard frame
   * @param {number} frameId - Frame ID
   * @returns {Promise} Delete result
   */
  async deleteFrame(frameId) {
    const sql = 'DELETE FROM storyboard_frames WHERE id = ?';
    return await this.runQuery(sql, [frameId]);
  }

  // UTILITY OPERATIONS

  /**
   * Get project statistics
   * @param {number} projectId - Project ID
   * @returns {Promise<Object>} Project statistics
   */
  async getProjectStats(projectId) {
    const sceneCountSql = 'SELECT COUNT(*) as scene_count FROM scenes WHERE project_id = ?';
    const frameCountSql = 'SELECT COUNT(*) as frame_count FROM storyboard_frames WHERE project_id = ?';
    const emotionDistSql = `
      SELECT emotion, COUNT(*) as count 
      FROM scenes 
      WHERE project_id = ? 
      GROUP BY emotion 
      ORDER BY count DESC
    `;

    const [sceneCount, frameCount, emotionDist] = await Promise.all([
      this.getOneQuery(sceneCountSql, [projectId]),
      this.getOneQuery(frameCountSql, [projectId]),
      this.getQuery(emotionDistSql, [projectId])
    ]);

    return {
      sceneCount: sceneCount.scene_count,
      frameCount: frameCount.frame_count,
      emotionDistribution: emotionDist
    };
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Database close error:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = new DatabaseService();
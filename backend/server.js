const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const emotionService = require('./services/emotionService');
const imageService = require('./services/imageService');
const databaseService = require('./services/databaseService');
const fileParserService = require('./services/fileParserService');
const geminiService = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for generated images
app.use('/images', express.static(path.join(__dirname, '../generated_images')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/rtf',
      'text/rtf'
    ];
    
    const allowedExtensions = [
      '.txt', '.fountain', '.pdf', '.doc', '.docx', '.rtf', '.fdx', '.celtx'
    ];
    
    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasValidMimeType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload .txt, .pdf, .doc, .docx, .rtf, .fountain, .fdx, or .celtx files'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (increased for PDFs and Word docs)
  }
});

// Initialize database
databaseService.initializeDatabase();

// Routes
const scriptRoutes = require('./routes/scripts');
const storyboardRoutes = require('./routes/storyboards');

app.use('/api/scripts', scriptRoutes);
app.use('/api/storyboards', storyboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get available image styles endpoint
app.get('/api/image-styles', (req, res) => {
  try {
    const styles = imageService.getAvailableStyles();
    res.json({ success: true, styles });
  } catch (error) {
    console.error('Error getting image styles:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve image styles',
      details: error.message 
    });
  }
});

// Upload script endpoint
app.post('/api/upload-script', upload.single('script'), async (req, res) => {
  try {
    console.log('📁 Upload request received');
    console.log('File info:', req.file ? { 
      filename: req.file.filename, 
      size: req.file.size, 
      mimetype: req.file.mimetype 
    } : 'No file');
    console.log('Body:', req.body);

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No script file uploaded' });
    }

    console.log('📖 Parsing file content...');
    console.log('File type:', fileParserService.getFileType(req.file.originalname));
    
    // Use file parser service to handle different file types
    const scriptContent = await fileParserService.parseFile(req.file.path, req.file.originalname);
    console.log('✅ File parsed successfully, length:', scriptContent.length);
    
    const projectTitle = req.body.title || 'Untitled Project';
    const language = req.body.language || 'en';
    const imageStyle = req.body.imageStyle || 'realistic';
    
    console.log('💾 Creating project in database...');
    console.log('Project data:', { title: projectTitle, imageStyle, language });
    
    // Save project to database
    const projectId = await databaseService.createProject({
      title: projectTitle,
      scriptContent,
      filePath: req.file.path,
      imageStyle: imageStyle
    });
    console.log('✅ Project created with ID:', projectId);

    console.log('🧠 Analyzing script emotions...');
    // Analyze emotions in the script with language support
    const scenes = await emotionService.analyzeScript(scriptContent, language);
    console.log('✅ Emotion analysis complete, found', scenes.length, 'scenes');
    
    console.log('💾 Saving scenes to database...');
    // Save scenes to database
    for (const scene of scenes) {
      await databaseService.createScene({
        projectId,
        content: scene.content,
        emotion: scene.emotion,
        confidence: scene.confidence,
        sceneNumber: scene.sceneNumber
      });
    }
    console.log('✅ All scenes saved successfully');

    console.log('📤 Sending success response');
    res.json({
      success: true,
      projectId,
      scenes,
      language: language,
      message: `Script analyzed successfully. Found ${scenes.length} scenes.`
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to process script',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate storyboard endpoint
app.post('/api/generate-storyboard/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log('🎬 Generating storyboard for project:', projectId);
    console.log('📋 Request headers:', req.headers);
    console.log('📋 Raw request body:', req.body);
    console.log('📋 Body type:', typeof req.body);
    
    const { sceneNumbers } = req.body; // Array of scene numbers to generate
    console.log('📋 Selected scene numbers:', sceneNumbers);
    
    // Get project to retrieve imageStyle
    const project = await databaseService.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Use imageStyle from request body, or fall back to project's saved style, or default to realistic
    const imageStyle = req.body.imageStyle || project.image_style || 'realistic';
    
    // Get scenes from database
    let scenes = await databaseService.getScenesByProject(projectId);
    
    if (!scenes.length) {
      return res.status(404).json({ error: 'No scenes found for this project' });
    }

    console.log('📚 All scenes:', scenes.map(s => ({ id: s.id, scene_number: s.scene_number, type: typeof s.scene_number })));

    // Filter scenes if specific scene numbers were provided
    if (sceneNumbers && Array.isArray(sceneNumbers) && sceneNumbers.length > 0) {
      // Ensure both scene numbers and filter are numbers for proper comparison
      const numberFilter = sceneNumbers.map(n => Number(n));
      scenes = scenes.filter(scene => numberFilter.includes(Number(scene.scene_number)));
      console.log(`✅ Filtered to ${scenes.length} selected scenes from ${sceneNumbers.length} requested`);
      console.log('Selected scenes:', scenes.map(s => ({ id: s.id, sceneNumber: s.sceneNumber })));
    }

    if (scenes.length === 0) {
      return res.status(400).json({ error: 'No valid scenes selected for generation' });
    }

    const storyboardFrames = [];
    let successfulFrames = 0;
    let failedFrames = 0;

    // Generate images for each scene with selected style
    for (const scene of scenes) {
      try {
        console.log(`🎨 Generating image for Scene ${scene.sceneNumber} (${scene.emotion})...`);
        const imageUrl = await imageService.generateImage(scene.content, scene.emotion, imageStyle);
        
        const frame = {
          sceneId: scene.id,
          sceneNumber: scene.sceneNumber,
          content: scene.content,
          emotion: scene.emotion,
          confidence: scene.confidence,
          imageUrl,
          imageStyle,
          timestamp: new Date().toISOString()
        };

        // Save frame to database
        await databaseService.createStoryboardFrame({
          projectId,
          sceneId: scene.id,
          imageUrl,
          emotion: scene.emotion
        });

        storyboardFrames.push(frame);
        successfulFrames++;
        console.log(`✅ Scene ${scene.sceneNumber} image generated successfully`);
      } catch (imageError) {
        console.error(`❌ Error generating image for scene ${scene.sceneNumber}:`, imageError);
        failedFrames++;
        // Continue with other scenes even if one fails
        storyboardFrames.push({
          sceneId: scene.id,
          sceneNumber: scene.sceneNumber,
          content: scene.content,
          emotion: scene.emotion,
          confidence: scene.confidence,
          imageUrl: null,
          error: 'Failed to generate image',
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`✅ Storyboard generation complete: ${successfulFrames} successful, ${failedFrames} failed`);

    // Generate cinematography suggestions using Gemini AI
    let cinematographySuggestions = null;
    try {
      console.log('🎬 Generating cinematography suggestions with Gemini AI...');
      const geminiResult = await geminiService.generateCinematographySuggestions(scenes);
      
      if (geminiResult.success && geminiResult.suggestions.length > 0) {
        cinematographySuggestions = geminiResult;
        
        // Save suggestions to database
        for (const suggestion of geminiResult.suggestions) {
          await databaseService.updateSceneSuggestions(suggestion.sceneId, {
            camera: suggestion.camera,
            lighting: suggestion.lighting,
            reasoning: suggestion.reasoning
          });
        }
        
        console.log('✅ Cinematography suggestions saved to database');
      }
    } catch (geminiError) {
      console.error('⚠️  Gemini suggestions failed (non-critical):', geminiError.message);
      // Don't fail the whole request if Gemini fails
    }

    res.json({
      success: true,
      projectId,
      frames: storyboardFrames,
      successfulFrames,
      failedFrames,
      cinematographySuggestions,
      message: `Generated ${successfulFrames} storyboard frames${failedFrames > 0 ? ` (${failedFrames} failed)` : ''}`
    });

  } catch (error) {
    console.error('❌ Storyboard generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate storyboard',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🎬 Film Storyboard AI Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
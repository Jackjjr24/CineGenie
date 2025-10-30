const express = require('express');
const router = express.Router();
const imageGenerationService = require('../services/imageGenerationService');
const exportService = require('../services/exportService');
const multilingualService = require('../services/multilingualService');
const databaseService = require('../services/databaseService');
const path = require('path');

// Enhanced frame generation with cinematographic options
router.post('/frames/generate-enhanced', async (req, res) => {
  try {
    const {
      sceneDescription,
      emotion,
      style = 'cinematic',
      cameraAngle,
      lighting,
      colorPalette,
      customPrompt = '',
      aspectRatio = '16:9',
      language = 'en'
    } = req.body;

    if (!sceneDescription || !emotion) {
      return res.status(400).json({
        error: 'Scene description and emotion are required'
      });
    }

    // Generate enhanced image
    const result = await imageGenerationService.generateEnhancedImage(
      sceneDescription,
      emotion,
      {
        style,
        cameraAngle,
        lighting,
        colorPalette,
        customPrompt,
        aspectRatio
      }
    );

    // Add language-specific enhancements if specified
    if (language !== 'en') {
      const enhancedPrompt = multilingualService.generateLanguageSpecificPrompt(
        result.metadata.prompt,
        language,
        emotion
      );
      
      result.metadata.enhancedPrompt = enhancedPrompt;
      result.metadata.language = language;
    }

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Enhanced frame generation error:', error);
    res.status(500).json({
      error: 'Failed to generate enhanced frame',
      details: error.message
    });
  }
});

// Get cinematographic suggestions based on emotion and scene
router.post('/frames/suggestions', async (req, res) => {
  try {
    const { emotion, sceneDescription, language = 'en' } = req.body;

    if (!emotion || !sceneDescription) {
      return res.status(400).json({
        error: 'Emotion and scene description are required'
      });
    }

    const suggestions = {
      cameraAngles: [
        {
          name: imageGenerationService.suggestCameraAngle(emotion, sceneDescription),
          description: imageGenerationService.cameraAngles[imageGenerationService.suggestCameraAngle(emotion, sceneDescription)],
          recommended: true
        },
        ...Object.entries(imageGenerationService.cameraAngles)
          .filter(([key]) => key !== imageGenerationService.suggestCameraAngle(emotion, sceneDescription))
          .slice(0, 3)
          .map(([key, description]) => ({
            name: key,
            description,
            recommended: false
          }))
      ],
      
      lighting: [
        {
          name: imageGenerationService.suggestLighting(emotion, sceneDescription),
          description: imageGenerationService.lightingPresets[imageGenerationService.suggestLighting(emotion, sceneDescription)],
          recommended: true
        },
        ...Object.entries(imageGenerationService.lightingPresets)
          .filter(([key]) => key !== imageGenerationService.suggestLighting(emotion, sceneDescription))
          .slice(0, 3)
          .map(([key, description]) => ({
            name: key,
            description,
            recommended: false
          }))
      ],
      
      colorPalettes: [
        {
          name: imageGenerationService.suggestColorPalette(emotion),
          description: imageGenerationService.colorPalettes[imageGenerationService.suggestColorPalette(emotion)],
          recommended: true
        },
        ...Object.entries(imageGenerationService.colorPalettes)
          .filter(([key]) => key !== imageGenerationService.suggestColorPalette(emotion))
          .slice(0, 3)
          .map(([key, description]) => ({
            name: key,
            description,
            recommended: false
          }))
      ],
      
      styles: Object.keys(imageGenerationService.models).map(style => ({
        name: style,
        description: `${style.charAt(0).toUpperCase() + style.slice(1)} style image generation`,
        recommended: style === 'cinematic'
      }))
    };

    // Add language-specific suggestions
    if (language !== 'en') {
      suggestions.culturalEnhancements = {
        description: 'Cultural and aesthetic enhancements for this language',
        suggestions: multilingualService.generateLanguageSpecificPrompt('', language, emotion)
      };
    }

    res.json({
      success: true,
      suggestions,
      emotion,
      language
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      error: 'Failed to generate suggestions',
      details: error.message
    });
  }
});

// Get available generation options
router.get('/frames/options', (req, res) => {
  try {
    const options = imageGenerationService.getAvailableOptions();
    const languages = multilingualService.getSupportedLanguages();
    
    res.json({
      success: true,
      options: {
        ...options,
        supportedLanguages: languages
      }
    });
  } catch (error) {
    console.error('Options error:', error);
    res.status(500).json({
      error: 'Failed to get options',
      details: error.message
    });
  }
});

// Enhanced frame regeneration
router.post('/frame/:frameId/regenerate-enhanced', async (req, res) => {
  try {
    const { frameId } = req.params;
    const {
      style,
      cameraAngle,
      lighting,
      colorPalette,
      customPrompt,
      aspectRatio,
      language = 'en'
    } = req.body;

    // Get original frame data
    const frame = await databaseService.getFrameById(frameId);
    if (!frame) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    // Get scene data
    const scene = await databaseService.getSceneById(frame.scene_id);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Regenerate with new options
    const result = await imageGenerationService.regenerateWithOptions(
      scene.content,
      scene.emotion,
      {
        style,
        cameraAngle,
        lighting,
        colorPalette,
        customPrompt,
        aspectRatio
      }
    );

    // Update frame in database
    await databaseService.updateStoryboardFrame(frameId, {
      imageUrl: result.imageUrl,
      metadata: JSON.stringify(result.metadata),
      updated_at: new Date().toISOString()
    });

    res.json({
      success: true,
      frameId,
      newImageUrl: result.imageUrl,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Enhanced regeneration error:', error);
    res.status(500).json({
      error: 'Failed to regenerate frame',
      details: error.message
    });
  }
});

// Analyze uploaded image for suggestions
router.post('/frames/analyze-image', async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({
        error: 'Image path is required'
      });
    }

    const fullPath = path.join(__dirname, '../../generated_images', path.basename(imagePath));
    const suggestions = await imageGenerationService.analyzeImageForSuggestions(fullPath);

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze image',
      details: error.message
    });
  }
});

// Export storyboard in various formats
router.post('/project/:projectId/export', async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      format = 'pdf_storyboard',
      template = 'professional',
      includeMetadata = true,
      resolution = 'high',
      language = 'en'
    } = req.body;

    // Get project and frames
    const project = await databaseService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const frames = await databaseService.getStoryboardFramesByProject(projectId);
    if (!frames.length) {
      return res.status(400).json({ error: 'No frames found for export' });
    }

    // Process frames data
    const processedFrames = frames.map(frame => ({
      ...frame,
      metadata: frame.metadata ? JSON.parse(frame.metadata) : {}
    }));

    // Export storyboard
    const exportResult = await exportService.exportStoryboard(
      projectId,
      processedFrames,
      project,
      {
        format,
        template,
        includeMetadata,
        resolution,
        language
      }
    );

    if (format === 'pdf_storyboard' || format === 'pdf_presentation') {
      // Return PDF file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      return res.download(exportResult.filepath);
    } else {
      // Return download URL for other formats
      res.json({
        success: true,
        ...exportResult
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Failed to export storyboard',
      details: error.message
    });
  }
});

// Get available export formats
router.get('/export/formats', (req, res) => {
  try {
    const formats = exportService.getAvailableFormats();
    const templates = exportService.getAvailableTemplates();
    const languages = multilingualService.getSupportedLanguages();

    res.json({
      success: true,
      formats,
      templates,
      languages
    });
  } catch (error) {
    console.error('Export formats error:', error);
    res.status(500).json({
      error: 'Failed to get export formats',
      details: error.message
    });
  }
});

// Detect script language
router.post('/scripts/detect-language', async (req, res) => {
  try {
    const { scriptContent } = req.body;

    if (!scriptContent) {
      return res.status(400).json({
        error: 'Script content is required'
      });
    }

    const detection = multilingualService.detectLanguage(scriptContent);
    
    res.json({
      success: true,
      detection
    });

  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      error: 'Failed to detect language',
      details: error.message
    });
  }
});

// Process multilingual script
router.post('/scripts/process-multilingual', async (req, res) => {
  try {
    const { scriptContent, language } = req.body;

    if (!scriptContent || !language) {
      return res.status(400).json({
        error: 'Script content and language are required'
      });
    }

    // Validate language support
    if (!multilingualService.isLanguageSupported(language)) {
      return res.status(400).json({
        error: `Language '${language}' is not supported`,
        supportedLanguages: Object.keys(multilingualService.getSupportedLanguages())
      });
    }

    const processed = multilingualService.processMultilingualScript(scriptContent, language);
    
    res.json({
      success: true,
      processed
    });

  } catch (error) {
    console.error('Multilingual processing error:', error);
    res.status(500).json({
      error: 'Failed to process multilingual script',
      details: error.message
    });
  }
});

// Get supported languages
router.get('/languages', (req, res) => {
  try {
    const languages = multilingualService.getSupportedLanguages();
    
    res.json({
      success: true,
      languages
    });
  } catch (error) {
    console.error('Languages error:', error);
    res.status(500).json({
      error: 'Failed to get supported languages',
      details: error.message
    });
  }
});

// Batch process frames with different options
router.post('/frames/batch-process', async (req, res) => {
  try {
    const { frameIds, options } = req.body;

    if (!frameIds || !Array.isArray(frameIds) || frameIds.length === 0) {
      return res.status(400).json({
        error: 'Frame IDs array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const frameId of frameIds) {
      try {
        // Get frame and scene data
        const frame = await databaseService.getFrameById(frameId);
        if (!frame) {
          errors.push({ frameId, error: 'Frame not found' });
          continue;
        }

        const scene = await databaseService.getSceneById(frame.scene_id);
        if (!scene) {
          errors.push({ frameId, error: 'Scene not found' });
          continue;
        }

        // Process with new options
        const result = await imageGenerationService.regenerateWithOptions(
          scene.content,
          scene.emotion,
          options
        );

        // Update frame
        await databaseService.updateStoryboardFrame(frameId, {
          imageUrl: result.imageUrl,
          metadata: JSON.stringify(result.metadata),
          updated_at: new Date().toISOString()
        });

        results.push({
          frameId,
          success: true,
          newImageUrl: result.imageUrl,
          metadata: result.metadata
        });

      } catch (error) {
        console.error(`Batch process error for frame ${frameId}:`, error);
        errors.push({ frameId, error: error.message });
      }
    }

    res.json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({
      error: 'Failed to batch process frames',
      details: error.message
    });
  }
});

module.exports = router;
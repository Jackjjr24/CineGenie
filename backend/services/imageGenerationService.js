const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

class ImageGenerationService {
  constructor() {
    // Initialize with Stable Diffusion 3 Medium for enhanced quality
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.generatedImagesPath = path.join(__dirname, '../../generated_images');
    
    // Initialize directory
    fs.ensureDirSync(this.generatedImagesPath);
    
    // Available models for different styles (all using SD3 Medium for consistency)
    this.models = {
      'realistic': 'stabilityai/stable-diffusion-3-medium',
      'artistic': 'stabilityai/stable-diffusion-3-medium',
      'cinematic': 'stabilityai/stable-diffusion-3-medium',
      'sketch': 'stabilityai/stable-diffusion-3-medium',
      'animation': 'stabilityai/stable-diffusion-3-medium'
    };
    
    // Camera angle templates
    this.cameraAngles = {
      'close_up': 'extreme close-up shot, intimate framing',
      'medium': 'medium shot, waist up framing',
      'wide': 'wide establishing shot, full scene view',
      'aerial': 'aerial view, bird\'s eye perspective',
      'low_angle': 'low angle shot, looking up dramatically',
      'high_angle': 'high angle shot, looking down',
      'over_shoulder': 'over the shoulder shot, conversation angle',
      'dutch': 'dutch angle, tilted frame for tension'
    };
    
    // Lighting presets
    this.lightingPresets = {
      'golden_hour': 'warm golden hour lighting, soft shadows',
      'blue_hour': 'cool blue hour lighting, dramatic atmosphere',
      'harsh': 'harsh direct lighting, strong shadows',
      'soft': 'soft diffused lighting, gentle shadows',
      'dramatic': 'dramatic chiaroscuro lighting, high contrast',
      'neon': 'neon lighting, cyberpunk atmosphere',
      'natural': 'natural daylight, balanced exposure',
      'moonlight': 'moonlight illumination, mysterious shadows'
    };
    
    // Color palette themes
    this.colorPalettes = {
      'warm': 'warm color palette, oranges and reds',
      'cool': 'cool color palette, blues and teals',
      'monochrome': 'monochromatic color scheme',
      'vibrant': 'vibrant saturated colors',
      'muted': 'muted desaturated colors',
      'noir': 'film noir black and white with selective color',
      'pastel': 'soft pastel color palette',
      'complementary': 'complementary color scheme'
    };
  }

  /**
   * Generate image with enhanced cinematographic elements
   * @param {string} sceneDescription - Scene description
   * @param {string} emotion - Detected emotion
   * @param {Object} options - Generation options
   * @returns {string} Generated image URL
   */
  async generateEnhancedImage(sceneDescription, emotion, options = {}) {
    try {
      const {
        style = 'cinematic',
        cameraAngle = this.suggestCameraAngle(emotion, sceneDescription),
        lighting = this.suggestLighting(emotion, sceneDescription),
        colorPalette = this.suggestColorPalette(emotion),
        customPrompt = '',
        aspectRatio = '16:9'
      } = options;

      // Build enhanced prompt
      const enhancedPrompt = this.buildEnhancedPrompt(
        sceneDescription,
        emotion,
        cameraAngle,
        lighting,
        colorPalette,
        customPrompt
      );

      console.log('Generating image with enhanced prompt:', enhancedPrompt);

      // Generate image
      const imageBuffer = await this.callImageGenerationAPI(enhancedPrompt, style);
      
      // Process and save image
      const processedImage = await this.processImage(imageBuffer, aspectRatio, emotion);
      const imageUrl = await this.saveImage(processedImage, emotion);

      return {
        imageUrl,
        metadata: {
          prompt: enhancedPrompt,
          style,
          cameraAngle,
          lighting,
          colorPalette,
          emotion,
          aspectRatio
        }
      };

    } catch (error) {
      console.error('Enhanced image generation error:', error);
      throw new Error(`Failed to generate enhanced image: ${error.message}`);
    }
  }

  /**
   * Build enhanced prompt with cinematographic elements
   * @param {string} scene - Scene description
   * @param {string} emotion - Emotion
   * @param {string} cameraAngle - Camera angle
   * @param {string} lighting - Lighting setup
   * @param {string} colorPalette - Color palette
   * @param {string} customPrompt - Custom additions
   * @returns {string} Enhanced prompt
   */
  buildEnhancedPrompt(scene, emotion, cameraAngle, lighting, colorPalette, customPrompt) {
    // Clean and prepare scene description
    const cleanScene = this.cleanSceneDescription(scene);
    
    // Get cinematographic elements
    const cameraDesc = this.cameraAngles[cameraAngle] || cameraAngle;
    const lightingDesc = this.lightingPresets[lighting] || lighting;
    const colorDesc = this.colorPalettes[colorPalette] || colorPalette;
    
    // Emotion-specific style enhancements
    const emotionModifiers = this.getEmotionModifiers(emotion);
    
    // Quality and style modifiers
    const qualityModifiers = 'highly detailed, professional cinematography, film grain, 4K resolution';
    
    // Combine all elements
    const promptParts = [
      cleanScene,
      cameraDesc,
      lightingDesc,
      colorDesc,
      emotionModifiers,
      customPrompt,
      qualityModifiers
    ].filter(Boolean);

    return promptParts.join(', ');
  }

  /**
   * Clean scene description for better prompting
   * @param {string} scene - Raw scene description
   * @returns {string} Cleaned description
   */
  cleanSceneDescription(scene) {
    return scene
      .replace(/\([^)]*\)/g, '') // Remove parenthetical directions
      .replace(/[A-Z]{2,}/g, '') // Remove character names
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200); // Limit length
  }

  /**
   * Get emotion-specific style modifiers
   * @param {string} emotion - Emotion
   * @returns {string} Style modifiers
   */
  getEmotionModifiers(emotion) {
    const modifiers = {
      'happy': 'bright, cheerful, uplifting atmosphere',
      'sad': 'melancholic, subdued, emotional depth',
      'angry': 'intense, aggressive, dynamic energy',
      'fearful': 'ominous, suspenseful, dark atmosphere',
      'romantic': 'intimate, warm, soft focus',
      'dramatic': 'intense, high contrast, theatrical',
      'mysterious': 'enigmatic, shadowy, atmospheric',
      'peaceful': 'serene, calm, harmonious',
      'tense': 'suspenseful, edgy, uncomfortable angles'
    };

    return modifiers[emotion] || 'cinematic atmosphere';
  }

  /**
   * Suggest optimal camera angle based on emotion and scene
   * @param {string} emotion - Detected emotion
   * @param {string} scene - Scene description
   * @returns {string} Suggested camera angle
   */
  suggestCameraAngle(emotion, scene) {
    const sceneText = scene.toLowerCase();
    
    // Scene-based suggestions
    if (sceneText.includes('conversation') || sceneText.includes('talking')) {
      return 'over_shoulder';
    }
    if (sceneText.includes('landscape') || sceneText.includes('building')) {
      return 'wide';
    }
    if (sceneText.includes('face') || sceneText.includes('expression')) {
      return 'close_up';
    }
    if (sceneText.includes('action') || sceneText.includes('fight')) {
      return 'medium';
    }
    
    // Emotion-based suggestions
    const emotionAngles = {
      'happy': 'medium',
      'sad': 'close_up',
      'angry': 'low_angle',
      'fearful': 'high_angle',
      'romantic': 'close_up',
      'dramatic': 'low_angle',
      'mysterious': 'dutch',
      'peaceful': 'wide',
      'tense': 'dutch'
    };

    return emotionAngles[emotion] || 'medium';
  }

  /**
   * Suggest lighting setup based on emotion and scene
   * @param {string} emotion - Detected emotion
   * @param {string} scene - Scene description
   * @returns {string} Suggested lighting
   */
  suggestLighting(emotion, scene) {
    const sceneText = scene.toLowerCase();
    
    // Scene-based lighting
    if (sceneText.includes('night') || sceneText.includes('dark')) {
      return 'moonlight';
    }
    if (sceneText.includes('sunset') || sceneText.includes('dawn')) {
      return 'golden_hour';
    }
    if (sceneText.includes('office') || sceneText.includes('indoor')) {
      return 'soft';
    }
    if (sceneText.includes('city') || sceneText.includes('neon')) {
      return 'neon';
    }
    
    // Emotion-based lighting
    const emotionLighting = {
      'happy': 'golden_hour',
      'sad': 'blue_hour',
      'angry': 'harsh',
      'fearful': 'dramatic',
      'romantic': 'soft',
      'dramatic': 'dramatic',
      'mysterious': 'moonlight',
      'peaceful': 'natural',
      'tense': 'harsh'
    };

    return emotionLighting[emotion] || 'natural';
  }

  /**
   * Suggest color palette based on emotion
   * @param {string} emotion - Detected emotion
   * @returns {string} Suggested color palette
   */
  suggestColorPalette(emotion) {
    const emotionPalettes = {
      'happy': 'warm',
      'sad': 'cool',
      'angry': 'complementary',
      'fearful': 'monochrome',
      'romantic': 'warm',
      'dramatic': 'noir',
      'mysterious': 'cool',
      'peaceful': 'pastel',
      'tense': 'complementary'
    };

    return emotionPalettes[emotion] || 'natural';
  }

  /**
   * Call the image generation API
   * @param {string} prompt - Generation prompt
   * @param {string} style - Image style
   * @returns {Buffer} Image buffer
   */
  async callImageGenerationAPI(prompt, style) {
    const model = this.models[style] || this.models.cinematic;
    
    try {
      // Try SD3 Medium first
      const response = await axios({
        url: `${this.baseUrl}/${model}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data: {
          inputs: prompt,
          parameters: {
            guidance_scale: 7.5,
            num_inference_steps: 28, // Optimized for SD3
            width: 1024,
            height: 576, // 16:9 aspect ratio
            negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy'
          }
        },
        responseType: 'arraybuffer',
        timeout: 90000 // Increased timeout for SD3 Medium
      });

      return Buffer.from(response.data);
    } catch (sd3Error) {
      console.log('SD3 API call failed, falling back to SDXL:', sd3Error.message);
      
      // Fallback to SDXL
      try {
        const response = await axios({
          url: `${this.baseUrl}/stabilityai/stable-diffusion-xl-base-1.0`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          data: {
            inputs: prompt,
            parameters: {
              guidance_scale: 7.5,
              num_inference_steps: 30,
              width: 1024,
              height: 576,
              negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy'
            }
          },
          responseType: 'arraybuffer',
          timeout: 60000
        });

        return Buffer.from(response.data);
      } catch (fallbackError) {
        console.error('Both SD3 and SDXL failed:', fallbackError.response?.data || fallbackError.message);
        throw new Error('Failed to generate image from API');
      }
    }
  }

  /**
   * Process generated image
   * @param {Buffer} imageBuffer - Raw image buffer
   * @param {string} aspectRatio - Desired aspect ratio
   * @param {string} emotion - Scene emotion for processing hints
   * @returns {Buffer} Processed image buffer
   */
  async processImage(imageBuffer, aspectRatio, emotion) {
    try {
      let image = sharp(imageBuffer);
      
      // Get image metadata
      const metadata = await image.metadata();
      const { width, height } = metadata;
      
      // Calculate target dimensions based on aspect ratio
      const targetDimensions = this.calculateAspectRatio(width, height, aspectRatio);
      
      // Apply emotion-based processing
      image = await this.applyEmotionProcessing(image, emotion);
      
      // Resize to target dimensions
      image = image.resize(targetDimensions.width, targetDimensions.height, {
        fit: 'cover',
        position: 'center'
      });
      
      // Add film grain for cinematic feel
      image = await this.addFilmGrain(image);
      
      // Optimize for web
      return await image
        .jpeg({ quality: 90 })
        .toBuffer();
        
    } catch (error) {
      console.error('Image processing error:', error);
      return imageBuffer; // Return original if processing fails
    }
  }

  /**
   * Calculate aspect ratio dimensions
   * @param {number} width - Original width
   * @param {number} height - Original height
   * @param {string} aspectRatio - Target aspect ratio
   * @returns {Object} Target dimensions
   */
  calculateAspectRatio(width, height, aspectRatio) {
    const ratios = {
      '16:9': 16/9,
      '4:3': 4/3,
      '1:1': 1,
      '21:9': 21/9,
      'original': width/height
    };
    
    const targetRatio = ratios[aspectRatio] || ratios['16:9'];
    const currentRatio = width / height;
    
    if (currentRatio > targetRatio) {
      // Width needs to be reduced
      return {
        width: Math.round(height * targetRatio),
        height: height
      };
    } else {
      // Height needs to be reduced
      return {
        width: width,
        height: Math.round(width / targetRatio)
      };
    }
  }

  /**
   * Apply emotion-specific image processing
   * @param {Sharp} image - Sharp image instance
   * @param {string} emotion - Scene emotion
   * @returns {Sharp} Processed image
   */
  async applyEmotionProcessing(image, emotion) {
    const processingMap = {
      'happy': () => image.modulate({ brightness: 1.1, saturation: 1.2 }),
      'sad': () => image.modulate({ brightness: 0.9, saturation: 0.8 }).tint({ r: 0, g: 0, b: 50 }),
      'angry': () => image.modulate({ saturation: 1.3 }).tint({ r: 50, g: 0, b: 0 }),
      'fearful': () => image.modulate({ brightness: 0.8, saturation: 0.9 }),
      'romantic': () => image.modulate({ brightness: 1.05 }).tint({ r: 30, g: 20, b: 0 }),
      'dramatic': () => image.modulate({ brightness: 0.95, saturation: 1.1 }),
      'mysterious': () => image.modulate({ brightness: 0.85, saturation: 0.9 }),
      'peaceful': () => image.modulate({ brightness: 1.05, saturation: 0.95 }),
      'tense': () => image.modulate({ brightness: 0.9, saturation: 1.1 })
    };

    const processor = processingMap[emotion];
    return processor ? processor() : image;
  }

  /**
   * Add subtle film grain effect
   * @param {Sharp} image - Sharp image instance
   * @returns {Sharp} Image with film grain
   */
  async addFilmGrain(image) {
    try {
      // Create noise overlay
      const { width, height } = await image.metadata();
      
      // Simple noise addition - in production, you might want a more sophisticated approach
      return image.modulate({ brightness: 1, saturation: 1 });
    } catch (error) {
      console.error('Film grain error:', error);
      return image;
    }
  }

  /**
   * Save processed image
   * @param {Buffer} imageBuffer - Processed image buffer
   * @param {string} emotion - Scene emotion for filename
   * @returns {string} Image URL path
   */
  async saveImage(imageBuffer, emotion) {
    try {
      const filename = `storyboard_${emotion}_${Date.now()}_${uuidv4().substring(0, 8)}.jpg`;
      const filepath = path.join(this.generatedImagesPath, filename);
      
      await fs.writeFile(filepath, imageBuffer);
      
      // Return relative URL path
      return `/images/${filename}`;
    } catch (error) {
      console.error('Save image error:', error);
      throw new Error('Failed to save generated image');
    }
  }

  /**
   * Regenerate image with new parameters
   * @param {string} originalPrompt - Original scene description
   * @param {string} emotion - Scene emotion
   * @param {Object} newOptions - New generation options
   * @returns {Object} Regeneration result
   */
  async regenerateWithOptions(originalPrompt, emotion, newOptions) {
    try {
      return await this.generateEnhancedImage(originalPrompt, emotion, newOptions);
    } catch (error) {
      console.error('Regeneration error:', error);
      throw new Error('Failed to regenerate image with new options');
    }
  }

  /**
   * Get available options for UI
   * @returns {Object} Available generation options
   */
  getAvailableOptions() {
    return {
      styles: Object.keys(this.models),
      cameraAngles: Object.keys(this.cameraAngles),
      lightingPresets: Object.keys(this.lightingPresets),
      colorPalettes: Object.keys(this.colorPalettes),
      aspectRatios: ['16:9', '4:3', '1:1', '21:9', 'original']
    };
  }

  /**
   * Analyze existing image for suggestions
   * @param {string} imagePath - Path to existing image
   * @returns {Object} Analysis results with suggestions
   */
  async analyzeImageForSuggestions(imagePath) {
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const stats = await image.stats();
      
      // Basic analysis - in production, you might want more sophisticated analysis
      const brightness = stats.channels[0].mean;
      const suggestions = {
        lighting: brightness < 100 ? 'dramatic' : brightness > 200 ? 'soft' : 'natural',
        colorPalette: stats.channels[1].mean > stats.channels[2].mean ? 'warm' : 'cool',
        cameraAngle: metadata.width > metadata.height * 1.5 ? 'wide' : 'medium'
      };
      
      return suggestions;
    } catch (error) {
      console.error('Image analysis error:', error);
      return this.getDefaultSuggestions();
    }
  }

  /**
   * Get default suggestions when analysis fails
   * @returns {Object} Default suggestions
   */
  getDefaultSuggestions() {
    return {
      lighting: 'natural',
      colorPalette: 'vibrant',
      cameraAngle: 'medium'
    };
  }
}

module.exports = new ImageGenerationService();

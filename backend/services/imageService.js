const { HfInference } = require('@huggingface/inference');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ImageService {
  constructor() {
    // Initialize HuggingFace client with Stable Diffusion 3 Medium model
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    this.outputDir = path.join(__dirname, '../../generated_images');
    
    // Ensure output directory exists
    fs.ensureDirSync(this.outputDir);

    // Image style categories for user selection
    this.imageStyles = {
      'realistic': {
        name: 'Realistic',
        description: 'Photorealistic, cinematic film stills',
        stylePrompt: 'photorealistic, cinematic film still, professional photography, high detail, realistic lighting, film grain, DSLR quality',
        negativePrompt: 'cartoon, anime, drawing, sketch, painted, illustration, CGI, 3D render, digital art, artistic, stylized'
      },
      'cinematic': {
        name: 'Cinematic',
        description: 'Movie-style dramatic scenes',
        stylePrompt: 'cinematic movie scene, dramatic lighting, film composition, professional cinematography, movie still, Hollywood quality',
        negativePrompt: 'cartoon, anime, amateur, low budget, sketch, drawing'
      },
      'cartoon': {
        name: 'Cartoon',
        description: 'Animated cartoon style',
        stylePrompt: 'cartoon style, animated, cel shading, cartoon illustration, Disney style, colorful animation',
        negativePrompt: 'photorealistic, realistic, photograph, film grain, detailed skin texture'
      },
      'comic': {
        name: 'Comic Book',
        description: 'Comic book illustration style',
        stylePrompt: 'comic book style, graphic novel illustration, bold lines, vibrant colors, superhero comic style',
        negativePrompt: 'photorealistic, realistic, photograph, blurry, low contrast'
      },
      'noir': {
        name: 'Film Noir',
        description: 'Classic black and white noir style',
        stylePrompt: 'film noir style, black and white, dramatic shadows, high contrast, classic cinematography, 1940s movie style',
        negativePrompt: 'colorful, bright colors, cartoon, anime, modern'
      },
      'anime': {
        name: 'Anime',
        description: 'Japanese animation style',
        stylePrompt: 'anime style, Japanese animation, manga style, detailed anime art, studio quality animation',
        negativePrompt: 'photorealistic, realistic, photograph, western cartoon'
      }
    };

    // Style mappings for different emotions
    this.emotionStyles = {
      'happy': {
        style: 'bright, cheerful, warm lighting, vibrant colors',
        mood: 'joyful, uplifting, positive energy',
        cinematography: 'well-lit, golden hour lighting'
      },
      'sad': {
        style: 'muted colors, cool tones, soft lighting',
        mood: 'melancholic, somber, emotional',
        cinematography: 'dramatic shadows, blue hour lighting'
      },
      'angry': {
        style: 'intense reds, sharp contrasts, dramatic lighting',
        mood: 'aggressive, intense, powerful',
        cinematography: 'harsh lighting, strong shadows'
      },
      'fearful': {
        style: 'dark shadows, desaturated colors, eerie atmosphere',
        mood: 'suspenseful, ominous, tension',
        cinematography: 'low-key lighting, film noir style'
      },
      'surprised': {
        style: 'dynamic composition, bright highlights',
        mood: 'unexpected, shocking, revelation',
        cinematography: 'dramatic lighting, wide angle'
      },
      'romantic': {
        style: 'warm golden tones, soft focus, intimate lighting',
        mood: 'tender, passionate, emotional connection',
        cinematography: 'romantic lighting, close-up shots'
      },
      'tense': {
        style: 'high contrast, sharp edges, urgent composition',
        mood: 'suspenseful, anxiety, pressure',
        cinematography: 'tight framing, dramatic angles'
      },
      'mysterious': {
        style: 'shadows and silhouettes, muted palette',
        mood: 'enigmatic, secretive, intrigue',
        cinematography: 'chiaroscuro lighting, mysterious atmosphere'
      },
      'dramatic': {
        style: 'bold composition, strong contrasts',
        mood: 'intense, theatrical, powerful',
        cinematography: 'dramatic lighting, cinematic angles'
      },
      'peaceful': {
        style: 'soft pastels, gentle lighting, serene composition',
        mood: 'calm, tranquil, harmonious',
        cinematography: 'natural lighting, balanced composition'
      },
      'neutral': {
        style: 'balanced lighting, natural colors',
        mood: 'everyday, realistic, grounded',
        cinematography: 'standard lighting, documentary style'
      }
    };
  }

  /**
   * Generate an image based on scene content and emotion
   * @param {string} sceneContent - The scene description
   * @param {string} emotion - Detected emotion
   * @param {string} imageStyle - Image style (realistic, cartoon, etc.)
   * @returns {string} URL path to generated image
   */
  async generateImage(sceneContent, emotion = 'neutral', imageStyle = 'realistic') {
    try {
      // Create enhanced prompt with style
      const prompt = this.createPrompt(sceneContent, emotion, imageStyle);
      console.log(`Generating ${imageStyle} image for emotion "${emotion}" with prompt: ${prompt.substring(0, 100)}...`);

      // Try SDXL Base first (cost-effective for free tier)
      try {
        const imageBlob = await this.hf.textToImage({
          model: 'stabilityai/stable-diffusion-xl-base-1.0',
          inputs: prompt,
          parameters: {
            negative_prompt: this.getNegativePrompt(imageStyle),
            num_inference_steps: 25, // Reduced for faster generation
            guidance_scale: 7.5,
            width: 1024,
            height: 576 // 16:9 aspect ratio for storyboard
          }
        });

        // Save image to file
        const filename = `storyboard_${uuidv4()}.png`;
        const filepath = path.join(this.outputDir, filename);
        
        // Convert blob to buffer and save
        const buffer = await this.blobToBuffer(imageBlob);
        await fs.writeFile(filepath, buffer);

        // Return URL path
        return `/images/${filename}`;
      } catch (sdxlError) {
        console.log('SDXL Base failed, falling back to SD v1.5:', sdxlError.message);
        
        // Fallback to SD v1.5 (most cost-effective)
        const imageBlob = await this.hf.textToImage({
          model: 'runwayml/stable-diffusion-v1-5',
          inputs: prompt,
          parameters: {
            negative_prompt: this.getNegativePrompt(imageStyle),
            num_inference_steps: 30,
            guidance_scale: 7.5,
            width: 768,
            height: 432
          }
        });

        const filename = `storyboard_${uuidv4()}.png`;
        const filepath = path.join(this.outputDir, filename);
        
        const buffer = await this.blobToBuffer(imageBlob);
        await fs.writeFile(filepath, buffer);

        return `/images/${filename}`;
      }

    } catch (error) {
      console.error('Image generation error:', error);
      
      // Try fallback with simpler prompt
      try {
        return await this.generateFallbackImage(emotion, imageStyle);
      } catch (fallbackError) {
        console.error('Fallback image generation failed:', fallbackError);
        throw new Error('Failed to generate storyboard image');
      }
    }
  }

  /**
   * Create an enhanced prompt for image generation
   * @param {string} content - Scene content
   * @param {string} emotion - Emotion category
   * @param {string} imageStyle - Image style (realistic, cartoon, etc.)
   * @returns {string} Enhanced prompt
   */
  createPrompt(content, emotion, imageStyle = 'realistic') {
    const emotionStyle = this.emotionStyles[emotion] || this.emotionStyles['neutral'];
    const selectedImageStyle = this.imageStyles[imageStyle] || this.imageStyles['realistic'];
    
    // Extract key visual elements from scene content
    const visualElements = this.extractVisualElements(content);
    
    // Build comprehensive prompt
    const basePrompt = `Professional film storyboard frame: ${visualElements}`;
    const emotionPrompt = `${emotionStyle.style}, ${emotionStyle.mood}, ${emotionStyle.cinematography}`;
    const stylePrompt = selectedImageStyle.stylePrompt;
    const qualityPrompt = 'high quality, detailed, professional composition';
    
    return `${basePrompt}, ${emotionPrompt}, ${stylePrompt}, ${qualityPrompt}`;
  }

  /**
   * Extract visual elements from scene content
   * @param {string} content - Scene description
   * @returns {string} Visual elements description
   */
  extractVisualElements(content) {
    // Clean content and extract key visual information
    let cleaned = content
      .replace(/\(.*?\)/g, '') // Remove parentheses
      .replace(/[A-Z]{2,}/g, '') // Remove character names
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();

    // Limit length for API
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 200) + '...';
    }

    // Add film storyboard context if not present
    if (!cleaned.toLowerCase().includes('scene') && !cleaned.toLowerCase().includes('shot')) {
      cleaned = `Film scene: ${cleaned}`;
    }

    return cleaned || 'A cinematic scene';
  }

  /**
   * Get negative prompt to avoid unwanted elements - optimized for SD3
   * @param {string} imageStyle - Image style to customize negative prompts
   * @returns {string} Negative prompt
   */
  getNegativePrompt(imageStyle = 'realistic') {
    const baseNegative = 'blurry, low quality, distorted, watermark, text, signature, amateur, bad anatomy, poor composition, oversaturated, deformed, ugly, extra limbs, poorly drawn hands, poorly drawn face, mutation';
    const selectedStyle = this.imageStyles[imageStyle] || this.imageStyles['realistic'];
    
    return `${baseNegative}, ${selectedStyle.negativePrompt}`;
  }

  /**
   * Generate a fallback image with simpler prompt
   * @param {string} emotion - Emotion for fallback
   * @param {string} imageStyle - Image style
   * @returns {string} Image URL
   */
  async generateFallbackImage(emotion, imageStyle = 'realistic') {
    const emotionStyle = this.emotionStyles[emotion] || this.emotionStyles['neutral'];
    const selectedImageStyle = this.imageStyles[imageStyle] || this.imageStyles['realistic'];
    const simplePrompt = `Film storyboard frame with ${emotionStyle.mood}, ${emotionStyle.cinematography}, ${selectedImageStyle.stylePrompt}`;

    // Try SDXL first, then SD v1.5 as final fallback
    try {
      const imageBlob = await this.hf.textToImage({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        inputs: simplePrompt,
        parameters: {
          num_inference_steps: 20,
          guidance_scale: 7.0,
          negative_prompt: this.getNegativePrompt(imageStyle)
        }
      });

      const filename = `fallback_${uuidv4()}.png`;
      const filepath = path.join(this.outputDir, filename);
      
      const buffer = await this.blobToBuffer(imageBlob);
      await fs.writeFile(filepath, buffer);

      return `/images/${filename}`;
    } catch (sdxlError) {
      console.log('SDXL fallback failed, using SD v1.5:', sdxlError.message);
      
      // Final fallback to SD v1.5 (most cost-effective)
      const imageBlob = await this.hf.textToImage({
        model: 'runwayml/stable-diffusion-v1-5',
        inputs: simplePrompt,
        parameters: {
          num_inference_steps: 25,
          guidance_scale: 7.5
        }
      });

      const filename = `fallback_${uuidv4()}.png`;
      const filepath = path.join(this.outputDir, filename);
      
      const buffer = await this.blobToBuffer(imageBlob);
      await fs.writeFile(filepath, buffer);

      return `/images/${filename}`;
    }
  }

  /**
   * Convert blob to buffer
   * @param {Blob} blob - Image blob
   * @returns {Buffer} Image buffer
   */
  async blobToBuffer(blob) {
    if (blob.arrayBuffer) {
      return Buffer.from(await blob.arrayBuffer());
    }
    // Fallback for older Node.js versions
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(Buffer.from(reader.result));
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Regenerate image for a specific scene
   * @param {string} sceneContent - Scene content
   * @param {string} emotion - Scene emotion
   * @param {string} customPrompt - Optional custom prompt additions
   * @param {string} imageStyle - Image style
   * @returns {string} New image URL
   */
  async regenerateImage(sceneContent, emotion, customPrompt = '', imageStyle = 'realistic') {
    const basePrompt = this.createPrompt(sceneContent, emotion, imageStyle);
    const enhancedPrompt = customPrompt ? `${basePrompt}, ${customPrompt}` : basePrompt;

    // Try SDXL Base first, then SD v1.5 as fallback
    try {
      const imageBlob = await this.hf.textToImage({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        inputs: enhancedPrompt,
        parameters: {
          negative_prompt: this.getNegativePrompt(imageStyle),
          num_inference_steps: 30, // Optimized for regeneration
          guidance_scale: 7.5,
          width: 1024,
          height: 576
        }
      });

      const filename = `regen_${uuidv4()}.png`;
      const filepath = path.join(this.outputDir, filename);
      
      const buffer = await this.blobToBuffer(imageBlob);
      await fs.writeFile(filepath, buffer);

      return `/images/${filename}`;
    } catch (sdxlError) {
      console.log('SDXL regeneration failed, using SD v1.5:', sdxlError.message);
      
      // Fallback to SD v1.5
      const imageBlob = await this.hf.textToImage({
        model: 'runwayml/stable-diffusion-v1-5',
        inputs: enhancedPrompt,
        parameters: {
          negative_prompt: this.getNegativePrompt(imageStyle),
          num_inference_steps: 35,
          guidance_scale: 8.0,
          width: 768,
          height: 432
        }
      });

      const filename = `regen_${uuidv4()}.png`;
      const filepath = path.join(this.outputDir, filename);
      
      const buffer = await this.blobToBuffer(imageBlob);
      await fs.writeFile(filepath, buffer);

      return `/images/${filename}`;
    }

  } catch (error) {
    console.error('Image regeneration error:', error);
    throw new Error('Failed to regenerate image');
  }

  /**
   * Clean up old generated images (optional maintenance function)
   * @param {number} maxAge - Maximum age in hours
   */
  async cleanupOldImages(maxAge = 24) {
    try {
      const files = await fs.readdir(this.outputDir);
      const now = Date.now();
      const maxAgeMs = maxAge * 60 * 60 * 1000;

      for (const file of files) {
        const filepath = path.join(this.outputDir, file);
        const stats = await fs.stat(filepath);
        
        if (now - stats.mtime.getTime() > maxAgeMs) {
          await fs.unlink(filepath);
          console.log(`Cleaned up old image: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Generate image with custom user prompt
   * @param {string} sceneContent - Original scene content for context
   * @param {string} emotion - Scene emotion for styling
   * @param {string} customPrompt - User's custom prompt
   * @param {string} imageStyle - Image style
   * @returns {Promise<string>} - URL path to generated image
   */
  async generateImageWithCustomPrompt(sceneContent, emotion, customPrompt, imageStyle = 'realistic') {
    try {
      console.log(`Generating ${imageStyle} image with custom prompt for emotion: ${emotion}`);
      
      // Get emotion and image styling
      const emotionStyle = this.emotionStyles[emotion.toLowerCase()] || this.emotionStyles.neutral;
      const selectedImageStyle = this.imageStyles[imageStyle] || this.imageStyles['realistic'];
      
      // Create enhanced prompt combining user input with styling
      const enhancedPrompt = `${customPrompt}. ${emotionStyle.style}, ${emotionStyle.mood}, ${emotionStyle.cinematography}, ${selectedImageStyle.stylePrompt}. Professional composition, high quality, detailed`;
      
      console.log(`Enhanced prompt: ${enhancedPrompt}`);

      // Try SDXL Base first, then SD v1.5 as fallback
      try {
        const response = await this.hf.textToImage({
          model: 'stabilityai/stable-diffusion-xl-base-1.0',
          inputs: enhancedPrompt,
          parameters: {
            negative_prompt: this.getNegativePrompt(imageStyle),
            num_inference_steps: 30,
            guidance_scale: 7.5,
            width: 1024,
            height: 576, // 16:9 aspect ratio for cinematic look
          }
        });

        // Convert response to buffer and save
        const buffer = Buffer.from(await response.arrayBuffer());
        
        const filename = `custom_${Date.now()}_${uuidv4().substring(0, 8)}.png`;
        const filepath = path.join(this.outputDir, filename);
        
        await fs.writeFile(filepath, buffer);

        return `/images/${filename}`;
      } catch (sdxlError) {
        console.log('SDXL custom prompt failed, using SD v1.5:', sdxlError.message);
        
        // Fallback to SD v1.5
        const response = await this.hf.textToImage({
          model: 'runwayml/stable-diffusion-v1-5',
          inputs: enhancedPrompt,
          parameters: {
            negative_prompt: this.getNegativePrompt(imageStyle),
            num_inference_steps: 30,
            guidance_scale: 7.5,
            width: 1024,
            height: 576,
          }
        });

        const buffer = Buffer.from(await response.arrayBuffer());
        
        const filename = `custom_${Date.now()}_${uuidv4().substring(0, 8)}.png`;
        const filepath = path.join(this.outputDir, filename);
        
        await fs.writeFile(filepath, buffer);

        return `/images/${filename}`;
      }

    } catch (error) {
      console.error('Custom prompt image generation error:', error);
      throw new Error('Failed to generate image with custom prompt');
    }
  }

  /**
   * Get available image styles for the frontend
   * @returns {Object} Available image styles
   */
  getAvailableStyles() {
    return Object.entries(this.imageStyles).map(([key, style]) => ({
      key: key,
      name: style.name,
      description: style.description
    }));
  }
}

module.exports = new ImageService();
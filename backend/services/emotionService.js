const { HfInference } = require('@huggingface/inference');

class EmotionService {
  constructor() {
    // Initialize Hugging Face client
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    
    // Emotion mapping for better storyboard generation
    this.emotionMapping = {
      'joy': 'happy',
      'happiness': 'happy',
      'sadness': 'sad',
      'anger': 'angry',
      'fear': 'fearful',
      'surprise': 'surprised',
      'disgust': 'disgusted',
      'love': 'romantic',
      'excitement': 'excited',
      'calm': 'peaceful',
      'tension': 'tense',
      'mystery': 'mysterious',
      'action': 'dynamic',
      'drama': 'dramatic'
    };
  }

  /**
   * Analyze script content and extract scenes with emotions
   * @param {string} scriptContent - The full script text
   * @param {string} language - Language code (e.g., 'en', 'es', 'fr')
   * @returns {Array} Array of scenes with detected emotions
   */
  async analyzeScript(scriptContent, language = 'en') {
    try {
      // Split script into scenes
      const scenes = this.parseScenes(scriptContent);
      const analyzedScenes = [];

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        
        try {
          // Analyze emotion using Hugging Face with language support
          const emotion = await this.detectEmotion(scene.content, language);
          
          analyzedScenes.push({
            sceneNumber: i + 1,
            content: scene.content,
            emotion: emotion.label,
            confidence: emotion.score,
            originalEmotion: emotion.originalLabel,
            language: language
          });

          // Add delay to respect API rate limits
          await this.delay(100);
          
        } catch (error) {
          console.error(`Error analyzing scene ${i + 1}:`, error);
          
          // Fallback to basic emotion detection
          const fallbackEmotion = this.getFallbackEmotion(scene.content);
          
          analyzedScenes.push({
            sceneNumber: i + 1,
            content: scene.content,
            emotion: fallbackEmotion,
            confidence: 0.5,
            originalEmotion: fallbackEmotion,
            fallback: true
          });
        }
      }

      return analyzedScenes;
      
    } catch (error) {
      console.error('Script analysis error:', error);
      throw new Error('Failed to analyze script emotions');
    }
  }

  /**
   * Parse script content into individual scenes
   * @param {string} content - Script content
   * @returns {Array} Array of scene objects
   */
  parseScenes(content) {
    // Clean and normalize the content
    const cleanContent = content.replace(/\r\n/g, '\n').trim();
    
    // Enhanced scene detection patterns
    const sceneMarkers = [
      /^FADE IN:/gmi,
      /^FADE OUT:/gmi,
      /^CUT TO:/gmi,
      /^(INT\.|EXT\.)\s+.+/gmi,  // Interior/Exterior scene headers
      /^SCENE\s+\d+/gmi,
      /^\d+\.\s+/gmi,  // Numbered scenes
      /^[A-Z\s]{20,}$/gmi,  // Long uppercase lines (likely locations)
      /^-{3,}/gmi,  // Divider lines
      /^#{1,6}\s+/gmi,  // Markdown headers
      /^CHAPTER\s+\d+/gmi,
      /^ACT\s+[IVX\d]+/gmi
    ];

    const lines = cleanContent.split('\n');
    const scenes = [];
    let currentScene = '';
    let sceneCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isSceneBreak = sceneMarkers.some(marker => marker.test(line));
      
      if (isSceneBreak) {
        // Save previous scene if it exists and has substantial content
        if (currentScene.trim() && currentScene.trim().length > 50) {
          scenes.push({
            content: currentScene.trim(),
            sceneNumber: sceneCounter + 1,
            header: this.extractSceneHeader(currentScene)
          });
          sceneCounter++;
        }
        
        // Start new scene with the marker line
        currentScene = line;
      } else {
        currentScene += '\n' + line;
      }
    }

    // Add the last scene
    if (currentScene.trim() && currentScene.trim().length > 50) {
      scenes.push({
        content: currentScene.trim(),
        sceneNumber: sceneCounter + 1,
        header: this.extractSceneHeader(currentScene)
      });
    }

    // If no clear scene breaks found, use intelligent paragraph splitting
    if (scenes.length <= 1) {
      return this.fallbackSceneParsing(cleanContent);
    }

    // Filter out very short scenes and merge if necessary
    const filteredScenes = this.filterAndMergeScenes(scenes);
    
    // Limit to reasonable number of scenes to manage API costs
    return filteredScenes.slice(0, 20);
  }

  /**
   * Extract scene header/location from scene content
   * @param {string} sceneContent - Full scene content
   * @returns {string} Scene header
   */
  extractSceneHeader(sceneContent) {
    const lines = sceneContent.split('\n');
    for (const line of lines.slice(0, 3)) { // Check first 3 lines
      const trimmed = line.trim();
      if (trimmed && (
        /^(INT\.|EXT\.)/.test(trimmed) ||
        /^SCENE\s+\d+/.test(trimmed) ||
        /^[A-Z\s]{10,}$/.test(trimmed)
      )) {
        return trimmed;
      }
    }
    return `Scene ${sceneContent.substring(0, 50)}...`;
  }

  /**
   * Fallback scene parsing for scripts without clear markers
   * @param {string} content - Script content
   * @returns {Array} Array of scene objects
   */
  fallbackSceneParsing(content) {
    // Split by multiple empty lines or significant dialogue breaks
    const chunks = content.split(/\n\s*\n\s*\n/).filter(chunk => chunk.trim().length > 100);
    
    if (chunks.length > 1) {
      return chunks.map((chunk, index) => ({
        content: chunk.trim(),
        sceneNumber: index + 1,
        header: `Scene ${index + 1}`
      }));
    }

    // Split by dialogue blocks (character names in caps)
    const dialoguePattern = /\n([A-Z]{2,}[A-Z\s]*)\n/g;
    const parts = content.split(dialoguePattern);
    const scenes = [];
    
    for (let i = 0; i < parts.length; i += 2) {
      const scenePart = parts[i] + (parts[i + 1] || '');
      if (scenePart.trim().length > 100) {
        scenes.push({
          content: scenePart.trim(),
          sceneNumber: Math.floor(i / 2) + 1,
          header: `Scene ${Math.floor(i / 2) + 1}`
        });
      }
    }

    // Final fallback: split into equal chunks
    if (scenes.length <= 1) {
      const chunkSize = Math.max(500, Math.floor(content.length / 5));
      const words = content.split(' ');
      const wordsPerChunk = Math.floor(chunkSize / 6); // Approximate words per chunk
      
      for (let i = 0; i < words.length; i += wordsPerChunk) {
        const chunk = words.slice(i, i + wordsPerChunk).join(' ');
        if (chunk.trim().length > 100) {
          scenes.push({
            content: chunk.trim(),
            sceneNumber: Math.floor(i / wordsPerChunk) + 1,
            header: `Scene ${Math.floor(i / wordsPerChunk) + 1}`
          });
        }
      }
    }

    return scenes.length > 0 ? scenes : [{
      content: content,
      sceneNumber: 1,
      header: 'Complete Script'
    }];
  }

  /**
   * Filter out very short scenes and merge related ones
   * @param {Array} scenes - Array of scene objects
   * @returns {Array} Filtered and merged scenes
   */
  filterAndMergeScenes(scenes) {
    const filteredScenes = [];
    let currentMergedScene = null;

    for (const scene of scenes) {
      // Skip very short scenes (less than 100 characters)
      if (scene.content.length < 100) {
        if (currentMergedScene) {
          currentMergedScene.content += '\n\n' + scene.content;
        }
        continue;
      }

      // If we have a scene to merge, add it first
      if (currentMergedScene) {
        filteredScenes.push(currentMergedScene);
        currentMergedScene = null;
      }

      // Check if this scene should be merged with the next one
      if (scene.content.length < 300) {
        currentMergedScene = { ...scene };
      } else {
        filteredScenes.push(scene);
      }
    }

    // Add any remaining merged scene
    if (currentMergedScene) {
      filteredScenes.push(currentMergedScene);
    }

    // Renumber scenes
    return filteredScenes.map((scene, index) => ({
      ...scene,
      sceneNumber: index + 1
    }));
  }

  /**
   * Detect emotion in text using Hugging Face models
   * @param {string} text - Text to analyze
   * @param {string} language - Language code for analysis
   * @returns {Object} Emotion detection result
   */
  async detectEmotion(text, language = 'en') {
    try {
      // Preprocess text for better analysis
      const processedText = this.preprocessText(text);
      
      // Get appropriate model for language
      const model = this.getEmotionModelForLanguage(language);
      
      // Try multiple models for better accuracy
      let result;
      
      try {
        // Primary model based on language
        result = await this.hf.textClassification({
          model: model.primary,
          inputs: processedText
        });
      } catch (primaryError) {
        console.log(`Primary model (${model.primary}) failed, trying secondary model...`);
        
        // Fallback to alternative emotion model
        result = await this.hf.textClassification({
          model: model.fallback,
          inputs: processedText
        });
      }

      if (result && result.length > 0) {
        // Get top 3 emotions and consider context
        const topEmotions = result.slice(0, 3);
        const selectedEmotion = this.selectBestEmotion(topEmotions, text);
        const mappedEmotion = this.mapEmotion(selectedEmotion.label.toLowerCase());
        
        return {
          label: mappedEmotion,
          score: selectedEmotion.score,
          originalLabel: selectedEmotion.label,
          language: language,
          alternatives: topEmotions.slice(1).map(e => ({
            label: this.mapEmotion(e.label.toLowerCase()),
            score: e.score
          }))
        };
      }

      throw new Error('No emotion detected');
      
    } catch (error) {
      console.error('Emotion detection error:', error);
      
      // Enhanced fallback with context analysis
      const contextEmotion = this.analyzeContextualEmotion(text);
      
      return {
        label: contextEmotion.emotion,
        score: contextEmotion.confidence,
        originalLabel: 'contextual_analysis',
        language: language,
        fallback: true
      };
    }
  }

  /**
   * Get appropriate emotion detection model for language
   * @param {string} language - Language code
   * @returns {Object} Model configuration
   */
  getEmotionModelForLanguage(language) {
    const models = {
      'en': {
        primary: 'j-hartmann/emotion-english-distilroberta-base',
        fallback: 'SamLowe/roberta-base-go_emotions'
      },
      'es': {
        primary: 'finiteautomata/beto-emotion-analysis',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      },
      'fr': {
        primary: 'tblard/tf-allocine',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      },
      'de': {
        primary: 'oliverguhr/german-sentiment-bert',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      },
      'it': {
        primary: 'neuraly/bert-base-italian-cased-sentiment',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      },
      'pt': {
        primary: 'neuralmind/bert-base-portuguese-cased',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      },
      'ja': {
        primary: 'koheiduck/bert-japanese-finetuned-sentiment',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      },
      'ko': {
        primary: 'snunlp/KR-BERT-char16424',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      },
      'zh': {
        primary: 'uer/roberta-base-finetuned-chinanews-chinese',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      },
      'hi': {
        primary: 'l3cube-pune/hindi-sentiment-analysis-v2',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      },
      'ar': {
        primary: 'CAMeL-Lab/bert-base-arabic-camelbert-msa-sentiment',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      },
      'ru': {
        primary: 'seara/rubert-base-cased-russian-sentiment',
        fallback: 'cardiffnlp/twitter-roberta-base-emotion'
      }
    };

    // Default to English if language not supported
    return models[language] || models['en'];
  }

  /**
   * Preprocess text for better emotion detection
   * @param {string} text - Raw text
   * @returns {string} Processed text
   */
  preprocessText(text) {
    // Extract meaningful content from script format
    const lines = text.split('\n');
    let dialogueText = '';
    let actionText = '';
    let contextText = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Skip stage directions in parentheses but extract emotion cues
      if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
        const emotionalCues = this.extractEmotionalCues(trimmed);
        if (emotionalCues) contextText += ' ' + emotionalCues;
        continue;
      }
      
      // Skip character names (all caps) but note speaker changes
      if (trimmed === trimmed.toUpperCase() && trimmed.length < 30 && !trimmed.includes(' ')) {
        continue;
      }

      // Check if it's a scene description (often contains emotional context)
      if (this.isSceneDescription(trimmed)) {
        actionText += ' ' + trimmed;
      } else {
        // Likely dialogue
        dialogueText += ' ' + trimmed;
      }
    }

    // Combine with priority on dialogue, then action, then context
    let processedText = dialogueText;
    if (processedText.length < 100) {
      processedText += ' ' + actionText;
    }
    if (processedText.length < 50) {
      processedText += ' ' + contextText;
    }

    // Clean up and limit length for API
    processedText = processedText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?'-]/g, '') // Remove special characters but keep punctuation
      .trim()
      .substring(0, 512); // Optimal length for BERT models

    return processedText || text.substring(0, 512);
  }

  /**
   * Extract emotional cues from stage directions
   * @param {string} stageDirection - Stage direction text
   * @returns {string} Emotional cues
   */
  extractEmotionalCues(stageDirection) {
    const emotionalWords = [
      'angrily', 'sadly', 'happily', 'fearfully', 'nervously', 'excitedly',
      'tears', 'crying', 'laughing', 'screaming', 'shouting', 'whispering',
      'tense', 'relaxed', 'worried', 'confident', 'desperate', 'hopeful',
      'angry', 'sad', 'happy', 'scared', 'nervous', 'excited', 'calm'
    ];

    const lowerDirection = stageDirection.toLowerCase();
    const foundCues = emotionalWords.filter(word => lowerDirection.includes(word));
    
    return foundCues.join(' ');
  }

  /**
   * Check if a line is a scene description vs dialogue
   * @param {string} line - Text line
   * @returns {boolean} True if scene description
   */
  isSceneDescription(line) {
    // Scene descriptions often start with uppercase or contain specific indicators
    const sceneIndicators = [
      /^[A-Z][A-Z\s]+ (walks|runs|sits|stands|looks|moves|enters|exits)/,
      /^The /,
      /^A /,
      /\b(suddenly|meanwhile|later|earlier|outside|inside)\b/i,
      /\b(camera|shot|angle|close|wide)\b/i
    ];

    return sceneIndicators.some(pattern => pattern.test(line));
  }

  /**
   * Select the best emotion from multiple predictions based on context
   * @param {Array} emotions - Array of emotion predictions
   * @param {string} originalText - Original text for context
   * @returns {Object} Best emotion prediction
   */
  selectBestEmotion(emotions, originalText) {
    if (emotions.length === 1) return emotions[0];

    // Boost certain emotions based on context
    const contextualBoosts = this.getContextualBoosts(originalText);
    
    let bestEmotion = emotions[0];
    let bestScore = emotions[0].score;

    for (const emotion of emotions) {
      const boost = contextualBoosts[emotion.label.toLowerCase()] || 1;
      const adjustedScore = emotion.score * boost;
      
      if (adjustedScore > bestScore) {
        bestScore = adjustedScore;
        bestEmotion = emotion;
      }
    }

    return bestEmotion;
  }

  /**
   * Get contextual boosts for emotions based on text analysis
   * @param {string} text - Text to analyze
   * @returns {Object} Emotion boost multipliers
   */
  getContextualBoosts(text) {
    const lowerText = text.toLowerCase();
    const boosts = {};

    // Scene setting boosts
    if (/\b(night|dark|shadow|storm)\b/.test(lowerText)) {
      boosts.fear = 1.2;
      boosts.sadness = 1.1;
      boosts.suspense = 1.3;
    }

    if (/\b(sunny|bright|morning|garden|party)\b/.test(lowerText)) {
      boosts.joy = 1.2;
      boosts.happiness = 1.2;
      boosts.optimism = 1.1;
    }

    // Action indicators
    if (/\b(run|chase|fight|escape|urgent)\b/.test(lowerText)) {
      boosts.fear = 1.2;
      boosts.excitement = 1.3;
      boosts.anger = 1.1;
    }

    // Dialogue patterns
    if (/[!]{2,}/.test(text)) {
      boosts.anger = 1.2;
      boosts.excitement = 1.2;
    }

    if (/[?]{2,}/.test(text)) {
      boosts.confusion = 1.2;
      boosts.surprise = 1.1;
    }

    return boosts;
  }

  /**
   * Analyze emotion using contextual clues and patterns
   * @param {string} text - Text to analyze
   * @returns {Object} Emotion analysis result
   */
  analyzeContextualEmotion(text) {
    const lowerText = text.toLowerCase();
    
    // Enhanced keyword-based analysis with weights
    const emotionPatterns = {
      'happy': {
        keywords: ['laugh', 'smile', 'joy', 'celebration', 'wedding', 'party', 'fun', 'excited', 'wonderful', 'amazing'],
        patterns: [/\b(ha|he)+\b/, /:\)/, /\blol\b/],
        weight: 1
      },
      'sad': {
        keywords: ['cry', 'tears', 'death', 'funeral', 'goodbye', 'loss', 'sorrow', 'regret', 'miss', 'lonely'],
        patterns: [/\bcr(y|ies|ied)\b/, /:\(/, /\bsob\b/],
        weight: 1
      },
      'angry': {
        keywords: ['shout', 'yell', 'fight', 'anger', 'rage', 'furious', 'mad', 'hate', 'damn', 'stupid'],
        patterns: [/[!]{2,}/, /\b(grr|argh)\b/, /DAMN/],
        weight: 1
      },
      'fearful': {
        keywords: ['scared', 'afraid', 'terror', 'horror', 'monster', 'scream', 'panic', 'nightmare', 'danger'],
        patterns: [/\bah+\b/, /\bhelp\b/, /\bno+\b/],
        weight: 1
      },
      'romantic': {
        keywords: ['kiss', 'love', 'romance', 'heart', 'romantic', 'embrace', 'darling', 'honey', 'beautiful'],
        patterns: [/\bheart\b/, /\blove you\b/, /<3/],
        weight: 1
      },
      'surprised': {
        keywords: ['wow', 'amazing', 'incredible', 'unbelievable', 'shocking', 'sudden', 'unexpected'],
        patterns: [/\bwow\b/, /\boh\b/, /[?]{2,}/],
        weight: 1
      },
      'tense': {
        keywords: ['chase', 'run', 'escape', 'danger', 'urgent', 'quickly', 'hurry', 'fast', 'immediate'],
        patterns: [/\brun\b/, /\bquick\b/, /\burgen/],
        weight: 1
      }
    };

    let bestEmotion = 'neutral';
    let bestScore = 0;

    for (const [emotion, data] of Object.entries(emotionPatterns)) {
      let score = 0;
      
      // Check keywords
      for (const keyword of data.keywords) {
        if (lowerText.includes(keyword)) {
          score += 1;
        }
      }
      
      // Check patterns
      for (const pattern of data.patterns) {
        if (pattern.test(lowerText)) {
          score += 1.5;
        }
      }
      
      // Apply weight and normalize
      const finalScore = (score * data.weight) / Math.max(text.length / 100, 1);
      
      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestEmotion = emotion;
      }
    }

    return {
      emotion: bestEmotion,
      confidence: Math.min(bestScore / 3, 0.9) // Normalize to 0-0.9 range
    };
  }

  /**
   * Map detected emotions to visual-friendly categories
   * @param {string} emotion - Raw emotion label
   * @returns {string} Mapped emotion
   */
  mapEmotion(emotion) {
    return this.emotionMapping[emotion] || emotion;
  }

  /**
   * Convert sentiment to emotion
   * @param {string} sentiment - Sentiment label
   * @returns {string} Emotion
   */
  sentimentToEmotion(sentiment) {
    const sentimentMap = {
      'positive': 'happy',
      'negative': 'sad',
      'neutral': 'calm'
    };
    
    return sentimentMap[sentiment] || 'neutral';
  }

  /**
   * Get fallback emotion based on content analysis
   * @param {string} content - Scene content
   * @returns {string} Fallback emotion
   */
  getFallbackEmotion(content) {
    const lowerContent = content.toLowerCase();
    
    // Simple keyword-based emotion detection
    const emotionKeywords = {
      'happy': ['laugh', 'smile', 'joy', 'celebration', 'wedding', 'party', 'fun'],
      'sad': ['cry', 'tears', 'death', 'funeral', 'goodbye', 'loss', 'sorrow'],
      'angry': ['shout', 'yell', 'fight', 'anger', 'rage', 'furious', 'mad'],
      'fearful': ['scared', 'afraid', 'terror', 'horror', 'monster', 'scream'],
      'romantic': ['kiss', 'love', 'romance', 'heart', 'romantic', 'embrace'],
      'tense': ['chase', 'run', 'escape', 'danger', 'urgent', 'quickly'],
      'mysterious': ['dark', 'shadow', 'mystery', 'secret', 'hidden', 'unknown'],
      'dramatic': ['reveal', 'truth', 'betrayal', 'shocking', 'dramatic']
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return emotion;
      }
    }

    return 'neutral';
  }

  /**
   * Add delay for API rate limiting
   * @param {number} ms - Milliseconds to wait
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new EmotionService();
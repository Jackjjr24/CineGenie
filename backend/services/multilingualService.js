const franc = require('franc');
const compromise = require('compromise');
const { transliteration } = require('transliteration');

class MultilingualService {
  constructor() {
    this.supportedLanguages = {
      'en': { name: 'English', direction: 'ltr', model: 'en_core_web_sm' },
      'es': { name: 'Español', direction: 'ltr', model: 'es_core_news_sm' },
      'fr': { name: 'Français', direction: 'ltr', model: 'fr_core_news_sm' },
      'de': { name: 'Deutsch', direction: 'ltr', model: 'de_core_news_sm' },
      'it': { name: 'Italiano', direction: 'ltr', model: 'it_core_news_sm' },
      'pt': { name: 'Português', direction: 'ltr', model: 'pt_core_news_sm' },
      'ja': { name: '日本語', direction: 'ltr', model: 'ja_core_news_sm' },
      'ko': { name: '한국어', direction: 'ltr', model: 'ko_core_news_sm' },
      'zh': { name: '中文', direction: 'ltr', model: 'zh_core_web_sm' },
      'hi': { name: 'हिन्दी', direction: 'ltr', model: 'hi_core_news_sm' },
      'ar': { name: 'العربية', direction: 'rtl', model: 'ar_core_news_sm' },
      'ru': { name: 'Русский', direction: 'ltr', model: 'ru_core_news_sm' },
      'nl': { name: 'Nederlands', direction: 'ltr', model: 'nl_core_news_sm' },
      'sv': { name: 'Svenska', direction: 'ltr', model: 'sv_core_news_sm' },
      'da': { name: 'Dansk', direction: 'ltr', model: 'da_core_news_sm' },
      'no': { name: 'Norsk', direction: 'ltr', model: 'nb_core_news_sm' },
      'fi': { name: 'Suomi', direction: 'ltr', model: 'fi_core_news_sm' },
      'pl': { name: 'Polski', direction: 'ltr', model: 'pl_core_news_sm' },
      'cs': { name: 'Čeština', direction: 'ltr', model: 'cs_core_news_sm' },
      'tr': { name: 'Türkçe', direction: 'ltr', model: 'tr_core_news_sm' }
    };

    // Emotional keywords by language for enhanced analysis
    this.emotionalKeywords = {
      'en': {
        'happy': ['joy', 'laugh', 'smile', 'celebration', 'happy', 'cheerful', 'delighted', 'thrilled', 'ecstatic'],
        'sad': ['cry', 'tears', 'sorrow', 'grief', 'melancholy', 'depression', 'mourning', 'weeping'],
        'angry': ['rage', 'fury', 'anger', 'mad', 'furious', 'hostile', 'aggressive', 'violent'],
        'fearful': ['fear', 'terror', 'horror', 'panic', 'scared', 'frightened', 'anxious', 'worried'],
        'romantic': ['love', 'romance', 'passion', 'intimate', 'tender', 'affection', 'kiss', 'embrace'],
        'surprised': ['shock', 'amazed', 'astonished', 'stunned', 'bewildered', 'startled', 'unexpected'],
        'disgusted': ['disgust', 'revulsion', 'repulsed', 'sickened', 'nauseated', 'appalled']
      },
      'es': {
        'happy': ['alegría', 'reír', 'sonreír', 'celebración', 'feliz', 'contento', 'encantado', 'emocionado'],
        'sad': ['llorar', 'lágrimas', 'tristeza', 'dolor', 'melancolía', 'depresión', 'luto', 'pena'],
        'angry': ['rabia', 'furia', 'enojo', 'loco', 'furioso', 'hostil', 'agresivo', 'violento'],
        'fearful': ['miedo', 'terror', 'horror', 'pánico', 'asustado', 'temeroso', 'ansioso', 'preocupado'],
        'romantic': ['amor', 'romance', 'pasión', 'íntimo', 'tierno', 'cariño', 'beso', 'abrazo'],
        'surprised': ['shock', 'asombrado', 'sorprendido', 'aturdido', 'desconcertado', 'sobresaltado'],
        'disgusted': ['asco', 'repulsión', 'repugnancia', 'náuseas', 'horrorizado', 'consternado']
      },
      'fr': {
        'happy': ['joie', 'rire', 'sourire', 'célébration', 'heureux', 'content', 'ravi', 'excité'],
        'sad': ['pleurer', 'larmes', 'tristesse', 'douleur', 'mélancolie', 'dépression', 'deuil', 'chagrin'],
        'angry': ['rage', 'fureur', 'colère', 'fou', 'furieux', 'hostile', 'agressif', 'violent'],
        'fearful': ['peur', 'terreur', 'horreur', 'panique', 'effrayé', 'craintif', 'anxieux', 'inquiet'],
        'romantic': ['amour', 'romance', 'passion', 'intime', 'tendre', 'affection', 'baiser', 'étreinte'],
        'surprised': ['choc', 'étonné', 'surpris', 'stupéfait', 'déconcerté', 'sursauté', 'inattendu'],
        'disgusted': ['dégoût', 'répulsion', 'répugnance', 'nausée', 'horrifié', 'consterné']
      },
      'de': {
        'happy': ['freude', 'lachen', 'lächeln', 'feier', 'glücklich', 'fröhlich', 'erfreut', 'begeistert'],
        'sad': ['weinen', 'tränen', 'trauer', 'schmerz', 'melancholie', 'depression', 'traurig', 'kummer'],
        'angry': ['wut', 'zorn', 'ärger', 'verrückt', 'wütend', 'feindselig', 'aggressiv', 'gewalttätig'],
        'fearful': ['angst', 'terror', 'horror', 'panik', 'erschrocken', 'ängstlich', 'besorgt', 'nervös'],
        'romantic': ['liebe', 'romantik', 'leidenschaft', 'intim', 'zärtlich', 'zuneigung', 'kuss', 'umarmung'],
        'surprised': ['schock', 'erstaunt', 'überrascht', 'verblüfft', 'verwirrt', 'erschrocken', 'unerwartet'],
        'disgusted': ['ekel', 'abscheu', 'widerwille', 'übelkeit', 'entsetzt', 'bestürzt']
      },
      'ja': {
        'happy': ['喜び', '笑う', '微笑む', '祝い', '幸せ', '楽しい', '嬉しい', '興奮'],
        'sad': ['泣く', '涙', '悲しみ', '痛み', '憂鬱', 'うつ病', '悲しい', '嘆き'],
        'angry': ['怒り', '激怒', '腹立つ', '狂った', '激怒した', '敵対的', '攻撃的', '暴力的'],
        'fearful': ['恐怖', 'テロ', 'ホラー', 'パニック', '怖い', '恐れる', '不安', '心配'],
        'romantic': ['愛', 'ロマンス', '情熱', '親密', '優しい', '愛情', 'キス', '抱擁'],
        'surprised': ['ショック', '驚いた', '驚く', '唖然', '当惑', 'びっくり', '予想外'],
        'disgusted': ['嫌悪', '嫌悪感', '反発', '吐き気', '恐怖', '困惑']
      }
    };

    // Script format patterns by language/region
    this.scriptPatterns = {
      'hollywood': {
        sceneHeaders: /^(INT\.|EXT\.)/gm,
        characters: /^[A-Z\s]+$/gm,
        dialogue: /^\s+.+$/gm,
        action: /^[A-Z].+$/gm
      },
      'european': {
        sceneHeaders: /^(INTÉRIEUR|EXTÉRIEUR|INT\.|EXT\.)/gm,
        characters: /^[A-Z\s]+\s*:$/gm,
        dialogue: /^\s+.+$/gm,
        action: /^[A-Z].+$/gm
      },
      'fountain': {
        sceneHeaders: /^(INT\.|EXT\.|\.|>)/gm,
        characters: /^[A-Z\s]+$/gm,
        dialogue: /^\s+.+$/gm,
        transitions: /^(FADE IN|FADE OUT|CUT TO)/gm
      },
      'asian': {
        sceneHeaders: /^(屋内|屋外|內景|外景|장면|씬)/gm,
        characters: /^[가-힣\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]+\s*[：:]/gm,
        dialogue: /^\s+.+$/gm
      }
    };

    // Cultural emotion mappings
    this.culturalEmotionMappings = {
      'en': { // English/Western
        'joy': 'happy', 'sadness': 'sad', 'anger': 'angry', 'fear': 'fearful',
        'love': 'romantic', 'surprise': 'surprised', 'disgust': 'disgusted'
      },
      'ja': { // Japanese
        'ikari': 'angry', 'kanashimi': 'sad', 'yorokobi': 'happy', 'kyofu': 'fearful',
        'ai': 'romantic', 'odoroki': 'surprised', 'iya': 'disgusted'
      },
      'zh': { // Chinese
        'nu': 'angry', 'bei': 'sad', 'xi': 'happy', 'kong': 'fearful',
        'ai': 'romantic', 'jing': 'surprised', 'wu': 'disgusted'
      },
      'ar': { // Arabic
        'ghadab': 'angry', 'huzn': 'sad', 'farah': 'happy', 'khawf': 'fearful',
        'hubb': 'romantic', 'dasha': 'surprised', 'qarf': 'disgusted'
      }
    };
  }

  /**
   * Detect language of script content
   * @param {string} content - Script content
   * @returns {Object} Language detection result
   */
  detectLanguage(content) {
    try {
      // Use franc for initial detection
      const detected = franc(content, { minLength: 10 });
      
      // Validate against supported languages
      if (this.supportedLanguages[detected]) {
        return {
          language: detected,
          confidence: this.calculateLanguageConfidence(content, detected),
          name: this.supportedLanguages[detected].name,
          direction: this.supportedLanguages[detected].direction
        };
      }

      // Fallback to pattern-based detection
      const patternBased = this.detectLanguageByPatterns(content);
      if (patternBased) {
        return patternBased;
      }

      // Default to English
      return {
        language: 'en',
        confidence: 0.5,
        name: 'English',
        direction: 'ltr',
        fallback: true
      };

    } catch (error) {
      console.error('Language detection error:', error);
      return {
        language: 'en',
        confidence: 0.3,
        name: 'English',
        direction: 'ltr',
        fallback: true,
        error: true
      };
    }
  }

  /**
   * Detect language using character patterns and keywords
   * @param {string} content - Script content
   * @returns {Object|null} Language detection result
   */
  detectLanguageByPatterns(content) {
    const patterns = {
      'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/,
      'ko': /[\uac00-\ud7af]/,
      'zh': /[\u4e00-\u9fff]/,
      'ar': /[\u0600-\u06ff]/,
      'ru': /[\u0400-\u04ff]/,
      'hi': /[\u0900-\u097f]/,
      'th': /[\u0e00-\u0e7f]/
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(content) && this.supportedLanguages[lang]) {
        const matches = content.match(pattern) || [];
        const confidence = Math.min(matches.length / 100, 0.95);
        
        return {
          language: lang,
          confidence,
          name: this.supportedLanguages[lang].name,
          direction: this.supportedLanguages[lang].direction,
          detectionMethod: 'pattern'
        };
      }
    }

    return null;
  }

  /**
   * Calculate language confidence based on content analysis
   * @param {string} content - Script content
   * @param {string} language - Detected language
   * @returns {number} Confidence score (0-1)
   */
  calculateLanguageConfidence(content, language) {
    if (!this.emotionalKeywords[language]) {
      return 0.5; // Medium confidence if no keyword list available
    }

    const keywords = this.emotionalKeywords[language];
    const lowerContent = content.toLowerCase();
    let matchCount = 0;
    let totalKeywords = 0;

    // Count keyword matches across all emotions
    for (const emotion of Object.values(keywords)) {
      totalKeywords += emotion.length;
      for (const keyword of emotion) {
        if (lowerContent.includes(keyword)) {
          matchCount++;
        }
      }
    }

    // Calculate confidence based on keyword match ratio
    const keywordConfidence = totalKeywords > 0 ? matchCount / totalKeywords : 0;
    
    // Adjust confidence based on content length and structure
    const lengthFactor = Math.min(content.length / 1000, 1); // More content = higher confidence
    const structureFactor = this.analyzeScriptStructure(content, language);

    return Math.min((keywordConfidence * 0.4 + lengthFactor * 0.3 + structureFactor * 0.3), 0.98);
  }

  /**
   * Analyze script structure for language-specific patterns
   * @param {string} content - Script content
   * @param {string} language - Language code
   * @returns {number} Structure confidence score
   */
  analyzeScriptStructure(content, language) {
    // Determine likely script format based on language/culture
    let scriptFormat = 'hollywood'; // default
    
    if (['ja', 'ko', 'zh', 'hi', 'th'].includes(language)) {
      scriptFormat = 'asian';
    } else if (['fr', 'de', 'it', 'es', 'pt'].includes(language)) {
      scriptFormat = 'european';
    }

    const patterns = this.scriptPatterns[scriptFormat];
    let structureScore = 0;
    let totalPatterns = 0;

    // Check for scene headers
    if (patterns.sceneHeaders) {
      const sceneMatches = content.match(patterns.sceneHeaders) || [];
      structureScore += Math.min(sceneMatches.length / 5, 0.3); // Max 0.3 for scene headers
      totalPatterns++;
    }

    // Check for character patterns
    if (patterns.characters) {
      const charMatches = content.match(patterns.characters) || [];
      structureScore += Math.min(charMatches.length / 10, 0.3); // Max 0.3 for characters
      totalPatterns++;
    }

    // Check for dialogue patterns
    if (patterns.dialogue) {
      const dialogueMatches = content.match(patterns.dialogue) || [];
      structureScore += Math.min(dialogueMatches.length / 20, 0.4); // Max 0.4 for dialogue
      totalPatterns++;
    }

    return totalPatterns > 0 ? structureScore : 0.5;
  }

  /**
   * Process multilingual script content
   * @param {string} content - Script content
   * @param {string} language - Language code
   * @returns {Object} Processed script data
   */
  processMultilingualScript(content, language) {
    try {
      // Normalize content based on language
      const normalizedContent = this.normalizeContent(content, language);
      
      // Extract script elements
      const scriptElements = this.extractScriptElements(normalizedContent, language);
      
      // Enhance emotional analysis with language-specific keywords
      const enhancedScenes = this.enhanceEmotionalAnalysis(scriptElements.scenes, language);
      
      return {
        success: true,
        language,
        direction: this.supportedLanguages[language]?.direction || 'ltr',
        originalContent: content,
        normalizedContent,
        elements: {
          ...scriptElements,
          scenes: enhancedScenes
        },
        metadata: {
          characterCount: content.length,
          wordCount: this.countWords(content, language),
          sceneCount: enhancedScenes.length,
          estimatedReadingTime: this.estimateReadingTime(content, language)
        }
      };

    } catch (error) {
      console.error('Multilingual processing error:', error);
      throw new Error(`Failed to process multilingual script: ${error.message}`);
    }
  }

  /**
   * Normalize content based on language rules
   * @param {string} content - Raw content
   * @param {string} language - Language code
   * @returns {string} Normalized content
   */
  normalizeContent(content, language) {
    let normalized = content;

    // Remove BOM and normalize line endings
    normalized = normalized.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

    // Language-specific normalization
    switch (language) {
      case 'ar':
        // Arabic text normalization
        normalized = normalized
          .replace(/ي/g, 'ی') // Normalize Yeh
          .replace(/ك/g, 'ک'); // Normalize Kaf
        break;
        
      case 'zh':
        // Chinese text normalization (Traditional to Simplified)
        // This would require a proper conversion library in production
        break;
        
      case 'ja':
        // Japanese text normalization
        // Convert full-width to half-width for certain characters
        normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
          return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
        break;
        
      case 'ko':
        // Korean text normalization
        // Normalize combining characters
        break;
        
      default:
        // Western languages normalization
        normalized = normalized
          .replace(/['']/g, "'") // Normalize quotes
          .replace(/[""]/g, '"') // Normalize double quotes
          .replace(/…/g, '...'); // Normalize ellipsis
    }

    return normalized.trim();
  }

  /**
   * Extract script elements (scenes, characters, dialogue, etc.)
   * @param {string} content - Normalized content
   * @param {string} language - Language code
   * @returns {Object} Extracted script elements
   */
  extractScriptElements(content, language) {
    // Determine script format
    const scriptFormat = this.determineScriptFormat(content, language);
    const patterns = this.scriptPatterns[scriptFormat];
    
    const scenes = [];
    const characters = new Set();
    const dialogueLines = [];
    const actionLines = [];
    
    const lines = content.split('\n');
    let currentScene = null;
    let currentCharacter = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      // Check for scene headers
      if (this.isSceneHeader(line, patterns, language)) {
        if (currentScene) {
          scenes.push(currentScene);
        }
        
        currentScene = {
          header: line,
          content: line + '\n',
          startLine: i,
          characters: new Set(),
          dialogue: [],
          action: []
        };
        continue;
      }
      
      // Check for character names
      if (this.isCharacterName(line, patterns, language)) {
        currentCharacter = this.extractCharacterName(line, language);
        characters.add(currentCharacter);
        
        if (currentScene) {
          currentScene.characters.add(currentCharacter);
        }
        continue;
      }
      
      // Process dialogue and action
      if (currentScene) {
        currentScene.content += line + '\n';
        
        if (this.isDialogue(line, patterns, language)) {
          const dialogueObj = {
            character: currentCharacter,
            text: line.trim(),
            lineNumber: i
          };
          
          currentScene.dialogue.push(dialogueObj);
          dialogueLines.push(dialogueObj);
        } else if (this.isAction(line, patterns, language)) {
          const actionObj = {
            text: line.trim(),
            lineNumber: i
          };
          
          currentScene.action.push(actionObj);
          actionLines.push(actionObj);
        }
      }
    }
    
    // Add final scene
    if (currentScene) {
      scenes.push(currentScene);
    }
    
    return {
      scenes: scenes.map((scene, index) => ({
        ...scene,
        sceneNumber: index + 1,
        characters: Array.from(scene.characters)
      })),
      characters: Array.from(characters),
      dialogue: dialogueLines,
      action: actionLines,
      format: scriptFormat
    };
  }

  /**
   * Determine script format based on content and language
   * @param {string} content - Script content
   * @param {string} language - Language code
   * @returns {string} Script format
   */
  determineScriptFormat(content, language) {
    // Check for specific format indicators
    if (content.includes('FADE IN:') || content.includes('FADE OUT:')) {
      return 'hollywood';
    }
    
    if (content.includes('INTÉRIEUR') || content.includes('EXTÉRIEUR')) {
      return 'european';
    }
    
    if (['ja', 'ko', 'zh', 'hi', 'th'].includes(language)) {
      return 'asian';
    }
    
    if (['fr', 'de', 'it', 'es', 'pt'].includes(language)) {
      return 'european';
    }
    
    // Check for Fountain format indicators
    if (content.match(/^>/gm) || content.match(/^\./gm)) {
      return 'fountain';
    }
    
    return 'hollywood'; // default
  }

  /**
   * Check if line is a scene header
   * @param {string} line - Text line
   * @param {Object} patterns - Script patterns
   * @param {string} language - Language code
   * @returns {boolean} Is scene header
   */
  isSceneHeader(line, patterns, language) {
    if (patterns.sceneHeaders && patterns.sceneHeaders.test(line)) {
      return true;
    }
    
    // Language-specific scene header patterns
    const sceneKeywords = {
      'en': ['FADE IN', 'FADE OUT', 'CUT TO', 'INT.', 'EXT.'],
      'es': ['INTERIOR', 'EXTERIOR', 'INT.', 'EXT.', 'CORTE A'],
      'fr': ['INTÉRIEUR', 'EXTÉRIEUR', 'INT.', 'EXT.', 'COUPE'],
      'de': ['INNEN', 'AUSSEN', 'INT.', 'EXT.', 'SCHNITT'],
      'ja': ['屋内', '屋外', '内景', '外景', 'フェードイン'],
      'ko': ['실내', '실외', '장면', '씬', '페이드인'],
      'zh': ['内景', '外景', '场景', '淡入', '淡出'],
      'ar': ['داخلي', 'خارجي', 'مشهد', 'انتقال']
    };
    
    const keywords = sceneKeywords[language] || sceneKeywords['en'];
    return keywords.some(keyword => line.toUpperCase().includes(keyword));
  }

  /**
   * Check if line is a character name
   * @param {string} line - Text line
   * @param {Object} patterns - Script patterns
   * @param {string} language - Language code
   * @returns {boolean} Is character name
   */
  isCharacterName(line, patterns, language) {
    // Basic pattern check
    if (patterns.characters && patterns.characters.test(line)) {
      return true;
    }
    
    // Heuristic checks
    if (line.length < 2 || line.length > 30) {
      return false;
    }
    
    // Check if all uppercase (common in many formats)
    if (line === line.toUpperCase() && /^[A-Z\s]+$/.test(line)) {
      return true;
    }
    
    // Check for character name with colon (European style)
    if (line.endsWith(':') || line.endsWith('：')) {
      return true;
    }
    
    // Language-specific character name patterns
    switch (language) {
      case 'ja':
        return /^[ぁ-んァ-ヶ一-龯]+[：:]?$/.test(line);
      case 'ko':
        return /^[가-힣]+[：:]?$/.test(line);
      case 'zh':
        return /^[一-龯]+[：:]?$/.test(line);
      case 'ar':
        return /^[\u0600-\u06ff\s]+[：:]?$/.test(line);
      default:
        return false;
    }
  }

  /**
   * Extract character name from line
   * @param {string} line - Text line
   * @param {string} language - Language code
   * @returns {string} Character name
   */
  extractCharacterName(line, language) {
    // Remove common suffixes
    return line
      .replace(/[：:]\s*$/, '')
      .replace(/\s*\([^)]*\)\s*$/, '') // Remove parenthetical
      .trim()
      .toUpperCase();
  }

  /**
   * Check if line is dialogue
   * @param {string} line - Text line
   * @param {Object} patterns - Script patterns
   * @param {string} language - Language code
   * @returns {boolean} Is dialogue
   */
  isDialogue(line, patterns, language) {
    // Dialogue is typically indented or follows a character name
    if (line.startsWith('  ') || line.startsWith('\t')) {
      return true;
    }
    
    // Check for quotation marks (various styles)
    if (/^["'"「『"]/.test(line) || /["'"」』"]$/.test(line)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if line is action/description
   * @param {string} line - Text line
   * @param {Object} patterns - Script patterns
   * @param {string} language - Language code
   * @returns {boolean} Is action
   */
  isAction(line, patterns, language) {
    // Action lines are typically not indented and start with capital letter
    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      const firstChar = line.charAt(0);
      return /[A-Z\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff]/.test(firstChar);
    }
    
    return false;
  }

  /**
   * Enhance emotional analysis with language-specific keywords
   * @param {Array} scenes - Extracted scenes
   * @param {string} language - Language code
   * @returns {Array} Enhanced scenes with emotion analysis
   */
  enhanceEmotionalAnalysis(scenes, language) {
    const keywords = this.emotionalKeywords[language] || this.emotionalKeywords['en'];
    
    return scenes.map(scene => {
      const emotionScores = {};
      const sceneText = scene.content.toLowerCase();
      
      // Score each emotion based on keyword matches
      for (const [emotion, emotionKeywords] of Object.entries(keywords)) {
        let score = 0;
        
        for (const keyword of emotionKeywords) {
          const matches = sceneText.split(keyword.toLowerCase()).length - 1;
          score += matches;
        }
        
        if (score > 0) {
          emotionScores[emotion] = score;
        }
      }
      
      // Determine primary emotion
      let primaryEmotion = 'neutral';
      let maxScore = 0;
      
      for (const [emotion, score] of Object.entries(emotionScores)) {
        if (score > maxScore) {
          maxScore = score;
          primaryEmotion = emotion;
        }
      }
      
      // Calculate confidence based on score distribution
      const totalScore = Object.values(emotionScores).reduce((sum, score) => sum + score, 0);
      const confidence = totalScore > 0 ? (maxScore / totalScore) : 0.5;
      
      return {
        ...scene,
        emotion: primaryEmotion,
        confidence: Math.min(confidence, 0.95),
        emotionScores,
        language,
        enhancedAnalysis: true
      };
    });
  }

  /**
   * Count words based on language
   * @param {string} content - Text content
   * @param {string} language - Language code
   * @returns {number} Word count
   */
  countWords(content, language) {
    // For languages without spaces between words
    if (['ja', 'zh', 'th'].includes(language)) {
      // Approximate character-based count
      return Math.floor(content.replace(/\s/g, '').length / 2);
    }
    
    // For space-separated languages
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Estimate reading time based on language
   * @param {string} content - Text content
   * @param {string} language - Language code
   * @returns {number} Estimated reading time in minutes
   */
  estimateReadingTime(content, language) {
    const wordCount = this.countWords(content, language);
    
    // Reading speeds by language (words per minute)
    const readingSpeeds = {
      'en': 250, 'es': 220, 'fr': 200, 'de': 180, 'it': 210,
      'pt': 200, 'ja': 400, 'ko': 350, 'zh': 300, 'hi': 200,
      'ar': 150, 'ru': 180, 'nl': 200, 'sv': 220, 'da': 220,
      'no': 220, 'fi': 200, 'pl': 180, 'cs': 180, 'tr': 200
    };
    
    const speed = readingSpeeds[language] || readingSpeeds['en'];
    return Math.ceil(wordCount / speed);
  }

  /**
   * Convert script to different formats
   * @param {Object} scriptData - Processed script data
   * @param {string} targetFormat - Target format
   * @returns {string} Converted script
   */
  convertScriptFormat(scriptData, targetFormat) {
    const { scenes, language } = scriptData;
    
    switch (targetFormat) {
      case 'fountain':
        return this.convertToFountain(scenes, language);
      case 'final_draft':
        return this.convertToFinalDraft(scenes, language);
      case 'writersduet':
        return this.convertToWritersDuet(scenes, language);
      default:
        return this.convertToStandard(scenes, language);
    }
  }

  /**
   * Convert to Fountain format
   * @param {Array} scenes - Scene data
   * @param {string} language - Language code
   * @returns {string} Fountain formatted script
   */
  convertToFountain(scenes, language) {
    let fountain = '';
    
    scenes.forEach((scene, index) => {
      if (index === 0) {
        fountain += 'FADE IN:\n\n';
      }
      
      fountain += scene.header + '\n\n';
      
      scene.action.forEach(action => {
        fountain += action.text + '\n\n';
      });
      
      scene.dialogue.forEach(dialogue => {
        fountain += dialogue.character + '\n';
        fountain += dialogue.text + '\n\n';
      });
      
      if (index === scenes.length - 1) {
        fountain += 'FADE OUT.\n';
      }
    });
    
    return fountain;
  }

  /**
   * Get supported languages list
   * @returns {Object} Supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Validate language support
   * @param {string} language - Language code
   * @returns {boolean} Is supported
   */
  isLanguageSupported(language) {
    return !!this.supportedLanguages[language];
  }

  /**
   * Get language direction
   * @param {string} language - Language code
   * @returns {string} Text direction (ltr/rtl)
   */
  getLanguageDirection(language) {
    return this.supportedLanguages[language]?.direction || 'ltr';
  }

  /**
   * Generate language-specific prompt enhancements
   * @param {string} basePrompt - Base prompt
   * @param {string} language - Language code
   * @param {string} emotion - Scene emotion
   * @returns {string} Enhanced prompt
   */
  generateLanguageSpecificPrompt(basePrompt, language, emotion) {
    // Cultural and aesthetic preferences by language/region
    const culturalEnhancements = {
      'ja': 'anime style, Japanese aesthetic, sakura, traditional architecture',
      'ko': 'K-drama style, Korean aesthetic, modern Seoul, traditional hanbok elements',
      'zh': 'Chinese aesthetic, traditional architecture, martial arts cinematography',
      'ar': 'Middle Eastern aesthetic, Islamic architecture, desert landscapes',
      'hi': 'Bollywood style, Indian aesthetic, vibrant colors, traditional elements',
      'fr': 'French cinema style, Parisian aesthetic, artistic composition',
      'de': 'German expressionist style, European architecture',
      'es': 'Spanish cinema style, warm Mediterranean colors',
      'it': 'Italian neorealism style, Renaissance aesthetics',
      'ru': 'Russian cinema style, Slavic aesthetic, dramatic lighting'
    };
    
    const enhancement = culturalEnhancements[language];
    if (enhancement) {
      return `${basePrompt}, ${enhancement}`;
    }
    
    return basePrompt;
  }
}

module.exports = new MultilingualService();
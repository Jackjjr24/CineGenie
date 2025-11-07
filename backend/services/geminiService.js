const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = your_api_key';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generate cinematography suggestions for scenes using Gemini AI
 * @param {Array} scenes - Array of scene objects with content
 * @returns {Promise<Object>} Suggestions for each scene
 */
async function generateCinematographySuggestions(scenes) {
  try {
    console.log('🎬 Generating cinematography suggestions with Gemini...');
    
    // Format scenes for Gemini input
    const sceneText = scenes.map((scene, index) => 
      `Scene ${scene.scene_number || index + 1}: ${scene.content}`
    ).join('\n\n');

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    const systemInstruction = `You are an expert AI cinematographer and film pre-production assistant.
The user will provide a film script divided into scenes (e.g., Scene 1, Scene 2, Scene 3…).

Your task:

Read and analyze each scene separately.

For every scene, suggest:

Camera setup: shot type (wide/medium/close-up), camera angle (high/low/eye level), lens suggestion, and possible camera movement (pan, dolly, handheld, etc.).

Lighting setup: key light placement, light temperature (warm/cool), intensity, shadows, and color tone that fit the mood, time of day, and action.

Brief reasoning for each choice (why that camera and lighting style enhances the storytelling).

Maintain visual continuity across all scenes while adapting style to each moment.

Format your response like this:

🎥 Scene 1: [Scene Title or Description]
- Camera Suggestion:
- Lighting Suggestion:
- Reasoning:

🎥 Scene 2: [Scene Title or Description]
- Camera Suggestion:
- Lighting Suggestion:
- Reasoning:


Example input:

Scene 1: Sarah walks nervously through a dark alley at night.  
Scene 2: She enters a bright café and meets her friend.  


Example output:

🎥 Scene 1
- Camera: Low-angle, handheld medium shot to create tension.  
- Lighting: Low-key blue lighting with harsh side shadows.  
- Reasoning: Enhances fear and mystery.  

🎥 Scene 2
- Camera: Eye-level wide shot with gentle dolly in.  
- Lighting: Warm key light with soft fill to contrast the previous scene.  
- Reasoning: Creates a sense of safety and relief.  


Make your suggestions cinematic, context-aware, and production-ready.`;

    const result = await model.generateContent({
      contents: [{ 
        role: 'user', 
        parts: [{ text: sceneText }] 
      }],
      systemInstruction: systemInstruction
    });

    const response = result.response;
    const suggestionText = response.text();
    
    console.log('✅ Gemini suggestions generated successfully');
    
    // Parse the suggestions into structured format
    const suggestions = parseSuggestions(suggestionText, scenes);
    
    return {
      success: true,
      rawText: suggestionText,
      suggestions: suggestions
    };

  } catch (error) {
    console.error('❌ Gemini API error:', error);
    return {
      success: false,
      error: error.message,
      suggestions: []
    };
  }
}

/**
 * Parse Gemini's text response into structured suggestions
 * @param {string} text - Raw text from Gemini
 * @param {Array} scenes - Original scenes array
 * @returns {Array} Structured suggestions
 */
function parseSuggestions(text, scenes) {
  const suggestions = [];
  
  // Split by scene markers (🎥 Scene)
  const sceneBlocks = text.split(/🎥\s*Scene\s*\d+/i);
  
  sceneBlocks.forEach((block, index) => {
    if (index === 0 || !block.trim()) return; // Skip first empty element
    
    const sceneIndex = index - 1;
    const scene = scenes[sceneIndex];
    
    if (!scene) return;
    
    // Extract camera, lighting, and reasoning
    const cameraMatch = block.match(/Camera(?:\s+Suggestion)?:\s*(.+?)(?=\n-\s*Lighting|$)/is);
    const lightingMatch = block.match(/Lighting(?:\s+Suggestion)?:\s*(.+?)(?=\n-\s*Reasoning|$)/is);
    const reasoningMatch = block.match(/Reasoning:\s*(.+?)(?=\n🎥|$)/is);
    
    suggestions.push({
      sceneNumber: scene.scene_number || sceneIndex + 1,
      sceneId: scene.id,
      camera: cameraMatch ? cameraMatch[1].trim() : '',
      lighting: lightingMatch ? lightingMatch[1].trim() : '',
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : '',
      fullText: block.trim()
    });
  });
  
  return suggestions;
}

module.exports = {
  generateCinematographySuggestions
};

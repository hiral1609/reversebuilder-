const fs = require('fs').promises;
const config = require('../config');
const { validateProject, SUPPORTED_SECTION_TYPES } = require('../validators/schema-validator');

class AiVisionService {
  isConfigured() {
    return Boolean(config.geminiApiKey || config.openaiApiKey);
  }

  async analyzeScreenshot(imagePath) {
    if (!this.isConfigured()) {
      return {
        success: false,
        usedAi: false,
        message: 'No Vision AI API key configured. Utilizing local Heuristic Reconstruction Engine.'
      };
    }

    try {
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      if (config.geminiApiKey) {
        return await this._callGeminiVision(base64Image);
      } else if (config.openaiApiKey) {
        return await this._callOpenAiVision(base64Image);
      }
    } catch (err) {
      console.warn('AI Vision call error:', err.message);
      return {
        success: false,
        usedAi: false,
        message: `AI Vision analysis failed (${err.message}). Reverting to Heuristic Reconstruction.`
      };
    }
  }

  async _callGeminiVision(base64Image) {
    const prompt = `Analyze this webpage screenshot and reverse engineer its visual layout into ReverseBuilder JSON component schema.
Return ONLY valid JSON matching this structure:
{
  "name": "Reconstructed Page",
  "theme": { "primaryColor": "#hex", "backgroundColor": "#hex", "textColor": "#hex" },
  "sections": [
    {
      "type": "navbar" | "hero" | "features" | "stats" | "testimonials" | "pricing" | "contact" | "cta" | "footer",
      "props": { ... },
      "styles": { "paddingTop": 80, "paddingBottom": 80, "backgroundColor": "#hex", "textColor": "#hex" }
    }
  ]
}
Supported section types: ${SUPPORTED_SECTION_TYPES.join(', ')}.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`;
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/png', data: base64Image } }
        ]
      }],
      generationConfig: {
        response_mime_type: 'application/json'
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      throw new Error(`Gemini API HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini Vision');

    const parsed = JSON.parse(rawText);
    const validated = validateProject(parsed);

    return {
      success: true,
      usedAi: true,
      projectData: validated.project
    };
  }

  async _callOpenAiVision(base64Image) {
    const prompt = `Reverse engineer this webpage screenshot into ReverseBuilder JSON layout schema. Return ONLY valid JSON with sections (navbar, hero, features, stats, testimonials, pricing, contact, footer).`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
          ]
        }]
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      throw new Error(`OpenAI Vision HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    const validated = validateProject(parsed);

    return {
      success: true,
      usedAi: true,
      projectData: validated.project
    };
  }
}

module.exports = new AiVisionService();
module.exports.AiVisionService = AiVisionService;

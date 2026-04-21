import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// Setup axios instance for OpenRouter
console.log(`Initializing OpenRouter client. Key present: ${!!OPENROUTER_API_KEY}. Key starts with: ${OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 10) : 'none'}...`);
const openRouterClient = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://idoc-telemedicine.com', // Required by OpenRouter
    'X-Title': 'iDoc Symptom Checker'
  },
  timeout: 15000 // 15 seconds timeout
});

/**
 * Sends symptom data to OpenRouter for AI analysis
 * @param {Object} symptomData 
 * @returns {Promise<Object>} AI analysis result
 */
export const analyzeSymptoms = async (symptomData) => {
  const { 
    symptoms, 
    duration, 
    severity, 
    age, 
    gender, 
    existingConditions, 
    allergies, 
    medications 
  } = symptomData;

  // Build the system prompt with strict medical safety rules
  const systemPrompt = `
    You are a medical assistant AI. Your task is to analyze patient symptoms and provide guidance.
    
    SAFETY RULES:
    1. NEVER provide a confirmed medical diagnosis.
    2. NEVER prescribe medications or specific dosages.
    3. ALWAYS include a disclaimer that this is AI-generated guidance and not a medical diagnosis.
    4. If symptoms sound life-threatening, set urgency to 'high' and recommend immediate emergency care.
    5. Be concise and professional.
    
    SPECIALTY RECOMMENDATION:
    - Recommend 1 to 3 relevant doctor specialties (e.g., "Cardiologist", "Dermatologist", "Pediatrician").
    - If symptoms are general or unclear, always include "General Physician".
    
    RESPONSE FORMAT:
    You MUST return a valid JSON object ONLY. No other text.
    The JSON structure must be:
    {
      "possibleConditions": ["condition 1", "condition 2"],
      "urgency": "low|medium|high",
      "recommendation": "your patient-friendly guidance here",
      "recommendedDoctorSpecialties": ["Specialty 1", "Specialty 2"]
    }
  `;

  // Build the user prompt with patient details
  const userPrompt = `
    Patient Details:
    - Symptoms: ${symptoms}
    - Duration: ${duration || 'Not specified'}
    - Reported Severity: ${severity || 'medium'}
    - Age: ${age || 'Not specified'}
    - Gender: ${gender || 'Not specified'}
    - Existing Conditions: ${existingConditions ? existingConditions.join(', ') : 'None'}
    - Allergies: ${allergies ? allergies.join(', ') : 'None'}
    - Medications: ${medications ? medications.join(', ') : 'None'}
    
    Analyze these symptoms, identify possible conditions (without diagnosing), determine urgency, provide guidance, and recommend relevant doctor specialties. Return the JSON response as instructed.
  `;

  try {
    // Some providers/models (e.g., certain Gemma variants) reject system/developer instructions.
    // In that case, fold system instructions into the user message.
    const modelId = String(OPENROUTER_MODEL || '').toLowerCase();
    const supportsSystemMessages = !modelId.includes('gemma-3n');

    const payload = {
      model: OPENROUTER_MODEL,
      messages: supportsSystemMessages
        ? [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        : [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }]
    };

    console.log(`Sending request to OpenRouter using model: ${OPENROUTER_MODEL}`);
    const response = await openRouterClient.post('/chat/completions', payload);
    console.log('OpenRouter Response Status:', response.status);

    const content = response?.data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      return null;
    }

    const extractJsonObject = (text) => {
      const trimmed = text.trim();

      // 1) Fast path: whole response is valid JSON
      try {
        return JSON.parse(trimmed);
      } catch {
        // continue
      }

      // 2) Common case: JSON wrapped in code fences or extra text
      // Try to pull the first balanced-ish JSON object by greedy braces.
      const firstBrace = trimmed.indexOf('{');
      const lastBrace = trimmed.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const maybeJson = trimmed.slice(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(maybeJson);
        } catch {
          // continue
        }
      }

      // 3) Try code-fence JSON blocks
      const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenceMatch?.[1]) {
        try {
          return JSON.parse(fenceMatch[1]);
        } catch {
          // ignore
        }
      }

      return null;
    };

    // Safely parse JSON from AI response
    try {
      const parsed = extractJsonObject(content);
      if (!parsed) return null;
      
      // Sanitize output
      return {
        possibleConditions: Array.isArray(parsed.possibleConditions) ? parsed.possibleConditions.filter(c => typeof c === 'string') : [],
        urgency: ['low', 'medium', 'high'].includes(parsed.urgency) ? parsed.urgency : 'medium',
        recommendation: typeof parsed.recommendation === 'string' ? parsed.recommendation : '',
        recommendedDoctorSpecialties: Array.isArray(parsed.recommendedDoctorSpecialties) ? parsed.recommendedDoctorSpecialties.filter(s => typeof s === 'string') : ['General Physician']
      };
    } catch (parseError) {
      console.error('AI Response parsing error:', parseError);
      console.log('Raw AI content:', content);
      return null; // Let the controller handle the fallback
    }

  } catch (error) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    return null; // Let the controller handle the fallback
  }
};

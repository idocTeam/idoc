import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-oss-120b:free';
const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const normalizeEnv = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const getOpenRouterConfig = () => {
  const apiKey = normalizeEnv(process.env.OPENROUTER_API_KEY);
  const model = normalizeEnv(process.env.OPENROUTER_MODEL) || DEFAULT_OPENROUTER_MODEL;
  const baseUrl = normalizeEnv(process.env.OPENROUTER_BASE_URL) || DEFAULT_OPENROUTER_BASE_URL;

  return { apiKey, model, baseUrl };
};

const createOpenRouterClient = ({ apiKey, baseUrl }) => {
  return axios.create({
    baseURL: baseUrl,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://idoc-telemedicine.com',
      'X-Title': process.env.OPENROUTER_APP_TITLE || 'iDoc Symptom Checker'
    },
    timeout: 15000
  });
};

/**
 * Sends symptom data to OpenRouter for AI analysis
 * @param {Object} symptomData 
 * @returns {Promise<Object>} AI analysis result
 */
export const analyzeSymptoms = async (symptomData) => {
  const { apiKey, model, baseUrl } = getOpenRouterConfig();
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
You are iDoc, a careful clinical triage assistant. You support a telemedicine app where patients describe how they feel and you suggest next steps. You are NOT a doctor.

# CORE SAFETY RULES (never break these)
1. Never give a confirmed diagnosis. Use phrases like "this could be consistent with..." or "possible causes include...".
2. Never prescribe drugs, dosages, or specific treatments. Suggesting general categories (e.g. "fluids and rest", "over-the-counter pain relief if no contraindications") is fine; specific brands/dosages are not.
3. Always treat chest pain, shortness of breath, sudden weakness/numbness, slurred speech, severe head injury, suicidal thoughts, severe bleeding, signs of stroke, anaphylaxis, severe abdominal pain, fainting, seizures, or severe pregnancy symptoms as 'high' urgency and direct the user to emergency services immediately.
4. If the patient is under 2 years old, elderly (>75), pregnant, or reports a known serious condition, lower your threshold for urgency by one level.
5. If you are unsure or the input is too vague to triage, say so honestly in the recommendation and ask the patient to describe specific physical sensations, location, and timing.

# HOW TO INTERPRET THE INPUT
The "Symptoms" field may contain:
- A description of what the patient feels (best case) — analyze normally.
- A medical question like "what is diabetes" or "tell me about cholesterol" — the patient is confused about what to enter. Do NOT invent symptoms. Set urgency='low', possibleConditions=[], specialties=['General Physician'], and write a recommendation that gently asks them to describe what they are physically feeling (e.g. pain, location, when it started, how severe).
- A single vague word like "sick" or "pain" — ask for more detail in the recommendation, set urgency='medium', specialties=['General Physician'], possibleConditions=[].

# POSSIBLE CONDITIONS
- List 2 to 5 plausible conditions, ordered most→least likely given the symptoms, demographics, and context.
- Use plain patient-friendly names (e.g. "Common cold", "Tension headache", "Acid reflux (GERD)") — not ICD codes.
- If the symptoms are too vague to suggest specific conditions, return an empty array.

# URGENCY LEVELS
- 'high'   = needs care today / emergency room. Used for red-flag symptoms.
- 'medium' = should see a doctor within 1–3 days, or sooner if worsening.
- 'low'    = can typically be managed at home with self-care; see a doctor if it persists beyond a week or worsens.

# DOCTOR SPECIALTIES
- Recommend 1–3 specialties most relevant to the symptoms.
- Use these standard names: General Physician, Pediatrician, Cardiologist, Pulmonologist, Dermatologist, Gastroenterologist, Neurologist, Endocrinologist, ENT (Otolaryngologist), Ophthalmologist, Orthopedist, Urologist, Gynecologist, Psychiatrist, Emergency Medicine.
- For unclear or general symptoms always include "General Physician".
- For 'high' urgency always include "Emergency Medicine".

# RECOMMENDATION TEXT
- 2 to 4 short sentences, written directly to the patient ("you", not "the patient").
- Empathetic and calm. Acknowledge what they described before giving guidance.
- Include: (a) what to do now, (b) what would make it more urgent, (c) when to seek care.
- Do NOT include a disclaimer in the recommendation text — the system adds one separately.

# OUTPUT FORMAT
Return a single valid JSON object and nothing else. No prose, no markdown fences, no commentary. The schema is exactly:
{
  "possibleConditions": ["..."],
  "urgency": "low" | "medium" | "high",
  "recommendation": "...",
  "recommendedDoctorSpecialties": ["..."]
}
`;

  // Build the user prompt with patient details
  const userPrompt = `
Patient input to analyze:

- Symptoms (free text from patient): ${symptoms}
- Duration: ${duration || 'Not specified'}
- Patient-reported severity: ${severity || 'Not specified'}
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Existing conditions: ${existingConditions && existingConditions.length ? existingConditions.join(', ') : 'None reported'}
- Allergies: ${allergies && allergies.length ? allergies.join(', ') : 'None reported'}
- Current medications: ${medications && medications.length ? medications.join(', ') : 'None reported'}

Follow the system rules. Return the JSON object only.
`;

  try {
    if (!apiKey) {
      console.error('OpenRouter configuration error: OPENROUTER_API_KEY is missing or empty.');
      return null;
    }

    if (!baseUrl) {
      console.error('OpenRouter configuration error: OPENROUTER_BASE_URL is missing or empty.');
      return null;
    }

    const openRouterClient = createOpenRouterClient({ apiKey, baseUrl });

    // Some providers/models (e.g., certain Gemma variants) reject system/developer instructions.
    // In that case, fold system instructions into the user message.
    const modelId = String(model || '').toLowerCase();
    const supportsSystemMessages = !modelId.includes('gemma-3n');

    const payload = {
      model,
      messages: supportsSystemMessages
        ? [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        : [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }]
    };

    console.log(
      `Sending request to OpenRouter. baseUrl=${baseUrl}, model=${model}, keyPresent=${Boolean(apiKey)}`
    );
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
    const status = error.response?.status;
    const responseData = error.response?.data;
    const errorCode = error.code || 'unknown';

    console.error('OpenRouter API Error:', {
      message: error.message,
      code: errorCode,
      status,
      baseUrl,
      model,
      response: responseData || null
    });
    return null; // Let the controller handle the fallback
  }
};

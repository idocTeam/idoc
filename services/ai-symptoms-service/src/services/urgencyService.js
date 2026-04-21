/**
 * Logic to detect dangerous symptoms and determine urgency
 */

const DANGEROUS_SYMPTOMS = [
  'chest pain',
  'trouble breathing',
  'shortness of breath',
  'fainting',
  'seizure',
  'severe bleeding',
  'loss of consciousness',
];

/**
 * Checks if any dangerous symptoms are present in the text
 * @param {string} symptomText 
 * @returns {boolean}
 */
export const detectRedFlags = (symptomText) => {
  if (!symptomText) return false;
  
  const lowerCaseSymptoms = symptomText.toLowerCase();
  
  return DANGEROUS_SYMPTOMS.some((dangerousSymptom) => 
    lowerCaseSymptoms.includes(dangerousSymptom.toLowerCase())
  );
};

/**
 * Normalizes and validates the urgency level
 * @param {string} urgency - Urgency level from AI or other sources
 * @param {boolean} redFlagsDetected - Whether dangerous symptoms were found
 * @returns {string} - 'low', 'medium', or 'high'
 */
export const determineUrgency = (urgency, redFlagsDetected) => {
  if (redFlagsDetected) return 'high';

  const validUrgencies = ['low', 'medium', 'high'];
  const normalizedUrgency = urgency ? urgency.toLowerCase() : 'medium';

  return validUrgencies.includes(normalizedUrgency) ? normalizedUrgency : 'medium';
};

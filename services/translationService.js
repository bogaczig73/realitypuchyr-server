const axios = require('axios');
require('dotenv').config();

const SUPPORTED_LANGUAGES = ['en', 'cs', 'de', 'ru', 'ua', 'vn', 'es', 'fr', 'it'];
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

/**
 * Translates a text to the target language using DeepL API
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., 'en', 'cs', 'sk')
 * @param {string} [sourceLanguage] - Optional source language code (e.g., 'en', 'cs', 'sk')
 * @returns {Promise<string>} Translated text
 */
const translateText = async (text, targetLanguage, sourceLanguage) => {
  if (!text) return '';
  
  try {
    const params = {
      text: text,
      target_lang: targetLanguage.toUpperCase()
    };

    // Only add source_lang if it's provided
    if (sourceLanguage) {
      params.source_lang = sourceLanguage.toUpperCase();
    } else {
      params.source_lang = 'CS'; // Default to Czech if not specified
    }

    const response = await axios.post(DEEPL_API_URL, 
      new URLSearchParams(params), {
        headers: {
          'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data.translations[0].text;
  } catch (error) {
    console.error('Translation error:', error.response?.data || error.message);
    throw new Error(`Failed to translate text: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Translates a property to the target language
 * @param {Object} property - Property object to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} [sourceLanguage] - Optional source language code
 * @returns {Promise<Object>} Translated property fields
 */
const translateProperty = async (property, targetLanguage, sourceLanguage) => {
  if (!SUPPORTED_LANGUAGES.includes(targetLanguage)) {
    throw new Error(`Unsupported language: ${targetLanguage}`);
  }

  const fieldsToTranslate = [
    'name',
    'description',
    'country',
    'buildingCondition',
    'apartmentCondition',
    'objectType',
    'objectLocationType',
    'houseEquipment',
    'accessRoad',
    'objectCondition',
    'equipmentDescription',
    'additionalSources',
    'buildingPermit',
    'buildability',
    'utilitiesOnLand',
    'utilitiesOnAdjacentRoad',
    'payments'
  ];

  const translations = {};
  
  for (const field of fieldsToTranslate) {
    if (property[field]) {
      translations[field] = await translateText(property[field], targetLanguage, sourceLanguage);
    }
  }

  // Convert numeric fields to strings
  translations.size = property.size?.toString() || '';
  translations.beds = property.beds?.toString() || '';
  translations.baths = property.baths?.toString() || '';

  return translations;
};

module.exports = {
  translateText,
  translateProperty,
  SUPPORTED_LANGUAGES
}; 
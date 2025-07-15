const axios = require('axios');
require('dotenv').config();

const SUPPORTED_LANGUAGES = [
  'AR', 'BG', 'CS', 'DA', 'DE', 'EL', 'EN', 'EN-GB', 'EN-US', 'ES', 'ES-419',
  'ET', 'FI', 'FR', 'HE', 'HU', 'ID', 'IT', 'JA', 'KO', 'LT', 'LV', 'NB',
  'NL', 'PL', 'PT', 'PT-BR', 'PT-PT', 'RO', 'RU', 'SK', 'SL', 'SV', 'TH',
  'TR', 'UK', 'VI', 'ZH', 'ZH-HANS', 'ZH-HANT'
];
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

/**
 * Creates a URL-friendly slug from a string
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-friendly slug
 */
const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

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
 * Translates HTML content while preserving HTML structure
 * @param {string} htmlContent - HTML content to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} [sourceLanguage] - Optional source language code
 * @returns {Promise<string>} Translated HTML content
 */
const translateHtmlContent = async (htmlContent, targetLanguage, sourceLanguage) => {
  if (!htmlContent) return '';
  
  try {
    // Use DeepL's HTML handling by setting the tag_handling parameter
    const params = {
      text: htmlContent,
      target_lang: targetLanguage.toUpperCase(),
      tag_handling: 'html' // This tells DeepL to preserve HTML tags
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
    console.error('HTML translation error:', error.response?.data || error.message);
    throw new Error(`Failed to translate HTML content: ${error.response?.data?.message || error.message}`);
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
  if (!SUPPORTED_LANGUAGES.includes(targetLanguage.toUpperCase())) {
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

/**
 * Translates a blog to the target language
 * @param {Object} blog - Blog object to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} [sourceLanguage] - Optional source language code
 * @returns {Promise<Object>} Translated blog fields
 */
const translateBlog = async (blog, targetLanguage, sourceLanguage) => {
  if (!SUPPORTED_LANGUAGES.includes(targetLanguage.toUpperCase())) {
    throw new Error(`Unsupported language: ${targetLanguage}`);
  }

  const translations = {};
  
  // Translate content with HTML preservation
  if (blog.content) {
    translations.content = await translateHtmlContent(blog.content, targetLanguage, sourceLanguage);
  }

  // Translate other text fields
  const textFieldsToTranslate = [
    'name',
    'metaTitle',
    'metaDescription',
    'keywords'
  ];
  
  for (const field of textFieldsToTranslate) {
    if (blog[field]) {
      translations[field] = await translateText(blog[field], targetLanguage, sourceLanguage);
    }
  }

  // Create translated slug from translated title
  if (translations.name) {
    translations.slug = createSlug(translations.name);
  }

  // Translate tags if they exist
  if (blog.tags && blog.tags.length > 0) {
    const translatedTags = [];
    for (const tag of blog.tags) {
      const translatedTag = await translateText(tag, targetLanguage, sourceLanguage);
      translatedTags.push(translatedTag);
    }
    translations.tags = translatedTags;
  }

  return translations;
};

module.exports = {
  translateText,
  translateHtmlContent,
  translateProperty,
  translateBlog,
  createSlug,
  SUPPORTED_LANGUAGES
}; 
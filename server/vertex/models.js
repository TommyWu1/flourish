export const MODEL_PRO = 'gemini-2.5-pro';
export const MODEL_FLASH = 'gemini-2.5-flash';

export const groundedConfig = {
  tools: [{ googleSearch: {} }],
};

export const structuredConfig = (responseSchema) => ({
  responseMimeType: 'application/json',
  responseSchema,
});

/**
 * Gemini supports legacy standard API keys (`AIza...`) and the newer
 * authorization keys (`AQ....`) issued by Google AI Studio.
 */
export const isGeminiApiKey = (value: string): boolean => {
  const key = value.trim();
  return /^(?:AIza|AQ\.)\S+$/.test(key);
};

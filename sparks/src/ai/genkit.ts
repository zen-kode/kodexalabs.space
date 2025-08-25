import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Validate API key configuration
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not configured. AI features will be disabled.');
  console.log('📖 See docs/production-setup-guide.md for setup instructions');
}

// Configure Google AI with proper error handling
const googleAIConfig = process.env.GEMINI_API_KEY ? {
  apiKey: process.env.GEMINI_API_KEY,
} : undefined;

export const ai = genkit({
  plugins: googleAIConfig ? [googleAI(googleAIConfig)] : [],
  model: 'googleai/gemini-2.0-flash',
  // Production configuration
  telemetry: {
    instrumentation: 'googleai',
    logger: process.env.NODE_ENV === 'production' ? 'structured' : 'dev',
  },
});

// Export helper function to check if AI is available
export const isAIAvailable = (): boolean => {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
};

// Export safe AI wrapper that handles missing API key
export const safeAI = {
  generate: async (prompt: string) => {
    if (!isAIAvailable()) {
      throw new Error('AI service not configured. Please set GEMINI_API_KEY environment variable.');
    }
    return ai.generate(prompt);
  },
};

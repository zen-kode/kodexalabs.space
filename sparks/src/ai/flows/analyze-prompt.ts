'use server';

/**
 * @fileOverview Analyzes a prompt to determine its quality and effectiveness.
 *
 * - analyzePrompt - A function that analyzes the prompt.
 * - AnalyzePromptInput - The input type for the analyzePrompt function.
 * - AnalyzePromptOutput - The return type for the analyzePrompt function.
 */

import {ai, isAIAvailable} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePromptInputSchema = z.object({
  promptText: z.string().describe('The prompt text to analyze.'),
});
export type AnalyzePromptInput = z.infer<typeof AnalyzePromptInputSchema>;

const AnalyzePromptOutputSchema = z.object({
  strengthScore: z
    .number()
    .describe(
      'A score from 0 to 1 indicating the strength of the prompt. Higher scores indicate stronger prompts.'
    ),
  clarityScore: z
    .number()
    .describe(
      'A score from 0 to 1 indicating the clarity of the prompt. Higher scores indicate clearer prompts.'
    ),
  completenessScore: z
    .number()
    .describe(
      'A score from 0 to 1 indicating how complete the prompt is. Higher scores indicate more complete prompts.'
    ),
  metrics: z.string().describe('Detailed metrics about the prompt.'),
});
export type AnalyzePromptOutput = z.infer<typeof AnalyzePromptOutputSchema>;

export async function analyzePrompt(input: AnalyzePromptInput): Promise<AnalyzePromptOutput> {
  if (!isAIAvailable()) {
    console.warn('AI service not available, returning default analysis');
    return {
      analysis: {
        clarity: 50,
        specificity: 50,
        completeness: 50,
        overallScore: 50,
        suggestions: ['AI service not configured. Please set GEMINI_API_KEY to get detailed analysis.']
      }
    };
  }
  
  try {
    return await analyzePromptFlow(input);
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    return {
      analysis: {
        clarity: 0,
        specificity: 0,
        completeness: 0,
        overallScore: 0,
        suggestions: ['Error occurred during analysis. Please check your API configuration.']
      }
    };
  }
}

const prompt = ai.definePrompt({
  name: 'analyzePromptPrompt',
  input: {schema: AnalyzePromptInputSchema},
  output: {schema: AnalyzePromptOutputSchema},
  prompt: `You are an AI prompt analyzer. You will receive a prompt and provide a strength score, clarity score, completeness score, and detailed metrics about the prompt.

Prompt: {{{promptText}}}

Provide your analysis in the following JSON format:
{
  "strengthScore": <number>,
    "clarityScore": <number>,
    "completenessScore": <number>,
  "metrics": <string>,
}

strengthScore: A score from 0 to 1 indicating the strength of the prompt. Higher scores indicate stronger prompts.
clarityScore: A score from 0 to 1 indicating the clarity of the prompt. Higher scores indicate clearer prompts.
completenessScore: A score from 0 to 1 indicating how complete the prompt is. Higher scores indicate more complete prompts.
metrics: Detailed metrics about the prompt.
`,
});

const analyzePromptFlow = ai.defineFlow(
  {
    name: 'analyzePromptFlow',
    inputSchema: AnalyzePromptInputSchema,
    outputSchema: AnalyzePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

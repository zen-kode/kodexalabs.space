// Enhance Prompt Flow
'use server';

/**
 * @fileOverview Enhances a given prompt using an LLM.
 *
 * - enhancePrompt - A function that enhances the prompt.
 * - EnhancePromptInput - The input type for the enhancePrompt function.
 * - EnhancePromptOutput - The return type for the enhancePrompt function.
 */

import {ai, isAIAvailable} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePromptInputSchema = z.object({
  prompt: z.string().describe('The prompt to be enhanced.'),
});
export type EnhancePromptInput = z.infer<typeof EnhancePromptInputSchema>;

const EnhancePromptOutputSchema = z.object({
  enhancedPrompt: z.string().describe('The enhanced prompt.'),
});
export type EnhancePromptOutput = z.infer<typeof EnhancePromptOutputSchema>;

export async function enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
  if (!isAIAvailable()) {
    console.warn('AI service not available, returning original prompt');
    return { enhancedPrompt: input.prompt };
  }
  
  try {
    return await enhancePromptFlow(input);
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return { enhancedPrompt: input.prompt };
  }
}

const prompt = ai.definePrompt({
  name: 'enhancePromptPrompt',
  input: {schema: EnhancePromptInputSchema},
  output: {schema: EnhancePromptOutputSchema},
  prompt: `You are an expert prompt engineer. Your goal is to take a user-provided prompt and enhance it to be more effective. Consider clarity, specificity, and potential for generating the desired output. Ensure the enhanced prompt is well-structured and optimized for the best results.

Original Prompt: {{{prompt}}}

Enhanced Prompt:`, // Keep it as Enhanced Prompt: so that the LLM will generate the enhanced prompt after the colon
});

const enhancePromptFlow = ai.defineFlow(
  {
    name: 'enhancePromptFlow',
    inputSchema: EnhancePromptInputSchema,
    outputSchema: EnhancePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';

/**
 * @fileOverview Cleans a prompt by removing unnecessary elements.
 *
 * - cleanPrompt - A function that cleans the prompt.
 * - CleanPromptInput - The input type for the cleanPrompt function.
 * - CleanPromptOutput - The return type for the cleanPrompt function.
 */

import {ai, isAIAvailable} from '@/ai/genkit';
import {z} from 'genkit';

const CleanPromptInputSchema = z.object({
  prompt: z.string().describe('The prompt to be cleaned.'),
});
export type CleanPromptInput = z.infer<typeof CleanPromptInputSchema>;

const CleanPromptOutputSchema = z.object({
  cleanedPrompt: z.string().describe('The cleaned prompt.'),
});
export type CleanPromptOutput = z.infer<typeof CleanPromptOutputSchema>;

export async function cleanPrompt(input: CleanPromptInput): Promise<CleanPromptOutput> {
  if (!isAIAvailable()) {
    console.warn('AI service not available, returning original prompt');
    return { cleanedPrompt: input.prompt };
  }
  
  try {
    return await cleanPromptFlow(input);
  } catch (error) {
    console.error('Error cleaning prompt:', error);
    return { cleanedPrompt: input.prompt };
  }
}

const prompt = ai.definePrompt({
  name: 'cleanPromptPrompt',
  input: {schema: CleanPromptInputSchema},
  output: {schema: CleanPromptOutputSchema},
  prompt: `You are an expert prompt engineer. Your task is to clean the given prompt by removing any unnecessary elements, while preserving its core meaning and intent.\n\nPrompt: {{{prompt}}}`,
});

const cleanPromptFlow = ai.defineFlow(
  {
    name: 'cleanPromptFlow',
    inputSchema: CleanPromptInputSchema,
    outputSchema: CleanPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

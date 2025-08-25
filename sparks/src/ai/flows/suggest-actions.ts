'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting actions based on a given prompt.
 *
 * - suggestActions - A function that suggests actions based on the prompt.
 * - SuggestActionsInput - The input type for the suggestActions function.
 * - SuggestActionsOutput - The return type for the suggestActions function.
 */

import {ai, isAIAvailable} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestActionsInputSchema = z.object({
  prompt: z.string().describe('The prompt to suggest actions for.'),
});
export type SuggestActionsInput = z.infer<typeof SuggestActionsInputSchema>;

const SuggestActionsOutputSchema = z.object({
  actions: z.array(z.string()).describe('A list of suggested actions based on the prompt.'),
});
export type SuggestActionsOutput = z.infer<typeof SuggestActionsOutputSchema>;

export async function suggestActions(input: SuggestActionsInput): Promise<SuggestActionsOutput> {
  if (!isAIAvailable()) {
    console.warn('AI service not available, returning default suggestions');
    return {
      actions: [
        'Configure GEMINI_API_KEY to enable AI-powered suggestions',
        'Review the production setup guide for API configuration',
        'Use manual prompt editing tools while AI is unavailable'
      ]
    };
  }
  
  try {
    return await suggestActionsFlow(input);
  } catch (error) {
    console.error('Error suggesting actions:', error);
    return {
      actions: [
        'Error occurred while generating suggestions',
        'Please check your API configuration',
        'Try again or use manual editing tools'
      ]
    };
  }
}

const prompt = ai.definePrompt({
  name: 'suggestActionsPrompt',
  input: {schema: SuggestActionsInputSchema},
  output: {schema: SuggestActionsOutputSchema},
  prompt: `You are an AI assistant that suggests actions a user can take based on their prompt. The actions should be related to content generation.

Prompt: {{{prompt}}}

Suggest 3 possible actions the user could take:`,
});

const suggestActionsFlow = ai.defineFlow(
  {
    name: 'suggestActionsFlow',
    inputSchema: SuggestActionsInputSchema,
    outputSchema: SuggestActionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

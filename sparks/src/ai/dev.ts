import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-actions.ts';
import '@/ai/flows/enhance-prompt.ts';
import '@/ai/flows/organize-prompt.ts';
import '@/ai/flows/clean-prompt.ts';
import '@/ai/flows/analyze-prompt.ts';
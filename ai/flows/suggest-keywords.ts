
// 'use server';
/**
 * @fileOverview A flow that analyzes the job description and suggests keywords to add to the CV, using a user-provided API key.
 *
 * - suggestKeywords - A function that handles the keyword suggestion process.
 * - SuggestKeywordsInput - The input type for the suggestKeywords function.
 * - SuggestKeywordsOutput - The return type for the suggestKeywords function.
 */

'use server';

import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import Handlebars from 'handlebars';

const SuggestKeywordsInputSchema = z.object({
  cvText: z.string().describe('The text content of the CV.'),
  jobDescription: z.string().describe('The text content of the job description.'),
  apiKey: z.string().min(1, { message: "API Key is required."}).describe('User provided Google AI API Key.'),
});
export type SuggestKeywordsInput = z.infer<typeof SuggestKeywordsInputSchema>;

const SuggestKeywordsOutputSchema = z.object({
  suggestedKeywords: z
    .string()
    .describe(
      'A comma-separated list of keywords suggested for inclusion in the CV, based on the job description.'
    ),
});
export type SuggestKeywordsOutput = z.infer<typeof SuggestKeywordsOutputSchema>;

const KEYWORDS_PROMPT_TEMPLATE = `Given the following CV text and job description, suggest a list of keywords that should be added to the CV to improve its matching score with the job description. Return a comma-separated list of keywords. Only include keywords that are present in the job description but not in the CV.

CV Text:
{{{cvText}}}

Job Description:
{{{jobDescription}}}`;


export async function suggestKeywords(input: SuggestKeywordsInput): Promise<SuggestKeywordsOutput> {
  const parsedInput = SuggestKeywordsInputSchema.parse(input);
  return suggestKeywordsFlow(parsedInput);
}

const suggestKeywordsFlow = ai.defineFlow(
  {
    name: 'suggestKeywordsFlow',
    inputSchema: SuggestKeywordsInputSchema,
    outputSchema: SuggestKeywordsOutputSchema,
  },
  async (flowInput) => {
    if (!flowInput.apiKey) {
      throw new Error("API Key is required to suggest keywords.");
    }

    try {
      const dynamicGoogleAIPlugin = googleAI({ apiKey: flowInput.apiKey });

      const template = Handlebars.compile(KEYWORDS_PROMPT_TEMPLATE);
      const renderedPrompt = template({ cvText: flowInput.cvText, jobDescription: flowInput.jobDescription });

      const { output } = await ai.generate({
        model: 'googleai/gemini-2.0-flash', // Specify the model
        prompt: renderedPrompt,
        output: { schema: SuggestKeywordsOutputSchema },
        plugins: [dynamicGoogleAIPlugin], // Pass the dynamically configured plugin
        // config: { ... } // Add safetySettings etc. if needed
      });

      if (!output) {
        throw new Error("Failed to suggest keywords. Model returned no output.");
      }
      return output;

    } catch (e) {
      console.error("Error in suggestKeywordsFlow with dynamic API key:", e);
      if (e instanceof Error && (e.message.toLowerCase().includes("api key not valid") || e.message.toLowerCase().includes("permission_denied") || e.message.toLowerCase().includes("api_key_invalid")|| e.message.toLowerCase().includes("api key is invalid"))) {
          throw new Error("Invalid API Key provided. Please check your API key and try again.");
      }
      throw new Error(`Failed to process keyword suggestion: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
);

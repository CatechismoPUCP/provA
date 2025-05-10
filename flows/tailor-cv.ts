// tailor-cv.ts
'use server';

/**
 * @fileOverview A Genkit flow for tailoring a CV to a specific job description using a user-provided API key.
 *
 * - tailorCv - A function that accepts a CV, job description, and API key, and returns a tailored CV with suggestions.
 * - TailorCvInput - The input type for the tailorCv function.
 * - TailorCvOutput - The return type for the tailorCv function.
 */

import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import Handlebars from 'handlebars';

const TailorCvInputSchema = z.object({
  cv: z.string().describe('The CV to tailor.'),
  jobDescription: z.string().describe('The job description to tailor the CV to.'),
  apiKey: z.string().min(1, { message: "API Key is required."}).describe('User provided Google AI API Key.'),
});
export type TailorCvInput = z.infer<typeof TailorCvInputSchema>;

const TailorCvOutputSchema = z.object({
  tailoredCv: z.string().describe('The tailored CV, in the same language as the job description.'),
  suggestions: z.string().describe('Suggestions for improving the CV, in the same language as the job description.'),
});
export type TailorCvOutput = z.infer<typeof TailorCvOutputSchema>;

const PROMPT_TEMPLATE = `You are an expert resume tailor. Your primary task is to adapt the provided CV to perfectly align with the given job description.

ABSOLUTE LANGUAGE REQUIREMENT:
The language of your entire response, including the "tailoredCv" and "suggestions", MUST EXACTLY MATCH the predominant language identified in the "Job Description".

Follow these steps meticulously:
1.  DETAILED LANGUAGE ANALYSIS: Carefully examine the "Job Description" text. Determine its primary language (e.g., English, Spanish, French, Italian, German, etc.). This determination is critical.
2.  TRANSLATION (IF NECESSARY): If the provided "CV" is in a language different from the primary language of the "Job Description" (as determined in step 1), you MUST translate all relevant content from the "CV" into the Job Description's language. This translated CV content will then be used for tailoring.
3.  TAILORING IN THE CORRECT LANGUAGE: Perform the CV tailoring using the (potentially translated) CV content and the "Job Description".
4.  OUTPUT IN THE CORRECT LANGUAGE: Generate the "tailoredCv" and "suggestions" fields. Both fields MUST be exclusively in the primary language identified from the "Job Description" in step 1. Do NOT use any other language for any part of your output.

Input:

CV:
{{{cv}}}

Job Description:
{{{jobDescription}}}

Output Structure (Ensure this structure is followed and all text within is in the Job Description's language):

For "tailoredCv":
(The complete tailored CV, written *only* in the primary language of the Job Description.)

For "suggestions":
(Actionable suggestions for improving the CV, written *only* in the primary language of the Job Description.)

Failure to adhere to this language instruction will result in an incorrect and unusable output.
`;


export async function tailorCv(input: TailorCvInput): Promise<TailorCvOutput> {
  const parsedInput = TailorCvInputSchema.parse(input);
  return tailorCvFlow(parsedInput);
}

const tailorCvFlow = ai.defineFlow(
  {
    name: 'tailorCvFlow',
    inputSchema: TailorCvInputSchema,
    outputSchema: TailorCvOutputSchema,
  },
  async (flowInput) => {
    if (!flowInput.apiKey) {
        throw new Error("API Key is required to tailor the CV.");
    }

    let dynamicGoogleAIPlugin;
    try {
        dynamicGoogleAIPlugin = googleAI({ apiKey: flowInput.apiKey });
    } catch(e) {
        console.error("Error initializing GoogleAI plugin with dynamic API key:", e);
        throw new Error("Failed to initialize AI services with the provided API Key. Please check if the key is valid and has permissions.");
    }
    
    try {
      const template = Handlebars.compile(PROMPT_TEMPLATE);
      const renderedPrompt = template({ cv: flowInput.cv, jobDescription: flowInput.jobDescription });

      const { output } = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: renderedPrompt,
        output: { schema: TailorCvOutputSchema },
        plugins: [dynamicGoogleAIPlugin], 
      });
      
      if (!output) {
        throw new Error("Failed to generate tailored CV. Model returned no output.");
      }
      return output;

    } catch (e) {
        console.error("Error in tailorCvFlow with dynamic API key:", e);
        if (e instanceof Error && (e.message.toLowerCase().includes("api key not valid") || e.message.toLowerCase().includes("permission_denied") || e.message.toLowerCase().includes("api_key_invalid") || e.message.toLowerCase().includes("api key is invalid") || e.message.toLowerCase().includes("invalid api key"))) {
            throw new Error("Invalid API Key provided. Please check your API key and try again.");
        }
        throw new Error(`Failed to process CV tailoring: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
);


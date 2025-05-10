
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv'; // Import dotenv

config(); // Call config() to load .env variables into process.env
          // If GEMINI_API_KEY or GOOGLE_API_KEY is set here, googleAI() will pick it up
          // as a fallback if a flow doesn't provide one or uses the global instance directly.
          // For the user-provided key scenario, ensure these are not set in .env if the UI key is to be exclusive.

export const ai = genkit({
  plugins: [
    googleAI() // Initialize googleAI plugin. It will try to use environment variables
               // (GEMINI_API_KEY, GOOGLE_API_KEY) if no API key is passed here.
               // Since our flows (tailorCv, suggestKeywords) now create their own
               // GoogleAI instances with user-provided keys, this global instance's key
               // (or lack thereof if no env var) won't be used by them.
  ],
  model: 'googleai/gemini-2.0-flash', // Default model identifier for the global `ai` instance.
});


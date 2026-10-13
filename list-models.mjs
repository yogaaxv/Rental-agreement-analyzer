/**
 * Lists available Gemini models for your API key.
 * Usage: GEMINI_API_KEY=your_key node list-models.mjs
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read key from backend/.env
const envPath = resolve('./backend/.env');
let apiKey = '';
try {
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
} catch {
  apiKey = process.env.GEMINI_API_KEY || '';
}

if (!apiKey) {
  console.error('No GEMINI_API_KEY found in backend/.env');
  process.exit(1);
}

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
);
const data = await response.json();

if (data.models) {
  console.log('Available models that support generateContent:');
  data.models
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .forEach(m => console.log(' -', m.name));
} else {
  console.log('Response:', JSON.stringify(data, null, 2));
}

import { json, error } from '@sveltejs/kit';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import { cocktails, ingredientMapping } from '$lib/data/cocktails.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({
	apiKey: env.OPENAI_API_KEY
}) : null;

/**
 * Parse voice request and identify if it's a predefined cocktail or custom ingredients
 * @param {string} transcript - Text from Whisper transcription
 * @returns {Promise<{type: 'predefined'|'custom'|'none', cocktailId?: string, ingredients?: string[]}>}
 */
async function parseVoiceRequestWithGPT(transcript) {
	try {
		// Generate cocktail list dynamically
		const cocktailList = cocktails.map(c => `- ${c.id} (${c.name})`).join('\n');

		// Generate ingredient list dynamically
		const ingredientList = Object.keys(ingredientMapping).map(id => `- ${id}`).join('\n');

		const systemPrompt = `You are a bartender prompt-interpreter AI. Your job is to analyze the customer's message and determine what drink they want.

AVAILABLE PREDEFINED COCKTAILS:
${cocktailList}

AVAILABLE INGREDIENTS FOR CUSTOM DRINKS (canonical IDs):
${ingredientList}

RULES:

1. PREDEFINED COCKTAIL
   If the customer mentions any predefined cocktail (even inside a longer sentence), return:
   {"type": "predefined", "cocktailId": "<id>"}

2. PREDEFINED + EXTRA INGREDIENTS
   If the customer mentions a predefined cocktail and also mentions additional ingredients, ALWAYS ignore the extras.
   Always return ONLY the predefined cocktail.

3. CUSTOM COCKTAIL
   Triggered when:
   - The customer explicitly wants a "coctel", "cocktail", "trago", "drink", "mezcla", "mi propio coctel", etc.
   AND
   - They do NOT mention a predefined cocktail.

   For custom drinks:
   - Extract ONLY ingredients from the AVAILABLE INGREDIENTS list.
   - Ignore any ingredient not in the available list.
   - Return: {"type": "custom", "ingredients": ["…", "…"]}

4. UNCLEAR / NO MATCH
   If you cannot clearly identify a predefined cocktail or at least one valid ingredient for a custom cocktail, return:
   {"type": "none"}

STRICT OUTPUT RULE:
Return ONLY a JSON object.
No text, no markdown, no comments, no explanations.

EXAMPLES:
- "quiero un mojito" → {"type": "predefined", "cocktailId": "mojito"}
- "mojito con whiskey extra" → {"type": "predefined", "cocktailId": "mojito"}
- "hazme un coctel con menta, hielo y ron blanco" → {"type": "custom", "ingredients": ["mint", "ice", "white-rum"]}
- "dame un trago con whiskey y coca cola" → {"type": "custom", "ingredients": ["whiskey", "coke"]}
- "quiero inventar un coctel con hielo, lima y soda" → {"type": "custom", "ingredients": ["ice", "lime", "soda"]}
- "hazme un coctel con vodka y naranja" → {"type": "custom", "ingredients": []}
- "no se que pedir" → {"type": "none"}
`;

		const completion = await openai.chat.completions.create({
			model: 'gpt-4.1-nano',
			messages: [
				{
					role: 'system',
					content: systemPrompt
				},
				{
					role: 'user',
					content: transcript
				}
			],
			temperature: 0,
			max_tokens: 100,
			response_format: { type: "json_object" }
		});

		const responseText = completion.choices[0].message.content.trim();
		const parsed = JSON.parse(responseText);
		console.log(parsed)
		return parsed;

	} catch (err) {
		console.error('GPT voice parsing error:', err);
		return { type: 'none' };
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const audioFile = formData.get('audio');

		if (!audioFile || !(audioFile instanceof File)) {
			throw error(400, 'No audio file provided');
		}

		// Verify API key is configured
		if (!env.OPENAI_API_KEY || !openai) {
			throw error(500, 'OpenAI API key not configured');
		}

		// Convert File to format compatible with OpenAI
		const audioBuffer = await audioFile.arrayBuffer();
		const audioBlob = new Blob([audioBuffer], { type: audioFile.type });

		// Create a File object with proper name
		const file = new File([audioBlob], 'audio.webm', { type: audioFile.type });

		// Generate Whisper prompt dynamically from cocktail names
		const cocktailNames = cocktails.map(c => c.name).join(', ');
		const whisperPrompt = `Cocktail order. Drinks: ${cocktailNames}.`;

		// Transcribe audio using Whisper (auto-detect language)
		const transcription = await openai.audio.transcriptions.create({
			file: file,
			model: 'whisper-1',
			prompt: whisperPrompt
		});

		const transcript = transcription.text;

		// Use GPT to parse the voice request
		const voiceRequest = await parseVoiceRequestWithGPT(transcript);

		// Handle predefined cocktail
		if (voiceRequest.type === 'predefined') {
			const cocktail = cocktails.find(c => c.id === voiceRequest.cocktailId);

			if (!cocktail) {
				return json({
					success: false,
					type: 'none',
					transcript,
					message: 'Cocktail not found in menu'
				});
			}

			return json({
				success: true,
				type: 'predefined',
				transcript,
				cocktail: {
					id: cocktail.id,
					name: cocktail.name
				}
			});
		}

		// Handle custom cocktail
		if (voiceRequest.type === 'custom') {
			const ingredients = voiceRequest.ingredients || [];

			if (ingredients.length === 0) {
				return json({
					success: false,
					type: 'none',
					transcript,
					message: 'No valid ingredients detected. Please try again.'
				});
			}

			return json({
				success: true,
				type: 'custom',
				transcript,
				ingredients
			});
		}

		// Handle none/unclear
		return json({
			success: false,
			type: 'none',
			transcript,
			message: 'Could not understand your request. Please try again.',
			availableCocktails: cocktails.map(c => c.name)
		});

	} catch (err) {
		console.error('Voice recognition error:', err);

		if (err.status === 400 || err.status === 500) {
			throw err;
		}

		throw error(500, {
			message: 'Error processing voice command',
			details: err.message
		});
	}
}

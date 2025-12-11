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

		// Generate ingredient list with descriptive labels for better GPT understanding
		const ingredientList = Object.keys(ingredientMapping)
			.map(key => `- ${key} (${ingredientMapping[key].label})`)
			.join('\n');

		const systemPrompt = `You are a bartender prompt-interpreter AI. Your job is to analyze the customer's message and determine what drink they want.

AVAILABLE PREDEFINED COCKTAILS:
${cocktailList}

AVAILABLE INGREDIENTS:
${ingredientList}

CRITICAL RULES (READ CAREFULLY):

1. PREDEFINED COCKTAIL - ONLY if explicitly named
   Return predefined ONLY if the customer explicitly mentions the EXACT NAME of a predefined cocktail:
   - "I want a mojito" ✓
   - "give me a cuba libre" ✓
   - "make me a whiskey sour" ✓

   Return: {"type": "predefined", "cocktailId": "<id>"}

2. CUSTOM COCKTAIL - When ingredients are mentioned
   Return custom if the customer mentions ingredients WITHOUT explicitly naming a predefined cocktail:
   - "rum and coke" → {"type": "custom", "ingredients": ["white-rum", "coke"]}
   - "whiskey with ice" → {"type": "custom", "ingredients": ["whiskey", "ice"]}
   - "give me white rum and soda" → {"type": "custom", "ingredients": ["white-rum", "soda"]}
   - "I want a drink with whiskey and coca cola" → {"type": "custom", "ingredients": ["whiskey", "coke"]}

   IMPORTANT: Even if the ingredients match a predefined cocktail (like cuba-libre),
   if the customer did NOT explicitly say the cocktail name, return CUSTOM.

3. IGNORE TRIGGER WORDS
   These words alone don't mean custom, they're just natural language:
   - "cocktail", "drink", "beverage", "mix"

   What matters is whether they mention:
   - COCKTAIL NAME → predefined
   - INGREDIENTS → custom

4. UNCLEAR / NO MATCH
   If you cannot identify a predefined cocktail name OR valid ingredients, return:
   {"type": "none"}

STRICT OUTPUT RULE:
Return ONLY a JSON object.
No text, no markdown, no comments, no explanations.

EXAMPLES:
- "I want a mojito" → {"type": "predefined", "cocktailId": "mojito"}
- "give me a cuba libre" → {"type": "predefined", "cocktailId": "cuba-libre"}
- "rum and coke" → {"type": "custom", "ingredients": ["white-rum", "coke"]}
- "white rum and coke" → {"type": "custom", "ingredients": ["white-rum", "coke"]}
- "whiskey with ice" → {"type": "custom", "ingredients": ["whiskey", "ice"]}
- "give me a drink with whiskey and coke" → {"type": "custom", "ingredients": ["whiskey", "coke"]}
- "I want a cocktail with mint, ice and white rum" → {"type": "custom", "ingredients": ["mint", "ice", "white-rum"]}
- "make me a cocktail with lime and soda" → {"type": "custom", "ingredients": ["lime", "soda"]}
- "cognac with ice" → {"type": "custom", "ingredients": ["cognac", "ice"]}
- "mojito with extra whiskey" → {"type": "predefined", "cocktailId": "mojito"}
- "I want vodka with orange" → {"type": "custom", "ingredients": []}
- "I don't know what to order" → {"type": "none"}
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

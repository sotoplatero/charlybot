import { json, error } from '@sveltejs/kit';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import { cocktails } from '$lib/data/cocktails.js';

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
		const systemPrompt = `You are a bartender assistant AI. Analyze customer speech and identify their request.

AVAILABLE PREDEFINED COCKTAILS:
- mojito (Mojito)
- cuba-libre (Cuba Libre)
- cubata (Cubata)
- whiskey-rocks (Whiskey on the Rocks)
- neat-whiskey (Neat Whiskey)
- whiskey-highball (Whiskey Highball)
- whiskey-coke (Whiskey and Coke)

AVAILABLE INGREDIENTS FOR CUSTOM DRINKS:
- mint (menta, hierbabuena, mint leaves)
- ice (hielo, ice cubes)
- syrup (jarabe, sirope, sugar syrup)
- lime (lima, limón, lime juice)
- white-rum (ron blanco, white rum, light rum, rum)
- dark-rum (ron negro, dark rum, black rum)
- whiskey (whisky, bourbon)
- soda (soda water, club soda, sparkling water)
- coke (coca cola, cola, coke)

DETECTION RULES:
1. PREDEFINED COCKTAIL: If customer mentions a cocktail from the menu
   - Return: {"type": "predefined", "cocktailId": "mojito"}

2. PREDEFINED + EXTRAS: If customer mentions a known cocktail + extra ingredients
   - ALWAYS return the predefined cocktail, IGNORE extras
   - Example: "mojito with whiskey" → {"type": "predefined", "cocktailId": "mojito"}

3. CUSTOM COCKTAIL: If customer wants to create their own drink
   - Phrases indicating custom: "nuevo coctel", "mi propio coctel", "quiero hacer", "custom drink", "personalizado", "con [ingredients]"
   - Extract ALL mentioned ingredients
   - Return: {"type": "custom", "ingredients": ["mint", "ice", "white-rum"]}
   - ONLY include ingredients from the available list above
   - Map aliases to canonical IDs (e.g., "ron blanco" → "white-rum")

4. UNCLEAR/NONE: If no clear request
   - Return: {"type": "none"}

RESPONSE FORMAT:
Return ONLY a valid JSON object, nothing else. No markdown, no explanation.

Examples:
- "quiero un mojito" → {"type": "predefined", "cocktailId": "mojito"}
- "mojito with extra whiskey" → {"type": "predefined", "cocktailId": "mojito"}
- "nuevo coctel con menta, hielo y ron blanco" → {"type": "custom", "ingredients": ["mint", "ice", "white-rum"]}
- "dame un coctel con whiskey y coca cola" → {"type": "custom", "ingredients": ["whiskey", "coke"]}
- "quiero hacer mi propio coctel con hielo, lima y soda" → {"type": "custom", "ingredients": ["ice", "lime", "soda"]}`;

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

		// Transcribe audio using Whisper (auto-detect language)
		const transcription = await openai.audio.transcriptions.create({
			file: file,
			model: 'whisper-1',
			prompt: 'Cocktail order. Drinks: mojito, cuba libre, cubata, whiskey on the rocks, neat whiskey, whiskey highball, whiskey and coke.'
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

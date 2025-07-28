// netlify/functions/gemini-proxy.js

// Importez la bibliothèque GoogleGenerativeAI
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async function(event, context) {
    // Assurez-vous que seule la méthode POST est autorisée
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Parse le corps de la requête pour obtenir les données envoyées par le client.
        // Le client envoie un objet avec une propriété 'contents'.
        const { contents } = JSON.parse(event.body);

        // Vérifiez que 'contents' est bien un tableau et n'est pas vide
        if (!contents || !Array.isArray(contents) || contents.length === 0) {
            console.error('Invalid or empty "contents" array received in Netlify function.');
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ error: 'Invalid request payload: "contents" array is missing or empty.' })
            };
        }

        // Récupérez la clé API depuis les variables d'environnement de Netlify
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            console.error('GEMINI_API_KEY environment variable is not set.');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API Key not configured in Netlify environment variables.' })
            };
        }

        // Initialisez l'API Gemini avec la clé sécurisée
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Appelez l'API Gemini en passant directement le tableau 'contents'
        const result = await model.generateContent({ contents: contents }); // Passez l'objet { contents: ... }
        const response = await result.response;
        const text = response.text();

        // Renvoyez la réponse de l'IA au client
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ explanation: text }) // La clé 'explanation' est attendue par votre script.js
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate content', details: error.message })
        };
    }
};

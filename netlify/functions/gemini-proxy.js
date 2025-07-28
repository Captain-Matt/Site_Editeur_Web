    // netlify/functions/gemini-proxy.js

    // Importez la bibliothèque GoogleGenerativeAI
    // Note: Vous devrez installer cette dépendance plus tard
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
            // Parse le corps de la requête pour obtenir le prompt
            const { prompt } = JSON.parse(event.body);

            // Récupérez la clé API depuis les variables d'environnement de Netlify
            // C'est CRUCIAL pour la sécurité : la clé n'est JAMAIS exposée côté client.
            const API_KEY = process.env.GEMINI_API_KEY;

            if (!API_KEY) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'API Key not configured in Netlify environment variables.' })
                };
            }

            // Initialisez l'API Gemini avec la clé sécurisée
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            // Appelez l'API Gemini
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Renvoyez la réponse de l'IA au client
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ explanation: text })
            };

        } catch (error) {
            console.error('Error in Netlify function:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to generate content', details: error.message })
            };
        }
    };
    
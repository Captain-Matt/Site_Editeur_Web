// Récupération des éléments du DOM
const htmlEditorDiv = document.getElementById('htmlCodeEditor');
const cssEditorDiv = document.getElementById('cssCodeEditor');
const jsEditorDiv = document.getElementById('jsCodeEditor');
const previewFrame = document.getElementById('previewFrame');
const imageUpload = document.getElementById('imageUpload');
const fileNameDisplay = document.getElementById('fileNameDisplay');

// Récupération des icônes de copie
const copyHtmlBtn = document.getElementById('copyHtml');
const copyCssBtn = document.getElementById('copyCss');
const copyJsBtn = document.getElementById('copyJs');

// Récupération des icônes de recherche
const searchHtmlBtn = document.getElementById('searchHtml');
const searchCssBtn = document.getElementById('searchCss');
const searchJsBtn = document.getElementById('searchJs');

// Nouveaux boutons pour expliquer le code
const explainHtmlBtn = document.getElementById('explainHtmlBtn');
const explainCssBtn = document.getElementById('explainCssBtn');
const explainJsBtn = document.getElementById('explainJsBtn');

// Récupération des boutons de vue
const desktopViewBtn = document.getElementById('desktopViewBtn');
const mobileViewBtn = document.getElementById('mobileViewBtn');

// Récupération du nouveau conteneur du cadre de l'appareil
const previewDeviceFrame = document.getElementById('previewDeviceFrame');

// Nouveaux éléments pour le panneau d'explication IA
const explanationPanel = document.getElementById('explanationPanel');
const explanationContent = document.getElementById('explanationContent');
const closeExplanationBtn = document.getElementById('closeExplanationBtn');
const openExplanationPanelBtn = document.getElementById('openExplanationPanelBtn');
const explanationBackdrop = document.getElementById('explanationBackdrop'); // Correction ici

// Éléments pour l'aide à la génération IA
const aiGenerationPrompt = document.getElementById('aiGenerationPrompt');
const generateCodeBtn = document.getElementById('generateCodeBtn');


// Stockage des images chargées localement (Data URLs)
const loadedImagesData = {}; // Clé: nom du fichier, Valeur: Data URL (Base64)


let currentlyHighlightedElement = null; // Pour suivre l'élément actuellement en surbrillance dans la prévisualisation

// Initialisation des éditeurs CodeMirror
const htmlCode = CodeMirror(htmlEditorDiv, {
    mode: 'htmlmixed',
    lineNumbers: true,
    lineWrapping: true, // Très important pour les longues lignes comme les Data URLs
    autofocus: true,
    value: `<!--
    ATTENTION : N'incluez PAS les balises <!DOCTYPE html>, <html>, <head>, ou <body> ici.
    Ce code sera inséré directement DANS le <body> de la prévisualisation.
-->
<h1>Bonjour le monde !</h1>
<p>Ceci est un paragraphe.</p>
<button id="myButton">Cliquez-moi</button>

<!--
    Pour inclure des images locales, utilisez le bouton "Charger une image locale" ci-dessous.
    Le fichier sera converti en "Data URL" (Base64) et inséré ici.
    Dans l'éditeur, une balise image de remplacement sera insérée pour éviter les très longues lignes.
    La prévisualisation affichera l'image réelle.
-->

<div id="messageBox" style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 5px; display: none;"></div>

<p>Double-cliquez sur n'importe quel élément dans cette prévisualisation pour le mettre en surbrillance ici et dans l'éditeur HTML !</p>
<p>Note: La surbrillance directe du code CSS et JavaScript n'est pas possible dans cet éditeur simple.</p>`,
    theme: 'default' // Nous styliserons le thème via CSS
});

const cssCode = CodeMirror(cssEditorDiv, {
    mode: 'css',
    lineNumbers: true,
    lineWrapping: true,
    value: `body {
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    background-color: #e0f2f7;
    color: #333;
}
h1 {
    color: #2a64ad;
}
button {
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 20px;
}
button:hover {
    background-color: #45a049;
}
#messageBox {
    background-color: #d4edda; /* Vert clair pour succès/info */
    color: #155724; /* Texte vert foncé */
    border: 1px solid #c3e6cb;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
    font-weight: bold;
}`,
    theme: 'default'
});

const jsCode = CodeMirror(jsEditorDiv, {
    mode: 'javascript',
    lineNumbers: true,
    lineWrapping: true,
    value: `document.getElementById('myButton').addEventListener('click', () => {
    // Accéder au messageBox du parent pour afficher le message sur la page principale
    const messageBox = parent.document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = 'Bouton cliqué !';
        messageBox.style.display = 'block';
        messageBox.style.backgroundColor = '#cfe2ff'; // Info blue
        messageBox.style.color = '#052c65';
        messageBox.style.borderColor = '#b6d4fe';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 3000); // Masque le message après 3 secondes
    }
});`,
    theme: 'default'
});


// Fonction pour afficher des messages temporaires
function showMessageBox(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.style.display = 'block';
        // Réinitialise les styles de couleur
        messageBox.style.backgroundColor = '';
        messageBox.style.color = '';
        messageBox.style.borderColor = '';

        if (type === 'success') {
            messageBox.style.backgroundColor = '#d4edda';
            messageBox.style.color = '#155724';
            messageBox.style.borderColor = '#c3e6cb';
        } else if (type === 'error') {
            messageBox.style.backgroundColor = '#f8d7da';
            messageBox.style.color = '#721c24';
            messageBox.style.borderColor = '#f5c6cb';
        } else if (type === 'loading') { // Nouveau type pour les messages de chargement
            messageBox.style.backgroundColor = '#fff3cd'; // Jaune clair
            messageBox.style.color = '#856404'; // Texte jaune foncé
            messageBox.style.borderColor = '#ffeeba';
        }
        else { // info
            messageBox.style.backgroundColor = '#cfe2ff';
            messageBox.style.color = '#052c65';
            messageBox.style.borderColor = '#b6d4fe';
        }

        // Pour les messages de chargement, ne pas masquer automatiquement
        if (type !== 'loading') {
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 3000); // Masque le message après 3 secondes
        }
    }
}

// Fonction pour insérer du texte à la position du curseur dans un éditeur CodeMirror
function insertAtCursor(editor, text) {
    const doc = editor.getDoc();
    const cursor = doc.getCursor();
    doc.replaceRange(text, cursor);
}

// Fonction pour sélectionner et faire défiler vers le texte dans l'éditeur HTML (CodeMirror)
function highlightHtmlCode(elementOuterHTML) {
    const htmlContent = htmlCode.getValue();
    // Normaliser l'espace blanc pour une meilleure correspondance
    const normalizedElementHTML = elementOuterHTML.replace(/>\s+</g, '><').trim();
    const normalizedHtmlContent = htmlContent.replace(/>\s+</g, '><').trim();

    let startIndex = normalizedHtmlContent.indexOf(normalizedElementHTML);

    // Si l'élément exact n'est pas trouvé, essayez de trouver l'ouverture de la balise
    if (startIndex === -1) {
        const tagName = elementOuterHTML.match(/^<([a-zA-Z0-9]+)/);
        if (tagName && tagName[1]) {
            const searchTag = `<${tagName[1]}`;
            startIndex = normalizedHtmlContent.indexOf(searchTag);
        }
    }

    if (startIndex !== -1) {
        // Trouver la position réelle dans le texte original (non normalisé)
        let realStartIndex = 0;
        let tempNormalizedIndex = 0;
        const rawHtmlContent = htmlCode.getValue(); // Utiliser le contenu brut
        for (let i = 0; i < rawHtmlContent.length; i++) {
            if (tempNormalizedIndex === startIndex) {
                realStartIndex = i;
                break;
            }
            const char = rawHtmlContent[i];
            if (char !== '\n' && char !== '\r' && char !== '\t' && char !== ' ') {
                tempNormalizedIndex++;
            } else if (char === '>' && i + 1 < rawHtmlContent.length && rawHtmlContent[i+1] === '<') {
                // Skip whitespace between tags
            } else {
                tempNormalizedIndex++;
            }
        }

        let realEndIndex = realStartIndex;
        let tempNormalizedEndIndex = startIndex;
        const targetLength = normalizedElementHTML.length;
        for (let i = realStartIndex; i < rawHtmlContent.length; i++) {
            if (tempNormalizedEndIndex >= startIndex + targetLength) {
                realEndIndex = i;
                break;
            }
            const char = rawHtmlContent[i];
            if (char !== '\n' && char !== '\r' && char !== '\t' && char !== ' ') {
                tempNormalizedEndIndex++;
            } else if (char === '>' && i + 1 < rawHtmlContent.length && rawHtmlContent[i+1] === '<') {
                // Skip whitespace between tags
            } else {
                tempNormalizedIndex++;
            }
            realEndIndex = i + 1;
        }

        const startPos = htmlCode.posFromIndex(realStartIndex);
        const endPos = htmlCode.posFromIndex(realEndIndex);

        htmlCode.setSelection(startPos, endPos);
        htmlCode.scrollIntoView({ from: startPos, to: endPos }, 20); // Scroll into view with a bit of padding

        showMessageBox('Élément HTML mis en surbrillance dans l\'éditeur !', 'info');
    } else {
        showMessageBox('Impossible de trouver l\'élément HTML correspondant dans l\'éditeur.', 'error');
    }
}


// Fonction pour copier le texte d'un éditeur CodeMirror dans le presse-papiers
function copyToClipboard(editor, type) {
    const textToCopy = editor.getValue();
    if (textToCopy) {
        // Utilisation de l'API Clipboard (plus moderne)
        navigator.clipboard.writeText(textToCopy).then(() => {
            showMessageBox(`${type} copié dans le presse-papiers !`, 'success');
        }).catch(err => {
            // Fallback pour les environnements où navigator.clipboard n'est pas disponible (ex: certains iframes)
            const textareaTemp = document.createElement('textarea');
            textareaTemp.value = textToCopy;
            document.body.appendChild(textareaTemp);
            textareaTemp.select();
            try {
                document.execCommand('copy');
                showMessageBox(`${type} copié dans le presse-papiers (fallback) !`, 'success');
            } catch (fallbackErr) {
                showMessageBox(`Erreur lors de la copie du ${type}.`, 'error');
                console.error('Failed to copy (fallback): ', fallbackErr);
            }
            document.body.removeChild(textareaTemp);
        });
    } else {
        showMessageBox(`L'éditeur ${type} est vide, rien à copier.`, 'info');
    }
}

// Fonction pour mettre à jour la prévisualisation
function updatePreview() {
    let htmlContent = htmlCode.getValue(); // Récupère le contenu de l'éditeur HTML
    const cssContent = cssCode.getValue();
    const jsContent = jsCode.getValue();

    // Serialize loadedImagesData to a JSON string to pass to the iframe
    const imagesDataJson = JSON.stringify(loadedImagesData);

    // Création du contenu HTML complet pour l'iframe
    const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${cssContent}</style>
        </head>
        <body>
            ${htmlContent}
            <script>
                // CORRECTION ICI : Utilisation de 'var' pour permettre la re-déclaration
                var iframeLoadedImagesData = ${imagesDataJson}; // Inject the data

                document.addEventListener('DOMContentLoaded', () => {
                    const imgElements = document.querySelectorAll('img[data-local-image-name]');
                    imgElements.forEach(img => {
                        const fileName = img.getAttribute('data-local-image-name');
                        if (iframeLoadedImagesData[fileName]) {
                            img.src = iframeLoadedImagesData[fileName];
                        }
                    });
                });
            <\/script>
            <script>${jsContent}<\/script>
        </body>
        </html>
    `;
    // Écriture du contenu dans l'iframe
    previewFrame.contentDocument.open();
    previewFrame.contentDocument.write(content);
    previewFrame.contentDocument.close();

    // Ajoute un effet de flash à l'iframe de prévisualisation
    previewFrame.classList.add('highlight-flash');
    setTimeout(() => {
        previewFrame.classList.remove('highlight-flash');
    }, 200); // Le flash dure 200ms

    // Supprime les anciens écouteurs d'événements de clic/double-clic si existants
    if (previewFrame.contentDocument.body) {
        previewFrame.contentDocument.body.onclick = null; // S'assurer que le simple clic est libre
        previewFrame.contentDocument.body.ondblclick = null;

        // Réinitialise l'élément en surbrillance dans la prévisualisation
        if (currentlyHighlightedElement) {
            currentlyHighlightedElement.classList.remove('highlighted-element');
            currentlyHighlightedElement = null;
        }

        // Ajoute l'écouteur d'événements de DOUBLE-CLIC pour la surbrillance des éléments et le lien vers le code
        previewFrame.contentDocument.body.ondblclick = (event) => {
            const clickedElement = event.target;

            // Gère la surbrillance dans la prévisualisation
            if (currentlyHighlightedElement && currentlyHighlightedElement !== clickedElement) {
                currentlyHighlightedElement.classList.remove('highlighted-element');
            }
            clickedElement.classList.toggle('highlighted-element');
            currentlyHighlightedElement = clickedElement.classList.contains('highlighted-element') ? clickedElement : null;

            // Tente de mettre en surbrillance le code HTML correspondant
            if (currentlyHighlightedElement) {
                // Pour les images chargées localement, on ne peut pas surligner la Data URL,
                // donc on surligne la balise placeholder.
                const originalOuterHTML = clickedElement.outerHTML;
                const dataLocalImageName = clickedElement.getAttribute('data-local-image-name');

                if (dataLocalImageName) {
                    // Si c'est une image locale, on recherche sa balise placeholder dans l'éditeur
                    const placeholderTag = `<img src="https://placehold.co/150x100/cccccc/000000?text=Image+Locale" data-local-image-name="${dataLocalImageName}" alt="Image locale chargée">`;
                    highlightHtmlCode(placeholderTag); // Surligne le placeholder
                } else {
                    highlightHtmlCode(originalOuterHTML);
                }

            } else {
                // Si l'élément est désélectionné, retire la sélection de l'éditeur HTML
                htmlCode.setSelection({line: 0, ch: 0}, {line: 0, ch: 0}); // Désélectionne le texte
            }
        };
    }
}

// Fonction pour changer la vue de la prévisualisation
function setPreviewView(viewType) {
    // Supprime toutes les classes de vue existantes du cadre de l'appareil
    previewDeviceFrame.classList.remove('desktop-frame', 'mobile-frame');
    desktopViewBtn.classList.remove('active');
    mobileViewBtn.classList.remove('active');

    // Applique la nouvelle classe de vue au cadre de l'appareil
    if (viewType === 'desktop') {
        previewDeviceFrame.classList.add('desktop-frame');
        desktopViewBtn.classList.add('active');
    } else if (viewType === 'mobile') {
        previewDeviceFrame.classList.add('mobile-frame');
        mobileViewBtn.classList.add('active');
    }
    // Re-render the preview to ensure it adapts to the new frame size
    updatePreview();
}

/**
 * Explique le code donné en utilisant l'API Gemini.
 * @param {CodeMirror.Editor} editor L'instance CodeMirror de l'éditeur.
 * @param {string} language Le nom du langage (ex: 'HTML', 'CSS', 'JavaScript').
 */
async function explainCode(editor, language) {
    const codeContent = editor.getValue();
    if (!codeContent.trim()) {
        showMessageBox(`L'éditeur ${language} est vide, rien à expliquer.`, 'info');
        return;
    }

    // Ouvre le panneau d'explication
    explanationPanel.classList.add('active');
    explanationBackdrop.classList.add('active');
    openExplanationPanelBtn.classList.add('hidden'); // Cache le bouton d'ouverture

    // Affiche un message de chargement temporaire dans le panneau d'explication
    appendExplanation('<p class="text-center text-gray-500">Explication du code en cours...</p>', 'loading');
    showMessageBox(`Explication du code ${language} en cours...`, 'loading');
    console.log(`Attempting to explain ${language} code.`); // Debugging log

    // Modifie le prompt pour demander une explication formatée en Markdown
    const prompt = `Expliquez le code ${language} suivant de manière concise et facile à comprendre. Concentrez-vous sur sa fonctionnalité et son but. Utilisez un langage simple et évitez le jargon technique excessif. Formatez votre explication en utilisant le Markdown pour améliorer la lisibilité (paragraphes, listes, gras, etc.). :\n\n\`\`\`${language.toLowerCase()}\n${codeContent}\n\`\`\``;
    console.log("Generated prompt:", prompt); // Debugging log

    try {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });

        const payload = { contents: chatHistory };

        // NOUVEL APPEL SÉCURISÉ À LA FONCTION NETLIFY
        const apiUrl = '/.netlify/functions/gemini-proxy'; // L'URL de votre fonction Netlify

        console.log("Sending request to API URL:", apiUrl); // Debugging log
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log("API Response status:", response.status, response.statusText); // Debugging log
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Response not OK:", errorText); // Log detailed error
            appendExplanation(`<p class="text-center text-red-500">Erreur: La requête à l'IA a échoué avec le statut ${response.status}.</p>`, 'error');
            showMessageBox(`Erreur: La requête à l'IA a échoué avec le statut ${response.status}.`, 'error');
            return;
        }

        const result = await response.json();
        console.log("API Result:", result); // Debugging log

        // La réponse de la fonction Netlify contient l'explication sous la clé 'explanation'
        if (result.explanation) {
            const explanation = result.explanation;
            
            // RENDU MARKDOWN ICI : Utilise marked.js pour convertir le Markdown en HTML
            appendExplanation(marked.parse(explanation), 'success');
            
            // Masque la messageBox de chargement après l'affichage de l'explication
            showMessageBox('', 'info'); // Efface le message et le masque
        } else {
            appendExplanation('<p class="text-center text-red-500">Erreur: Aucune explication générée. La structure de la réponse de l\'IA est inattendue.</p>', 'error');
            showMessageBox('Erreur: Aucune explication générée. La structure de la réponse de l\'IA est inattendue.', 'error');
            console.error('Unexpected API response structure:', result);
        }
    } catch (error) {
        appendExplanation('<p class="text-center text-red-500">Erreur lors de l\'explication du code. Veuillez réessayer.</p>', 'error');
        showMessageBox(`Erreur lors de l'explication du code ${language}. Veuillez réessayer.`, 'error');
        console.error('Error calling Gemini API:', error);
    }
}

/**
 * Génère du code basé sur un prompt utilisateur en utilisant l'API Gemini.
 */
async function generateCode() {
    const promptText = aiGenerationPrompt.value.trim();
    if (!promptText) {
        showMessageBox('Veuillez entrer une description pour générer du code.', 'info');
        return;
    }

    // Ouvre le panneau d'explication
    explanationPanel.classList.add('active');
    explanationBackdrop.classList.add('active');
    openExplanationPanelBtn.classList.add('hidden'); // Cache le bouton d'ouverture

    // Affiche un message de chargement
    appendExplanation('<p class="text-center text-gray-500">Génération du code en cours...</p>', 'loading');
    showMessageBox('Génération du code en cours...', 'loading');
    
    const generationPrompt = `Générez du code (HTML, CSS, JavaScript) basé sur la description suivante. Fournissez le code dans des blocs Markdown séparés pour chaque langage (par exemple, \`\`\`html...\`\`\`, \`\`\`css...\`\`\`, \`\`\`javascript...\`\`\`). Soyez concis et n'incluez que le code pertinent. :\n\n"${promptText}"`;
    console.log("Generated prompt for code generation:", generationPrompt);

    try {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: generationPrompt }] });

        const payload = { contents: chatHistory };
        // NOUVEL APPEL SÉCURISÉ À LA FONCTION NETLIFY
        const apiUrl = '/.netlify/functions/gemini-proxy'; // L'URL de votre fonction Netlify

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Response not OK for code generation:", errorText);
            appendExplanation(`<p class="text-center text-red-500">Erreur: La requête à l'IA a échoué avec le statut ${response.status} lors de la génération de code.</p>`, 'error');
            showMessageBox(`Erreur: La génération de code a échoué avec le statut ${response.status}.`, 'error');
            return;
        }

        const result = await response.json();
        console.log("API Result:", result);

        // La réponse de la fonction Netlify contient le code généré sous la clé 'explanation'
        if (result.explanation) {
            const generatedCodeMarkdown = result.explanation;
            appendExplanation(marked.parse(generatedCodeMarkdown), 'success');
            showMessageBox('Code généré avec succès !', 'success');
        } else {
            appendExplanation('<p class="text-center text-red-500">Erreur: Aucune génération de code. La structure de la réponse de l\'IA est inattendue.</p>', 'error');
            showMessageBox('Erreur: Aucune génération de code. La structure de la réponse de l\'IA est inattendue.', 'error');
        }
    } catch (error) {
        appendExplanation('<p class="text-center text-red-500">Erreur lors de la génération du code. Veuillez réessayer.</p>', 'error');
        showMessageBox('Erreur lors de la génération du code. Veuillez réessayer.', 'error');
        console.error('Error calling Gemini API for code generation:', error);
    }
}

/**
 * Ajoute du contenu à l'élément explanationContent, avec un horodatage et un type.
 * @param {string} contentHtml Le contenu HTML à ajouter.
 * @param {string} type Le type de message (info, success, error, loading).
 */
function appendExplanation(contentHtml, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    let headerClass = '';
    let headerText = '';

    switch (type) {
        case 'loading':
            headerClass = 'text-yellow-600';
            headerText = 'Chargement...';
            break;
        case 'error':
            headerClass = 'text-red-600';
            headerText = 'Erreur';
            break;
        case 'success':
            headerClass = 'text-green-600';
            headerText = 'Réponse IA';
            break;
        default:
            headerClass = 'text-gray-600';
            headerText = 'Info';
            break;
    }

    const newEntry = document.createElement('div');
    newEntry.className = 'mb-4 p-3 rounded-lg shadow-sm bg-gray-50'; // Style de base pour chaque entrée
    newEntry.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-semibold ${headerClass}">${headerText}</span>
            <span class="text-xs text-gray-500">${timestamp}</span>
        </div>
        <div>${contentHtml}</div>
    `;
    explanationContent.appendChild(newEntry);

    // Faites défiler vers le bas pour voir le nouveau contenu
    explanationContent.scrollTop = explanationContent.scrollHeight;
}


// Ajout des écouteurs d'événements 'change' de CodeMirror pour une mise à jour en temps réel
htmlCode.on('change', updatePreview);
cssCode.on('change', updatePreview);
jsCode.on('change', updatePreview);

// Ajout des écouteurs d'événements pour les icônes de copie
copyHtmlBtn.addEventListener('click', () => copyToClipboard(htmlCode, 'HTML'));
copyCssBtn.addEventListener('click', () => copyToClipboard(cssCode, 'CSS'));
copyJsBtn.addEventListener('click', () => copyToClipboard(jsCode, 'JavaScript'));

// Ajout des écouteurs d'événements pour les icônes de recherche
searchHtmlBtn.addEventListener('click', () => CodeMirror.commands.find(htmlCode));
searchCssBtn.addEventListener('click', () => CodeMirror.commands.find(cssCode));
searchJsBtn.addEventListener('click', () => CodeMirror.commands.find(jsCode));

// Ajout des écouteurs d'événements pour les nouveaux boutons d'explication
explainHtmlBtn.addEventListener('click', () => explainCode(htmlCode, 'HTML'));
explainCssBtn.addEventListener('click', () => explainCode(cssCode, 'CSS'));
explainJsBtn.addEventListener('click', () => explainCode(jsCode, 'JavaScript'));

// Ajout des écouteurs d'événements pour le bouton de fermeture du panneau d'explication
closeExplanationBtn.addEventListener('click', () => {
    explanationPanel.classList.remove('active');
    explanationBackdrop.classList.remove('active');
    openExplanationPanelBtn.classList.remove('hidden'); // Réaffiche le bouton d'ouverture
    explanationContent.innerHTML = '<p>Cliquez sur "Expliquer le code" dans les éditeurs pour obtenir une explication ici.</p><p>Utilisez le champ ci-dessous pour demander de l\'aide à l\'IA.</p>'; // Réinitialise le contenu
    aiGenerationPrompt.value = ''; // Efface le prompt de génération
});

// Ajout de l'écouteur d'événements pour le bouton d'ouverture du panneau
openExplanationPanelBtn.addEventListener('click', () => {
    explanationPanel.classList.add('active');
    explanationBackdrop.classList.add('active');
    openExplanationPanelBtn.classList.add('hidden'); // Cache le bouton d'ouverture
});

// Ajout de l'écouteur d'événements pour le backdrop (fermer le panneau en cliquant à l'extérieur)
explanationBackdrop.addEventListener('click', () => {
    explanationPanel.classList.remove('active');
    explanationBackdrop.classList.remove('active');
    openExplanationPanelBtn.classList.remove('hidden'); // Réaffiche le bouton d'ouverture
    explanationContent.innerHTML = '<p>Cliquez sur "Expliquer le code" dans les éditeurs pour obtenir une explication ici.</p><p>Utilisez le champ ci-dessous pour demander de l\'aide à l\'IA.</p>'; // Réinitialise le contenu
    aiGenerationPrompt.value = ''; // Efface le prompt de génération
});

// Ajout de l'écouteur d'événements pour le bouton de génération de code
generateCodeBtn.addEventListener('click', generateCode);


// Ajout des écouteurs d'événements pour les boutons de vue
desktopViewBtn.addEventListener('click', () => setPreviewView('desktop'));
mobileViewBtn.addEventListener('click', () => setPreviewView('mobile'));


// Écouteur d'événement pour le chargement d'image
imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        // Vérifier si c'est une image (vous pouvez étendre pour d'autres types)
        if (file.type.startsWith('image/')) {
            // Masquer le panneau d'explication lors du chargement d'une nouvelle image
            explanationPanel.classList.remove('active');
            explanationBackdrop.classList.remove('active');
            openExplanationPanelBtn.classList.remove('hidden'); // Réaffiche le bouton d'ouverture
            explanationContent.innerHTML = '<p>Cliquez sur "Expliquer le code" dans les éditeurs pour obtenir une explication ici.</p><p>Utilisez le champ ci-dessous pour demander de l\'aide à l\'IA.</p>'; // Réinitialise le contenu
            aiGenerationPrompt.value = ''; // Efface le prompt de génération

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataURL = e.target.result;
                loadedImagesData[file.name] = dataURL; // Stocke la Data URL

                // Insère une balise image placeholder dans l'éditeur HTML
                const imgTagPlaceholder = `<img src="https://placehold.co/150x100/cccccc/000000?text=Image+Locale" data-local-image-name="${file.name}" alt="Image locale chargée">`;
                insertAtCursor(htmlCode, imgTagPlaceholder);
                
                updatePreview(); // Met à jour la prévisualisation avec la vraie image
                showMessageBox('Image chargée et insérée dans le HTML (placeholder dans l\'éditeur) !', 'success');
            };
            reader.onerror = () => {
                showMessageBox('Erreur lors du chargement de l\'image.', 'error');
                fileNameDisplay.textContent = 'Erreur de chargement';
            };
            reader.readAsDataURL(file); // Lit le fichier comme une Data URL
        } else {
            showMessageBox('Veuillez sélectionner un fichier image (JPG, PNG, GIF).', 'error');
            fileNameDisplay.textContent = 'Type de fichier non supporté';
        }
    } else {
        fileNameDisplay.textContent = 'Aucun fichier sélectionné';
    }
});

// Appel initial pour afficher le contenu par défaut et définir la vue par défaut (PC)
updatePreview();
setPreviewView('desktop'); // Définit la vue PC par défaut au chargement

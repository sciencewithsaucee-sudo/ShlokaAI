// This is the new file: shloka_logic.js

// --- Translation Dictionary (v19.8.2) ---
// (This is kept here so the logic file is self-contained, though it's not strictly "logic")
const TRANSLATIONS = {
    // Hero
    heroTitle: { en: 'ShlokaAI', hi: '\u0936\u094D\u0932\u094B\u0915AI' },
    heroSubtitle: { en: 'The Smart Sanskrit Analysis Platform. Classify shlokas by concept, analyze texts, and build datasets for digital Ayurveda research.', hi: '\u0938\u094D\u092E\u093E\u0930\u094D\u091F \u0938\u0902\u0938\u094D\u0915\u0943\u0924 \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u092E\u0902\u091A\u0964 \u0905\u0935\u0927\u093E\u0930\u0923\u093E \u0915\u0947 \u0906\u0927\u093E\u0930 \u092A\u0930 \u0936\u094D\u0932\u094B\u0915\u094B\u0902 \u0915\u094B \u0935\u0930\u094D\u0917\u0940\u0915\u0943\u0924 \u0915\u0930\u0947\u0902, \u0917\u094D\u0930\u0902\u0925\u094B\u0902 \u0915\u093E \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0915\u0930\u0947\u0902 \u0914\u0930 \u0921\u093F\u091C\u093F\u091F\u0932 \u0906\u092F\u0941\u0930\u094D\u0935\u0947\u0926 \u0905\u0928\u0941\u0938\u0902\u0927\u093E\u0928 \u0915\u0947 \u0932\u093F\u090F \u0921\u0947\u091F\u093E\u0938\u0947\u091F \u092C\u0928\u093E\u090F\u0902\u0964' },
    startAnalysisBtn: { en: 'Get Started', hi: '\u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902' },
    langToggle: { en: '\u0939\u093F\u0928\u094D\u0926\u0940', hi: 'English' },
    // ... (rest of your TRANSLATIONS object) ...
    // Errors
    errorConceptName: { en: '* Please enter both a Concept Name and at least one Synonym.', hi: '* \u0915\u0943\u092A\u092F\u093E \u0905\u0935\u0927\u093E\u0930\u0923\u093E \u0915\u093E \u0928\u093E\u092E \u0914\u0930 \u0915\u092E \u0938\u0947 \u0915\u092E \u090F\u0915 \u0938\u092E\u093E\u0928\u093E\u0930\u094D\u0925\u0940 \u0936\u092C\u094D\u0926 \u0926\u0930\u094D\u091C \u0915\u0930\u0947\u0902\u0964' },
    errorSynonyms: { en: '* Please enter valid, comma-separated synonyms.', hi: '* \u0915\u0943\u092A\u092F\u093E \u0935\u0948\u0927, \u0905\u0932\u094D\u092A\u0935\u093F\u0930\u093E\u092E \u0938\u0947 \u0905\u0932\u0917 \u0938\u092E\u093E\u0928\u093E\u0930\u094D\u0925\u0940 \u0936\u092C\u094D\u0926 \u0926\u0930\u094D\u091C \u0915\u0930\u0947\u0902\u0964' },
    errorMapEmpty: { en: '* Concept map is empty. Add some concepts first.', hi: '* \u0905\u0935\u0927\u093E\u0930\u0923\u093E \u092E\u0948\u092A \u0916\u093E\u0932\u0940 \u0939\u0948\u0964 \u092A\u0939\u0932\u0947 \u0915\u0941\u091B \u0905\u0935\u0927\u093E\u0930\u0923\u093E\u090F\u0902 \u091C\u094B\u0921\u093C\u0947\u0902\u0964' },
    errorLoadMap: { en: 'Error loading map: Invalid JSON file.', hi: '\u092E\u0948\u092A \u0932\u094B\u0921 \u0915\u0930\u0928\u0947 \u092E\u0947\u0902 \u0924\u094D\u0930\u0941\u091F\u093F: \u0905\u092E\u093E\u0928\u094D\u092F JSON \u092B\u093C\u093E\u0907\u0932\u0964' },
    errorNoText: { en: '* Please paste text or upload a .txt file.', hi: '* \u0915\u0943\u092A\u092F\u093E \u091F\u0947\u0915\u094D\u0938\u094D\u091F \u092A\u0947\u0938\u094D\u091F \u0915\u0930\u0947\u0902 \u092F\u093E .txt \u092B\u093C\u093E\u0907\u0932 \u0905\u092A\u0932\u094B\u0921 \u0915\u0930\u0947\u0902\u0964' },
    errorNoShlokas: { en: '* No shlokas were found (missing dandas or line breaks).', hi: '* \u0915\u094B\u0908 \u0936\u094D\u0932\u094B\u0915 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E (\u0926\u0902\u0921 \u092F\u093E \u0932\u093E\u0907\u0928 \u092C\u094D\u0930\u0947\u0915 \u0917\u093E\u092F\u092C \u0939\u0948\u0902)\u0964' },
    errorCopy: { en: 'Copied!', hi: '\u0915\u0949\u092A\u0940 \u0915\u093F\u092F\u093E \u0917\u092F\u093E!' },
    errorCopyFail: { en: 'Failed!', hi: '\u0935\u093F\u092B\u0932!' }
};

// --- Concept Templates ---
const CONCEPT_TEMPLATES = {
    "doshas": {
        "Vata Dosha": ["वात", "वायु", "अनिल", "vata", "vayu", "anila"],
        "Pitta Dosha": ["पित्त", "अग्नि", "pitta", "agni", "tejas"],
        "Kapha Dosha": ["कफ", "श्लेष्म", "kapha", "shleshma"]
    },
    // ... (rest of your CONCEPT_TEMPLATES object) ...
    "chakras": {
        "Muladhara": ["मूलाधार", "muladhara"], "Svadhisthana": ["स्वाधिष्ठान", "svadhisthana"],
        "Manipura": ["मणिपूर", "manipura"], "Anahata": ["अनाहत", "anahata"],
        "Vishuddha": ["विशुद्ध", "vishuddha"], "Ajna": ["आज्ञा", "ajna"],
        "Sahasrara": ["सहस्रार", "sahasrara"]
    }
};

// --- HTML Entity Decoder Function ---
// This is pure logic, so it moves here.
function decodeHtmlEntities(str) {
    if (typeof str !== 'string') return str;
    // We can't use a DOM element in a pure logic file.
    // Use a string-based approach instead.
    if (typeof document === 'undefined') {
        // Fallback for non-browser environment (like tests)
        // This is a simple version, might need expansion if you use many entities
        return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    }
    // Browser environment
    let textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
}

// --- Sanskrit Normalization Function ---
// This is pure logic, so it moves here.
function normalizeSanskrit(text) {
    if (typeof text !== 'string') return '';
    return text
        .toLowerCase() // <-- FIX: Add toLowerCase() for case-insensitive matching
        .replace(/[ःं]/g, '') // Remove Visarga and Anusvara
        .replace(/[।॥]/g, ' ') // Replace dandas with space
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
}

/**
 * Runs the core analysis on the text.
 * This is a "pure" function: it takes inputs and returns an output
 * without modifying the global state or the DOM.
 * @param {string} rawTextInput - The raw text from the user.
 * @param {object} conceptMap - The concept map object.
 * @returns {object} An object containing the results of the analysis.
 */
function runAnalysis(rawTextInput, conceptMap) {
    
    // --- 1. Validate Inputs ---
    if (Object.keys(conceptMap).length === 0) {
        return { error: 'errorMapEmpty' };
    }
    if (!rawTextInput) {
        return { error: 'errorNoText' };
    }

    // --- 2. Split Shlokas ---
    const dandaRegex = /[\s\S]+?[।॥]/g;
    let shlokasRaw = rawTextInput.match(dandaRegex);

    if (!shlokasRaw || shlokasRaw.length === 0) {
        shlokasRaw = rawTextInput.split('\n').filter(line => line.trim().length > 0);
    }

    if (!shlokasRaw || shlokasRaw.length === 0) {
        return { error: 'errorNoShlokas' };
    }
    
    const shlokas = shlokasRaw.map(s => s.trim()).filter(Boolean);

    // --- 3. Initialize Results ---
    let localProcessedResults = [];
    let totalKeywordHits = 0;
    let matchedShlokaCount = 0;
    let overallConceptCounts = {};

    // --- 4. Pre-normalize the concept map ---
    const normalizedConceptMap = {};
    for (const [concept, keywords] of Object.entries(conceptMap)) {
        normalizedConceptMap[concept] = keywords.map(normalizeSanskrit).filter(Boolean);
    }

    // --- 5. Process Each Shloka ---
    let shlokaId = 1;
    for (let i = 0; i < shlokas.length; i++) {
        const cleanedShloka = shlokas[i];
        
        const shlokaBefore = shlokas[i - 1] || null;
        const shlokaAfter = shlokas[i + 1] || null;

        const normalizedShloka = normalizeSanskrit(cleanedShloka);
        let scores = {};
        let keywordsInThisShloka = [];
        let hasMatch = false;

        for (const [concept, normalizedKeywords] of Object.entries(normalizedConceptMap)) {
            scores[concept] = 0;
            normalizedKeywords.forEach(normKeyword => {
                if (normalizedShloka.includes(normKeyword)) {
                    scores[concept]++;
                    totalKeywordHits++;
                    hasMatch = true;
                    
                    const originalKeywords = conceptMap[concept];
                    const matchingOriginalKeyword = originalKeywords.find(ok => normalizeSanskrit(ok) === normKeyword);
                    if (matchingOriginalKeyword && !keywordsInThisShloka.includes(matchingOriginalKeyword)) {
                        keywordsInThisShloka.push(matchingOriginalKeyword);
                    }
                }
            });
        }

        if (hasMatch) {
            matchedShlokaCount++;
        }
        
        let topConcept = "N/A";
        let maxScore = 0;
        let scoreStrings = [];
        let topConceptsList = [];
        
        for(const [concept, score] of Object.entries(scores)) {
            if (score > 0) {
                scoreStrings.push(`${concept}: ${score}`);
                overallConceptCounts[concept] = (overallConceptCounts[concept] || 0) + score;
                
                if (score > maxScore) {
                    maxScore = score;
                    topConceptsList = [concept];
                } else if (score === maxScore && maxScore > 0) {
                    topConceptsList.push(concept);
                }
            }
        }
        if (topConceptsList.length > 0) {
            topConcept = topConceptsList.join(', ');
        }
        
        let highlightedShloka = cleanedShloka;
        if(keywordsInThisShloka.length > 0) {
            const escapedKeywords = keywordsInThisShloka.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
            const highlightRegex = new RegExp(`(${escapedKeywords.join('|')})`, 'g');
            highlightedShloka = cleanedShloka.replace(highlightRegex, (match) => `<mark>${match}</mark>`);
        }

        localProcessedResults.push({
            id: shlokaId,
            shloka: cleanedShloka,
            highlighted_shloka: highlightedShloka,
            top_concept: topConcept,
            all_scores: scoreStrings.join(', '),
            char_count: cleanedShloka.length,
            word_count: cleanedShloka.split(/\s+/).filter(Boolean).length,
            shloka_before: shlokaBefore,
            shloka_after: shlokaAfter
        });
        shlokaId++;
    }

    // --- 6. Return the final results object ---
    return {
        error: null,
        processedResults: localProcessedResults,
        totalShlokas: shlokas.length,
        matchedShlokaCount: matchedShlokaCount,
        totalKeywordHits: totalKeywordHits,
        overallConceptCounts: overallConceptCounts
    };
}

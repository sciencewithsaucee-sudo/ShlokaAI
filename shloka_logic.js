// This is shloka_logic.js

/**
 * Normalizes Sanskrit text for analysis.
 * Removes diacritics, dandas, and converts to lowercase.
 * @param {string} text - The raw Sanskrit string.
 * @returns {string} - The normalized string.
 */
function normalizeSanskrit(text) {
    if (typeof text !== 'string') return '';
    return text
        .toLowerCase()
        .replace(/[ःं]/g, '') // Remove Visarga and Anusvara
        .replace(/[।॥]/g, ' ') // Replace dandas with space
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
}

/**
 * Runs the core analysis on the raw text.
 * This is the "engine" of ShlokaAI, separated from the UI.
 * @param {string} rawTextInput - The full raw text from the user.
 * @param {Object} conceptMap - The user's { concept: [keywords] } map.
 * @returns {Object} - An object containing results or an error.
 */
function runShlokaAnalysis(rawTextInput, conceptMap) {
    
    // --- 1. Validate Inputs ---
    if (Object.keys(conceptMap).length === 0) {
        return { error: "errorMapEmpty", results: [] };
    }
    if (!rawTextInput) {
        return { error: "errorNoText", results: [] };
    }

    // --- 2. Split Text into Shlokas ---
    const dandaRegex = /[\s\S]+?[।॥]/g;
    let shlokasRaw = rawTextInput.match(dandaRegex);
    
    // Fallback to newline splitting if no dandas found
    if (!shlokasRaw || shlokasRaw.length === 0) {
        shlokasRaw = rawTextInput.split('\n').filter(line => line.trim().length > 0);
    }
    
    if (!shlokasRaw || shlokasRaw.length === 0) {
        return { error: "errorNoShlokas", results: [] };
    }
    
    const shlokas = shlokasRaw.map(s => s.trim()).filter(Boolean);

    // --- 3. Pre-normalize the Concept Map ---
    const normalizedConceptMap = {};
    for (const [concept, keywords] of Object.entries(conceptMap)) {
        normalizedConceptMap[concept] = keywords.map(normalizeSanskrit).filter(Boolean);
    }

    // --- 4. Process Each Shloka ---
    let processedResults = [];
    let totalKeywordHits = 0;
    let matchedShlokaCount = 0;
    let overallConceptCounts = {};
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

        processedResults.push({
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

    // --- 5. Return the Final Package ---
    return {
        error: null,
        results: processedResults,
        summary: {
            totalShlokas: shlokas.length,
            matchedShlokas: matchedShlokaCount,
            totalHits: totalKeywordHits,
            conceptCounts: overallConceptCounts
        }
    };
}

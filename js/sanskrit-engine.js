/**
 * ShlokaAI Sanskrit Analysis Engine (v2.0)
 * Tokenization, boundary-aware matching, compound segmentation, XSS-safe highlighting.
 */
(function (global) {
    'use strict';

    const IAST_MAP = {
        'ā': 'a', 'ī': 'i', 'ū': 'u', 'ṛ': 'r', 'ṝ': 'r', 'ḷ': 'l',
        'ē': 'e', 'ō': 'o', 'ṃ': '', 'ḥ': '', 'ṁ': '',
        'á': 'a', 'à': 'a', 'í': 'i', 'ì': 'i', 'ú': 'u', 'ù': 'u',
        'é': 'e', 'è': 'e', 'ó': 'o', 'ò': 'o',
        'ṅ': 'n', 'ñ': 'n', 'ṇ': 'n', 'ṭ': 't', 'ḍ': 'd', 'ṛ': 'r',
        'ś': 's', 'ṣ': 's', 'ṡ': 's', 'ḻ': 'l', 'ṟ': 'r',
        'Ā': 'a', 'Ī': 'i', 'Ū': 'u', 'Ṛ': 'r', 'Ḷ': 'l',
        'É': 'e', 'Ó': 'o', 'Ṭ': 't', 'Ḍ': 'd', 'Ṣ': 's', 'Ś': 's', 'Ṇ': 'n'
    };

    const TOKEN_SPLIT = /[\s।॥,.;:!?()\[\]{}"'«»—–\-]+/;

    function escapeRegex(str) {
        return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function foldIast(text) {
        return text.replace(/[\u0100-\u017F\u1E00-\u1EFF]/g, ch => IAST_MAP[ch] || ch);
    }

    function isDevanagariChar(ch) {
        const code = ch.codePointAt(0);
        return code >= 0x0900 && code <= 0x097F;
    }

    function isLatinLetter(ch) {
        return /[a-zA-Z]/.test(ch);
    }

    function graphemeLength(str) {
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            const seg = new Intl.Segmenter('und', { granularity: 'grapheme' });
            return [...seg.segment(str)].length;
        }
        return [...str].length;
    }

    function normalizeSanskrit(text) {
        if (typeof text !== 'string') return '';
        let t = foldIast(text.toLowerCase());
        t = t.replace(/[ःं]/g, '');
        t = t.replace(/[।॥]/g, ' ');
        t = t.replace(/\s+/g, ' ').trim();
        return t;
    }

    function tokenizeShloka(text) {
        if (!text) return [];
        return text.split(TOKEN_SPLIT).map(t => t.trim()).filter(Boolean);
    }

    function getMinKeywordLength(keyword, settings) {
        const norm = normalizeSanskrit(keyword);
        const hasDevanagari = [...norm].some(isDevanagariChar);
        if (hasDevanagari) {
            return settings.minDevanagariLength || 2;
        }
        return settings.minLatinLength || 3;
    }

    function buildBoundaryRegex(keyword) {
        const escaped = escapeRegex(keyword);
        try {
            return new RegExp(`(?<![\\p{L}\\p{M}])${escaped}(?![\\p{L}\\p{M}])`, 'giu');
        } catch (e) {
            if (/^[a-zA-Z]+$/.test(keyword)) {
                return new RegExp(`\\b${escaped}\\b`, 'gi');
            }
            return new RegExp(`(^|[^\\p{L}\\p{M}])(${escaped})(?![\\p{L}\\p{M}])`, 'giu');
        }
    }

    function findBoundaryMatches(text, keyword, settings) {
        const normKw = normalizeSanskrit(keyword);
        if (!normKw) return [];

        const minLen = getMinKeywordLength(keyword, settings);
        if (graphemeLength(normKw) < minLen) return [];

        const matches = [];
        const regex = buildBoundaryRegex(keyword);
        let m;
        const re = new RegExp(regex.source, regex.flags);
        while ((m = re.exec(text)) !== null) {
            if (m[0].length === 0) { re.lastIndex++; continue; }
            const start = m.index;
            const end = start + m[0].length;
            const matchedText = text.slice(start, end);

            if (normalizeSanskrit(matchedText) === normKw ||
                normalizeSanskrit(matchedText).includes(normKw)) {
                matches.push({
                    start, end,
                    text: matchedText,
                    type: 'boundary',
                    keyword: keyword
                });
            }
        }
        return matches;
    }

    function findTokenExactMatches(tokens, tokenOffsets, keyword) {
        const normKw = normalizeSanskrit(keyword);
        const matches = [];
        tokens.forEach((token, idx) => {
            if (normalizeSanskrit(token) === normKw) {
                matches.push({
                    start: tokenOffsets[idx].start,
                    end: tokenOffsets[idx].end,
                    text: token,
                    type: 'token',
                    keyword: keyword
                });
            }
        });
        return matches;
    }

    function segmentCompound(token, tokenStart, allKeywords, settings) {
        const normToken = normalizeSanskrit(token);
        const sorted = [...allKeywords]
            .map(k => ({ original: k, norm: normalizeSanskrit(k) }))
            .filter(k => k.norm.length > 0)
            .sort((a, b) => b.norm.length - a.norm.length);

        const segments = [];
        let pos = 0;

        while (pos < normToken.length) {
            let found = null;
            for (const kw of sorted) {
                const minLen = getMinKeywordLength(kw.original, settings);
                if (kw.norm.length < minLen) continue;
                if (normToken.startsWith(kw.norm, pos)) {
                    found = kw;
                    break;
                }
            }
            if (found) {
                const slice = token.slice(
                    mapNormIndexToOriginal(token, pos),
                    mapNormIndexToOriginal(token, pos + found.norm.length)
                );
                segments.push({
                    start: tokenStart + mapNormIndexToOriginal(token, pos),
                    end: tokenStart + mapNormIndexToOriginal(token, pos + found.norm.length),
                    text: slice || token.substring(0, 1),
                    type: 'compound',
                    keyword: found.original
                });
                pos += found.norm.length;
            } else {
                pos += 1;
            }
        }
        return segments;
    }

    function mapNormIndexToOriginal(original, normIndex) {
        let normPos = 0;
        for (let i = 0; i < original.length; i++) {
            if (normPos >= normIndex) return i;
            const ch = original[i];
            const normCh = normalizeSanskrit(ch);
            normPos += normCh.length || (ch.trim() ? 1 : 0);
        }
        return original.length;
    }

    function computeTokenOffsets(text, tokens) {
        const offsets = [];
        let searchFrom = 0;
        tokens.forEach(token => {
            const idx = text.indexOf(token, searchFrom);
            const start = idx >= 0 ? idx : searchFrom;
            offsets.push({ start, end: start + token.length });
            searchFrom = start + token.length;
        });
        return offsets;
    }

    function mergeMatchRanges(ranges) {
        if (!ranges.length) return [];
        const sorted = [...ranges].sort((a, b) => a.start - b.start || b.end - a.end);
        const merged = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
            const last = merged[merged.length - 1];
            const cur = sorted[i];
            if (cur.start <= last.end) {
                last.end = Math.max(last.end, cur.end);
                if (cur.type === 'token') last.type = 'token';
            } else {
                merged.push(cur);
            }
        }
        return merged;
    }

    function findMatchesInShloka(shloka, conceptMap, settings) {
        const allKeywords = [];
        const keywordToConcept = {};
        for (const [concept, keywords] of Object.entries(conceptMap)) {
            keywords.forEach(kw => {
                allKeywords.push(kw);
                if (!keywordToConcept[kw]) keywordToConcept[kw] = concept;
            });
        }

        const tokens = tokenizeShloka(shloka);
        const tokenOffsets = computeTokenOffsets(shloka, tokens);
        const allMatches = [];
        const conceptScores = {};
        const conceptMatchDetails = {};
        const matchedKeywords = new Set();

        for (const [concept, keywords] of Object.entries(conceptMap)) {
            conceptScores[concept] = 0;
            conceptMatchDetails[concept] = [];
        }

        for (const keyword of allKeywords) {
            const concept = keywordToConcept[keyword];
            let keywordMatches = [];

            if (settings.matchMode === 'legacy') {
                const normKw = normalizeSanskrit(keyword);
                const normShloka = normalizeSanskrit(shloka);
                if (normShloka.includes(normKw)) {
                    const regex = new RegExp(escapeRegex(keyword), 'gi');
                    let m;
                    while ((m = regex.exec(shloka)) !== null) {
                        if (m[0].length === 0) { regex.lastIndex++; continue; }
                        keywordMatches.push({
                            start: m.index,
                            end: m.index + m[0].length,
                            text: m[0],
                            type: 'legacy',
                            keyword: keyword
                        });
                    }
                }
            } else if (settings.matchMode === 'strict') {
                keywordMatches = findTokenExactMatches(tokens, tokenOffsets, keyword);
                keywordMatches = mergeMatchRanges(
                    keywordMatches.concat(findBoundaryMatches(shloka, keyword, settings))
                );
            } else if (settings.matchMode === 'compound') {
                keywordMatches = findTokenExactMatches(tokens, tokenOffsets, keyword);
                keywordMatches = keywordMatches.concat(findBoundaryMatches(shloka, keyword, settings));
                tokens.forEach((token, idx) => {
                    if (normalizeSanskrit(token) === normalizeSanskrit(keyword)) return;
                    const segs = segmentCompound(token, tokenOffsets[idx].start, [keyword], settings);
                    keywordMatches = keywordMatches.concat(segs);
                });
                if (settings.compoundDictionary) {
                    tokens.forEach((token, idx) => {
                        const segs = segmentCompound(token, tokenOffsets[idx].start, allKeywords, settings);
                        segs.forEach(seg => {
                            if (normalizeSanskrit(seg.keyword) === normalizeSanskrit(keyword)) {
                                keywordMatches.push(seg);
                            }
                        });
                    });
                }
                keywordMatches = mergeMatchRanges(keywordMatches);
            }

            keywordMatches = mergeMatchRanges(keywordMatches);
            if (keywordMatches.length > 0) {
                conceptScores[concept] += keywordMatches.length;
                matchedKeywords.add(keyword);
                keywordMatches.forEach(m => {
                    conceptMatchDetails[concept].push({
                        keyword: keyword,
                        matchedText: m.text,
                        matchType: m.type
                    });
                });
                allMatches.push(...keywordMatches);
            }
        }

        return {
            matches: mergeMatchRanges(allMatches),
            conceptScores,
            conceptMatchDetails,
            matchedKeywords: [...matchedKeywords]
        };
    }

    function buildHighlightedHtml(shloka, matchRanges) {
        if (!matchRanges.length) return escapeHtml(shloka);
        const merged = mergeMatchRanges(matchRanges);
        let html = '';
        let last = 0;
        merged.forEach(({ start, end }) => {
            html += escapeHtml(shloka.slice(last, start));
            html += '<mark>' + escapeHtml(shloka.slice(start, end)) + '</mark>';
            last = end;
        });
        html += escapeHtml(shloka.slice(last));
        return html;
    }

    function splitShlokas(rawText) {
        const dandaRegex = /[\s\S]+?[।॥]/g;
        let shlokasRaw = rawText.match(dandaRegex);
        if (!shlokasRaw || shlokasRaw.length === 0) {
            shlokasRaw = rawText.split('\n').filter(line => line.trim().length > 0);
        }
        return (shlokasRaw || []).map(s => s.trim()).filter(Boolean);
    }

    function analyzeText(rawText, conceptMap, settings, onProgress) {
        const shlokas = splitShlokas(rawText);
        const conceptNames = Object.keys(conceptMap);
        const results = [];
        let totalKeywordHits = 0;
        let matchedShlokaCount = 0;
        const overallConceptCounts = {};

        const defaultSettings = {
            matchMode: 'strict',
            minLatinLength: 3,
            minDevanagariLength: 2,
            compoundDictionary: true,
            onlyMatchedShlokas: false
        };
        const cfg = { ...defaultSettings, ...settings };

        for (let i = 0; i < shlokas.length; i++) {
            const cleanedShloka = shlokas[i];
            const { matches, conceptScores, conceptMatchDetails, matchedKeywords } =
                findMatchesInShloka(cleanedShloka, conceptMap, cfg);

            const hasMatch = Object.values(conceptScores).some(s => s > 0);
            if (hasMatch) matchedShlokaCount++;

            let hitsThisShloka = 0;
            const scoreMap = {};
            const scoreStrings = [];
            for (const concept of conceptNames) {
                const score = conceptScores[concept] || 0;
                scoreMap[concept] = score;
                if (score > 0) {
                    scoreStrings.push(`${concept}: ${score}`);
                    overallConceptCounts[concept] = (overallConceptCounts[concept] || 0) + score;
                    hitsThisShloka += score;
                }
            }
            totalKeywordHits += hitsThisShloka;

            let topConcept = 'N/A';
            let maxScore = 0;
            const topConceptsList = [];
            for (const [concept, score] of Object.entries(scoreMap)) {
                if (score > maxScore) {
                    maxScore = score;
                    topConceptsList.length = 0;
                    topConceptsList.push(concept);
                } else if (score === maxScore && maxScore > 0) {
                    topConceptsList.push(concept);
                }
            }
            if (topConceptsList.length > 0) topConcept = topConceptsList.join(', ');

            if (cfg.onlyMatchedShlokas && !hasMatch) {
                if (onProgress && i % 50 === 0) onProgress(i + 1, shlokas.length);
                continue;
            }

            results.push({
                id: results.length + 1,
                shloka: cleanedShloka,
                highlighted_shloka: buildHighlightedHtml(cleanedShloka, matches),
                top_concept: topConcept,
                all_scores: scoreStrings.join(', '),
                score_map: scoreMap,
                match_details: conceptMatchDetails,
                matched_keywords: matchedKeywords,
                char_count: cleanedShloka.length,
                word_count: tokenizeShloka(cleanedShloka).length,
                shloka_before: shlokas[i - 1] || null,
                shloka_after: shlokas[i + 1] || null,
                has_match: hasMatch
            });

            if (onProgress && i % 50 === 0) onProgress(i + 1, shlokas.length);
        }

        if (onProgress) onProgress(shlokas.length, shlokas.length);

        return {
            results,
            totalShlokas: shlokas.length,
            matchedShlokas: matchedShlokaCount,
            totalHits: totalKeywordHits,
            conceptCounts: overallConceptCounts,
            settings: cfg,
            analyzedAt: new Date().toISOString()
        };
    }

    const SanskritEngine = {
        normalizeSanskrit,
        tokenizeShloka,
        escapeHtml,
        escapeRegex,
        findMatchesInShloka,
        buildHighlightedHtml,
        splitShlokas,
        analyzeText,
        mergeMatchRanges
    };

    global.SanskritEngine = SanskritEngine;
})(typeof self !== 'undefined' ? self : window);

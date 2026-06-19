/**
 * ShlokaAI Application (v2.0) — Research-grade UI controller
 */
document.addEventListener('DOMContentLoaded', () => {
    const TRANSLATIONS = window.SHLOKAI_DATA.TRANSLATIONS;
    const CONCEPT_TEMPLATES = window.SHLOKAI_DATA.CONCEPT_TEMPLATES;
    const ROWS_PER_PAGE = 50;
    const FILTER_DEBOUNCE_MS = 300;

    let conceptMap = {};
    let processedResults = [];
    let currentViewResults = [];
    let currentPage = 1;
    let resultsChart = null;
    let currentLang = 'en';
    let analysisWorker = null;
    let lastAnalysisReport = null;
    let conceptNames = [];

    const $ = id => document.getElementById(id);

    const els = {
        addConceptBtn: $('addConceptButton'),
        clearConceptInputsButton: $('clearConceptInputsButton'),
        conceptNameInput: $('conceptName'),
        conceptKeywordsInput: $('conceptKeywords'),
        keywordJsonOutput: $('keywordJsonOutput'),
        conceptListDiv: $('conceptList'),
        templateToggleBtn: $('template-toggle-btn'),
        templateCheckboxContainer: $('template-checkbox-container'),
        loadTemplateBtn: $('loadTemplateButton'),
        saveMapBtn: $('saveMapButton'),
        loadMapBtn: $('loadMapButton'),
        loadMapInput: $('loadMapInput'),
        uploadTextBtn: $('uploadTextButton'),
        loadTextInput: $('loadTextInput'),
        processBtn: $('processButton'),
        clearBtn: $('clearButton'),
        downloadCsvBtn: $('downloadCsvButton'),
        downloadJsonBtn: $('downloadJsonButton'),
        downloadFreqBtn: $('downloadFreqButton'),
        textInput: $('textInput'),
        resultsBody: $('resultsBody'),
        shlokaCountSpan: $('shlokaCount'),
        filterInput: $('filterInput'),
        addConceptError: $('addConceptError'),
        textInputError: $('textInputError'),
        resultsArea: $('results-area'),
        dashboardContainer: $('dashboardContainer'),
        paginationControls: $('paginationControls'),
        prevPageButton: $('prevPageButton'),
        nextPageButton: $('nextPageButton'),
        pageInfo: $('pageInfo'),
        langToggleBtn: $('lang-toggle-btn'),
        analysisSummaryCard: $('analysis-summary-card'),
        summaryTotalShlokas: $('summary-total-shlokas'),
        summaryMatchedShlokas: $('summary-matched-shlokas'),
        summaryTotalHits: $('summary-total-hits'),
        summaryTopConcept: $('summary-top-concept'),
        summaryMatchMode: $('summary-match-mode'),
        shlokaModal: $('shloka-modal'),
        modalCloseBtn: $('modal-close-btn'),
        modalTopConcept: $('modal-top-concept'),
        modalAllScores: $('modal-all-scores'),
        modalMatchedKw: $('modal-matched-kw'),
        modalMatchDetails: $('modal-match-details'),
        modalShlokaText: $('modal-shloka-text'),
        modalCopyBtn: $('modal-copy-btn'),
        modalShlokaBefore: $('modal-shloka-before'),
        modalShlokaAfter: $('modal-shloka-after'),
        copyCitationBtn: $('copy-citation-btn'),
        matchModeSelect: $('matchModeSelect'),
        onlyMatchedCheckbox: $('onlyMatchedCheckbox'),
        minLatinInput: $('minLatinInput'),
        minDevanagariInput: $('minDevanagariInput'),
        progressContainer: $('progressContainer'),
        progressBarFill: $('progressBarFill'),
        progressText: $('progressText')
    };

    function t(key) {
        const entry = TRANSLATIONS[key];
        return entry ? (entry[currentLang] || entry.en || '') : key;
    }

    function applyTranslations() {
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            if (!TRANSLATIONS[key]) return;
            const textEl = el.querySelector('[data-lang-text]') || el;
            if (textEl.dataset.langText !== undefined || el.querySelector('[data-lang-text]')) {
                (el.querySelector('[data-lang-text]') || textEl).textContent = t(key);
            } else if (el.tagName === 'OPTION') {
                el.textContent = t(key);
            } else if (!el.querySelector('svg')) {
                el.textContent = t(key);
            } else {
                const span = el.querySelector('span[data-lang-text], span:last-child');
                if (span) span.textContent = t(key);
            }
        });
        document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
            el.placeholder = t(el.dataset.langPlaceholder);
        });
        updateDynamicText();
    }

    function updateDynamicText() {
        const count = currentViewResults.length;
        els.shlokaCountSpan.textContent = `${count} ${t('shlokasFound')}`;
        if (count > 0) {
            const totalPages = Math.ceil(count / ROWS_PER_PAGE);
            els.pageInfo.textContent = `${t('page')} ${currentPage} ${t('of')} ${totalPages || 1}`;
        }
        ['addConceptError', 'textInputError'].forEach(id => {
            const el = els[id.replace('Error', 'Error')] || $(id);
            const errEl = id === 'addConceptError' ? els.addConceptError : els.textInputError;
            if (errEl.style.display === 'block' && errEl.dataset.errorKey) {
                errEl.textContent = t(errEl.dataset.errorKey);
            }
        });
    }

    function debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    }

    function getAnalysisSettings() {
        return {
            matchMode: els.matchModeSelect.value,
            onlyMatchedShlokas: els.onlyMatchedCheckbox.checked,
            minLatinLength: parseInt(els.minLatinInput.value, 10) || 3,
            minDevanagariLength: parseInt(els.minDevanagariInput.value, 10) || 2,
            compoundDictionary: true
        };
    }

    function showError(el, key) {
        el.textContent = t(key);
        el.dataset.errorKey = key;
        el.style.display = 'block';
    }

    function addConcept() {
        els.addConceptError.style.display = 'none';
        const name = els.conceptNameInput.value.trim();
        const keywordsStr = els.conceptKeywordsInput.value.trim();
        if (!name || !keywordsStr) {
            showError(els.addConceptError, 'errorConceptName');
            els.conceptNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const keywords = keywordsStr.split(',').map(k => k.trim()).filter(Boolean);
        if (!keywords.length) {
            showError(els.addConceptError, 'errorSynonyms');
            return;
        }
        conceptMap[name] = keywords;
        els.conceptNameInput.value = '';
        els.conceptKeywordsInput.value = '';
        updateConceptUI();
    }

    function removeConcept(name) {
        delete conceptMap[name];
        updateConceptUI();
    }

    function updateConceptUI() {
        conceptNames = Object.keys(conceptMap);
        let jsonString = JSON.stringify(conceptMap, null, 2);
        jsonString = jsonString.replace(/\\u([\dA-Fa-f]{4})/g, (_, g) => String.fromCharCode(parseInt(g, 16)));
        els.keywordJsonOutput.value = jsonString;
        els.conceptListDiv.innerHTML = '';
        conceptNames.forEach(name => {
            const tag = document.createElement('span');
            tag.className = 'concept-tag';
            tag.textContent = name + ' ';
            const btn = document.createElement('button');
            btn.innerHTML = '&times;';
            btn.title = 'Remove';
            btn.dataset.conceptName = name;
            tag.appendChild(btn);
            els.conceptListDiv.appendChild(tag);
        });
    }

    function loadTemplates() {
        const checked = document.querySelectorAll('#template-checkbox-container input:checked');
        if (!checked.length) return;
        const toLoad = [];
        checked.forEach(cb => {
            if (cb.value === 'all_ayurveda') {
                ['doshas', 'dhatus', 'gunas', 'rasas', 'malas'].forEach(x => {
                    if (!toLoad.includes(x)) toLoad.push(x);
                });
            } else if (!toLoad.includes(cb.value)) {
                toLoad.push(cb.value);
            }
        });
        toLoad.forEach(name => {
            const tpl = CONCEPT_TEMPLATES[name];
            if (!tpl) return;
            Object.entries(tpl).forEach(([concept, keywords]) => {
                if (conceptMap[concept]) {
                    conceptMap[concept] = [...new Set([...conceptMap[concept], ...keywords])];
                } else {
                    conceptMap[concept] = [...keywords];
                }
            });
        });
        checked.forEach(cb => { cb.checked = false; });
        els.templateCheckboxContainer.classList.add('hidden');
        els.templateToggleBtn.querySelector('svg').style.transform = 'rotate(0deg)';
        updateConceptUI();
    }

    function saveConceptMap() {
        els.addConceptError.style.display = 'none';
        if (!conceptNames.length) {
            showError(els.addConceptError, 'errorMapEmpty');
            return;
        }
        let json = JSON.stringify(conceptMap, null, 2);
        json = json.replace(/\\u([\dA-Fa-f]{4})/g, (_, g) => String.fromCharCode(parseInt(g, 16)));
        downloadBlob(json, 'shloka_concept_map.json', 'application/json;charset=utf-8');
    }

    function loadConceptMap(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const loaded = JSON.parse(ev.target.result);
                if (typeof loaded !== 'object' || Array.isArray(loaded)) throw new Error('bad');
                conceptMap = loaded;
                updateConceptUI();
            } catch {
                showError(els.addConceptError, 'errorLoadMap');
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    }

    function loadTextFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { els.textInput.value = ev.target.result; };
        reader.readAsText(file);
        e.target.value = null;
    }

    function hideResults() {
        els.resultsArea.classList.add('hidden');
        els.analysisSummaryCard.classList.add('hidden');
        if (resultsChart) { resultsChart.destroy(); resultsChart = null; }
    }

    function clearAll() {
        conceptMap = {};
        processedResults = [];
        currentViewResults = [];
        lastAnalysisReport = null;
        updateConceptUI();
        document.querySelectorAll('#template-checkbox-container input:checked').forEach(cb => { cb.checked = false; });
        els.templateCheckboxContainer.classList.add('hidden');
        els.textInput.value = '';
        els.resultsBody.innerHTML = '';
        els.filterInput.value = '';
        hideResults();
        els.addConceptError.style.display = 'none';
        els.textInputError.style.display = 'none';
        els.progressContainer.classList.remove('visible');
        updateDynamicText();
    }

    function setProcessingState(loading) {
        const textSpan = els.processBtn.querySelector('.btn-text');
        const icon = els.processBtn.querySelector('.btn-icon');
        const spinner = els.processBtn.querySelector('.spinner');
        els.processBtn.disabled = loading;
        els.processBtn.classList.toggle('btn-loading', loading);
        if (icon) icon.style.display = loading ? 'none' : 'inline-block';
        if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
        if (textSpan) textSpan.textContent = loading ? t('processingBtn') : t('classifyBtn');
        els.progressContainer.classList.toggle('visible', loading);
        if (!loading) {
            els.progressBarFill.style.width = '0%';
            els.progressText.textContent = '';
        }
    }

    function updateProgress(done, total) {
        const pct = total ? Math.round((done / total) * 100) : 0;
        els.progressBarFill.style.width = pct + '%';
        els.progressText.textContent = `${t('progressLabel')} ${done} / ${total} (${pct}%)`;
    }

    function terminateWorker() {
        if (analysisWorker) {
            analysisWorker.terminate();
            analysisWorker = null;
        }
    }

    function createWorker() {
        terminateWorker();
        try {
            analysisWorker = new Worker('js/analysis-worker.js');
            return analysisWorker;
        } catch {
            return null;
        }
    }

    function handleAnalysisComplete(report) {
        lastAnalysisReport = report;
        processedResults = report.results;
        currentViewResults = processedResults;
        conceptNames = Object.keys(conceptMap);

        els.summaryTotalShlokas.textContent = report.totalShlokas;
        els.summaryMatchedShlokas.textContent = report.matchedShlokas;
        els.summaryTotalHits.textContent = report.totalHits;

        let topName = 'N/A';
        let maxHits = 0;
        Object.entries(report.conceptCounts).forEach(([c, n]) => {
            if (n > maxHits) { maxHits = n; topName = c; }
        });
        els.summaryTopConcept.textContent = maxHits > 0 ? `${topName} (${maxHits} hits)` : 'N/A';
        els.summaryMatchMode.textContent = report.settings.matchMode;

        els.analysisSummaryCard.classList.remove('hidden');
        els.resultsArea.classList.remove('hidden');
        updateDashboard(currentViewResults);
        renderTablePage(1);
        updateDynamicText();
        setProcessingState(false);
        els.resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function processText() {
        els.addConceptError.style.display = 'none';
        els.textInputError.style.display = 'none';

        if (!conceptNames.length) {
            showError(els.addConceptError, 'errorMapEmpty');
            els.conceptNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const rawText = els.textInput.value;
        if (!rawText.trim()) {
            showError(els.textInputError, 'errorNoText');
            return;
        }
        const shlokas = SanskritEngine.splitShlokas(rawText);
        if (!shlokas.length) {
            showError(els.textInputError, 'errorNoShlokas');
            return;
        }

        const settings = getAnalysisSettings();
        setProcessingState(true);
        updateProgress(0, shlokas.length);

        const worker = createWorker();
        if (worker) {
            worker.onmessage = e => {
                const msg = e.data;
                if (msg.type === 'progress') updateProgress(msg.done, msg.total);
                else if (msg.type === 'complete') {
                    terminateWorker();
                    handleAnalysisComplete(msg.report);
                } else if (msg.type === 'error') {
                    terminateWorker();
                    setProcessingState(false);
                    showError(els.textInputError, 'errorAnalysis');
                }
            };
            worker.onerror = () => {
                terminateWorker();
                runAnalysisMainThread(rawText, settings);
            };
            worker.postMessage({ rawText, conceptMap, settings });
        } else {
            runAnalysisMainThread(rawText, settings);
        }
    }

    function runAnalysisMainThread(rawText, settings) {
        setTimeout(() => {
            try {
                const report = SanskritEngine.analyzeText(rawText, conceptMap, settings, updateProgress);
                handleAnalysisComplete(report);
            } catch {
                setProcessingState(false);
                showError(els.textInputError, 'errorAnalysis');
            }
        }, 16);
    }

    function updateDashboard(results) {
        els.dashboardContainer.classList.remove('hidden');
        const ctx = $('resultsChart').getContext('2d');
        const conceptCounts = {};
        results.forEach(r => {
            Object.entries(r.score_map || {}).forEach(([c, n]) => {
                if (n > 0) conceptCounts[c] = (conceptCounts[c] || 0) + n;
            });
        });
        const sorted = Object.entries(conceptCounts).sort((a, b) => b[1] - a[1]);
        let top10 = sorted.slice(0, 10);
        if (sorted.length > 10) {
            const others = sorted.slice(10).reduce((a, [, n]) => a + n, 0);
            top10.push(['Others', others]);
        }
        const labels = top10.map(([c]) => c);
        const data = top10.map(([, n]) => n);
        if (resultsChart) resultsChart.destroy();
        if (!data.length || data.every(d => d === 0)) {
            els.dashboardContainer.classList.add('hidden');
            return;
        }
        resultsChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    label: 'Keyword Hit Distribution',
                    data,
                    backgroundColor: ['#006400','#1E40AF','#B91C1C','#D97706','#6B7280','#581C87','#0369A1','#BE123C','#78350F','#4B5563','#888888'],
                    hoverOffset: 4,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { font: { family: 'Inter' }, boxWidth: 20, padding: 15 } },
                    title: { display: true, text: 'Keyword Hit Distribution (Top 10)', font: { size: 16, family: 'Inter', weight: '600' } },
                    tooltip: {
                        callbacks: {
                            label(ctx) {
                                const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                                return `${ctx.label}: ${ctx.parsed} hits (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderTablePage(page) {
        currentPage = page;
        els.resultsBody.innerHTML = '';
        const totalPages = Math.ceil(currentViewResults.length / ROWS_PER_PAGE);

        if (!currentViewResults.length) {
            els.pageInfo.textContent = '';
            els.prevPageButton.disabled = true;
            els.nextPageButton.disabled = true;
            els.paginationControls.classList.add('hidden');
            const row = els.resultsBody.insertRow();
            row.className = 'no-results-row';
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.textContent = t('noFilterResults');
            return;
        }

        els.paginationControls.classList.remove('hidden');
        els.pageInfo.textContent = `${t('page')} ${currentPage} ${t('of')} ${totalPages}`;
        els.prevPageButton.disabled = currentPage === 1;
        els.nextPageButton.disabled = currentPage === totalPages;

        const pageData = currentViewResults.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
        pageData.forEach(result => {
            const row = els.resultsBody.insertRow();
            row.dataset.shlokaId = result.id;
            row.insertCell().textContent = result.id;
            row.insertCell().innerHTML = result.highlighted_shloka;
            row.insertCell().textContent = result.top_concept;
            row.insertCell().textContent = result.all_scores;
            row.insertCell().textContent = (result.matched_keywords || []).join(', ');
            row.insertCell().textContent = result.char_count;
            row.insertCell().textContent = result.word_count;
        });
    }

    const filterResults = debounce(() => {
        const q = els.filterInput.value.toLowerCase().trim();
        currentViewResults = q
            ? processedResults.filter(r =>
                r.shloka.toLowerCase().includes(q) ||
                r.all_scores.toLowerCase().includes(q) ||
                r.top_concept.toLowerCase().includes(q) ||
                (r.matched_keywords || []).some(k => k.toLowerCase().includes(q))
            )
            : processedResults;
        updateDashboard(currentViewResults);
        renderTablePage(1);
        updateDynamicText();
    }, FILTER_DEBOUNCE_MS);

    function escapeCSV(str) {
        return `"${String(str ?? '').replace(/"/g, '""')}"`;
    }

    function downloadBlob(data, filename, mime) {
        const bom = '\uFEFF';
        const blob = new Blob([bom + data], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function downloadFile(format) {
        const data = currentViewResults;
        const concepts = conceptNames.length ? conceptNames : [...new Set(data.flatMap(r => Object.keys(r.score_map || {})))];

        if (format === 'json') {
            const payload = {
                metadata: {
                    exportedAt: new Date().toISOString(),
                    tool: 'ShlokaAI v2.0',
                    matchMode: lastAnalysisReport?.settings?.matchMode,
                    conceptCount: concepts.length,
                    resultCount: data.length
                },
                conceptMap,
                results: data
            };
            let json = JSON.stringify(payload, null, 2);
            json = json.replace(/\\u([\dA-Fa-f]{4})/g, (_, g) => String.fromCharCode(parseInt(g, 16)));
            downloadBlob(json, 'shloka_export.json', 'application/json;charset=utf-8');
            return;
        }

        if (format === 'freq') {
            const freq = {};
            concepts.forEach(c => { freq[c] = 0; });
            data.forEach(r => {
                Object.entries(r.score_map || {}).forEach(([c, n]) => { freq[c] = (freq[c] || 0) + n; });
            });
            const header = 'concept,hit_count,shloka_count\n';
            const shlokaCounts = {};
            concepts.forEach(c => { shlokaCounts[c] = 0; });
            data.forEach(r => {
                Object.entries(r.score_map || {}).forEach(([c, n]) => {
                    if (n > 0) shlokaCounts[c] = (shlokaCounts[c] || 0) + 1;
                });
            });
            const rows = concepts.map(c => `${escapeCSV(c)},${freq[c] || 0},${shlokaCounts[c] || 0}`).join('\n');
            downloadBlob(header + rows, 'concept_frequency_report.csv', 'text/csv;charset=utf-8');
            return;
        }

        const conceptCols = concepts.map(c => escapeCSV(c + ' Score')).join(',');
        const header = `id,shloka,top_concept,all_scores,matched_keywords,${conceptCols},char_count,word_count,shloka_before,shloka_after\n`;
        const rows = data.map(r => {
            const scores = concepts.map(c => (r.score_map && r.score_map[c]) || 0);
            return [
                r.id,
                escapeCSV(r.shloka),
                escapeCSV(r.top_concept),
                escapeCSV(r.all_scores),
                escapeCSV((r.matched_keywords || []).join('; ')),
                ...scores,
                r.char_count,
                r.word_count,
                escapeCSV(r.shloka_before || ''),
                escapeCSV(r.shloka_after || '')
            ].join(',');
        }).join('\n');
        downloadBlob(header + rows, 'shloka_export_wide.csv', 'text/csv;charset=utf-8');
    }

    function handleTableRowClick(e) {
        const row = e.target.closest('tr');
        if (!row?.dataset.shlokaId) return;
        const data = processedResults.find(r => r.id === parseInt(row.dataset.shlokaId, 10));
        if (data) showModal(data);
    }

    function showModal(data) {
        els.modalTopConcept.textContent = data.top_concept || 'N/A';
        els.modalAllScores.textContent = data.all_scores || '—';
        els.modalMatchedKw.textContent = (data.matched_keywords || []).join(', ') || '—';
        const details = [];
        Object.entries(data.match_details || {}).forEach(([concept, matches]) => {
            matches.forEach(m => {
                details.push(`${concept}: "${m.matchedText}" ← ${m.keyword} [${m.matchType}]`);
            });
        });
        els.modalMatchDetails.textContent = details.length ? details.join('\n') : '—';
        els.modalShlokaText.textContent = data.shloka;
        els.modalShlokaBefore.textContent = data.shloka_before || '';
        els.modalShlokaAfter.textContent = data.shloka_after || '';
        els.modalShlokaBefore.classList.toggle('hidden', !data.shloka_before);
        els.modalShlokaAfter.classList.toggle('hidden', !data.shloka_after);
        els.shlokaModal.classList.remove('hidden');
    }

    function hideModal() {
        els.shlokaModal.classList.add('hidden');
    }

    function copyText(text, btn) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        showCopyFeedback(btn, ok);
    }

    function showCopyFeedback(btn, ok) {
        const orig = btn.innerHTML;
        btn.textContent = ok ? t('errorCopy') : t('errorCopyFail');
        btn.disabled = true;
        btn.style.background = ok ? 'var(--color-primary)' : 'var(--color-danger)';
        btn.style.color = '#fff';
        setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; btn.style.background = ''; btn.style.color = ''; }, 2000);
    }

    function bindEvents() {
        els.addConceptBtn.addEventListener('click', addConcept);
        els.clearConceptInputsButton.addEventListener('click', () => {
            els.conceptNameInput.value = '';
            els.conceptKeywordsInput.value = '';
            els.addConceptError.style.display = 'none';
            conceptMap = {};
            updateConceptUI();
        });
        els.processBtn.addEventListener('click', processText);
        els.clearBtn.addEventListener('click', clearAll);
        els.downloadCsvBtn.addEventListener('click', () => downloadFile('csv'));
        els.downloadJsonBtn.addEventListener('click', () => downloadFile('json'));
        els.downloadFreqBtn.addEventListener('click', () => downloadFile('freq'));
        els.filterInput.addEventListener('input', filterResults);
        els.saveMapBtn.addEventListener('click', saveConceptMap);
        els.loadMapBtn.addEventListener('click', () => els.loadMapInput.click());
        els.loadMapInput.addEventListener('change', loadConceptMap);
        els.uploadTextBtn.addEventListener('click', () => els.loadTextInput.click());
        els.loadTextInput.addEventListener('change', loadTextFile);
        els.loadTemplateBtn.addEventListener('click', loadTemplates);
        els.templateToggleBtn.addEventListener('click', () => {
            els.templateCheckboxContainer.classList.toggle('hidden');
            const icon = els.templateToggleBtn.querySelector('svg');
            icon.style.transform = els.templateCheckboxContainer.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        });
        els.prevPageButton.addEventListener('click', () => { if (currentPage > 1) renderTablePage(currentPage - 1); });
        els.nextPageButton.addEventListener('click', () => {
            const tp = Math.ceil(currentViewResults.length / ROWS_PER_PAGE);
            if (currentPage < tp) renderTablePage(currentPage + 1);
        });
        els.langToggleBtn.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'hi' : 'en';
            applyTranslations();
            if (els.processBtn.disabled) {
                const ts = els.processBtn.querySelector('.btn-text');
                if (ts) ts.textContent = t('processingBtn');
            }
        });
        els.conceptListDiv.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.conceptName) {
                removeConcept(e.target.dataset.conceptName);
            }
        });
        els.resultsBody.addEventListener('click', handleTableRowClick);
        els.modalCloseBtn.addEventListener('click', hideModal);
        els.shlokaModal.addEventListener('click', e => { if (e.target === els.shlokaModal) hideModal(); });
        els.modalCopyBtn.addEventListener('click', () => {
            copyText([els.modalShlokaBefore.textContent, els.modalShlokaText.textContent, els.modalShlokaAfter.textContent].filter(Boolean).join('\n\n'), els.modalCopyBtn);
        });
        els.copyCitationBtn.addEventListener('click', () => {
            copyText($('citation-text').textContent.trim(), els.copyCitationBtn);
        });
    }

    bindEvents();
    applyTranslations();
});

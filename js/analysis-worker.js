importScripts('sanskrit-engine.js');

self.onmessage = function (e) {
    const { rawText, conceptMap, settings } = e.data;
    try {
        const report = SanskritEngine.analyzeText(rawText, conceptMap, settings, (done, total) => {
            self.postMessage({ type: 'progress', done, total });
        });
        self.postMessage({ type: 'complete', report });
    } catch (err) {
        self.postMessage({ type: 'error', message: err.message || String(err) });
    }
};

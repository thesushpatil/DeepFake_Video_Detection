document.addEventListener('DOMContentLoaded', () => {
    // --- Prevent ALL default drag/drop on the window to keep popup alive ---
    window.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
    window.addEventListener('dragenter', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
    window.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); }, true);

    // --- Elements ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const urlInput = document.getElementById('urlInput');
    const analyzeUrlBtn = document.getElementById('analyzeUrlBtn');
    const previewArea = document.getElementById('previewArea');
    const mediaPreview = document.getElementById('mediaPreview');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const snipBtn = document.getElementById('snipBtn');
    const retryBtn = document.getElementById('retryBtn');

    // Result elements
    const loadingState = document.getElementById('loadingState');
    const resultState = document.getElementById('resultState');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    const verdictCard = document.getElementById('verdictCard');
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictText = document.getElementById('verdictText');
    const confidenceText = document.getElementById('confidenceText');
    const confidenceValue = document.getElementById('confidenceValue');
    const confidenceFill = document.getElementById('confidenceFill');
    const heatmapGallery = document.getElementById('heatmapGallery');
    const errorMessage = document.getElementById('errorMessage');

    let selectedFile = null;

    // --- Tab Navigation ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    function switchToTab(tabName) {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    // --- File Upload (Click) ---
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileSelected(file);
    });

    // --- Prevent default drag/drop on entire body (stops popup from closing) ---
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    document.body.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    // --- Drag & Drop on the upload zone ---
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');

        // Handle files dragged from local storage
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelected(e.dataTransfer.files[0]);
            return;
        }

        // Handle images dragged from web pages (URL)
        const imageUrl = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
        if (imageUrl && imageUrl.startsWith('http')) {
            urlInput.value = imageUrl;
            analyzeFromUrl(imageUrl);
        }
    });

    // --- Handle File Selected ---
    function handleFileSelected(file) {
        selectedFile = file;
        previewArea.style.display = 'block';

        const fileURL = URL.createObjectURL(file);
        if (file.type.startsWith('video/')) {
            mediaPreview.innerHTML = `<video src="${fileURL}" controls muted style="max-width:100%; max-height:100%;"></video>`;
        } else if (file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3|flac|ogg|m4a)$/i)) {
            mediaPreview.innerHTML = `
                <div style="text-align:center; padding:10px;">
                    <span class="material-icons" style="font-size:36px; color:#ff9900;">audiotrack</span>
                    <p style="font-size:11px; margin:5px 0; color:#545b64;">${file.name}</p>
                    <audio src="${fileURL}" controls style="width:100%; margin-top:5px;"></audio>
                </div>`;
        } else {
            mediaPreview.innerHTML = `<img src="${fileURL}" alt="Preview">`;
        }
    }

    // --- Clear Preview ---
    clearBtn.addEventListener('click', () => {
        selectedFile = null;
        previewArea.style.display = 'none';
        mediaPreview.innerHTML = '';
        fileInput.value = '';
    });

    // --- Analyze Button ---
    analyzeBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        analyzeFile(selectedFile);
    });

    // --- URL Analysis ---
    analyzeUrlBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (!url) return;
        analyzeFromUrl(url);
    });

    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const url = urlInput.value.trim();
            if (url) analyzeFromUrl(url);
        }
    });

    // --- Snip Button ---
    snipBtn.addEventListener('click', async () => {
        // Get the active tab and inject the content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            // Close popup so user can snip
            window.close();
        }
    });

    // --- Retry Button ---
    retryBtn.addEventListener('click', () => {
        switchToTab('upload');
    });

    // --- Visit Website Link ---
    const visitWebsite = document.getElementById('visitWebsite');
    visitWebsite.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'http://127.0.0.1:8000' });
    });

    // --- Analyze File ---
    async function analyzeFile(file) {
        switchToTab('results');
        showLoading();

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:8000/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.error) {
                showError(data.error);
            } else {
                showResult(data);
            }
        } catch (error) {
            showError('Cannot connect to AI server. Make sure FastAPI is running on 127.0.0.1:8000');
        }
    }

    // --- Analyze from URL ---
    async function analyzeFromUrl(url) {
        switchToTab('results');
        showLoading();

        try {
            // Fetch the media from URL
            const response = await fetch(url);
            const blob = await response.blob();

            // Determine extension
            let ext = 'jpg';
            if (url.match(/\.png/i)) ext = 'png';
            else if (url.match(/\.mp4/i)) ext = 'mp4';
            else if (url.match(/\.avi/i)) ext = 'avi';
            else if (url.match(/\.mov/i)) ext = 'mov';
            else if (url.match(/\.wav/i)) ext = 'wav';
            else if (url.match(/\.mp3/i)) ext = 'mp3';
            else if (url.match(/\.flac/i)) ext = 'flac';
            else if (url.match(/\.ogg/i)) ext = 'ogg';
            else if (url.match(/\.m4a/i)) ext = 'm4a';

            const formData = new FormData();
            formData.append('file', blob, `url_media.${ext}`);

            const apiResponse = await fetch('http://127.0.0.1:8000/predict', {
                method: 'POST',
                body: formData
            });

            const data = await apiResponse.json();

            if (data.error) {
                showError(data.error);
            } else {
                showResult(data);
            }
        } catch (error) {
            showError('Failed to fetch media from URL or connect to AI server.');
        }
    }

    // --- UI State Helpers ---
    function showLoading() {
        loadingState.style.display = 'block';
        resultState.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
    }

    function showResult(data) {
        loadingState.style.display = 'none';
        resultState.style.display = 'block';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';

        const isFake = data.verdict === 'FAKE';
        const isAudio = data.media_type === 'audio';

        // Verdict card
        verdictCard.className = `verdict-card ${isFake ? 'fake' : 'real'}`;
        verdictIcon.textContent = isFake ? 'warning' : 'verified_user';
        verdictText.textContent = data.verdict;
        confidenceText.textContent = `Confidence: ${data.confidence}`;

        // Confidence bar
        const confNum = parseFloat(data.confidence);
        confidenceValue.textContent = data.confidence;
        confidenceFill.style.width = `${confNum}%`;
        confidenceFill.className = `confidence-fill ${isFake ? 'fake' : ''}`;

        // Heatmaps (for video/image)
        heatmapGallery.innerHTML = '';
        const heatmapSection = document.getElementById('heatmapSection');

        if (isAudio) {
            // Audio-specific result display
            heatmapSection.style.display = 'block';
            const headerSmall = heatmapSection.querySelector('.card-header-small');
            headerSmall.innerHTML = `
                <span class="material-icons">audiotrack</span>
                <span>Audio Analysis</span>
            `;
            const desc = heatmapSection.querySelector('.heatmap-desc');
            desc.textContent = isFake
                ? 'This audio appears to be AI-generated or synthetically manipulated.'
                : 'This audio appears to be a genuine human voice recording.';
            heatmapGallery.innerHTML = `
                <div style="text-align:center; padding:15px;">
                    <span class="material-icons" style="font-size:36px; color:${isFake ? '#d13212' : '#1d8102'};">
                        ${isFake ? 'record_voice_over' : 'mic'}
                    </span>
                    <p style="margin-top:8px; font-size:12px; color:#545b64;">
                        Model: Wav2Vec2 Audio Classification
                    </p>
                </div>
            `;
        } else if (data.heatmaps && data.heatmaps.length > 0) {
            heatmapSection.style.display = 'block';
            const headerSmall = heatmapSection.querySelector('.card-header-small');
            headerSmall.innerHTML = `
                <span class="material-icons">thermostat</span>
                <span>AI Heatmap Analysis</span>
            `;
            const desc = heatmapSection.querySelector('.heatmap-desc');
            desc.textContent = 'Red/yellow zones indicate manipulated regions detected by AI.';
            data.heatmaps.forEach((b64Img, index) => {
                const card = document.createElement('div');
                card.className = 'heatmap-card';
                card.innerHTML = `
                    <img src="data:image/jpeg;base64,${b64Img}" alt="Heatmap Frame ${index + 1}">
                    <p>Frame ${index + 1}</p>
                `;
                heatmapGallery.appendChild(card);
            });
        } else {
            heatmapSection.style.display = 'none';
        }

        // Show audio analysis for video files (if available)
        if (data.audio_analysis) {
            heatmapSection.style.display = 'block';
            const audioIsFake = data.audio_analysis.verdict === 'FAKE';
            const audioDiv = document.createElement('div');
            audioDiv.style.cssText = 'margin-top:10px; padding:10px; background:#f8f9fa; border-radius:6px; border:1px solid #eaeded;';
            audioDiv.innerHTML = `
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
                    <span class="material-icons" style="font-size:16px; color:${audioIsFake ? '#d13212' : '#1d8102'};">
                        ${audioIsFake ? 'warning' : 'verified_user'}
                    </span>
                    <strong style="font-size:12px;">Audio Track: ${data.audio_analysis.verdict}</strong>
                </div>
                <p style="font-size:11px; color:#545b64; margin:0;">
                    Confidence: ${data.audio_analysis.confidence}
                </p>
            `;
            heatmapGallery.appendChild(audioDiv);
        }
    }

    function showError(message) {
        loadingState.style.display = 'none';
        resultState.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'block';
        errorMessage.textContent = message;
    }

    // --- Check for snip results from storage (if popup opened after snip) ---
    chrome.storage.local.get(['analysisState'], (result) => {
        const state = result.analysisState;
        if (!state) return;

        if (state.status === 'success' && state.data) {
            switchToTab('results');
            if (state.data.error) {
                showError(state.data.error);
            } else {
                showResult(state.data);
            }
            // Clear after showing
            chrome.storage.local.remove('analysisState');
        } else if (state.status === 'error') {
            switchToTab('results');
            showError(state.message || 'Analysis failed');
            chrome.storage.local.remove('analysisState');
        }
    });
});

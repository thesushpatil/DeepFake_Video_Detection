// Poll storage for analysis results
const checkResults = setInterval(() => {
    chrome.storage.local.get(['analysisState'], (result) => {
        const state = result.analysisState;
        if (!state) return;

        // Show source preview (right-click image URL or snip)
        const sourceCard = document.getElementById('sourceCard');
        const sourcePreview = document.getElementById('sourcePreview');

        if (state.url && sourcePreview.innerHTML === '') {
            sourceCard.style.display = 'block';
            sourcePreview.innerHTML = `<img src="${state.url}" alt="Analyzed media">`;
        } else if (state.originalSnip && sourcePreview.innerHTML === '') {
            sourceCard.style.display = 'block';
            sourcePreview.innerHTML = `<img src="${state.originalSnip}" alt="Snipped area">`;
        }

        // Handle Success
        if (state.status === 'success') {
            clearInterval(checkResults);
            document.getElementById('loadingCard').style.display = 'none';

            const data = state.data;

            if (data.error) {
                showError(data.error);
                return;
            }

            showResult(data);
            // Clear storage after displaying
            chrome.storage.local.remove('analysisState');
        }

        // Handle Error
        else if (state.status === 'error') {
            clearInterval(checkResults);
            showError(state.message || 'Analysis failed. Please try again.');
            chrome.storage.local.remove('analysisState');
        }
    });
}, 500);

function showResult(data) {
    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';

    const isFake = data.verdict === 'FAKE';
    const isAudio = data.media_type === 'audio';

    // Verdict card
    const verdictCard = document.getElementById('verdictCard');
    verdictCard.className = `verdict-card ${isFake ? 'fake' : 'real'}`;

    const verdictIcon = document.getElementById('verdictIcon');
    verdictIcon.textContent = isFake ? 'warning' : 'verified_user';

    const verdictText = document.getElementById('verdictText');
    verdictText.textContent = data.verdict;

    document.getElementById('confidenceLabel').textContent = `Confidence: ${data.confidence}`;

    // Confidence bar
    const confNum = parseFloat(data.confidence);
    document.getElementById('confidenceValue').textContent = data.confidence;

    const confidenceFill = document.getElementById('confidenceFill');
    confidenceFill.style.width = `${confNum}%`;
    confidenceFill.className = `confidence-bar-fill ${isFake ? 'fake' : 'real'}`;

    // Heatmap / Analysis section
    const heatmapCard = document.getElementById('heatmapCard');
    const gallery = document.getElementById('heatmapGallery');
    gallery.innerHTML = '';

    if (isAudio) {
        // Audio-specific result display
        heatmapCard.style.display = 'block';
        const cardHeader = heatmapCard.querySelector('.card-header');
        cardHeader.innerHTML = `
            <span class="material-icons">audiotrack</span>
            <span>Audio Deepfake Analysis</span>
        `;
        const desc = heatmapCard.querySelector('.heatmap-desc');
        desc.textContent = isFake
            ? 'This audio appears to be AI-generated or synthetically manipulated.'
            : 'This audio appears to be a genuine human voice recording.';

        const audioItem = document.createElement('div');
        audioItem.className = 'heatmap-item';
        audioItem.style.textAlign = 'center';
        audioItem.innerHTML = `
            <span class="material-icons" style="font-size:48px; color:${isFake ? '#d13212' : '#1d8102'};">
                ${isFake ? 'record_voice_over' : 'mic'}
            </span>
            <p style="margin-top:8px;">Model: Wav2Vec2 Audio Classification</p>
        `;
        gallery.appendChild(audioItem);
    } else if (data.heatmaps && data.heatmaps.length > 0) {
        // Video/Image heatmaps
        heatmapCard.style.display = 'block';
        const cardHeader = heatmapCard.querySelector('.card-header');
        cardHeader.innerHTML = `
            <span class="material-icons">thermostat</span>
            <span>AI Heatmap Analysis</span>
        `;
        const desc = heatmapCard.querySelector('.heatmap-desc');
        desc.textContent = 'Red and yellow zones highlight regions where the AI detected potential manipulation or synthetic artifacts.';

        data.heatmaps.forEach((b64Img, index) => {
            const item = document.createElement('div');
            item.className = 'heatmap-item';
            item.innerHTML = `
                <img src="data:image/jpeg;base64,${b64Img}" alt="Heatmap Frame ${index + 1}">
                <p>Analyzed Frame ${index + 1}</p>
            `;
            gallery.appendChild(item);
        });
    } else {
        heatmapCard.style.display = 'none';
    }

    // Show audio analysis for video files (if available)
    if (data.audio_analysis) {
        heatmapCard.style.display = 'block';
        const audioIsFake = data.audio_analysis.verdict === 'FAKE';
        const audioDiv = document.createElement('div');
        audioDiv.className = 'heatmap-item';
        audioDiv.style.cssText = 'background:#f0f8f0; border:1px solid ' + (audioIsFake ? '#ef9a9a' : '#a5d6a7') + ';';
        audioDiv.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:6px;">
                <span class="material-icons" style="font-size:20px; color:${audioIsFake ? '#d13212' : '#1d8102'};">
                    ${audioIsFake ? 'warning' : 'verified_user'}
                </span>
                <strong style="font-size:13px;">Audio Track: ${data.audio_analysis.verdict}</strong>
            </div>
            <p>Confidence: ${data.audio_analysis.confidence}</p>
        `;
        gallery.appendChild(audioDiv);
    }
}

function showError(message) {
    document.getElementById('loadingCard').style.display = 'none';
    document.getElementById('resultSection').style.display = 'none';

    const errorCard = document.getElementById('errorCard');
    errorCard.style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

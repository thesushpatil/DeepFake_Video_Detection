document.addEventListener("DOMContentLoaded", () => {
    // --- Detection History (localStorage) ---
    const HISTORY_KEY = 'deepfake_detection_history';

    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveHistory(history) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    function addToHistory(entry) {
        const history = getHistory();
        history.unshift(entry); // newest first
        // Keep max 50 entries
        if (history.length > 50) history.pop();
        saveHistory(history);
        renderDashboard();
    }

    function clearHistory() {
        localStorage.removeItem(HISTORY_KEY);
        renderDashboard();
    }

    function getMediaType(filename) {
        if (filename.match(/\.(wav|mp3|flac|ogg|m4a)$/i)) return 'audio';
        if (filename.match(/\.(mp4|avi|mov)$/i)) return 'video';
        if (filename.match(/\.(png|jpg|jpeg)$/i)) return 'image';
        return 'unknown';
    }

    function getMediaIcon(type) {
        switch (type) {
            case 'audio': return 'audiotrack';
            case 'video': return 'videocam';
            case 'image': return 'image';
            default: return 'insert_drive_file';
        }
    }

    function renderDashboard() {
        const history = getHistory();
        const historyBody = document.getElementById('historyBody');
        const emptyHistory = document.getElementById('emptyHistory');
        const historyTable = document.getElementById('historyTable');

        // Update metrics
        const totalDetections = history.length;
        const fakeCount = history.filter(h => h.verdict === 'FAKE').length;
        const realCount = history.filter(h => h.verdict === 'REAL').length;
        const times = history.filter(h => h.timeTaken).map(h => parseFloat(h.timeTaken));
        const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : '0.0';

        document.getElementById('recentDetections').innerText = totalDetections;
        document.getElementById('fakeCount').innerText = fakeCount;
        document.getElementById('realCount').innerText = realCount;
        document.getElementById('avgTime').innerText = `${avgTime}s`;

        // Render table
        if (history.length === 0) {
            historyTable.style.display = 'none';
            emptyHistory.style.display = 'block';
            return;
        }

        historyTable.style.display = 'table';
        emptyHistory.style.display = 'none';

        historyBody.innerHTML = history.map((entry, index) => {
            const isFake = entry.verdict === 'FAKE';
            const icon = getMediaIcon(entry.mediaType);

            return `<tr>
                <td class="row-number">${totalDetections - index}</td>
                <td class="file-name" title="${entry.filename}">${entry.filename}</td>
                <td>
                    <span class="type-badge ${entry.mediaType}">
                        <span class="material-icons">${icon}</span>
                        ${entry.mediaType.charAt(0).toUpperCase() + entry.mediaType.slice(1)}
                    </span>
                </td>
                <td>
                    <span class="verdict-badge ${isFake ? 'fake' : 'real'}">
                        <span class="material-icons">${isFake ? 'warning' : 'verified_user'}</span>
                        ${entry.verdict}
                    </span>
                </td>
                <td class="confidence-cell">${entry.confidence}</td>
                <td class="time-cell">${entry.timeTaken}s</td>
                <td class="date-cell">${entry.date}</td>
            </tr>`;
        }).join('');
    }

    // --- 1. Tab Navigation Logic ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-section');
            document.getElementById(targetId).classList.add('active');

            // Refresh dashboard when switching to it
            if (targetId === 'dashboard') {
                renderDashboard();
            }
        });
    });

    // --- Clear History Button ---
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all detection history?')) {
            clearHistory();
        }
    });

    // --- 2. File Upload & Processing Logic ---
    const fileInput = document.getElementById('fileInput');
    const mediaPreview = document.getElementById('mediaPreview');
    const progressContainer = document.getElementById('progressContainer');
    const resultContainer = document.getElementById('resultContainer');
    const emptyAnalysis = document.getElementById('emptyAnalysis');

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Switch to "Detection" Tab automatically
        document.querySelector('[data-section="detection"]').click();

        // Show Preview based on file type
        const fileURL = URL.createObjectURL(file);
        if (file.type.startsWith('video/')) {
            mediaPreview.innerHTML = `<video src="${fileURL}" controls autoplay muted style="max-width:100%; max-height:100%;"></video>`;
        } else if (file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3|flac|ogg|m4a)$/i)) {
            mediaPreview.innerHTML = `
                <div style="text-align:center; padding:20px; color:#fff;">
                    <span class="material-icons" style="font-size:64px; color:#ff9900;">audiotrack</span>
                    <p style="margin-top:10px; font-size:14px;">${file.name}</p>
                    <audio src="${fileURL}" controls style="margin-top:15px; width:100%;"></audio>
                </div>`;
        } else {
            mediaPreview.innerHTML = `<img src="${fileURL}" alt="Preview" style="max-width:100%; max-height:100%;">`;
        }

        // Update UI states
        emptyAnalysis.style.display = 'none';
        resultContainer.style.display = 'none';
        progressContainer.style.display = 'block';

        // Prepare data for FastAPI
        const formData = new FormData();
        formData.append('file', file);

        try {
            const startTime = Date.now();

            // Send to FastAPI Backend
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            const endTime = Date.now();
            const timeTaken = ((endTime - startTime) / 1000).toFixed(1);

            // Hide loader
            progressContainer.style.display = 'none';
            resultContainer.style.display = 'block';

            if (data.error) {
                showAlert("Error", data.error);
                resultContainer.style.display = 'none';
                return;
            }

            // Add to detection history
            const historyEntry = {
                filename: file.name,
                mediaType: data.media_type || getMediaType(file.name),
                verdict: data.verdict,
                confidence: data.confidence,
                timeTaken: timeTaken,
                date: new Date().toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                })
            };
            addToHistory(historyEntry);

            // Check if this is an audio response
            if (data.media_type === 'audio') {
                displayAudioResult(data);
            } else {
                displayVideoImageResult(data);
            }

        } catch (error) {
            progressContainer.style.display = 'none';
            showAlert("Connection Error", "Could not connect to the AI Backend. Ensure FastAPI is running.");
            console.error(error);
        }
    });

    // --- Display Audio Detection Result ---
    function displayAudioResult(data) {
        const isFake = data.verdict === 'FAKE';

        document.getElementById('resultTitle').innerText = isFake ? 'AI-Generated Audio Detected!' : 'Authentic Human Voice';
        document.getElementById('resultTitle').style.color = isFake ? 'var(--danger)' : 'var(--success)';

        const icon = document.getElementById('resultIcon');
        icon.innerText = isFake ? 'warning' : 'verified_user';
        icon.className = `material-icons result-icon ${isFake ? 'fake' : 'real'}`;

        document.getElementById('confidenceText').innerText = data.confidence;

        const confNum = parseFloat(data.confidence);
        const confidenceFill = document.querySelector('.confidence-fill');
        if (confidenceFill) {
            confidenceFill.style.width = `${confNum}%`;
        }

        // Audio-specific result details
        const detailsDiv = document.querySelector('.result-details');
        detailsDiv.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <span class="material-icons" style="font-size:48px; color:${isFake ? 'var(--danger)' : 'var(--success)'};">
                    ${isFake ? 'record_voice_over' : 'mic'}
                </span>
                <p style="margin-top:15px; font-size:16px; font-weight:500;">
                    ${isFake ? 'This audio appears to be AI-generated or synthetically manipulated.' : 'This audio appears to be a genuine human voice recording.'}
                </p>
                <div style="margin-top:15px; padding:12px; background:#f8f9fa; border-radius:8px; font-size:13px; color:var(--text-light);">
                    <p><strong>Analysis Type:</strong> Audio Deepfake Detection</p>
                    <p><strong>Model:</strong> Wav2Vec2 Audio Classification</p>
                    <p><strong>Verdict:</strong> ${data.verdict} (${data.confidence} confidence)</p>
                </div>
            </div>
        `;
    }

    // --- Display Video/Image Detection Result ---
    function displayVideoImageResult(data) {
        const isFake = data.verdict === 'FAKE';

        document.getElementById('resultTitle').innerText = isFake ? 'Manipulation Detected!' : 'Authentic Media';
        document.getElementById('resultTitle').style.color = isFake ? 'var(--danger)' : 'var(--success)';

        const icon = document.getElementById('resultIcon');
        icon.innerText = isFake ? 'warning' : 'verified_user';
        icon.className = `material-icons result-icon ${isFake ? 'fake' : 'real'}`;

        document.getElementById('confidenceText').innerText = data.confidence;

        const confNum = parseFloat(data.confidence);
        const confidenceFill = document.querySelector('.confidence-fill');
        if (confidenceFill) {
            confidenceFill.style.width = `${confNum}%`;
        }

        // Render Heatmaps into the details section
        const detailsDiv = document.querySelector('.result-details');
        detailsDiv.innerHTML = `<p>${isFake ? "High probability of AI manipulation found in these specific regions:" : "No signs of facial manipulation detected."}</p>`;

        if (data.heatmaps && data.heatmaps.length > 0) {
            const gallery = document.createElement('div');
            gallery.className = 'heatmap-gallery';

            data.heatmaps.forEach((b64Img, index) => {
                const card = document.createElement('div');
                card.className = 'heatmap-card';
                card.innerHTML = `
                    <p style="font-size:12px; margin:5px 0;">Analyzed Frame ${index + 1}</p>
                    <img src="data:image/jpeg;base64,${b64Img}" alt="AI Heatmap">
                `;
                gallery.appendChild(card);
            });
            detailsDiv.appendChild(gallery);
        }

        // Show audio analysis if available (for video files)
        if (data.audio_analysis) {
            const audioDiv = document.createElement('div');
            audioDiv.style.cssText = 'margin-top:20px; padding:15px; background:#f8f9fa; border-radius:8px; border:1px solid #eaeded;';
            const audioIsFake = data.audio_analysis.verdict === 'FAKE';
            audioDiv.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <span class="material-icons" style="color:${audioIsFake ? 'var(--danger)' : 'var(--success)'};">
                        ${audioIsFake ? 'warning' : 'verified_user'}
                    </span>
                    <strong>Audio Track Analysis</strong>
                </div>
                <p style="font-size:13px; color:var(--text-light);">
                    Audio Verdict: <strong style="color:${audioIsFake ? 'var(--danger)' : 'var(--success)'}">${data.audio_analysis.verdict}</strong>
                    (${data.audio_analysis.confidence} confidence)
                </p>
            `;
            detailsDiv.appendChild(audioDiv);
        }
    }

    // --- 3. URL Alert Mock logic ---
    window.analyzeFromUrl = function() {
        showAlert("Coming Soon", "URL analysis is under development. Please upload a file instead.");
    };

    // --- 4. Custom Alert Modal Logic ---
    const modal = document.getElementById('alertModal');
    document.getElementById('modalClose').onclick = () => modal.style.display = "none";

    function showAlert(title, message) {
        document.getElementById('alertContent').innerHTML = `<h3>${title}</h3><p>${message}</p>`;
        modal.style.display = "flex";
    }

    // --- Initial render of dashboard from saved history ---
    renderDashboard();
});

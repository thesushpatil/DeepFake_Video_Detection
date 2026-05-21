const checkResults = setInterval(() => {
    chrome.storage.local.get(['analysisState'], (result) => {
        const state = result.analysisState;
        if (!state) return;

        // Preview what is being analyzed (either right-click URL or Snipped Box)
        if (state.url && document.getElementById('mediaPreviewContainer').innerHTML === '') {
            document.getElementById('mediaPreviewContainer').innerHTML =
                `<img src="${state.url}" class="original-img" alt="Media being analyzed">`;
        } else if (state.originalSnip && document.getElementById('mediaPreviewContainer').innerHTML === '') {
            document.getElementById('mediaPreviewContainer').innerHTML =
                `<p style="color:#aaa; font-size:14px;">Your Snip:</p><img src="${state.originalSnip}" class="original-img">`;
        }

        // Handle Success
        if (state.status === 'success') {
            clearInterval(checkResults);
            document.getElementById('loader').style.display = 'none';
            document.getElementById('resultBox').style.display = 'block';

            const data = state.data;
            if (data.error) {
                document.getElementById('verdictText').innerHTML = `<span class="error">${data.error}</span>`;
                return;
            }

            const verdictEl = document.getElementById('verdictText');
            verdictEl.innerText = `${data.verdict} (${data.confidence})`;
            verdictEl.className = `verdict ${data.verdict.toLowerCase()}`;

            const gallery = document.getElementById('gallery');
            gallery.innerHTML = '';
            data.heatmaps.forEach((b64Img, index) => {
                const card = document.createElement('div');
                card.className = 'heatmap-card';
                card.innerHTML = `
                    <p style="margin:0 0 10px 0; font-size:14px; color:#ddd;">Frame ${index + 1}</p>
                    <img src="data:image/jpeg;base64,${b64Img}" alt="Heatmap">
                `;
                gallery.appendChild(card);
            });
        }

        // Handle Error
        else if (state.status === 'error') {
            clearInterval(checkResults);
            document.getElementById('loader').style.display = 'none';
            document.getElementById('resultBox').style.display = 'block';
            document.getElementById('verdictText').innerHTML = `<span class="error">Error: ${state.message}<br><br><small>Make sure your FastAPI server is running on 127.0.0.1:8000!</small></span>`;
        }
    });
}, 500);
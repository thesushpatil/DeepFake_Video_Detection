// --- 1. SETUP RIGHT-CLICK MENU ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "analyze-deepfake",
        title: "🕵️ Analyze for Deepfakes",
        contexts: ["image", "video"]
    });
});

// --- 2. HANDLE RIGHT-CLICK (Images & Video) ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "analyze-deepfake") {
        const mediaUrl = info.srcUrl;
        const mediaType = info.mediaType;

        // Store loading state
        chrome.storage.local.set({ analysisState: { status: 'loading', url: mediaUrl } }, () => {
            chrome.tabs.create({ url: "result.html" });
        });

        try {
            const response = await fetch(mediaUrl);
            const blob = await response.blob();
            const formData = new FormData();
            let ext = mediaType === 'video' ? 'mp4' : 'jpg';
            formData.append("file", blob, `web_upload.${ext}`);

            // Send to FastAPI
            const apiResponse = await fetch("http://127.0.0.1:8000/predict", {
                method: "POST",
                body: formData
            });
            const data = await apiResponse.json();

            chrome.storage.local.set({
                analysisState: { status: 'success', data: data, url: mediaUrl }
            });

        } catch (error) {
            chrome.storage.local.set({
                analysisState: { status: 'error', message: error.message }
            });
        }
    }
});

// --- 3. HANDLE SNIPPING TOOL CROP & SEND ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "capture_area") {

        // Store loading state
        chrome.storage.local.set({ analysisState: { status: 'loading' } });

        // Capture visible screen
        chrome.tabs.captureVisibleTab(null, { format: "png" }, async (dataUrl) => {
            try {
                const coords = request.coords;
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                const bitmap = await createImageBitmap(blob);

                // Crop using OffscreenCanvas
                const canvas = new OffscreenCanvas(coords.w, coords.h);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(bitmap, coords.x, coords.y, coords.w, coords.h, 0, 0, coords.w, coords.h);

                const croppedBlob = await canvas.convertToBlob({ type: 'image/jpeg' });
                const formData = new FormData();
                formData.append("file", croppedBlob, "snip.jpg");

                // Send to FastAPI
                const apiResponse = await fetch("http://127.0.0.1:8000/predict", {
                    method: "POST",
                    body: formData
                });
                const data = await apiResponse.json();

                // Convert crop to Base64 to show in results
                const reader = new FileReader();
                reader.onloadend = function() {
                    chrome.storage.local.set({
                        analysisState: { status: 'success', data: data, originalSnip: reader.result }
                    });
                };
                reader.readAsDataURL(croppedBlob);

            } catch (error) {
                chrome.storage.local.set({
                    analysisState: { status: 'error', message: error.message }
                });
            }
        });
    }
});

if (!document.getElementById('df-snipper-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'df-snipper-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.4); z-index: 999999; cursor: crosshair;
    `;

    const selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
        position: absolute; border: 2px dashed #00ff00; background: rgba(0, 255, 0, 0.15);
        display: none; pointer-events: none;
    `;

    overlay.appendChild(selectionBox);
    document.body.appendChild(overlay);

    let startX, startY, isDrawing = false;

    overlay.addEventListener('mousedown', (e) => {
        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
    });

    overlay.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const currentX = e.clientX;
        const currentY = e.clientY;
        selectionBox.style.width = Math.abs(currentX - startX) + 'px';
        selectionBox.style.height = Math.abs(currentY - startY) + 'px';
        selectionBox.style.left = Math.min(currentX, startX) + 'px';
        selectionBox.style.top = Math.min(currentY, startY) + 'px';
    });

    overlay.addEventListener('mouseup', (e) => {
        isDrawing = false;
        const rect = selectionBox.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        const coords = {
            x: rect.left * dpr,
            y: rect.top * dpr,
            w: rect.width * dpr,
            h: rect.height * dpr
        };

        document.body.removeChild(overlay);

        // If the box is large enough, trigger the capture
        if (coords.w > 10 && coords.h > 10) {
            chrome.runtime.sendMessage({ action: "capture_area", coords: coords });
        }
    });
}
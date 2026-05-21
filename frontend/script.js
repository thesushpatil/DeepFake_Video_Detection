document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Tab Navigation Logic ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-section');
            document.getElementById(targetId).classList.add('active');
        });
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

        // Show Preview
        const fileURL = URL.createObjectURL(file);
        if (file.type.startsWith('video/')) {
            mediaPreview.innerHTML = `<video src="${fileURL}" controls autoplay muted style="max-width:100%; max-height:100%;"></video>`;
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

            // Update Dashboard Metrics
            document.getElementById('recentDetections').innerText = parseInt(document.getElementById('recentDetections').innerText) + 1;
            document.getElementById('avgTime').innerText = `${timeTaken}s`;

            // Hide loader
            progressContainer.style.display = 'none';
            resultContainer.style.display = 'block';

            if (data.error) {
                showAlert("Error", data.error);
                return;
            }

            // Fill Results
            const isFake = data.verdict === 'FAKE';
            document.getElementById('resultTitle').innerText = isFake ? 'Manipulation Detected!' : 'Authentic Media';
            document.getElementById('resultTitle').style.color = isFake ? 'var(--danger)' : 'var(--success)';

            const icon = document.getElementById('resultIcon');
            icon.innerText = isFake ? 'warning' : 'verified_user';
            icon.className = `material-icons result-icon ${isFake ? 'fake' : 'real'}`;

            document.getElementById('confidenceText').innerText = data.confidence;

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

        } catch (error) {
            progressContainer.style.display = 'none';
            showAlert("Connection Error", "Could not connect to the AI Backend. Ensure FastAPI is running.");
            console.error(error);
        }
    });

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

    // --- 5. Team Member Interaction ---
//     window.showTeamMember = function(member) {
//         const members = {
//             alex: {
//                 name: "Alex Johnson",
//                 role: "Lead AI Engineer",
//                 details: "5+ years in computer vision research. PhD in Machine Learning from Stanford. Published 15+ papers on deepfake detection and media forensics."
//             },
//             sarah: {
//                 name: "Sarah Chen",
//                 role: "Data Scientist",
//                 details: "Expert in statistical modeling and neural networks. MS in Data Science from MIT. Specialized in training robust AI models on large-scale datasets."
//             },
//             mike: {
//                 name: "Mike Rodriguez",
//                 role: "Backend Developer",
//                 details: "Full-stack engineer with 7+ years experience. Expert in FastAPI, cloud architecture, and scalable system design for AI applications."
//             },
//             emma: {
//                 name: "Emma Wilson",
//                 role: "UX Designer",
//                 details: "Human-centered design specialist. 6+ years creating accessible interfaces for complex AI systems. Focus on ethical AI user experiences."
//             }
//         };
//
//         const memberData = members[member];
//         showAlert(`${memberData.name} - ${memberData.role}`, memberData.details);
//     };
});
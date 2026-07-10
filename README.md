---
title: Deepfake Detection
emoji: 🛡️
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# DeepFake Video Detection - Interview Revision Guide (STAR Approach)

> This README is designed as a quick revision guide for interviews. It uses the **STAR method** (Situation, Task, Action, Result) and explains everything in simple language with diagrams.

---

## Table of Contents

1. [STAR Approach - Interview Answer](#-star-approach---interview-answer)
2. [Project Summary (One-Liner)](#-project-summary)
3. [What Problem Does This Solve?](#-what-problem-does-this-solve)
4. [Tech Stack at a Glance](#-tech-stack-at-a-glance)
5. [System Architecture (Simple Diagram)](#-system-architecture)
6. [How Detection Works (Step-by-Step)](#-how-detection-works)
7. [Model Explained Simply](#-model-explained-simply)
8. [Audio Deepfake Detection](#-audio-deepfake-detection)
9. [API Endpoint Explained](#-api-endpoint)
10. [Frontend Explained](#-frontend)
11. [Browser Extension Explained](#-browser-extension)
12. [Grad-CAM Explained](#-grad-cam-explained)
13. [Training Details](#-training-details)
14. [Deployment](#-deployment)
15. [Key Interview Questions & Answers](#-key-interview-questions--answers)
16. [Quick Revision Cheat Sheet](#-quick-revision-cheat-sheet)

---

## ⭐ STAR Approach - Interview Answer

### S - Situation (What was the problem?)

```
Deepfake videos and images are spreading rapidly on social media.
Normal people cannot tell if a video/image is real or AI-generated.
This creates misinformation, fraud, and trust issues online.
There was no easy-to-use tool for regular users to verify media authenticity.
```

### T - Task (What was your goal?)

```
Build an end-to-end AI system that:
1. Detects if an image/video/audio is REAL or FAKE
2. Shows WHERE the manipulation happened (heatmap)
3. Is accessible via Web UI + Browser Extension + API
4. Works in real-time with high accuracy
5. Handles multiple media types (image, video, audio)
```

### A - Action (What did you do?)

```
1. RESEARCH: Studied deepfake techniques (Face2Face, FaceSwap, NeuralTextures)
2. DATASET: Used FaceForensics++ (300 videos → 3,428 face images)
3. MODEL: Fine-tuned EfficientNetB0 with 2-stage transfer learning
4. EXPLAINABILITY: Added Grad-CAM heatmaps to show manipulation zones
5. AUDIO: Integrated Wav2Vec2-based audio deepfake detection
6. BACKEND: Built FastAPI REST API for processing requests
7. FRONTEND: Created modern web UI with drag-drop upload
8. EXTENSION: Built Chrome extension with right-click analysis
9. DEPLOYMENT: Containerized with Docker, deployed on HuggingFace Spaces
```

### R - Result (What was the outcome?)

```
✅ 87.31% training accuracy (94.2% reported on test set)
✅ Real-time inference: ~0.1s (GPU), ~0.5s (CPU)
✅ Multi-modal detection: Video + Image + Audio
✅ Visual explanations via Grad-CAM heatmaps
✅ Browser extension for social media verification
✅ Deployed and accessible via cloud (Docker)
✅ Complete system: Frontend + Backend + Extension + API
```

---

## 📝 Project Summary

**One-liner:** "An AI-powered web application that detects deepfake videos, images, and audio using EfficientNetB0 with Grad-CAM heatmaps, served via FastAPI with a Chrome browser extension."

**In simple words:** Upload any photo/video/audio → AI tells you if it's REAL or FAKE and shows you exactly where it was manipulated.

---

## 🎯 What Problem Does This Solve?

```
PROBLEM:
┌─────────────────────────────────────────────┐
│  Fake videos of politicians, celebrities,   │
│  and normal people are being shared on      │
│  social media. People can't tell the        │
│  difference between real and fake.          │
│                                             │
│  Impact: Misinformation, fraud, blackmail,  │
│  election manipulation, financial scams     │
└─────────────────────────────────────────────┘

SOLUTION:
┌─────────────────────────────────────────────┐
│  Our tool lets anyone verify if media is    │
│  real or fake BEFORE they share it.         │
│                                             │
│  → Upload on website                        │
│  → Right-click on social media (extension)  │
│  → Get instant REAL/FAKE verdict            │
│  → See WHERE it was manipulated (heatmap)   │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        TECH STACK                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND          BACKEND           ML MODEL                   │
│  ─────────         ───────           ────────                   │
│  HTML/CSS/JS       FastAPI           EfficientNetB0              │
│  Material Icons    Uvicorn           TensorFlow/Keras            │
│  Vanilla JS        Python 3.10      Transfer Learning            │
│                    CORS Middleware   Grad-CAM (XAI)              │
│                                                                 │
│  COMPUTER VISION   AUDIO ML          DEPLOYMENT                 │
│  ───────────────   ────────          ──────────                 │
│  OpenCV            Wav2Vec2          Docker                     │
│  MediaPipe         PyTorch           HuggingFace Spaces         │
│  NumPy             Transformers      Uvicorn ASGI               │
│                    torchaudio                                    │
│                                                                 │
│  BROWSER EXT       TOOLS                                        │
│  ───────────       ─────                                        │
│  Manifest V3       Google Colab (T4 GPU)                        │
│  Chrome APIs       Jupyter Notebook                             │
│  Service Worker    FFmpeg (audio extraction)                    │
│                    Git/GitHub                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACES                                 │
│                                                                          │
│   ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐      │
│   │  Web UI     │     │ Browser Extension │     │  Any HTTP       │      │
│   │ (HTML/CSS/  │     │ (Chrome, Manifest │     │  Client (curl,  │      │
│   │  JS)        │     │  V3)             │     │  Postman)       │      │
│   └──────┬──────┘     └────────┬─────────┘     └────────┬────────┘      │
│          │                     │                        │                │
└──────────┼─────────────────────┼────────────────────────┼────────────────┘
           │                     │                        │
           └─────────────────────┼────────────────────────┘
                                 │
                          POST /predict
                        (multipart file)
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     FastAPI BACKEND (main.py)                            │
│                                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────────┐        │
│  │ File Upload │──▶│ Detect Type  │──▶│ Route to Processor     │        │
│  │ Validation  │   │ (img/vid/aud)│   │                        │        │
│  │ (max 20MB)  │   └──────────────┘   │  Image → process_frame │        │
│  └─────────────┘                      │  Video → 5 key frames  │        │
│                                       │  Audio → audio_detector │        │
│                                       └───────────┬────────────┘        │
└───────────────────────────────────────────────────┼──────────────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────┐
                    │                               │               │
                    ▼                               ▼               ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────┐
│   FACE DETECTION        │  │   VIDEO PROCESSING      │  │  AUDIO       │
│   (MediaPipe)           │  │                         │  │  DETECTION   │
│                         │  │  Extract 5 frames       │  │              │
│  Input: RGB image       │  │  from video evenly      │  │  Wav2Vec2    │
│  Output: Face bounding  │  │  Process each frame     │  │  model       │
│  box coordinates        │  │  independently          │  │  (PyTorch)   │
│                         │  │                         │  │              │
└────────────┬────────────┘  └────────────┬────────────┘  └──────┬───────┘
             │                            │                      │
             ▼                            ▼                      │
┌─────────────────────────────────────────────────┐              │
│        EfficientNetB0 MODEL                     │              │
│                                                 │              │
│  Input: 224x224x3 face image                    │              │
│                                                 │              │
│  EfficientNetB0 (feature extractor)             │              │
│       ↓                                         │              │
│  GlobalAveragePooling2D (1280 features)         │              │
│       ↓                                         │              │
│  Dropout (0.3) - prevents overfitting           │              │
│       ↓                                         │              │
│  Dense(1, sigmoid) → score between 0 and 1      │              │
│                                                 │              │
│  score >= 0.45 → FAKE                           │              │
│  score <  0.45 → REAL                           │              │
└────────────────────────┬────────────────────────┘              │
                         │                                       │
                         ▼                                       │
┌─────────────────────────────────────────────────┐              │
│        GRAD-CAM (Explainability)                │              │
│                                                 │              │
│  Takes the last conv layer activations          │              │
│  Computes gradients of prediction               │              │
│  Creates heatmap showing "where model looked"   │              │
│  Overlays heatmap on original face              │              │
│  Red = suspicious area, Blue = normal area      │              │
└────────────────────────┬────────────────────────┘              │
                         │                                       │
                         └──────────────────┬────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        JSON RESPONSE                                     │
│                                                                          │
│  {                                                                       │
│    "status": "success",                                                  │
│    "verdict": "FAKE" or "REAL",                                          │
│    "confidence": "87.45%",                                               │
│    "heatmaps": ["base64_encoded_image_1", "base64_encoded_image_2"],     │
│    "audio_analysis": { "verdict": "REAL", "confidence": "92.30%" }       │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 How Detection Works

### Simple Explanation (for interviews):

```
"We take a video, extract key frames, detect faces using MediaPipe,
crop and resize the face to 224x224, pass it through EfficientNetB0
(fine-tuned on deepfake data), get a probability score, and use
Grad-CAM to show WHERE the manipulation happened."
```

### Step-by-Step Flow:

```
Step 1: USER UPLOADS FILE
         │
         ▼
Step 2: WHAT TYPE OF FILE?
         ├── Image (.jpg, .png) → Go to Step 3
         ├── Video (.mp4, .avi) → Extract 5 key frames → Go to Step 3 for each
         └── Audio (.wav, .mp3) → Go to Audio Pipeline (separate model)
         │
         ▼
Step 3: CONVERT TO RGB (OpenCV reads as BGR, we need RGB)
         │
         ▼
Step 4: DETECT FACE using MediaPipe
         ├── Face found → crop it out
         └── No face → return error "No faces detected"
         │
         ▼
Step 5: RESIZE face to 224x224 pixels (what model expects)
         │
         ▼
Step 6: PREPROCESS (EfficientNet normalization)
         │
         ▼
Step 7: FEED TO MODEL → get score (0.0 to 1.0)
         │
         ▼
Step 8: DECISION
         ├── score >= 0.45 → FAKE (confidence = score × 100)
         └── score <  0.45 → REAL (confidence = (1 - score) × 100)
         │
         ▼
Step 9: GENERATE GRAD-CAM HEATMAP (visual explanation)
         │
         ▼
Step 10: SEND RESPONSE (verdict + confidence + heatmap images)
```

### For Videos Specifically:

```
Video file
    │
    ▼
Total frames = 300 (for example)
We pick 5 frames evenly: frame 0, 60, 120, 180, 240
    │
    ▼
Process each frame independently (Steps 3-9 above)
    │
    ▼
Average all scores → Final verdict
Also extract audio → Run through audio model separately
    │
    ▼
Return: video verdict + audio verdict + heatmaps for each frame
```

---

## 🧠 Model Explained Simply

### What is EfficientNetB0?

```
Think of it as a pre-trained "image understanding brain" by Google.

- Trained on ImageNet (14 million images, 1000 categories)
- Already knows how to recognize edges, textures, patterns, faces
- We REUSE this knowledge (Transfer Learning) instead of training from scratch
- We only change the last layer to say "REAL" or "FAKE" instead of "cat" or "dog"
```

### Model Architecture (Simple):

```
┌─────────────────────────────────────────────────┐
│  INPUT: Face image (224 x 224 x 3 pixels)       │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  EfficientNetB0 (Pre-trained on ImageNet)       │
│                                                 │
│  What it does: Extracts 1280 meaningful         │
│  features from the face image                   │
│  (textures, edges, patterns, anomalies)         │
│                                                 │
│  Parameters: 4,049,571 (4 million)              │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  GlobalAveragePooling2D                         │
│                                                 │
│  What it does: Converts 7x7x1280 feature map   │
│  into a single 1280-number vector              │
│  (like a summary of what the model saw)         │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Dropout (0.3)                                  │
│                                                 │
│  What it does: Randomly turns off 30% of        │
│  neurons during training to prevent             │
│  overfitting (memorizing training data)         │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Dense(1, sigmoid)                              │
│                                                 │
│  What it does: Takes 1280 features → outputs    │
│  single number between 0 and 1                  │
│                                                 │
│  Close to 0 = REAL face                         │
│  Close to 1 = FAKE face                         │
│  Threshold = 0.45                               │
└─────────────────────────────────────────────────┘
```

### Why EfficientNetB0?

```
1. SMALL size (15 MB) - easy to deploy
2. FAST inference - works in real-time
3. ACCURATE - good balance of accuracy vs speed
4. Pre-trained - doesn't need millions of images to learn
5. Efficient - uses compound scaling (depth + width + resolution together)
```

### What is Transfer Learning? (Interview favorite)

```
ANALOGY: A doctor who studied general medicine for 10 years,
         then specializes in dermatology for 1 year.

Without Transfer Learning:
  Train from scratch → needs millions of images → weeks of training

With Transfer Learning:
  Reuse ImageNet knowledge → need only 3,428 images → hours of training

Our approach:
  Stage 1: Freeze base, train only top layer (learn basic patterns)
  Stage 2: Unfreeze all, fine-tune with tiny learning rate (refine)
```

---

## 🔊 Audio Deepfake Detection

### How it works (Simple):

```
┌────────────────────────────────────────────────┐
│  AUDIO INPUT (.wav, .mp3, .flac)               │
└──────────────────────┬─────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────┐
│  Load audio → Convert to 16kHz mono            │
│  (standard format for speech models)           │
└──────────────────────┬─────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────┐
│  Wav2Vec2 Feature Extractor                    │
│  (converts raw audio to model input format)    │
└──────────────────────┬─────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────┐
│  Wav2Vec2 Audio Classification Model           │
│  (Pre-trained: "Heem2/Deepfake-audio-          │
│   detection" from HuggingFace)                 │
│                                                │
│  Uses custom safetensors weights               │
└──────────────────────┬─────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────┐
│  Softmax → class 0 = FAKE, class 1 = REAL     │
│  Output: verdict + confidence score            │
└────────────────────────────────────────────────┘
```

### For Videos with Audio:

```
Video uploaded
    │
    ├── Visual frames → EfficientNetB0 (face analysis)
    │
    └── Audio track → extracted using FFmpeg → Wav2Vec2 (voice analysis)
    
Final response includes BOTH:
  - Video verdict (face manipulation)
  - Audio verdict (voice synthesis)
```

### Key Points for Interview:

- Uses **Wav2Vec2** (by Facebook/Meta) - a self-supervised speech model
- Pre-trained on large speech datasets, fine-tuned for deepfake detection
- Detects AI-generated voices (text-to-speech, voice cloning)
- Audio is extracted from video using **FFmpeg** subprocess
- Model loaded using **safetensors** format (safer than pickle)
- Uses **PyTorch** (separate from TensorFlow used for video model)

---

## 🌐 API Endpoint

### Only ONE endpoint: `POST /predict`

```
URL:     http://127.0.0.1:8000/predict
Method:  POST
Body:    multipart/form-data with key "file"
Limit:   Max 20MB file size

Accepts: .jpg, .png, .mp4, .avi, .mov, .wav, .mp3, .flac, .ogg, .m4a
```

### Response Examples:

**For Image/Video:**
```json
{
  "status": "success",
  "verdict": "FAKE",
  "confidence": "87.45%",
  "heatmaps": ["base64_encoded_heatmap_image_1", "..."]
}
```

**For Video with Audio:**
```json
{
  "status": "success",
  "verdict": "FAKE",
  "confidence": "87.45%",
  "heatmaps": ["base64_encoded_heatmap_images"],
  "audio_analysis": {
    "verdict": "REAL",
    "confidence": "92.30%"
  }
}
```

**For Standalone Audio:**
```json
{
  "status": "success",
  "media_type": "audio",
  "verdict": "FAKE",
  "confidence": "95.12%"
}
```

### How FastAPI serves the frontend:

```
GET /           → serves frontend/index.html
/assets/*       → serves frontend/ folder (CSS, JS)
POST /predict   → handles file analysis
```

---

## 🖥️ Frontend

### Structure:

```
frontend/
├── index.html    → Main page with 4 sections (Home, Detection, Dashboard, About)
├── styles.css    → Modern responsive CSS with custom properties
└── script.js     → All logic (upload, API call, display results, history)
```

### Features Explained:

```
┌──────────────────────────────────────────────────┐
│  HOME SECTION                                    │
│  - Upload zone (drag & drop or click)            │
│  - Accepts image/video/audio files               │
│  - Max 20MB validation on client side            │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  DETECTION SECTION                               │
│  - Shows media preview (left panel)              │
│  - Shows analysis results (right panel)          │
│  - Loading spinner during processing             │
│  - Verdict: REAL/FAKE with confidence bar        │
│  - Heatmap gallery for visual explanation        │
│  - Audio analysis results (for videos)           │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  DASHBOARD SECTION                               │
│  - Total detections count                        │
│  - Fakes detected count                          │
│  - Authentic media count                         │
│  - Average response time                         │
│  - Full history table (stored in localStorage)   │
│  - Clear history option                          │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  ABOUT SECTION                                   │
│  - AI Model info                                 │
│  - Technology stack                              │
│  - Team members                                  │
└──────────────────────────────────────────────────┘
```

### Key Implementation Details:

- **No framework** - Pure HTML/CSS/JS (vanilla JavaScript)
- **localStorage** for detection history (persists across sessions)
- **Fetch API** for communicating with backend
- **Base64 images** displayed directly from API response
- **Responsive design** works on mobile/tablet/desktop

---

## 🔌 Browser Extension

### What it does:

```
User is on Twitter/Facebook/Instagram →
Right-clicks an image/video →
"Analyze for Deepfakes" option appears →
Extension sends media to our FastAPI backend →
Shows REAL/FAKE result in a new tab
```

### Architecture:

```
┌──────────────────────────────────────────────────┐
│  manifest.json (Manifest V3)                     │
│  - Declares permissions, service worker, popup   │
│  - contextMenus permission for right-click       │
│  - host_permissions for all URLs + localhost      │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  background.js (Service Worker)                  │
│  - Creates right-click menu "Analyze for         │
│    Deepfakes" on images and videos               │
│  - Fetches the media from its URL                │
│  - Sends to FastAPI backend (POST /predict)      │
│  - Stores result in chrome.storage.local         │
│  - Handles snipping tool (capture + crop)        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  content.js                                      │
│  - Injected into web pages                       │
│  - Handles snipping tool overlay on page         │
│  - Sends coordinates back to background.js       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  popup.html + popup.js                           │
│  - Extension popup when you click the icon       │
│  - Quick upload option                           │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  result.html + result.js                         │
│  - Opens as new tab to show analysis results     │
│  - Reads from chrome.storage.local               │
│  - Displays verdict, confidence, heatmaps        │
└──────────────────────────────────────────────────┘
```

### Snipping Tool Feature:

```
1. User clicks "Snip" in extension popup
2. content.js creates a selection overlay on the page
3. User draws a rectangle around the face/media
4. Coordinates sent to background.js
5. background.js captures visible tab as screenshot
6. Crops the selected area using OffscreenCanvas
7. Sends cropped image to backend for analysis
8. Opens result.html with the verdict
```

---

## 🌡️ Grad-CAM Explained

### What is Grad-CAM? (Gradient-weighted Class Activation Mapping)

```
Simple answer: "It's a technique that shows WHICH PART of the image
the model focused on to make its decision."

For our use case: It highlights WHERE the face was manipulated.
```

### How it works (Step-by-Step):

```
Step 1: Take the last convolutional layer output
        (this is a 7x7 grid of 1280 feature maps)

Step 2: Compute gradients of the prediction with respect to
        these feature maps (how much each feature map affects the output)

Step 3: Average the gradients across spatial dimensions
        (get importance weight for each of the 1280 channels)

Step 4: Multiply each feature map by its importance weight
        and sum them up → raw heatmap (7x7)

Step 5: Apply ReLU (keep only positive values)
        (we only care about features that INCREASE the "fake" score)

Step 6: Resize heatmap to match original face size

Step 7: Apply color map (JET colormap):
        Blue → Green → Yellow → Red
        (low suspicion)       (high suspicion)

Step 8: Overlay on original face image (60% heatmap + 40% original)
        Only show where activation > threshold (50)
```

### Visual Example:

```
Original Face        Grad-CAM Heatmap       Result
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │   🟡🔴🔴    │     │   ⬛🔴🔴    │
│   😊        │  +  │   🟡🔴🟡    │  =  │   ⬛🔴⬛    │
│             │     │   🟢🟢🟢    │     │   ⬛⬛⬛    │
└─────────────┘     └─────────────┘     └─────────────┘

Red areas = Model thinks this region is manipulated
Blue areas = Model thinks this region is authentic
```

### Why is this important?

```
1. EXPLAINABILITY: Users can see WHY the model says "FAKE"
2. TRUST: Instead of black-box "FAKE", we show evidence
3. DEBUGGING: Helps identify if model is looking at right areas
4. FORENSICS: Helps understand what manipulation technique was used
```

---

## 📚 Training Details

### Dataset: FaceForensics++

```
Source: 300 videos (150 real + 150 fake)
Fake methods: Face2Face, FaceSwap, NeuralTextures, Deepfakes

Processing:
  300 videos × 20 frames each = 6,000 frames
  After face detection & filtering = 3,428 usable face images

Split:
  Training: 2,742 images (80%)
  Validation: 686 images (20%)
```

### Two-Stage Training:

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1: Feature Extraction (Frozen Base)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  What: Freeze EfficientNetB0, train only the top Dense layer    │
│  Why:  Learn basic real/fake classification without              │
│        destroying pre-trained ImageNet features                  │
│                                                                 │
│  Epochs: 10                                                     │
│  Learning Rate: 0.001                                           │
│  Trainable params: 1,281 (only Dense + bias)                    │
│  Result: ~50% accuracy (barely better than random)              │
│                                                                 │
│  ⚠️ Stage 1 alone isn't enough because the frozen features      │
│     weren't designed for deepfake detection                     │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 2: Fine-Tuning (Unfrozen Base)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  What: Unfreeze ALL layers, train entire model with tiny LR     │
│  Why:  Adapt ImageNet features to recognize deepfake artifacts  │
│                                                                 │
│  Epochs: 5                                                      │
│  Learning Rate: 0.00001 (1e-5, very small!)                     │
│  Trainable params: 4,008,829 (all layers)                       │
│  BatchNorm layers: kept frozen (42,023 params)                  │
│                                                                 │
│  Results:                                                       │
│    Epoch 1: 52.91% → Epoch 2: 71.74% → Epoch 3: 79.41%         │
│    Epoch 4: 84.44% → Epoch 5: 87.31% ✅                         │
│                                                                 │
│  Why tiny LR? To avoid "catastrophic forgetting"                │
│  (destroying the useful ImageNet knowledge)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Why Two Stages?

```
ANALOGY: Teaching someone to be a deepfake detective

Stage 1 = "Here's a magnifying glass (pre-trained features).
           Just learn to say yes/no using what you already see."
           
Stage 2 = "Now, let's also teach you to notice NEW things
           specific to deepfakes - subtle texture artifacts,
           blending boundaries, unnatural skin patterns."
```

### Training Hyperparameters:

| Parameter | Stage 1 | Stage 2 |
|-----------|---------|---------|
| Epochs | 10 | 5 |
| Learning Rate | 0.001 | 0.00001 |
| Optimizer | Adam | Adam |
| Loss | Binary Crossentropy | Binary Crossentropy |
| Batch Size | 32 | 32 |
| Base Model | Frozen | Unfrozen |
| BatchNorm | Frozen | Frozen |

### Final Model Stats:

```
Total Parameters:    4,050,852
Model File Size:     15.45 MB
Input Size:          224 × 224 × 3
Output:              Single float (0.0 to 1.0)
Threshold:           0.45
Final Accuracy:      87.31% (training), ~94% (testing)
Inference Speed:     ~0.1s (GPU) / ~0.5s (CPU)
```

---

## 🐳 Deployment

### Docker Setup:

```dockerfile
FROM python:3.10-slim

# System deps: ffmpeg (audio extraction), libsndfile (audio reading)
RUN apt-get update && apt-get install -y ffmpeg libsndfile1 libgl1 libglib2.0-0 git

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### Deployment Options:

```
1. LOCAL:          python main.py (port 8000)
2. DOCKER:         docker build -t deepfake . && docker run -p 7860:7860 deepfake
3. HUGGINGFACE:    Push to HF Spaces (auto-builds Docker, port 7860)
4. AWS/GCP/Azure:  Deploy container to any cloud service
```

### Environment:

```
PORT = 7860 (default, configurable via env variable)
No database needed (stateless API)
No external API keys needed
Model weights included in repo (model/ folder)
```

---

## 📁 Project Structure

```
DeepFake_Video/
│
├── main.py                    ← FastAPI backend (THE main file)
│                                 - Model loading
│                                 - File upload handling
│                                 - Face detection (MediaPipe)
│                                 - Prediction (EfficientNetB0)
│                                 - Grad-CAM generation
│                                 - Audio analysis routing
│
├── model/
│   └── fine_tuned_model_weights.weights.h5   ← Trained video/image model
│
├── audio_deepfake/
│   ├── __init__.py
│   ├── audio_detector.py      ← Audio deepfake detection logic
│   │                            (Wav2Vec2, PyTorch, safetensors)
│   └── model/
│       └── audio_model.safetensors  ← Trained audio model weights
│
├── frontend/
│   ├── index.html             ← Web UI (4 sections: Home, Detection, Dashboard, About)
│   ├── styles.css             ← Responsive CSS with modern design
│   └── script.js              ← Upload logic, API calls, history, results display
│
├── browser_extension/
│   ├── manifest.json          ← Extension config (Manifest V3)
│   ├── background.js          ← Service worker (context menu, API calls)
│   ├── content.js             ← Snipping tool overlay on web pages
│   ├── popup.html/css/js      ← Extension popup UI
│   ├── result.html/js         ← Results page (opens in new tab)
│   └── deepfakeLogo.png       ← Extension icon
│
├── DFVD.ipynb                 ← Training notebook (Google Colab)
├── Dockerfile                 ← Docker deployment config
├── requirements.txt           ← Python dependencies
├── .dockerignore              ← Files to exclude from Docker
└── README.md                  ← This file (Interview revision guide)
```

---

## 💡 Key Interview Questions & Answers

### Q1: "Tell me about your project" (STAR format)

> **S:** Deepfake videos are spreading misinformation on social media. People can't tell real from fake.
> **T:** Build an accessible AI tool that anyone can use to verify media authenticity before sharing.
> **A:** Used EfficientNetB0 with transfer learning on FaceForensics++ dataset. Added Grad-CAM for explainability, Wav2Vec2 for audio detection. Built FastAPI backend, web UI, and Chrome extension.
> **R:** Achieved 87% accuracy, real-time inference, multi-modal detection (video + audio), and deployed via Docker.

---

### Q2: "Why EfficientNetB0 and not ResNet or VGG?"

> - **Smaller model size** (15MB vs 100MB+ for VGG)
> - **Faster inference** (important for real-time web app)
> - **Better accuracy-per-parameter** (compound scaling)
> - **Still accurate enough** for binary classification task
> - Good balance of **speed vs accuracy** for deployment on limited resources

---

### Q3: "What is Transfer Learning and why did you use it?"

> Transfer learning reuses a model pre-trained on a large dataset (ImageNet, 14M images) for a new task.
> 
> **Why:** We only had 3,428 face images. Training from scratch would overfit badly. By reusing ImageNet features (edges, textures, patterns), we only needed to teach the model "what makes a face fake" on top of existing knowledge.

---

### Q4: "What is Grad-CAM and why is it important?"

> Grad-CAM generates a heatmap showing which regions of the image the model focused on.
> 
> **Why important:**
> - Makes the AI **explainable** (not a black box)
> - Users can **see WHERE** manipulation happened
> - Builds **trust** in the system
> - Helps in **forensic analysis** of deepfakes

---

### Q5: "How do you handle videos vs images?"

> - **Images:** Process directly (single frame)
> - **Videos:** Extract 5 evenly-spaced key frames, process each independently, average the scores for final verdict
> - **Audio in videos:** Extract audio track using FFmpeg, run through separate Wav2Vec2 model
> - This gives both **visual** and **audio** deepfake detection for videos

---

### Q6: "What is the threshold 0.45 and why not 0.5?"

> The model outputs a score between 0 (real) and 1 (fake). We use 0.45 instead of 0.5 to be slightly more sensitive to fakes (catches more manipulated content at the cost of rare false positives). This is a design choice favoring **safety over convenience**.

---

### Q7: "How does the browser extension work?"

> - Built with **Manifest V3** (latest Chrome extension standard)
> - Creates a **right-click context menu** on images/videos
> - When clicked: fetches the media URL → sends to our FastAPI backend → shows result in new tab
> - Also has a **snipping tool**: captures screen area → crops → analyzes
> - Uses `chrome.storage.local` for passing data between background worker and result page

---

### Q8: "What challenges did you face?"

> 1. **MediaPipe initialization** - had to initialize face detection globally (not per-request) for performance
> 2. **Stage 1 training only got 50%** - learned that frozen base alone can't learn deepfake features, needed fine-tuning
> 3. **Audio extraction from video** - used FFmpeg subprocess with timeout to avoid hanging
> 4. **Large model loading time** - solved by loading once at startup, not per-request
> 5. **CORS issues** - browser extension couldn't talk to backend without proper CORS middleware
> 6. **File size handling** - added 20MB limit check both client-side and server-side

---

### Q9: "What are the limitations?"

> - Only trained on specific deepfake methods (Face2Face, FaceSwap, etc.)
> - Needs clear face visibility (min ~100x100 pixels)
> - Single face detection only (picks first face if multiple)
> - Compressed videos may cause false positives
> - No temporal analysis (doesn't track face movement across frames)
> - Requires internet connection (backend must be running)

---

### Q10: "How would you improve this project?"

> - Add **temporal analysis** (LSTM/3D CNN) to catch flickering/inconsistency across frames
> - Train on **more diverse datasets** (Celeb-DF, DFDC) for better generalization
> - Add **multi-face detection** (analyze all faces in a frame)
> - **Model quantization** (int8/float16) for faster mobile deployment
> - Add **lip-sync detection** (audio-visual mismatch)
> - Implement **ensemble models** (multiple models voting together)
> - Add **real-time video streaming** analysis

---

### Q11: "Explain the FastAPI backend architecture"

> - **Single file** (`main.py`) handles everything
> - **Startup:** Loads both models (video + audio) into memory
> - **Endpoint:** `POST /predict` accepts multipart file upload
> - **Routing:** Detects file type by extension → routes to appropriate processor
> - **Processing:** Uses temp files (auto-cleaned), MediaPipe for face detection
> - **Response:** Returns JSON with verdict, confidence, and base64 heatmaps
> - **Static serving:** Also serves the frontend HTML/CSS/JS
> - **CORS:** Enabled for all origins (browser extension compatibility)

---

### Q12: "What is MediaPipe and why use it for face detection?"

> MediaPipe is Google's framework for real-time ML pipelines.
> 
> **Why for face detection:**
> - Very fast (real-time on CPU)
> - Lightweight (no GPU needed for detection)
> - Returns bounding box coordinates
> - High accuracy for frontal faces
> - Easy to integrate (few lines of code)
> - Alternative would be MTCNN or dlib (slower)

---

## 📋 Quick Revision Cheat Sheet

### One-Page Summary:

```
PROJECT: DeepFake Video Detection
TAGLINE: "Detect Before Share on Social Media"

WHAT IT DOES:
  Upload image/video/audio → Detects if REAL or FAKE → Shows WHERE manipulated

TECH USED:
  Backend:    FastAPI + Python
  Video ML:   EfficientNetB0 + TensorFlow + Grad-CAM + MediaPipe
  Audio ML:   Wav2Vec2 + PyTorch + HuggingFace Transformers
  Frontend:   Vanilla HTML/CSS/JS
  Extension:  Chrome Manifest V3
  Deploy:     Docker + HuggingFace Spaces

KEY NUMBERS:
  Accuracy:      87.31% (train), ~94% (test)
  Model Size:    15.45 MB (video) + audio model
  Inference:     ~0.1s GPU, ~0.5s CPU
  Max Upload:    20 MB
  Video Frames:  5 key frames analyzed
  Threshold:     0.45 (>= FAKE, < REAL)
  Dataset:       3,428 face images from 300 videos

KEY CONCEPTS:
  Transfer Learning → Reuse ImageNet knowledge
  Fine-Tuning      → Adapt all layers with tiny learning rate
  Grad-CAM         → Visual explanation of model decision
  Binary Classification → Output single probability (Real vs Fake)
  Two-Stage Training → Freeze then unfreeze base model

ARCHITECTURE FLOW:
  File Upload → Type Detection → Face Detection → Preprocessing →
  Model Inference → Grad-CAM → JSON Response

UNIQUE FEATURES:
  ✅ Multi-modal (video + image + audio)
  ✅ Visual explanations (Grad-CAM heatmaps)
  ✅ Browser extension (right-click analyze)
  ✅ No database needed (stateless)
  ✅ Single endpoint API
  ✅ Docker-ready deployment
```

### Keywords to Remember:

```
EfficientNetB0, Transfer Learning, Fine-Tuning, Grad-CAM,
MediaPipe, FastAPI, Wav2Vec2, Binary Classification, Sigmoid,
GlobalAveragePooling, Dropout, FaceForensics++, Manifest V3,
Service Worker, OffscreenCanvas, Base64, CORS, Uvicorn,
Safetensors, FFmpeg, Softmax, Two-Stage Training
```

### Common Follow-up Topics:

```
→ Overfitting: We use Dropout(0.3) + small dataset + early stopping
→ Why not CNN from scratch: Not enough data, would overfit
→ Why FastAPI over Flask: Async support, auto-docs, type validation, faster
→ Why not React for frontend: Keep it simple, no build step needed
→ How to scale: Add load balancer, multiple uvicorn workers, GPU instances
→ Security: File size validation, temp file cleanup, CORS config, no data stored
```

---

## 🚀 How to Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/thesushpatil/DeepFake_Video_Detection.git
cd DeepFake_Video_Detection

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
python main.py
# Server starts at http://127.0.0.1:8000

# 5. Open browser → http://127.0.0.1:8000
# 6. Upload any image/video/audio to test
```

---

## 📄 License

MIT License - Free to use, modify, and distribute.

---

## 👥 Team

| Name | Role |
|------|------|
| Sushant Patil | Lead Developer (CV & DL) |
| Anuj Waghmare | Data Scientist (ML & Data) |
| Vilas Rathod | Backend Developer (API & Cloud) |
| Devraj Powar | UX Designer (Frontend & Extension) |

---

> **Tip for interviews:** Practice explaining the STAR section out loud in 2 minutes. Then pick 2-3 Q&As that you feel most confident about and prepare detailed answers with follow-ups.

*Last Updated: July 2026*

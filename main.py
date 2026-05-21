from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse,FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from tensorflow.keras import layers, Sequential
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
import cv2
import numpy as np
import base64
import os
import tempfile

# --- MEDIAPIPE IMPORT FIX ---
import mediapipe as mp

mp_face_detection = mp.solutions.face_detection
# Initialize it immediately
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.5)

app = FastAPI()

# Allow browser extensions and frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static folder for the frontend HTML
# Ensure you have a folder named 'static' in the same directory as this file
os.makedirs("frontend", exist_ok=True)
# app.mount("/static", StaticFiles(directory="static"), name="static")

app.mount("/assets", StaticFiles(directory="frontend"), name="assets")

# Serve your index.html when you go to http://127.0.0.1:8000/
@app.get("/")
async def serve_index():
    return FileResponse("frontend/index.html")

# --- 1. CONFIGURATION & MODEL LOADING ---
IMAGE_SIZE = (224, 224)
MODEL_WEIGHTS_PATH = "model/fine_tuned_model_weights.weights.h5"

print("Building model architecture...")
base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=(*IMAGE_SIZE, 3))
base_model.trainable = True
model = Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.3),
    layers.Dense(1, activation='sigmoid')
])

print("Loading weights...")
try:
    # Explicitly build the model's graph by passing a dummy tensor
    model(tf.zeros((1, *IMAGE_SIZE, 3)))
    model.load_weights(MODEL_WEIGHTS_PATH)
    print("✅ Model loaded successfully.")
except Exception as e:
    print(f"⚠️ Error loading weights. Ensure '{MODEL_WEIGHTS_PATH}' exists. Error: {e}")


# --- 2. GRAD-CAM FUNCTIONS ---
def make_gradcam_heatmap(img_array, model, last_conv_layer_name="top_activation"):
    base_model_functional = model.layers[0]
    grad_cam_sub_model = tf.keras.models.Model(
        inputs=base_model_functional.inputs,
        outputs=[base_model_functional.get_layer(last_conv_layer_name).output, base_model_functional.output]
    )

    inp_tensor = tf.keras.Input(shape=(*IMAGE_SIZE, 3))
    conv_out, base_out = grad_cam_sub_model(inp_tensor)

    x = base_out
    for layer in model.layers[1:]:
        x = layer(x)

    grad_model = tf.keras.models.Model(inputs=inp_tensor, outputs=[conv_out, x])

    with tf.GradientTape() as tape:
        if len(img_array.shape) == 3:
            img_array = np.expand_dims(img_array, axis=0)
        inputs_for_tape = tf.convert_to_tensor(img_array, dtype=tf.float32)
        last_conv_layer_output, preds = grad_model(inputs_for_tape)
        class_channel = preds[:, 0]

    grads = tape.gradient(class_channel, last_conv_layer_output)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    last_conv_layer_output = last_conv_layer_output[0]
    heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0)

    max_heat = tf.math.reduce_max(heatmap)
    if max_heat != 0:
        heatmap /= max_heat
    return heatmap.numpy()


def apply_heatmap(cropped_face, heatmap):
    heatmap = cv2.resize(heatmap, (cropped_face.shape[1], cropped_face.shape[0]))
    heatmap = np.uint8(255 * heatmap)
    jet_heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

    mask = heatmap > 50
    superimposed_img = cropped_face.copy()
    superimposed_img[mask] = cv2.addWeighted(cropped_face, 0.4, jet_heatmap, 0.6, 0)[mask]
    return superimposed_img


def encode_image_to_base64(image):
    # Convert BGR (OpenCV) to RGB for web display
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    _, buffer = cv2.imencode('.jpg', image_rgb)
    return base64.b64encode(buffer).decode('utf-8')


# --- 3. PROCESSING LOGIC ---
def process_frame(frame):
    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_detection.process(image_rgb)

    if not results.detections:
        return None, None

    detection = results.detections[0]
    box = detection.location_data.relative_bounding_box
    h, w, _ = frame.shape
    x, y, W, H = int(box.xmin * w), int(box.ymin * h), int(box.width * w), int(box.height * h)

    y1, y2 = max(0, y), min(h, y + H)
    x1, x2 = max(0, x), min(w, x + W)

    cropped_face = frame[y1:y2, x1:x2]

    if cropped_face.size == 0:
        return None, None

    face_resized = cv2.resize(cropped_face, IMAGE_SIZE)
    face_array = tf.keras.preprocessing.image.img_to_array(face_resized)
    face_expanded = np.expand_dims(face_array, axis=0)
    face_processed = preprocess_input(face_expanded)

    prediction = model.predict(face_processed, verbose=0)
    score = float(prediction[0][0])

    heatmap = make_gradcam_heatmap(face_processed, model, "top_activation")
    result_img = apply_heatmap(cropped_face, heatmap)

    b64_img = encode_image_to_base64(result_img)
    return score, b64_img


# --- 4. API ENDPOINT ---
@app.post("/predict")
async def predict_media(file: UploadFile = File(...)):
    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as temp:
        temp.write(await file.read())
        temp_path = temp.name

    filename = file.filename.lower()
    predictions = []
    heatmaps = []

    try:
        # IMAGE PROCESSING
        if filename.endswith(('.png', '.jpg', '.jpeg')):
            frame = cv2.imread(temp_path)
            score, b64_img = process_frame(frame)
            if score is not None:
                predictions.append(score)
                heatmaps.append(b64_img)

        # VIDEO PROCESSING
        elif filename.endswith(('.mp4', '.avi', '.mov')):
            cap = cv2.VideoCapture(temp_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frames_to_process = 5
            step = max(1, total_frames // frames_to_process)

            for i in range(0, total_frames, step):
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                if not ret: break

                score, b64_img = process_frame(frame)
                if score is not None:
                    predictions.append(score)
                    heatmaps.append(b64_img)

                if len(predictions) >= frames_to_process:
                    break
            cap.release()

        # Generate Final Response
        if not predictions:
            return JSONResponse({"error": "No faces detected in the uploaded media."})

        avg_score = sum(predictions) / len(predictions)
        is_fake = avg_score > 0.45
        confidence = (avg_score * 100) if is_fake else ((1 - avg_score) * 100)

        return JSONResponse({
            "status": "success",
            "verdict": "FAKE" if is_fake else "REAL",
            "confidence": f"{confidence:.2f}%",
            "heatmaps": heatmaps  # List of base64 images
        })

    except Exception as e:
        return JSONResponse({"error": str(e)})
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)  # Clean up temp file
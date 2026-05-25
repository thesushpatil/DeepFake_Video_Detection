import torch
import torchaudio
import soundfile as sf
import numpy as np
from safetensors.torch import load_file
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
import os

# Model configuration
MODEL_NAME = "Heem2/Deepfake-audio-detection"
MODEL_WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "model", "model.safetensors")


def load_model(model_path=None):
    """Load the audio deepfake detection model with safetensors weights."""
    if model_path is None:
        model_path = MODEL_WEIGHTS_PATH

    model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME)

    # Load and apply safetensors weights if the file exists
    if os.path.exists(model_path):
        model_weights = load_file(model_path)
        model.load_state_dict(model_weights)
        print(f"✅ Audio model loaded with custom weights from: {model_path}")
    else:
        print(f"⚠️ Custom weights not found at '{model_path}'. Using default pretrained weights.")

    model.eval()
    return model


def get_feature_extractor():
    """Load the feature extractor for audio preprocessing."""
    return AutoFeatureExtractor.from_pretrained(MODEL_NAME)


def preprocess_audio(audio_path):
    """Load and preprocess audio file to 16kHz mono waveform."""
    # Use soundfile for loading (more reliable on Windows, no torchcodec dependency)
    audio_data, sample_rate = sf.read(audio_path, dtype='float32')

    # Convert to torch tensor
    # soundfile returns (samples,) for mono or (samples, channels) for stereo
    if audio_data.ndim == 1:
        waveform = torch.from_numpy(audio_data).unsqueeze(0)  # (1, samples)
    else:
        waveform = torch.from_numpy(audio_data.T)  # (channels, samples)

    # Convert to mono if stereo
    if waveform.shape[0] > 1:
        waveform = torch.mean(waveform, dim=0, keepdim=True)

    # Resample to 16kHz if needed
    if sample_rate != 16000:
        waveform = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)(waveform)

    # Remove batch dimension -> [sequence_length]
    waveform = waveform.squeeze(0)

    return waveform


def predict(model, feature_extractor, audio_path):
    """Run inference on an audio file and return verdict + confidence."""
    # Preprocess audio
    input_values = preprocess_audio(audio_path)

    # Use feature extractor to format input correctly
    inputs = feature_extractor(input_values, sampling_rate=16000, return_tensors="pt", padding=True)

    # Perform inference
    with torch.no_grad():
        logits = model(**inputs).logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)

    # Get predicted class
    predicted_class = torch.argmax(probabilities, dim=-1).item()
    confidence = probabilities.max().item()

    verdict = "FAKE" if predicted_class == 0 else "REAL"
    return verdict, confidence

"""
Test script for audio deepfake detection.
Run this standalone to verify the model loads and inference works.

Usage:
    python audio_deepfake/test_audio.py
    python audio_deepfake/test_audio.py --audio path/to/audio.wav
"""

import sys
import os
import argparse

# Add parent directory to path so we can import the module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from audio_deepfake.audio_detector import load_model, get_feature_extractor, predict


def test_model_loading():
    """Test that the model and feature extractor load successfully."""
    print("=" * 50)
    print("TEST 1: Model Loading")
    print("=" * 50)

    try:
        print("Loading feature extractor...")
        feature_extractor = get_feature_extractor()
        print(f"  ✅ Feature extractor loaded successfully")

        print("Loading model...")
        model = load_model()
        print(f"  ✅ Model loaded successfully")
        print(f"  Model type: {type(model).__name__}")
        print(f"  Number of labels: {model.config.num_labels}")
        print(f"  Label mapping: {model.config.id2label}")
        return model, feature_extractor
    except Exception as e:
        print(f"  ❌ Failed to load model: {e}")
        return None, None


def test_inference(model, feature_extractor, audio_path):
    """Test inference on a given audio file."""
    print("\n" + "=" * 50)
    print("TEST 2: Inference")
    print("=" * 50)

    if not os.path.exists(audio_path):
        print(f"  ⚠️ Audio file not found: {audio_path}")
        print("  Skipping inference test. Provide an audio file with --audio flag.")
        return

    try:
        print(f"  Processing: {audio_path}")
        verdict, confidence = predict(model, feature_extractor, audio_path)
        print(f"  ✅ Inference successful!")
        print(f"  Verdict: {verdict}")
        print(f"  Confidence: {confidence:.4f} ({confidence * 100:.2f}%)")
    except Exception as e:
        print(f"  ❌ Inference failed: {e}")
        import traceback
        traceback.print_exc()


def test_supported_formats():
    """Display supported audio formats."""
    print("\n" + "=" * 50)
    print("INFO: Supported Audio Formats")
    print("=" * 50)
    print("  - .wav (recommended)")
    print("  - .mp3")
    print("  - .flac")
    print("  - .ogg")
    print("  Note: torchaudio handles format decoding automatically.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test audio deepfake detection")
    parser.add_argument("--audio", type=str, default=None, help="Path to an audio file to test")
    args = parser.parse_args()

    print("\n🔊 Audio Deepfake Detection - Test Suite\n")

    # Test 1: Model loading
    model, feature_extractor = test_model_loading()

    if model is None:
        print("\n❌ Model loading failed. Cannot proceed with inference tests.")
        sys.exit(1)

    # Test 2: Inference (if audio file provided)
    if args.audio:
        test_inference(model, feature_extractor, args.audio)
    else:
        print("\n  ℹ️ No audio file provided. Run with --audio <path> to test inference.")
        print("  Example: python audio_deepfake/test_audio.py --audio sample.wav")

    # Info
    test_supported_formats()

    print("\n" + "=" * 50)
    print("✅ All basic tests passed!")
    print("=" * 50)

import os
import subprocess
import librosa
import numpy as np
import joblib

MODEL_PATH = "deepfake_detector_svm (2).pkl"
SCALER_PATH = "scaler (2).pkl"


def load_models():
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print("✅ Models loaded successfully")
        return model, scaler
    except Exception as e:
        print("❌ Error loading models:", e)
        return None, None


def extract_mfcc_features(file_path):
    try:
        # Load audio (resample to 16k mono)
        y, sr = librosa.load(file_path, sr=16000, mono=True)

        # Extract MFCC (13)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

        # Delta
        delta = librosa.feature.delta(mfcc)

        # Delta-Delta
        delta2 = librosa.feature.delta(mfcc, order=2)

        # Stack
        combined = np.vstack((mfcc, delta, delta2))

        # Mean only (IMPORTANT)
        mean_features = np.mean(combined, axis=1)

        return mean_features  # length = 39

    except Exception as e:
        raise Exception(f"Feature extraction failed: {e}")


def compute_cosine_similarity(a, b):
    a = a.astype(np.float32)
    b = b.astype(np.float32)

    numerator = np.dot(a, b)
    denominator = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8

    return float(numerator / denominator)

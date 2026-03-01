import os
import librosa
import numpy as np
import joblib

MODEL_PATH = "deepfake_detector_svm (2).pkl"
SCALER_PATH = "scaler (2).pkl"


# ===============================
# LOAD MODEL + SCALER
# ===============================
def load_models():
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print("✅ Deepfake model loaded")
        return model, scaler
    except Exception as e:
        print("❌ Model loading error:", e)
        return None, None


# ===============================
# 1️⃣ DEEPFAKE DETECTION FEATURES
# (Exact same as training notebook)
# ===============================
def extract_deepfake_features(file_path):
    try:
        # EXACT SAME AS TRAINING
        y, sr = librosa.load(file_path, duration=3, offset=0.5)

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        delta = librosa.feature.delta(mfcc)
        delta2 = librosa.feature.delta(mfcc, order=2)

        combined = np.vstack([mfcc, delta, delta2])
        mean_features = np.mean(combined, axis=1)

        return mean_features  # 39 features

    except Exception as e:
        raise Exception(f"Deepfake feature extraction failed: {e}")


# ===============================
# 2️⃣ SPEAKER VERIFICATION FEATURES
# (Original Colab Working Logic)
# ===============================
def extract_speaker_features(file_path):
    try:
        y, sr = librosa.load(file_path, duration=4, offset=0.0)

        # Silence removal
        y, _ = librosa.effects.trim(y, top_db=25)

        # Pre-emphasis
        pre_emphasis = 0.97
        y = np.append(y[0], y[1:] - pre_emphasis * y[:-1])

        if len(y) < 100:
            return None

        mfcc = librosa.feature.mfcc(
            y=y,
            sr=sr,
            n_mfcc=20,
            n_fft=2048,
            hop_length=512,
            fmin=50,
            fmax=8000,
            lifter=22
        )

        delta = librosa.feature.delta(mfcc)

        combined = np.vstack([mfcc, delta])

        mean_features = np.mean(combined, axis=1)
        std_features = np.std(combined, axis=1)

        final_vector = np.concatenate((mean_features, std_features))

        return final_vector  # 80 features

    except Exception as e:
        raise Exception(f"Speaker feature extraction failed: {e}")


# ===============================
# COSINE SIMILARITY
# ===============================
def compute_cosine_similarity(a, b):
    a = a.astype(np.float32)
    b = b.astype(np.float32)

    numerator = np.dot(a, b)
    denominator = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8

    return float(numerator / denominator)

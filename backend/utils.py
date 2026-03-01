import os
import numpy as np
import librosa
import soundfile as sf
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
import warnings

# Suppress warnings for cleaner logs
warnings.filterwarnings("ignore")

# Configuration matching the project report
CONFIG = {
    'duration': 4,  # seconds
    'sr': 22050,    # Default librosa sample rate, but can be adjusted if model was trained differently
    'top_db': 25,
    'pre_emphasis': 0.97,
    'n_mfcc': 20,
    'n_fft': 2048,
    'hop_length': 512,
    'fmin': 50,
    'fmax': 8000,
    'lifter': 22
}

def load_models(model_path='deepfake_detector_svm (2).pkl', scaler_path='scaler (2).pkl'):
    """
    Load the trained model and scaler.
    Returns None, None if files are missing.
    """
    try:
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            print("✅ Models loaded successfully.")
            return model, scaler
        else:
            print(f"⚠️ Model files not found. Please place '{model_path}' and '{scaler_path}' in the backend directory.")
            return None, None
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        return None, None

def extract_mfcc_features(file_path):
    """
    Extract MFCC features using the EXACT pipeline described.
    """
    try:
        # 1. Load audio with librosa (Duration limit: 4 seconds)
        y, sr = librosa.load(file_path, duration=CONFIG['duration'], sr=None)
        
        # 2. Remove silence
        y, _ = librosa.effects.trim(y, top_db=CONFIG['top_db'])
        
        # 3. Apply pre-emphasis filter
        y = np.append(y[0], y[1:] - CONFIG['pre_emphasis'] * y[:-1])
        
        # 4. Extract MFCCs
        mfcc = librosa.feature.mfcc(
            y=y, 
            sr=sr, 
            n_mfcc=CONFIG['n_mfcc'], 
            n_fft=CONFIG['n_fft'], 
            hop_length=CONFIG['hop_length'], 
            fmin=CONFIG['fmin'], 
            fmax=CONFIG['fmax'], 
            lifter=CONFIG['lifter']
        )
        
        # 5. Compute delta features
        delta_mfcc = librosa.feature.delta(mfcc)
        
        # 6. Stack MFCC + delta
        combined_features = np.vstack([mfcc, delta_mfcc])
        
        # 7. Compute mean across time
        mean_features = np.mean(combined_features, axis=1)
        
        # 8. Compute std across time
        std_features = np.std(combined_features, axis=1)
        
        # 9. Concatenate mean + std
        final_feature_vector = np.hstack([mean_features, std_features])
        
        return final_feature_vector
        
    except Exception as e:
        print(f"Error extracting features: {e}")
        raise e

def compute_cosine_similarity(vec_a, vec_b):
    """
    Compute cosine similarity manually:
    cosine = dot(a,b) / (||a|| * ||b|| + 1e-8)
    """
    dot_product = np.dot(vec_a, vec_b)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    
    similarity = dot_product / ((norm_a * norm_b) + 1e-8)
    return float(similarity)

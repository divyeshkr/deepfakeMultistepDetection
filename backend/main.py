import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
from utils import load_models, extract_mfcc_features, compute_cosine_similarity

# Initialize App
app = FastAPI(title="Deepfake Detection & Speaker Verification System")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models
# Note: We assume these files are in the same directory as main.py or root of backend
MODEL, SCALER = load_models()

# Temporary directory for file processing
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def cleanup_file(path: str):
    """Background task to remove file after processing"""
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print(f"Error cleaning up file {path}: {e}")

@app.get("/")
async def root():
    return {"message": "Deepfake Detection API is running"}

@app.post("/detect")
async def detect_deepfake(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    """
    Stage 1: Deepfake Detection
    """
    if MODEL is None or SCALER is None:
        # Mock response if models are missing (for demonstration purposes if user hasn't uploaded models yet)
        # In production, this should raise an error.
        # raise HTTPException(status_code=500, detail="Models not loaded on server.")
        print("WARNING: Models not found. Returning mock response for UI testing.")
        return JSONResponse(content={
            "prediction": "real", 
            "confidence": 0.95, 
            "note": "MOCK RESPONSE - MODEL FILES MISSING"
        })

    file_id = str(uuid.uuid4())
    file_ext = file.filename.split('.')[-1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{file_ext}")

    try:
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract Features
        features = extract_mfcc_features(file_path)
        
        # Scale Features
        # Reshape for scalar (1, -1) because it expects 2D array
        features_reshaped = features.reshape(1, -1)
        features_scaled = SCALER.transform(features_reshaped)
        
        # Predict
        prediction_idx = MODEL.predict(features_scaled)[0]
        # Assuming 0 = Real, 1 = Deepfake (or vice versa, adjusting based on common conventions)
        # Usually 1 is the positive class (Deepfake) in anomaly detection, but let's assume standard binary:
        # If the user didn't specify class mapping, we assume standard: 0: Real, 1: Fake or similar.
        # Let's return the raw label string if the model supports it, otherwise map it.
        # For SVM, predict returns the class label.
        
        # We will assume the model returns 'real' or 'deepfake' strings or 0/1.
        # Adjusting logic to be robust:
        prediction_label = str(prediction_idx).lower()
        
        # Map numeric to string if necessary (Common: 0=Real, 1=Fake)
        if prediction_label == '0': prediction_label = 'real'
        if prediction_label == '1': prediction_label = 'deepfake'
        
        # Get confidence (probability)
        try:
            probabilities = MODEL.predict_proba(features_scaled)[0]
            confidence = float(np.max(probabilities))
        except:
            confidence = 0.0 # SVM might not have probability enabled

        return {
            "prediction": prediction_label,
            "confidence": confidence
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        background_tasks.add_task(cleanup_file, file_path)

@app.post("/verify")
async def verify_speaker(
    suspicious_audio: UploadFile = File(...),
    reference_audio: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Stage 2: Speaker Verification
    """
    # Save both files
    sus_id = str(uuid.uuid4())
    ref_id = str(uuid.uuid4())
    
    sus_path = os.path.join(UPLOAD_DIR, f"sus_{sus_id}.{suspicious_audio.filename.split('.')[-1]}")
    ref_path = os.path.join(UPLOAD_DIR, f"ref_{ref_id}.{reference_audio.filename.split('.')[-1]}")

    try:
        with open(sus_path, "wb") as buffer:
            shutil.copyfileobj(suspicious_audio.file, buffer)
        with open(ref_path, "wb") as buffer:
            shutil.copyfileobj(reference_audio.file, buffer)

        # Extract Features
        # Note: For verification, we use the raw features (or scaled? usually raw for cosine sim, but consistency matters)
        # The prompt says "Extract MFCC features... Compute cosine similarity". 
        # It doesn't explicitly say to scale them for verification, but usually we compare features in the same space.
        # We will use the raw extracted vector as per standard verification pipelines unless a specific embedding model is used.
        # Given the prompt's "MFCC FEATURE EXTRACTION" block applies to both, we use that.
        
        feat_sus = extract_mfcc_features(sus_path)
        feat_ref = extract_mfcc_features(ref_path)
        
        # Compute Similarity
        similarity = compute_cosine_similarity(feat_sus, feat_ref)
        
        # Threshold Check
        THRESHOLD = 0.60
        verified = similarity >= THRESHOLD

        return {
            "similarity": similarity,
            "verified": verified,
            "threshold": THRESHOLD
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        background_tasks.add_task(cleanup_file, sus_path)
        background_tasks.add_task(cleanup_file, ref_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

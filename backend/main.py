import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from utils import (
    load_models,
    extract_deepfake_features,
    extract_speaker_features,
    compute_cosine_similarity
)

app = FastAPI(title="Deepfake Detection & Speaker Verification System")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load deepfake model
MODEL, SCALER = load_models()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def cleanup_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except:
        pass


@app.get("/")
async def root():
    return {"message": "API Running"}


# ===============================
# STAGE 1 - DEEPFAKE DETECTION
# ===============================
@app.post("/detect")
async def detect_deepfake(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    if MODEL is None or SCALER is None:
        raise HTTPException(status_code=500, detail="Deepfake model not loaded")

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.wav")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        features = extract_deepfake_features(file_path)

        if len(features) != 39:
            raise HTTPException(status_code=500, detail="Feature size mismatch")

        features = features.reshape(1, -1)
        features_scaled = SCALER.transform(features)

        prediction = MODEL.predict(features_scaled)[0]

        label = "real" if str(prediction) == "0" else "deepfake"

        try:
            probs = MODEL.predict_proba(features_scaled)[0]
            confidence = float(np.max(probs))
        except:
            confidence = 0.0

        return {
            "prediction": label,
            "confidence": confidence
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        background_tasks.add_task(cleanup_file, file_path)


# ===============================
# STAGE 2 - SPEAKER VERIFICATION
# ===============================
@app.post("/verify")
async def verify_speaker(
    suspicious_audio: UploadFile = File(...),
    reference_audio: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    sus_path = os.path.join(UPLOAD_DIR, f"sus_{uuid.uuid4()}.wav")
    ref_path = os.path.join(UPLOAD_DIR, f"ref_{uuid.uuid4()}.wav")

    try:
        with open(sus_path, "wb") as buffer:
            shutil.copyfileobj(suspicious_audio.file, buffer)

        with open(ref_path, "wb") as buffer:
            shutil.copyfileobj(reference_audio.file, buffer)

        feat_sus = extract_speaker_features(sus_path)
        feat_ref = extract_speaker_features(ref_path)

        if feat_sus is None or feat_ref is None:
            raise HTTPException(status_code=400, detail="Audio too short")

        similarity = compute_cosine_similarity(feat_sus, feat_ref)

        THRESHOLD = 0.85
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

# Deepfake Audio Detection & Speaker Verification System

## Project Overview
This is a B.Tech Final Year Project implementing a dual-stage authentication system:
1. **Stage 1:** Deepfake Detection (SVM + MFCC)
2. **Stage 2:** Speaker Verification (Cosine Similarity)

## Prerequisites
- Python 3.10+
- Node.js 18+
- FFmpeg (must be installed on the system for audio processing)

## Setup Instructions

### 1. Backend Setup
Navigate to the `backend` directory and install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

**IMPORTANT:**
You must place your trained model files in the `backend/` directory:
- `deepfake_detector_svm (2).pkl`
- `scaler (2).pkl`

Start the backend server:
```bash
python main.py
```
The server will run on `http://localhost:8000`.

### 2. Frontend Setup
The frontend is located in the root directory. Install dependencies:

```bash
npm install
```

Start the frontend development server:
```bash
npm run dev
```
The application will run on `http://localhost:3000` (or the port assigned by Vite).

## Usage
1. Open the web application.
2. Click "Start Detection".
3. Upload a suspicious audio file.
4. If detected as **Real**, proceed to verification.
5. Upload a reference audio or record your voice.
6. View the final verification result.

## Troubleshooting
- **Model Missing Error:** Ensure the `.pkl` files are exactly named as specified and placed in `backend/`.
- **Audio Error:** Ensure FFmpeg is installed and accessible in your system PATH.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUpload } from '@/components/FileUpload';
import { AudioRecorder } from '@/components/AudioRecorder';
import { AlertCircle, CheckCircle, Loader2, ShieldAlert, UserCheck, UserX } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

/* ---------------------- IMPORTANT ---------------------- */
/* Make sure VITE_API_URL is added in Vercel settings     */
/* ------------------------------------------------------- */

const API_URL = import.meta.env.VITE_API_URL;

type Stage =
  | 'upload'
  | 'analyzing_deepfake'
  | 'result_deepfake'
  | 'verification_input'
  | 'analyzing_verification'
  | 'final_result';

interface DeepfakeResult {
  prediction: 'real' | 'deepfake';
  confidence: number;
  note?: string;
}

interface VerificationResult {
  similarity: number;
  verified: boolean;
  threshold: number;
}

export default function DetectionPage() {
  const [stage, setStage] = useState<Stage>('upload');
  const [suspiciousFile, setSuspiciousFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [deepfakeResult, setDeepfakeResult] = useState<DeepfakeResult | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ================== STAGE 1 ================== */
  const handleDeepfakeDetection = async () => {
    if (!suspiciousFile) return;

    if (!API_URL) {
      setError("API URL not configured. Check Vercel environment variables.");
      return;
    }

    setStage('analyzing_deepfake');
    setError(null);

    const formData = new FormData();
    formData.append('file', suspiciousFile);

    try {
      const response = await axios.post(`${API_URL}/detect`, formData);

      setDeepfakeResult(response.data);

      setTimeout(() => {
        if (response.data.prediction === 'real') {
          setStage('verification_input');
        } else {
          setStage('result_deepfake');
        }
      }, 1200);

    } catch (err: any) {
      console.error(err);

      if (err.response) {
        setError(err.response.data?.detail || "Backend returned an error.");
      } else {
        setError("Cannot connect to backend. It may be sleeping (Render cold start). Wait 30 seconds and retry.");
      }

      setStage('upload');
    }
  };

  /* ================== STAGE 2 ================== */
  const handleVerification = async () => {
    if (!suspiciousFile || !referenceFile) return;

    if (!API_URL) {
      setError("API URL not configured.");
      return;
    }

    setStage('analyzing_verification');
    setError(null);

    const formData = new FormData();
    formData.append('suspicious_audio', suspiciousFile);
    formData.append('reference_audio', referenceFile);

    try {
      const response = await axios.post(`${API_URL}/verify`, formData);

      setVerificationResult(response.data);

      setTimeout(() => {
        setStage('final_result');
      }, 1200);

    } catch (err: any) {
      console.error(err);

      if (err.response) {
        setError(err.response.data?.detail || "Verification failed.");
      } else {
        setError("Cannot connect to backend.");
      }

      setStage('verification_input');
    }
  };

  const reset = () => {
    setStage('upload');
    setSuspiciousFile(null);
    setReferenceFile(null);
    setDeepfakeResult(null);
    setVerificationResult(null);
    setError(null);
  };

  /* ================== UI ================== */
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* ================= Upload Stage ================= */}
        {stage === 'upload' && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-center">Upload Suspicious Audio</h2>

            <FileUpload
              selectedFile={suspiciousFile}
              onFileSelect={setSuspiciousFile}
              label="Drop suspicious audio here"
            />

            <button
              onClick={handleDeepfakeDetection}
              disabled={!suspiciousFile}
              className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Analyze Audio
            </button>
          </>
        )}

        {/* ================= Loading ================= */}
        {(stage === 'analyzing_deepfake' || stage === 'analyzing_verification') && (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p>Processing audio...</p>
          </div>
        )}

        {/* ================= Deepfake Result ================= */}
        {stage === 'result_deepfake' && deepfakeResult?.prediction === 'deepfake' && (
          <div className="text-center py-6">
            <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600">Deepfake Detected</h2>
            <p>Confidence: {(deepfakeResult.confidence * 100).toFixed(1)}%</p>
            <button onClick={reset} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg">
              Start Over
            </button>
          </div>
        )}

        {/* ================= Verification Result ================= */}
        {stage === 'final_result' && verificationResult && (
          <div className="text-center py-6">
            {verificationResult.verified ? (
              <UserCheck className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            ) : (
              <UserX className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold">
              {verificationResult.verified ? "Identity Verified" : "Different Speaker"}
            </h2>
            <p>Similarity: {(verificationResult.similarity * 100).toFixed(1)}%</p>
            <button onClick={reset} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg">
              Start New Detection
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

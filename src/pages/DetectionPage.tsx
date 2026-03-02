import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { AlertCircle, CheckCircle, Loader2, ShieldAlert, UserCheck, UserX } from 'lucide-react';
import axios from 'axios';

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

  const handleDeepfakeDetection = async () => {
    if (!suspiciousFile) return;

    if (!API_URL) {
      setError("API URL not configured.");
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
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Backend error or cold start. Try again.");
      setStage('upload');
    }
  };

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
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Verification failed.");
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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col justify-between">

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 w-full">

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {stage === 'upload' && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-center">
              Upload Suspicious Audio
            </h2>

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

        {(stage === 'analyzing_deepfake' || stage === 'analyzing_verification') && (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p>Processing audio...</p>
          </div>
        )}

        {stage === 'result_deepfake' && deepfakeResult?.prediction === 'deepfake' && (
          <div className="text-center py-6">
            <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600">
              Deepfake Detected
            </h2>
            <p>Confidence: {(deepfakeResult.confidence * 100).toFixed(1)}%</p>
            <button
              onClick={reset}
              className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg"
            >
              Start Over
            </button>
          </div>
        )}

        {stage === 'verification_input' && (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-600">
              Audio is Real
            </h2>
            <p className="mb-6">
              Upload reference voice for verification.
            </p>

            <FileUpload
              selectedFile={referenceFile}
              onFileSelect={setReferenceFile}
              label="Upload Reference Voice"
            />

            <button
              onClick={handleVerification}
              disabled={!referenceFile}
              className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Verify Speaker
            </button>
          </div>
        )}

        {stage === 'final_result' && verificationResult && (
          <div className="text-center py-6">
            {verificationResult.verified ? (
              <UserCheck className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            ) : (
              <UserX className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            )}

            <h2 className="text-2xl font-bold">
              {verificationResult.verified
                ? "Identity Verified"
                : "Different Speaker"}
            </h2>

            <p>
              Similarity: {(verificationResult.similarity * 100).toFixed(1)}%
            </p>

            <button
              onClick={reset}
              className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg"
            >
              Start New Detection
            </button>
          </div>
        )}

      </div>

      {/* ================= FOOTER ================= */}
      <footer className="mt-12 text-center text-sm text-slate-600">
        
        <div className="flex justify-center mb-4">
          <img
            src="https://drive.google.com/uc?export=view&id=1V1uM8M7WrH6VBkVxcCR8541g-jtg0moc"
            alt="NSUT Logo"
            className="h-16 object-contain"
          />
        </div>

        <p className="font-semibold">
          Department of Electronics and Communication
        </p>
        <p>Netaji Subhas University of Technology</p>

        <p className="mt-2">
          Under the guidance of <span className="font-medium">Dr. Sanya Anees</span>
        </p>

        <p className="mt-4">
          Project Members: Aman Kumar Jha, Divyesh Kumar, Rohan Sethi, Vaibhav Singh
        </p>

        <p className="mt-4 text-xs text-slate-400">
          © 2026 Deepfake Audio Detection & Speaker Verification System
        </p>

      </footer>

    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUpload } from '@/components/FileUpload';
import { AudioRecorder } from '@/components/AudioRecorder';
import { AlertCircle, CheckCircle, Loader2, ShieldAlert, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

// Configure API URL - assuming backend runs on port 8000
const API_URL = 'http://localhost:8000';

type Stage = 'upload' | 'analyzing_deepfake' | 'result_deepfake' | 'verification_input' | 'analyzing_verification' | 'final_result';

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

  const handleDeepfakeDetection = async () => {
    if (!suspiciousFile) return;

    setStage('analyzing_deepfake');
    setError(null);

    const formData = new FormData();
    formData.append('file', suspiciousFile);

    try {
      const response = await axios.post(`${API_URL}/detect`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setDeepfakeResult(response.data);
      
      // Artificial delay for UX
      setTimeout(() => {
        if (response.data.prediction === 'real') {
            setStage('verification_input');
        } else {
            setStage('result_deepfake');
        }
      }, 1500);

    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please ensure the backend is running and model files are present.");
      setStage('upload');
    }
  };

  const handleVerification = async () => {
    if (!suspiciousFile || !referenceFile) return;

    setStage('analyzing_verification');
    setError(null);

    const formData = new FormData();
    formData.append('suspicious_audio', suspiciousFile);
    formData.append('reference_audio', referenceFile);

    try {
      const response = await axios.post(`${API_URL}/verify`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setVerificationResult(response.data);
      
      setTimeout(() => {
        setStage('final_result');
      }, 1500);

    } catch (err) {
      console.error(err);
      setError("Verification failed. Please try again.");
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Detection Pipeline</h1>
          <p className="mt-2 text-slate-600">Follow the stages to authenticate the audio.</p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-12 flex justify-center items-center">
          <div className={cn("flex items-center gap-2", stage === 'upload' || stage === 'analyzing_deepfake' || stage === 'result_deepfake' ? "text-indigo-600 font-bold" : "text-slate-400")}>
            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">1</div>
            <span>Deepfake Detection</span>
          </div>
          <div className="w-16 h-0.5 bg-slate-300 mx-4" />
          <div className={cn("flex items-center gap-2", stage === 'verification_input' || stage === 'analyzing_verification' || stage === 'final_result' ? "text-indigo-600 font-bold" : "text-slate-400")}>
            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">2</div>
            <span>Speaker Verification</span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8">
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* STAGE 1: UPLOAD */}
              {stage === 'upload' && (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-slate-900">Upload Suspicious Audio</h2>
                    <p className="text-sm text-slate-500">Upload the file you want to analyze (WAV/MP3)</p>
                  </div>
                  
                  <FileUpload 
                    selectedFile={suspiciousFile} 
                    onFileSelect={setSuspiciousFile} 
                    label="Drop suspicious audio here"
                  />

                  <button
                    onClick={handleDeepfakeDetection}
                    disabled={!suspiciousFile}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-medium shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Analyze Audio
                  </button>
                </motion.div>
              )}

              {/* LOADING STATES */}
              {(stage === 'analyzing_deepfake' || stage === 'analyzing_verification') && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
                  <h3 className="text-xl font-semibold text-slate-900">
                    {stage === 'analyzing_deepfake' ? 'Extracting MFCC Features...' : 'Comparing Voice Signatures...'}
                  </h3>
                  <p className="text-slate-500 mt-2">Running SVM Model & Analysis</p>
                </motion.div>
              )}

              {/* STAGE 1 RESULT: DEEPFAKE */}
              {stage === 'result_deepfake' && deepfakeResult?.prediction === 'deepfake' && (
                <motion.div 
                  key="result-fake"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-red-600 mb-2">DEEPFAKE DETECTED</h2>
                  <p className="text-slate-600 mb-8">
                    The system has identified this audio as synthetic with <strong>{(deepfakeResult.confidence * 100).toFixed(1)}%</strong> confidence.
                  </p>
                  
                  {deepfakeResult.note && (
                     <p className="text-xs text-slate-400 mb-4">{deepfakeResult.note}</p>
                  )}

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-8">
                    <p className="text-sm text-slate-500">Authentication Process Halted.</p>
                  </div>

                  <button onClick={reset} className="px-6 py-2 text-slate-600 hover:text-slate-900 font-medium">
                    Start Over
                  </button>
                </motion.div>
              )}

              {/* STAGE 1 RESULT: REAL -> PROMPT FOR STAGE 2 */}
              {stage === 'result_deepfake' && deepfakeResult?.prediction === 'real' && (
                <motion.div 
                  key="result-real"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-600 mb-2">Audio is Real</h2>
                  <p className="text-slate-600 mb-8">
                    Proceeding to Stage 2: Speaker Verification
                  </p>
                  
                  <button 
                    onClick={() => setStage('verification_input')}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-md hover:bg-indigo-700"
                  >
                    Continue to Verification
                  </button>
                </motion.div>
              )}

              {/* STAGE 2: INPUT */}
              {stage === 'verification_input' && (
                <motion.div 
                  key="verify-input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 mb-6">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <div>
                        <h3 className="font-semibold text-emerald-800">Stage 1 Passed: Audio is Real</h3>
                        <p className="text-sm text-emerald-600">Proceeding to Speaker Verification</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-900">Verify Speaker Identity</h2>
                    <p className="text-sm text-slate-500">Provide a reference voice sample to compare against.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-center text-slate-700">Option A: Upload Reference</p>
                      <FileUpload 
                        selectedFile={referenceFile} 
                        onFileSelect={setReferenceFile}
                        label="Upload Reference Audio" 
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-center text-slate-700">Option B: Record Live</p>
                      <AudioRecorder onRecordingComplete={setReferenceFile} label="Record Your Voice" />
                    </div>
                  </div>

                  {referenceFile && (
                    <div className="text-center p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                      Selected Reference: {referenceFile.name}
                    </div>
                  )}

                  <button
                    onClick={handleVerification}
                    disabled={!referenceFile}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-medium shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Verify Speaker
                  </button>
                </motion.div>
              )}

              {/* FINAL RESULT */}
              {stage === 'final_result' && verificationResult && (
                <motion.div 
                  key="final"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  {verificationResult.verified ? (
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <UserCheck className="w-12 h-12 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <UserX className="w-12 h-12 text-yellow-600" />
                    </div>
                  )}

                  <h2 className={cn("text-3xl font-bold mb-2", verificationResult.verified ? "text-emerald-600" : "text-yellow-600")}>
                    {verificationResult.verified ? "IDENTITY VERIFIED" : "DIFFERENT SPEAKER"}
                  </h2>
                  
                  <p className="text-slate-600 mb-8">
                    {verificationResult.verified 
                      ? "The speaker matches the reference voice." 
                      : "The audio is real, but does not match the reference speaker."}
                  </p>

                  <div className="max-w-xs mx-auto bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500">Similarity Score</span>
                      <span className="font-mono font-bold text-slate-900">{(verificationResult.similarity * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1">
                      <div 
                        className={cn("h-2.5 rounded-full", verificationResult.verified ? "bg-emerald-500" : "bg-yellow-500")} 
                        style={{ width: `${Math.min(100, Math.max(0, verificationResult.similarity * 100))}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-400 text-right">Threshold: {(verificationResult.threshold * 100).toFixed(0)}%</div>
                  </div>

                  <button onClick={reset} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 shadow-md">
                    Start New Detection
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

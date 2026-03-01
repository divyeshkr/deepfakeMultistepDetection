import React, { useState, useRef } from 'react';
import { Mic, Square, Upload, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  label?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, label = "Record Audio" }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        
        const file = new File([blob], "recording.wav", { type: 'audio/wav' });
        onRecordingComplete(file);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure you have granted permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setAudioURL(null);
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
      <h3 className="text-sm font-medium text-slate-600">{label}</h3>
      
      {!audioURL ? (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            "flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-md",
            isRecording 
              ? "bg-red-500 hover:bg-red-600 animate-pulse" 
              : "bg-indigo-600 hover:bg-indigo-700"
          )}
        >
          {isRecording ? (
            <Square className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full">
          <audio src={audioURL} controls className="w-full h-10" />
          <button
            onClick={resetRecording}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
          >
            <RefreshCw className="w-4 h-4" />
            Record Again
          </button>
        </div>
      )}
      
      <p className="text-xs text-slate-400">
        {isRecording ? "Recording... Click to stop" : audioURL ? "Recording saved" : "Click mic to start recording"}
      </p>
    </div>
  );
};

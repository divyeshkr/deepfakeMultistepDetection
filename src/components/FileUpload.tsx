import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, label = "Upload Audio File" }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  // @ts-ignore - react-dropzone types are strict about HTML props
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.wav', '.mp3', '.ogg', '.m4a']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={cn(
        "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
        isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-400 bg-white",
        selectedFile ? "bg-emerald-50 border-emerald-200" : ""
      )}
    >
      <input {...getInputProps()} />
      
      {selectedFile ? (
        <div className="flex flex-col items-center text-emerald-700">
          <FileAudio className="w-12 h-12 mb-2" />
          <p className="font-medium text-center break-all">{selectedFile.name}</p>
          <p className="text-xs opacity-70 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          <p className="text-xs mt-2 text-emerald-600 font-semibold">Click to change file</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-slate-500">
          <Upload className="w-10 h-10 mb-3 text-slate-400" />
          <p className="font-medium text-slate-700">{label}</p>
          <p className="text-xs mt-1 text-slate-400">Drag & drop or click to browse</p>
          <p className="text-[10px] mt-2 text-slate-400 uppercase tracking-wider">Supports WAV, MP3</p>
        </div>
      )}
    </div>
  );
};

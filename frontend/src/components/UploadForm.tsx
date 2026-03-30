import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface UploadFormProps {
  onUploadSuccess: (data: any) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError("Please select a valid CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:8000/upload", formData);
      if (response.data.status === "success") {
        onUploadSuccess(response.data);
      } else {
        setError(response.data.message || "Upload failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "An error occurred during upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-zinc-200/80 w-full max-w-xl mx-auto text-center transition-all hover:border-zinc-300">
      <div className="mb-6 flex justify-center">
        <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200/60 shadow-sm">
          <Upload className="w-5 h-5 text-zinc-700" strokeWidth={2.5} />
        </div>
      </div>
      <h3 className="text-[17px] font-semibold mb-2 text-zinc-900 tracking-tight">Select a file</h3>
      <p className="text-[14px] text-zinc-500 mb-8 max-w-[280px] mx-auto leading-relaxed">CSV files up to 50MB are supported. First row must contain headers.</p>
      
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 text-[13px] font-medium border border-red-100/50 text-left">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl text-[14px] font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.12)] active:scale-[0.99]"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-[1.5px] border-white"></div>
          ) : null}
          {isUploading ? 'Uploading...' : 'Choose file'}
        </button>
      </div>
    </div>
  );
}

export default UploadForm;

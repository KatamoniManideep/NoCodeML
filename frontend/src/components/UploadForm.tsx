import React, { useState, useRef } from 'react';
import { Upload, FileType, AlertCircle } from 'lucide-react';
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
    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 w-full max-w-2xl mx-auto text-center transition-all hover:shadow-md">
      <div className="mb-6 flex justify-center">
        <div className="bg-blue-50 p-5 rounded-full ring-8 ring-blue-50/50">
          <FileType className="w-12 h-12 text-blue-600" />
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-3 text-gray-900">Upload Dataset</h3>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">Select a CSV file to begin. Your data will be processed rapidly using Polars.</p>
      
      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-center justify-center gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.98]"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Upload className="w-5 h-5" />
          )}
          {isUploading ? 'Uploading & Processing...' : 'Select CSV File'}
        </button>
      </div>
      <p className="mt-5 text-xs text-gray-400 tracking-wide uppercase font-semibold">Max size 50MB &bull; First row headers</p>
    </div>
  );
}

export default UploadForm;

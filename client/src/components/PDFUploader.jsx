import { useState, useCallback, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function PDFUploader({ onUploadSuccess, onUploadError }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;

      if (file.type !== 'application/pdf') {
        const msg = 'Only PDF files are allowed';
        setError(msg);
        onUploadError?.(msg);
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        const msg = 'File too large. Maximum size is 10MB';
        setError(msg);
        onUploadError?.(msg);
        return;
      }

      setIsUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/upload`, { method: 'POST', body: formData });
        const contentType = response.headers.get('content-type');

        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned an error page instead of JSON. Check server logs.');
        }

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Upload failed');

        const successMsg = `Successfully uploaded: ${result.fileName} (${result.chunksCreated} chunks created)`;
        setSuccess(successMsg);
        onUploadSuccess?.(result.fileName);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        onUploadError?.(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadSuccess, onUploadError]
  );

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };
  const handleFileInputChange = (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); };
  const handleClick = () => { if (!isUploading && fileInputRef.current) fileInputRef.current.click(); };
  const clearMessages = () => { setError(null); setSuccess(null); };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-4">
          {isUploading ? (
            <>
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-600">Processing PDF...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop the PDF file here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PDF files only (max 10MB)</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-800">{success}</p>
          </div>
          <button onClick={clearMessages} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
          </div>
          <button onClick={clearMessages} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

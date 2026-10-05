import { useState, useEffect } from 'react';
import { AlertCircle, FileText, MessageSquare, Upload } from 'lucide-react';
import Header from '../components/Header.jsx';
import PDFUploader from '../components/PDFUploader.jsx';
import ChatInterface from '../components/ChatInterface.jsx';
import CloseIcon from '../components/icons/CloseIcon.jsx';
import DeleteIcon from '../components/icons/DeleteIcon.jsx';

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('manage');
  const [fileStats, setFileStats] = useState({ count: 0, totalChunks: 0 });

  useEffect(() => {
    fetchUserFiles();
  }, []);

  const fetchUserFiles = async () => {
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(data.files || []);
        setFileStats({ count: data.count || 0, totalChunks: data.totalChunks || 0 });
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  };

  const handleUploadSuccess = (fileName) => {
    setUploadedFiles((prev) => [...prev, fileName]);
    setFileStats((prev) => ({ count: prev.count + 1, totalChunks: prev.totalChunks + 1 }));
    setActiveTab('chat');
    setError(null);
    setTimeout(fetchUserFiles, 1000);
  };

  const handleDeleteFile = async (fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/files?fileName=${encodeURIComponent(fileName)}`, { method: 'DELETE' });
      if (response.ok) {
        setUploadedFiles((prev) => prev.filter((n) => n !== fileName));
        setFileStats((prev) => ({ count: Math.max(0, prev.count - 1), totalChunks: Math.max(0, prev.totalChunks - 1) }));
        setTimeout(fetchUserFiles, 500);
      } else {
        const errorData = await response.json();
        setError(`Failed to delete file: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete file. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 transition-colors">
                <CloseIcon />
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                activeTab === 'manage'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Manage</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              disabled={fileStats.count === 0}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Ask a Question</span>
              {fileStats.count > 0 && (
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">{fileStats.count}</span>
              )}
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'manage' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload New Document</h2>
                    <p className="text-gray-600">Add new PDFs to your knowledge base</p>
                  </div>
                  <PDFUploader onUploadSuccess={handleUploadSuccess} onUploadError={setError} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Documents</h2>
                  <p className="text-gray-600">Manage your uploaded PDFs</p>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {uploadedFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No documents uploaded yet</p>
                      <p className="text-sm text-gray-400 mt-1">Upload your first PDF to get started</p>
                    </div>
                  ) : (
                    uploadedFiles.map((fileName, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{fileName}</p>
                            <p className="text-sm text-gray-500">PDF Document</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFile(fileName)}
                          className="opacity-0 group-hover:opacity-100 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center space-x-1"
                          title="Delete document"
                        >
                          <DeleteIcon />
                          <span className="text-xs">Delete</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{fileStats.count} documents</span>
                      <span>{fileStats.totalChunks} chunks total</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Chat with Your Documents</h2>
                    </div>
                  </div>
                </div>
                <ChatInterface onError={setError} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

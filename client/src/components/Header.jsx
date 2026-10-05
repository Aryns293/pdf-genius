import { useEffect, useState } from 'react';
import { LogOut, FileText, Hash, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { user, signOut } = useAuth();
  const [fileStats, setFileStats] = useState({ count: 0, totalChunks: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) fetchFileStats();
  }, [user]);

  const fetchFileStats = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        setFileStats({ count: data.count || 0, totalChunks: data.totalChunks || 0 });
      }
    } catch (error) {
      console.error('Failed to fetch file stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                PDF Genius
              </h1>
              <p className="text-xs text-gray-500 -mt-1">AI-Powered Assistant</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-4 bg-gray-50 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900">{isLoading ? '...' : fileStats.count}</div>
                      <div className="text-xs text-gray-500">docs</div>
                    </div>
                  </div>

                  <div className="w-px h-8 bg-gray-200"></div>

                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <Hash className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900">{isLoading ? '...' : fileStats.totalChunks}</div>
                      <div className="text-xs text-gray-500">chunks</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {user.image ? (
                    <img src={user.image} alt={user.name || 'User'} className="w-9 h-9 rounded-full ring-2 ring-gray-100" />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <button
                    onClick={signOut}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-all duration-200"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

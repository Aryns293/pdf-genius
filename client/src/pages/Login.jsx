import { useAuth } from '../context/AuthContext.jsx';
import Header from '../components/Header.jsx';
import GoogleLogo from '../components/icons/GoogleLogo.jsx';
import { Sparkles, Upload, Brain, Search, Zap } from 'lucide-react';

function FeatureCard({ icon, color, title, desc }) {
  return (
    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  );
}

export default function Login() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-blue-100 text-blue-700 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered PDF Intelligence
            </div>

            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
              Chat with Your
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Documents
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Upload PDF documents and ask questions to get instant, intelligent answers powered by advanced AI technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <FeatureCard
              icon={<Upload className="w-6 h-6 text-white" />}
              color="from-blue-500 to-blue-600"
              title="Smart Upload"
              desc="Drag & drop PDF files up to 10MB with instant processing"
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6 text-white" />}
              color="from-purple-500 to-purple-600"
              title="AI Analysis"
              desc="Advanced AI understands context and provides accurate answers"
            />
            <FeatureCard
              icon={<Search className="w-6 h-6 text-white" />}
              color="from-green-500 to-green-600"
              title="Source Citations"
              desc="Get answers with precise references to original content"
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={signIn}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <GoogleLogo />
                <span>Continue with Google</span>
                <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

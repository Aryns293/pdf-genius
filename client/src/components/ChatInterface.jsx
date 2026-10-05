import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Loader2 } from 'lucide-react';

export default function ChatInterface({ onError }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const question = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to get response');

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        sources: result.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      onError?.(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Sorry, I encountered an error: ${errorMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSources = (messageId) => {
    setShowSources(showSources === messageId ? null : messageId);
  };

  return (
    <div className="flex flex-col h-full max-h-[650px]">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl font-semibold text-gray-900 mb-2">Ready to help!</p>
            <p className="text-gray-600 max-w-md mx-auto">
              Ask me anything about your uploaded documents. I'll provide detailed answers with source references.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'assistant' && (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-gray-700" />
                  </div>
                )}

                <div className={`max-w-[75%] rounded-2xl px-6 py-4 ${
                  message.type === 'user'
                    ? 'text-black shadow-md'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => toggleSources(message.id)}
                        className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>
                          {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
                        </span>
                      </button>

                      {showSources === message.id && (
                        <div className="mt-3 space-y-3">
                          {message.sources.map((source) => (
                            <div key={source.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-blue-900 text-sm">{source.fileName}</span>
                                <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded-full">
                                  Page {source.pageNumber} • {Math.round(source.score * 100)}% match
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed">{source.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {message.type === 'user' && (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-5 h-5 text-gray-700" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-5 h-5 text-gray-700" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-gray-700">Analyzing your question...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about your documents..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 text-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import { toast } from 'react-toastify';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'support';
  timestamp: Date;
  seen?: boolean;
  attachmentUrl?: string;
}

const SupportPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Welcome to GhostGPT Support! How can we help you today?',
      sender: 'support',
      timestamp: new Date(Date.now() - 5 * 60000),
      seen: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      seen: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate support response
    setTimeout(() => {
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Thank you for your message. Our support team will review your inquiry and respond shortly.',
        sender: 'support',
        timestamp: new Date(),
        seen: true,
      };
      setMessages((prev) => [...prev, supportMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleFileUpload = () => {
    toast.info('File upload feature coming soon!');
  };

  const handleAttachTransactionId = () => {
    const transactionId = 'TXN_20240115_ABC123XYZ';
    setInputValue((prev) => `${prev} [Transaction: ${transactionId}]`.trim());
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2">
            Support Chat
          </h1>
          <p className="text-slate-300">
            Get help from our support team. Response time: typically within 24 hours.
          </p>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-emerald-500/20 rounded-lg p-6 overflow-y-auto mb-6 flex flex-col">
          <div className="flex-1 space-y-4 mb-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                id={message.id}
                content={message.content}
                sender={message.sender}
                timestamp={message.timestamp}
                seen={message.seen}
                attachmentUrl={message.attachmentUrl}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader size={16} className="animate-spin text-emerald-400" />
                    <span className="text-slate-400 text-sm">Support is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={handleAttachTransactionId}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-2 rounded-lg transition-colors"
          >
            Attach Transaction ID
          </button>
          <button
            onClick={handleFileUpload}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-2 rounded-lg transition-colors"
          >
            Upload Screenshot
          </button>
        </div>

        {/* Input Area */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/20 rounded-lg p-4">
          <div className="flex gap-3">
            <button
              onClick={handleFileUpload}
              className="flex-shrink-0 p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Attach file"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 bg-slate-900/50 border border-emerald-500/20 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="flex-shrink-0 p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-slate-900 disabled:text-slate-400 rounded-lg transition-colors"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SupportPage;

import React, { useState, useRef, useEffect } from 'react';
import { Send, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import MatrixBackground from '../components/MatrixBackground';
import { toast } from 'react-toastify';
import { backendApi, type ChatMessage } from '../lib/backendApi';
import { getTelegramUserId } from '../lib/telegramWebApp';
import { ADMIN_TELEGRAM_ID } from '../appConfig';

interface TrialMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const TrialPage: React.FC = () => {
  const [messages, setMessages] = useState<TrialMessage[]>([
    {
      id: '1',
      content: 'Welcome to GhostGPT Free Trial. I am your AI assistant. Ask me anything within the free tier limits.',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usedWords, setUsedWords] = useState(0);
  const [limitWords, setLimitWords] = useState<number | null>(500);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const remainingWords = typeof limitWords === 'number' ? Math.max(0, limitWords - usedWords) : null;
    if (typeof remainingWords === 'number' && remainingWords <= 0) {
      toast.warning('Free trial word limit reached. Upgrade to continue.');
      return;
    }

    const userMessage: TrialMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const systemPrompt =
        'You are GhostGPT. Be helpful, concise, and honest about uncertainty. Use clear formatting when useful.';

      // Send a short window of history for context.
      const historyWindow = messages.slice(-12);
      const chatMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...historyWindow
          .filter((m) => m.sender === 'user' || m.sender === 'ai')
          .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content })),
        { role: 'user', content: userMessage.content },
      ];

      const reply = await backendApi.chat(chatMessages);
      const aiMessage: TrialMessage = {
        id: (Date.now() + 1).toString(),
        content: reply.content,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (reply.trial) {
        setUsedWords(reply.trial.usedWords);
        setLimitWords(reply.trial.limitWords);
        if (typeof reply.trial.remainingWords === 'number' && reply.trial.remainingWords <= 0) {
          toast.warning('Free trial word limit reached. Upgrade to continue.');
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to reach chatbot.';
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_err`,
          content: msg,
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const remainingWords =
    typeof limitWords === 'number' ? Math.max(0, limitWords - usedWords) : null;

  const telegramUserId = getTelegramUserId();
  const isAdmin =
    typeof ADMIN_TELEGRAM_ID === 'number' &&
    Number.isFinite(ADMIN_TELEGRAM_ID) &&
    typeof telegramUserId === 'number' &&
    telegramUserId === ADMIN_TELEGRAM_ID;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <MatrixBackground />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex flex-col h-screen">
        <div className="mb-6">
          <p className="text-emerald-300 text-sm font-mono">Demo Mode Interface</p>
        </div>

        {/* Usage Bar */}
        <div className="mb-6 bg-slate-900/50 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-400 text-sm font-mono">USAGE</span>
            <span className="text-emerald-400 text-sm font-mono">
              {limitWords === null ? 'ADMIN' : `${usedWords}/${limitWords} words`}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-300"
              style={{
                width:
                  limitWords === null || limitWords <= 0
                    ? '100%'
                    : `${Math.min(100, (usedWords / limitWords) * 100)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-slate-900/30 border border-emerald-500/20 rounded-lg p-6 overflow-y-auto mb-6 flex flex-col font-mono">
          <div className="flex-1 space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md ${
                    message.sender === 'user'
                      ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/50 border border-slate-700/50 text-emerald-400'
                  } rounded-lg p-3 text-sm`}
                >
                  <p className="break-words">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-sm font-mono">
                      &gt; Processing...
                    </span>
                    <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Upgrade CTA */}
        {!isAdmin && typeof remainingWords === 'number' && remainingWords <= 120 && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
            <Lock className="text-amber-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-amber-400 font-semibold text-sm mb-2">
                Free Trial Limit Approaching
              </p>
              <p className="text-amber-300 text-sm mb-3">
                You have {remainingWords} words remaining. Upgrade to GhostGPT Premium for unlimited access.
              </p>
              <Link
                to="/"
                className="inline-block bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm transition-all duration-200"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/20 rounded-lg p-4">
          <div className="flex gap-3">
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
              placeholder="> Ask me anything..."
              className="flex-1 bg-slate-900/50 border border-emerald-500/20 rounded-lg px-4 py-2 text-emerald-400 placeholder-emerald-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono text-sm"
              disabled={isLoading || (!isAdmin && typeof remainingWords === 'number' && remainingWords <= 0)}
            />
            <button
              onClick={handleSendMessage}
              disabled={
                !inputValue.trim() ||
                isLoading ||
                (!isAdmin && typeof remainingWords === 'number' && remainingWords <= 0)
              }
              className="flex-shrink-0 p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-slate-900 disabled:text-slate-400 rounded-lg transition-colors"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-emerald-700 text-xs mt-2 font-mono">
            {!isAdmin && typeof remainingWords === 'number' && remainingWords <= 0
              ? '> LIMIT REACHED - UPGRADE TO CONTINUE'
              : limitWords === null
                ? '> ADMIN MODE'
                : `> ${remainingWords} words remaining`}
          </p>
        </div>
      </div>
    </main>
  );
};

export default TrialPage;

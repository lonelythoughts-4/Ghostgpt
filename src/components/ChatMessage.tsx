import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface ChatMessageProps {
  id: string;
  content: string;
  sender: 'user' | 'support';
  timestamp: Date;
  seen?: boolean;
  attachmentUrl?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  sender,
  timestamp,
  seen,
  attachmentUrl,
}) => {
  const isUser = sender === 'user';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md ${
          isUser
            ? 'bg-emerald-600/30 border border-emerald-500/50'
            : 'bg-slate-800/50 border border-slate-700/50'
        } rounded-lg p-3`}
      >
        {attachmentUrl && (
          <div className="mb-2">
            <img
              src={attachmentUrl}
              alt="Attachment"
              className="rounded max-w-full h-auto"
            />
          </div>
        )}
        <p className="text-slate-200 text-sm break-words">{content}</p>
        <div
          className={`flex items-center justify-end gap-1 mt-2 text-xs ${
            isUser ? 'text-emerald-300' : 'text-slate-400'
          }`}
        >
          <span>{formatTime(timestamp)}</span>
          {isUser && (
            <>
              {seen ? (
                <CheckCheck size={14} />
              ) : (
                <Check size={14} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { X, RotateCcw } from 'lucide-react';

const API_ENDPOINT = "/chat";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface WidgetSettings {
  welcome_text: string;
  title: string;
  show_poweredby?: boolean;
  input_placeholder?: string;
  loading_api?: string;
  loading_app?: string;
  tooltip_reset?: string;
  tooltip_close?: string;
}

const STORAGE_KEYS = {
  THREAD_ID: 'chatThreadId',
  MESSAGES: 'chatMessages'
} as const;

function App() {
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<WidgetSettings>({
    welcome_text: '',
    title: 'AI ChatBot',
    show_poweredby: true,
    input_placeholder: 'Type your message...',
    loading_api: 'Thinking...',
    loading_app: 'Loading chat...',
    tooltip_reset: 'Reset chat',
    tooltip_close: 'Close chat',
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.THREAD_ID));
  const [isLoading, setIsLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const widgetId = params.get('id');
    if (widgetId) setId(widgetId);

    setTimeout(() => {
      setIsLoading(false);
      scrollToBottom();
    }, 300);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    // Показать "Thinking..." как placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: settings.loading_api || 'Thinking...' }]);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (threadId) {
        headers['x-thread-id'] = threadId;
      }

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: content })
      });

      const result = await response.json();
      const answer = result.content || '🤖 Пустой ответ.';

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: answer
        };
        return newMessages;
      });

    } catch (err) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: '⚠️ Ошибка ответа от сервера.'
        };
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setThreadId(null);
    localStorage.removeItem(STORAGE_KEYS.THREAD_ID);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
  };

  const handleClose = () => {
    window.parent.postMessage('close-chat', '*');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center text-gray-500">
        {settings.loading_app}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold">{settings.title}</h1>
        <div className="flex gap-2">
          <button onClick={handleReset} className="p-2 hover:bg-gray-100">
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {settings.welcome_text && (
          <div className="text-center text-gray-500 mb-4">
            {settings.welcome_text}
          </div>
        )}
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            id={id}
            message={message}
            isStreaming={isStreaming && index === messages.length - 1}
            threadId={threadId}
            messageHistory={messages}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={isStreaming}
        settings={{ input_placeholder: settings.input_placeholder }}
      />

      {settings.show_poweredby && (
        <div className="text-center text-xs text-gray-400 pb-2">
          Powered by Widget Platform
        </div>
      )}
    </div>
  );
}

export default App;

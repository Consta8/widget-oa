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
  loading_openai?: string;
  tooltip_reset?: string;
  tooltip_close?: string;
  loading_app?: string;
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
    title: '',
    show_poweredby: true,
    input_placeholder: 'Type your message...',
    loading_api: 'Thinking...',
    loading_openai: 'Loading...',
    tooltip_reset: 'Reset chat',
    tooltip_close: 'Close chat',
    loading_app: 'Loading chat...'
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [threadId, setThreadId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.THREAD_ID));
  const [isLoading, setIsLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const widgetId = params.get('id');
        if (widgetId) setId(widgetId);
      } catch (_) {}
      setIsLoading(false);
      scrollToBottom();
    };
    load();
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

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(threadId ? { 'x-thread-id': threadId } : {})
        },
        body: JSON.stringify({ message: content })
      });

      const result = await response.json();
      const answer = result.content;

      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Ошибка получения ответа.' }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClose = () => {
    window.parent.postMessage('close-chat', '*');
  };

  const handleReset = () => {
    setMessages([]);
    setThreadId(null);
    localStorage.clear();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center">
        <div className="mt-4 text-gray-600">{settings.loading_app}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold">{settings.title}</h1>
        <div className="flex gap-2">
          <button onClick={handleReset} className="p-2 hover:bg-gray-100 group relative">
            <RotateCcw className="w-5 h-5 text-gray-500 group-hover:text-black" />
          </button>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 group relative">
            <X className="w-5 h-5 text-gray-500 group-hover:text-black" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {settings.welcome_text && (
          <div className="text-center text-gray-500 mb-4">
            {settings.welcome_text}
          </div>
        )}
        {messages.map((msg, idx) => (
          <ChatMessage
            key={idx}
            message={msg}
            isStreaming={isStreaming && idx === messages.length - 1}
            threadId={threadId}
            messageHistory={messages}
            id={id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={isStreaming} settings={settings} />

      {settings.show_poweredby && (
        <a href="https://widgetplatform.com" target="_blank" className="text-center text-xs text-gray-400 py-2">
          Powered by Widget Platform
        </a>
      )}
    </div>
  );
}

export default App;

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface Message {
  role: 'assistant' | 'human';
  content: string;
}

interface ChatAreaProps {
  initialMessages: Message[];
}

const ChatArea: React.FC<ChatAreaProps> = ({ initialMessages }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { role: 'human', content: input }]);
      setInput('');
      // Simulating AI response
      setTimeout(() => {
        setMessages(msgs => [...msgs, { 
          role: 'assistant', 
          content: `I understand you said: "${input}". How can I assist you further?`
        }]);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'human' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold mr-3">
                  C
                </div>
              )}
              <div className={`max-w-[75%] rounded-lg p-4 ${
                message.role === 'human' ? 'bg-blue-100 text-gray-800' : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
              {message.role === 'human' && (
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold ml-3">
                  C
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center bg-white rounded-full border border-gray-300">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What would you like to ask?"
              className="flex-1 p-3 bg-transparent focus:outline-none"
            />
            <button type="submit" className="p-3 text-blue-500 hover:text-blue-600 focus:outline-none">
              <Send size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatArea;


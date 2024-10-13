'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Menu } from 'lucide-react';
import Chat from './components/Chat';
import '../../globals.css';

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I assist you today?' }
  ]);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(scrollToBottom, [messages]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { role: 'human', content: input }]);
      setTimeout(() => {
        setMessages(msgs => [...msgs, { role: 'assistant', content: `You said: ${input}` }]);
      }, 500);
      setInput('');
    }
  }


  return (
    <div className="flex h-screen bg-gray-100">
     {/* Sidebar */}
     {/* TODO: Sidebar */}
     <div className={`bg-gray-800 text-white w-64 flex-shrink-0 ${isSidebarOpen ? '' : 'hidden'} md:block`}>
        <div className="p-4">
          <button className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center">
            <Plus size={20} className="mr-2" />
            New chat
          </button>
        </div>
        <nav className="mt-4">
          {/* Add your sidebar navigation items here */}
        </nav>
      </div>


      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden mr-4">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold">Chat with Claude</h1>
        </header>

       {/* Chat area */}
       <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'human' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded p-3 ${
                  message.role === 'human' ? 'bg-blue-100 text-gray-800' : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  <p className="text-sm font-semibold mb-1">{message.role === 'human' ? 'Human' : 'Claude'}</p>
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>


        {/* Input area */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200">
          <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="p-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Send size={20} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

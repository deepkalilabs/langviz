'use client'

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import '../../globals.css';

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const initialMessages = [
    { role: 'assistant' as const, content: 'Hello! How can I assist you today? If you have any questions or need help with data analysis, feel free to ask!' }
  ];

  return (
    <div className="flex h-screen bg-white">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Header title="Chat with Claude" />
        <ChatArea initialMessages={initialMessages} />
      </div>
    </div>
  );
}

'use client'

import React, { useState } from 'react';
import SideBar from './components/SideBar';
import ChatArea from './components/ChatArea';
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"


const ChatPage: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        <ChatArea
          initialMessages={[
            {
              role: 'assistant',
              content: 'Hello! How can I help you today? Upload a CSV file to get started.'
            }
          ]}
          onDataReceived={() => {}}
          onUploadComplete={() => {}}
        />
      </div>
    </div>
  );
};

export default ChatPage;

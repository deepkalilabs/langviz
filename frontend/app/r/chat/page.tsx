'use client'

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import SideBar from './components/SideBar';
import ChatArea from './components/ChatArea';



const ChatPage: React.FC = () => {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin')
    },
  })
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  //Loading state
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>Loading...</div>
      </div>
    </div>
  }

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

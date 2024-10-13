import React, { useState } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    // TODO: Send message to AI and get response
    // This is where you'd integrate with your AI backend
  };

  return (
    //Make it like claude chat
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-semibold text-gray-800">Chat with AI</h1>
      </header>
      <div className="flex-grow overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          <MessageList messages={messages} />
        </div>
      </div>
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto">
          <InputArea onSendMessage={sendMessage} />
        </div>
      </footer>
    </div>

  );
}

export default Chat;


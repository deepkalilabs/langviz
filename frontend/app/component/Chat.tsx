'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from './DataTable';

interface DataResponse {
  id: number;
  name: string;
  data: Record<string, string | number>[];
  user: number;
}

interface ChatProps {
  dataResponse: DataResponse;
}

const Chat: React.FC<ChatProps> = ({ dataResponse }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [showDataTable, setShowDataTable] = useState(false);

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }]);
      // Here you would typically send the message to a backend for processing
      // For now, we'll just add a mock response
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I've analyzed your CSV data with ${dataResponse.data.length} rows. What would you like to know about it?` 
        }]);
      }, 1000);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 mr-2"></div>
            )}
            <div className={`max-w-[70%] p-3 rounded-lg ${
              message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {message.content}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-400 flex-shrink-0 ml-2"></div>
            )}
          </div>
        ))}
      </div>
      {showDataTable && (
        <div className="p-4 border-t border-b">
          <DataTable dataResponse={dataResponse} />
        </div>
      )}
      <div className="p-4 border-t">
        <div className="flex space-x-2 mb-2">
          <Button onClick={() => setShowDataTable(!showDataTable)}>
            {showDataTable ? 'Hide Data' : 'Show Data'}
          </Button>
        </div>
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your CSV data..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

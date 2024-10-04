'use client'

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from './DataTable';
import { DataSetApiResponse, OriginalDataSet } from './types';
import D3Visualization from './D3Visualization';
import { useMutation } from '@tanstack/react-query';

interface ChatProps {
  sessionId: string;
  originalData: OriginalDataSet;
  dataResponse: DataSetApiResponse;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
}

const Chat: React.FC<ChatProps> = ({ originalData, dataResponse }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showDataTable, setShowDataTable] = useState(false);
  const [chartConfig, setChartConfig] = useState(null);
  const [csvData, setCsvData] = useState<any>(originalData);

  const sendMessageMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await axios.post<ChatResponse>(
        'http://0.0.0.0:8000/api/chat/chat-sessions/message/',
        {
          questions: [question],
          session_id: dataResponse.session_id
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.message }
      ]);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' }
      ]);
    }
  });

  const handleSendMessage = useCallback(() => {
    if (input.trim()) {
      setMessages(prev => [...prev, { role: 'user', content: input }]);
      sendMessageMutation.mutate(input);
      setInput('');
    }
  }, [input, sendMessageMutation]);

  if (!csvData) {
    return <div>Loading chart data and configuration...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {message.content}
            </span>
          </div>
        ))}
      </div>
      {showDataTable && (
        <div className="p-4 border-t border-b">
          <DataTable dataResponse={dataResponse} originalData={originalData} />
        </div>
      )}
      <div className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow mr-2 p-2 border rounded"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded"
            disabled={sendMessageMutation.isPending}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
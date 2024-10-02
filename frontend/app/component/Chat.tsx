'use client'

import React, { useState, useEffect, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from './DataTable';
import { DataSetApiResponse } from './types';
import D3Visualization from './D3Visualization';
import Papa from 'papaparse';

interface ChatProps {
  dataResponse: DataSetApiResponse;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  visualization?: boolean;
}

const Chat: React.FC<ChatProps> = ({ dataResponse }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showDataTable, setShowDataTable] = useState(false);
  const [chartConfig, setChartConfig] = useState(null);
  const [csvData, setCsvData] = useState<any>(dataResponse.data);

  useEffect(() => {
    // Fetch JSON configuration
    fetch('d3/test3.json')
      .then(response => response.json())
      .then(data => setChartConfig(data))
      .catch(error => console.error('Error loading chart configuration:', error));  

    }, []);

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }]);
      // Here you would typically send the message to a backend for processing
      // For now, we'll just add a mock response with a visualization
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Here's a visualization based on your data:`,
          visualization: true
        }]);
      }, 1000);
      setInput('');
    }
  };

  if (!chartConfig || !csvData) {
    return <div>Loading chart data and configuration...</div>;
  }

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
              {message.visualization && (
                <div className="mt-2">
                  <D3Visualization 
                    csvURL={'data/test3.csv'}
                    d3Code={chartConfig?.d3 ?? ''}
                    width={500}
                    height={500}
                  />
                </div>
              )}
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
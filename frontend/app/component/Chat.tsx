'use client'

import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import DataTable from './DataTable';
import { DataSetApiResponse, OriginalDataSet } from './types';
import D3Visualization from './D3Visualization';
import { useMutation } from '@tanstack/react-query';
import ChartContainer from './ChartContainer'; // Assuming ChartContainer is defined in the same directory
import useWebSocket from 'react-use-websocket';

interface ChatProps {
  //sessionId: string;
  originalData: OriginalDataSet;
  dataResponse: DataSetApiResponse;
}

// TODO: Decouple user & server messages
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: string;
  chartData?: any;
}


const URL = 'ws://0.0.0.0:8000/ws/chat/';

const Chat: React.FC<ChatProps> = ({ originalData, dataResponse }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showDataTable, setShowDataTable] = useState(false);
  const [csvData, setCsvData] = useState<any>(originalData);
  const [socketURL, setSocketURL] = useState(URL);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketURL); 
  // const [chartData, setChartData] = useState<any>(null);

  const setMessageHandler = (msg: ChatMessage) => {
    // const validatedMsg: ChatMessage = {
    //   role: msg.role || 'assistant',
    //   content: msg.content || 'No content',
    //   type: msg.type,
    //   chartData: msg.chartData
    // };
    if (msg.content) {
      setMessages(prev => [
        ...prev,
        msg
      ]);
    }
  }
  
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const message = JSON.parse(lastMessage.data);
        setMessageHandler(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  const sendMessageMutation = useMutation({
    mutationFn: async (question: string) => {
      console.log('sending message');
      console.log({
        questions: [question],
        session_id: dataResponse.session_id
      });

      // TODO: Add chat history
      const serverMsg = sendMessage(JSON.stringify({
        type: "generate_visualizations",
        data: {
          questions: [question],
          session_id: dataResponse.session_id
        }
      }));

      return serverMsg;
    },
    onSuccess: (serverMsg: ChatMessage) => {
      // setChartData(data);
      setMessageHandler(serverMsg)
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' }
      ]);
    }
  });

  const handleUserSendMessage = useCallback(() => {
    if (input.trim()) {
      const userMsg: ChatMessage = { role: 'user', content: input, chartData: null }
      setMessageHandler(userMsg);
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
            {message.chartData && (
              <div className="mt-4">
                <ChartContainer chartResponse={message.chartData} />
              </div>
            )}
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
            onKeyPress={(e) => e.key === 'Enter' && handleUserSendMessage()}
            className="flex-grow mr-2 p-2 border rounded"
            placeholder="Type your message..."
          />
          <button
            onClick={handleUserSendMessage}
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
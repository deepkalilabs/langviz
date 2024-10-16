'use client'

import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import DataTable from './DataTable';
import { DataSetApiResponse, OriginalDataSet, ChatProps, ChatMessage, ChartData } from './types';
import { useMutation } from '@tanstack/react-query';
import ChartContainer from './ChartContainer'; // Assuming ChartContainer is defined in the same directory
import useWebSocket from 'react-use-websocket';
import ChatInput from './ChatInput';

const URL = 'ws://0.0.0.0:8000/ws/chat/';

const Chat: React.FC<ChatProps> = ({ originalData, dataResponse }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showDataTable, setShowDataTable] = useState(false);
  const [csvData, setCsvData] = useState<any>(originalData);
  const [socketURL, setSocketURL] = useState(URL);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketURL); 
  const [ replyToAssistantMessageIdx, setReplyToAssistantMessageIdx ] = useState<string | null>(null);
  const [ chartSelected, setChartSelected ] = useState<ChartData | null>(null);
  const [ refineVizName, setRefineVizName ] = useState<string | null>(null);


  const setMessageHandler = (msg: ChatMessage) => {
    if (msg.content) {
      setMessages(prev => [
        ...prev,
        msg
      ]);
    }
  }  

  useEffect(() => {
    if (replyToAssistantMessageIdx !== null) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].chartData?.assistant_message_uuid === replyToAssistantMessageIdx) {
          setChartSelected(messages[i]?.chartData ?? null)
          setRefineVizName(messages[i]?.chartData?.viz_name ?? null)
          break;
        }
      }
    } else if (replyToAssistantMessageIdx === null) {
      setChartSelected(null)
      setRefineVizName(null)
    }
  }, [replyToAssistantMessageIdx, messages])


  useEffect(() => {
    if (lastMessage !== null) {
      const message_received = JSON.parse(lastMessage.data);
      
      if (message_received.type === "viz_code") {
        try {
          const chartData: ChartData = {
            reason: message_received.reason,
            viz_name: message_received.viz_name,
            pd_code: message_received.pd_code,
            pd_viz_code: message_received.pd_viz_code,
            svg_json: message_received.svg_json,
            assistant_message_uuid: message_received.assistant_message_uuid
          }
          const msg: ChatMessage = { role: 'assistant', content: message_received.viz_name, type: message_received.type, chartData: chartData }
          setMessageHandler(msg);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      } else if (message_received.type === "ack") {
        const msg: ChatMessage = message_received;
        setMessageHandler(msg)
      }
    }
  }, [lastMessage]);

  const sendMessageMutation = useMutation({
    mutationFn: async (question: string) => {
      // TODO: Add chat history
      // TODO: Only send message Idx and fetch the messages from the server

      debugger;

      const serverMsgBody = JSON.stringify({
            type: replyToAssistantMessageIdx !== null ? "refine_visualizations" : "generate_visualizations",
            user_message_body: {
              question: question,
              session_id: dataResponse.session_id,
            },
            reply_to_assistant_message_uuid: replyToAssistantMessageIdx
        })
      
      if (replyToAssistantMessageIdx !== null) {
        // setReplyToAssistantMessageIdx(null);
        setRefineVizName(null);
      }

      const serverMsg = sendMessage(serverMsgBody);
      return serverMsg;
    },
    onSuccess: (serverMsg: ChatMessage) => {
      // setChartData(data);
      setMessageHandler(serverMsg)
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    }
  });

  const handleUserSendMessage = useCallback(() => {
    if (input.trim()) {
      let userMsg: ChatMessage;
      if (replyToAssistantMessageIdx !== null) {
        const refinedInput = "(Refining " + refineVizName + ") " + input
        userMsg = { role: 'user', content: refinedInput }
      } else {
        userMsg = { role: 'user', content: input}
      }
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
        {
          messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {message.content}
            </span>
            {message.chartData?.svg_json && (
              // TODO: Better type handling for chartData
              <div className="mt-4">
                <ChartContainer message={message} replyToAssistantMessageIdx={replyToAssistantMessageIdx} setReplyToAssistantMessageIdx={setReplyToAssistantMessageIdx} />
              </div>
            )}
          </div>
        ))}
      </div>

      <ChatInput input={input} setInput={setInput} setReplyToAssistantMessageIdx={setReplyToAssistantMessageIdx} vizName={refineVizName} handleUserSendMessage={handleUserSendMessage} isLoading={sendMessageMutation.isPending} />
      
      {showDataTable && (
        <div className="p-4 border-t border-b">
          <DataTable dataResponse={dataResponse} originalData={originalData} />
        </div>
      )}
    </div>
  );
};

export default Chat;
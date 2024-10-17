import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Upload, Database } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import Papa from 'papaparse';
import useWebSocket from 'react-use-websocket';
import DataTable from '../../../component/DataTable';
import ChartContainer from '../../../component/ChartContainer';
import { DataSetApiResponse, OriginalDataSet, ChatProps, ChatMessage, ChartData } from '../../../component/types';


interface ChatAreaProps {
  initialMessages: ChatMessage[];
  onDataReceived: (originalData: OriginalDataSet, apiData: DataSetApiResponse) => void;
  onUploadComplete: () => void;
}

interface ParsedData {
  file: File;
  data: Record<string, string | number | boolean | null>[];
}

const URL = 'ws://0.0.0.0:8000/ws/chat/';

const ChatArea: React.FC<ChatAreaProps> = ({ initialMessages, onDataReceived, onUploadComplete }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiData, setApiData] = useState<DataSetApiResponse | null>(null);
  const [originalData, setOriginalData] = useState<OriginalDataSet | null>(null);
  const [isDataDrawerOpen, setIsDataDrawerOpen] = useState(false);
  const [replyToAssistantMessageIdx, setReplyToAssistantMessageIdx] = useState<string | null>(null);
  const [chartSelected, setChartSelected] = useState<ChartData | null>(null);
  const [refineVizName, setRefineVizName] = useState<string | null>(null);

  const { sendMessage, lastMessage, readyState } = useWebSocket(URL);

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
          setMessages(prev => [...prev, msg]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      } else if (message_received.type === "ack") {
        setMessages(prev => [...prev, message_received]);
      }
    }
  }, [lastMessage]);

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

  const handleDataReceived = useCallback((originalData: OriginalDataSet, apiData: DataSetApiResponse) => {
    console.log('Papa parsed data:', originalData);
    setOriginalData(originalData);
    setApiData(apiData);
  }, [apiData, originalData]);

  const handleUploadComplete = useCallback(() => {
    console.log('Upload complete...opening right bar');
    setIsDataDrawerOpen(true);
  }, [isDataDrawerOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      let userMsg: ChatMessage;
      if (replyToAssistantMessageIdx !== null) {
        const refinedInput = "(Refining " + refineVizName + ") " + input
        userMsg = { role: 'user', content: refinedInput }
      } else {
        userMsg = { role: 'user', content: input}
      }
      setMessages(prev => [...prev, userMsg]);

      const serverMsgBody = JSON.stringify({
        type: replyToAssistantMessageIdx !== null ? "refine_visualizations" : "generate_visualizations",
        user_message_body: {
          question: input,
          session_id: apiData?.session_id,
        },
        reply_to_assistant_message_uuid: replyToAssistantMessageIdx
      });

      sendMessage(serverMsgBody);
      setInput('');

      if (replyToAssistantMessageIdx !== null) {
        setRefineVizName(null);
      }
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ file, data }: ParsedData) => {
      const formData = new FormData();
      formData.append('name', file.name);
      formData.append('description', 'test');
      formData.append('url', 'https://raw.githubusercontent.com/uwdata/draco/master/data/cars.csv');

      const response = await axios.post<DataSetApiResponse>(
        'http://localhost:8000/api/chat/chat-sessions/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return { originalData: data, apiData: response.data };
    },
    onSuccess: ({ originalData, apiData }) => {
      const originalDataSet: OriginalDataSet = {
        data: originalData,
        name: 'Uploaded CSV',
        description: 'Data uploaded via CSV',
        uri: ''
      };
      handleDataReceived(originalDataSet, apiData);
      handleUploadComplete();
      setMessages(msgs => [...msgs, { 
        role: 'assistant', 
        content: `CSV file uploaded successfully. You can now ask questions about the data.`
      }]);
    },
    onError: (error) => {
      console.log(error)
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error uploading file:', error.response.data);
      } else {
        console.error('Error uploading file:', error);
      }
      setMessages(msgs => [...msgs, { 
        role: 'assistant', 
        content: `Error uploading CSV file. Please try again.`
      }]);
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      Papa.parse(file, {
        complete: (results) => {
          const parsedData = results.data as Record<string, string | number>[];
          uploadMutation.mutate({ file, data: parsedData });
        },
        header: true,
        dynamicTyping: true,
        error: (error: any) => {
          console.error('Error parsing CSV:', error);
        },
      });
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    noClick: true,
    noKeyboard: true,
  });

  const toggleDataDrawer = () => {
    console.log('toggleDataDrawer', isDataDrawerOpen);
    setIsDataDrawerOpen(!isDataDrawerOpen);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" {...getRootProps()}>
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && !message.chartData?.svg_json && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                  A
                </div>
              )}
              <div className={`max-w-[100%] rounded-lg p-2 ${
                message.role === 'user' ? 'bg-blue-100 text-gray-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {message.chartData?.svg_json ? (
                  <div className="flex flex-col justify-start">
                    <div className="flex items-start justify-start">
                      {/* <div className="w-8 h-8 rounded-full bg-black-100 flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                        V
                      </div> */}
                      <div>
                        <p className="text-md font-semibold mb-2 text-center">{message.chartData.viz_name.replace(/_/g, ' ').toUpperCase()}</p>
                        <br/>
                        <p className="text-sm text-center">{message.chartData.reason}</p>
                      </div>
                    </div>
                    <div className="mt-4 w-full">
                      <ChartContainer 
                        message={message} 
                        replyToAssistantMessageIdx={replyToAssistantMessageIdx} 
                        setReplyToAssistantMessageIdx={setReplyToAssistantMessageIdx} 
                      />
                    </div>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold ml-3">
                  C
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - pinned to the bottom */}
      <div className="border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
          <div className="flex items-center bg-white rounded-full border border-gray-300">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={refineVizName ? `Refining ${refineVizName}...` : "What would you like to ask?"}
              className="flex-1 p-3 bg-transparent focus:outline-none"
            />
            <button
              type="button"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="p-3 text-blue-500 hover:text-blue-600 focus:outline-none"
            >
              <Upload size={20} />
            </button>
            <input
              id="file-upload"
              type="file"
              {...getInputProps()}
              className="hidden"
            />
            {originalData && (
              <button
                type="button"
                onClick={toggleDataDrawer}
                className="p-3 text-blue-500 hover:text-blue-600 focus:outline-none"
              >
                <Database size={20} />
              </button>
            )}
            <button type="submit" className="p-3 text-blue-500 hover:text-blue-600 focus:outline-none">
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
      {uploadMutation.isPending && <p className="text-center">Uploading...</p>}

      {/* Data Drawer */}
      {isDataDrawerOpen && originalData && apiData && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-white shadow-lg transition-transform duration-300 ease-in-out overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex flex-col items-center">
              <h2 className="text-xl font-semibold">CSV Data Preview</h2>
              <p className="text-sm text-gray-500 mb-4">
                Showing your uploaded CSV data.
              </p>
            </div>
            <div className="flex-grow overflow-auto">
              <DataTable dataResponse={apiData} originalData={originalData} />
            </div>
            <div className="p-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {originalData.data.length} rows.
              </p>
              <button 
                onClick={toggleDataDrawer}
                className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;

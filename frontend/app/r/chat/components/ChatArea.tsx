import React, { useState, useRef, useEffect, useCallback, useMemo, use } from 'react';
import { Send, Upload, Database, XIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import Papa from 'papaparse';
import useWebSocket from 'react-use-websocket';
import DataTable from '../../../component/DataTable';
import ChartContainer from '../../../component/ChartContainer';
import { DataDrawer } from '../../../component/DataDrawer';
import { DataSetApiResponse, OriginalDataSet, ChatProps, ChatMessage, ChartData } from '../../../component/types';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload as S3Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import { throttle } from 'lodash'; // Add this import
import { debug } from 'console';
import ReactMarkdown from 'react-markdown';

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

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-west-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  },
});

const UploadFileS3 = async (file: File) => {
  // TODO: Remove after debugging is done
  const fileExt = file.name.split('.')[1];
  const uniqueFilename = uuidv4() + '.' + fileExt;
  const s3Key = 'data_uploads/' + uniqueFilename;
  const s3Uri = `s3://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}/${s3Key}`;
  // If you need a public URL instead:
  const publicUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${s3Key}`;

  const upload = new S3Upload({
    client: s3Client,
    params: {
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: s3Key,
      Body: file,
      ContentType: file.type,
    },
  }); 

  await upload.done(); 

  return { s3Uri, publicUrl };
}

const ChatArea: React.FC<ChatAreaProps> = ({ initialMessages, onDataReceived, onUploadComplete }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [message, setMessage] = useState<ChatMessage | null>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiData, setApiData] = useState<DataSetApiResponse | null>(null);
  const [originalData, setOriginalData] = useState<OriginalDataSet | null>(null);
  const [isDataDrawerOpen, setIsDataDrawerOpen] = useState(false);
  const [replyToAssistantMessageIdx, setReplyToAssistantMessageIdx] = useState<string | null>(null);
  const [msgRequestedType, setMsgRequestedType] = useState<string | null>(null);
  const [chartSelected, setChartSelected] = useState<ChartData | null>(null);
  const [refineVizName, setRefineVizName] = useState<string | null>(null);

  const { sendMessage, lastMessage, readyState } = useWebSocket(URL);

  useEffect(() => {
    if (lastMessage !== null) {
      const message_received = JSON.parse(lastMessage.data);
      if (!message_received) {
        return;
      }

      console.log("message_received", message_received)

      if (message_received.type === "viz_code") {
        try {
          const chartData: ChartData = {
            reason: message_received.reason,
            viz_name: message_received.viz_name,
            pd_code: message_received.pd_code,
            pd_viz_code: message_received.pd_viz_code,
            svg_json: message_received.svg_json,
            data: message_received.data,
            assistant_message_uuid: message_received.assistant_message_uuid
          }
          const msg: ChatMessage = { role: 'assistant', content: message_received.viz_name, type: message_received.type, chartData: chartData }

          setMessages(prev => [...prev, msg]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      } else if (message_received.type === "ack") {
        setMessages(prev => [...prev, message_received]);
      } else if (message_received.type === "analyze_visualization") {
          const chartData: ChartData = {
            reason: message_received.reason,
            viz_name: message_received.viz_name,
            pd_code: message_received.pd_code,
            pd_viz_code: message_received.pd_viz_code,
            svg_json: message_received.svg_json,
            data: message_received.data,
            assistant_message_uuid: message_received.assistant_message_uuid
          }
          const msg: ChatMessage = { role: 'assistant', content: message_received.viz_name, type: message_received.type, chartData: chartData, analysis: message_received.reason }

          setMessages(prev => [...prev, msg]);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    if (replyToAssistantMessageIdx !== null) {
      const msg_len = messages.length
    for (let i = msg_len - 1; i >= 0; i--) {
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
  }, [replyToAssistantMessageIdx])

  const handleDataReceived = useCallback((originalData: OriginalDataSet, apiData: DataSetApiResponse) => {
    console.log('Papa parsed data:', originalData);
    setOriginalData(originalData);
    setApiData(apiData);
  }, [apiData, originalData]);

  const handleUploadComplete = useCallback(() => {
    console.log('Upload complete...opening right bar');
    setIsDataDrawerOpen(true);
  }, [isDataDrawerOpen]);

  const throttledScrollToBottom = useCallback(
    throttle(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100),
    []
  );

  // Update useEffect to use throttled scroll function
  useEffect(() => {
    throttledScrollToBottom();
  }, [messages, throttledScrollToBottom]);
  

  const handleAnalyzeVisualization = () => {
    if (chartSelected) {
      const serverMsgBody = JSON.stringify({
        type: "analyze_visualization",
        user_message_body: {
          question: input,
          session_id: apiData?.session_id,
        },
        reply_to_assistant_message_uuid: replyToAssistantMessageIdx
      });

      sendMessage(serverMsgBody);
      setInput('');
    }
  }

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
      
      const msg_type = replyToAssistantMessageIdx !== null ? "refine_visualizations" : "generate_visualizations";
      
      const serverMsgBody = JSON.stringify({
        type: msg_type,
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

      const { s3Uri, publicUrl } = await UploadFileS3(file);
      const formData = new FormData();
      formData.append('name', file.name);
      formData.append('description', 'test');
      formData.append('s3Uri', s3Uri);
      formData.append('publicUrl', publicUrl);

      setMessages(msgs => [...msgs, { 
        role: 'assistant', 
        content: `We're uploading and analyzing your CSV file. This might take a minute.`
      }]);

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

  const ChatMessageMemoized = useMemo(() => React.memo(({ message, key }: { message: ChatMessage, key: number }) => {
    return (
      <div key={key} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        {message.role === 'assistant' && !message.chartData?.svg_json && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
            A
          </div>
        )}
        <div className={`max-w-full w-full rounded-lg p-2 flex ${
          message.role === 'user' ? 'bg-blue-100 text-gray-800 justify-end items-end' : 'bg-gray-100 text-gray-600 justify-start items-start'
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
                  {
                    message.analysis ?
                    <ReactMarkdown className="prose text-sm text-center">
                      {message.analysis || ''}
                    </ReactMarkdown> :
                    <p className="text-sm text-center">{message.chartData.reason}</p>
                  }
                </div>
              </div>
              <div className="mt-4 w-full">
                <ChartContainer 
                  message={message} 
                  setMsgRequestedType={setMsgRequestedType}
                  setReplyToAssistantMessageIdx={setReplyToAssistantMessageIdx} 
                  handleAnalyzeVisualization={handleAnalyzeVisualization}
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
    )
  }), [handleAnalyzeVisualization]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" {...getRootProps()}>
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, key) => (
            <ChatMessageMemoized message={message} key={key} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - pinned to the bottom */}
      <div className="border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
          {/* Refining message */}
          {refineVizName && msgRequestedType === "refine_visualizations" && (
            <div className="mb-2 flex items-center justify-end space-x-2">
              <p className="text-sm text-gray-600">Refining viz ... {refineVizName}</p>
              <button
                type="button"
                onClick={() => {
                  setReplyToAssistantMessageIdx(null);
                  setRefineVizName(null);
                }}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                <XIcon size={16} />
              </button>
            </div>
          )}
          
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

      {isDataDrawerOpen && originalData && apiData && (
        <div className="p-4">
          <DataDrawer
            isOpen={isDataDrawerOpen}
            onClose={() => setIsDataDrawerOpen(false)}
            chartData={null}
            originalData={originalData}
          />
        </div>
      )}
    </div>
  );
};

export default ChatArea;

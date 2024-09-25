'use client'

import React, { useState, useEffect } from 'react';
import DataTable from './DataTable';
import Chat from './Chat';

interface RightBarSheetProps {
  csvData: Record<string, string | number>[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RightBarSheet: React.FC<RightBarSheetProps> = ({ csvData, isOpen, onOpenChange }) => {
  const [showChat, setShowChat] = useState(false);
  
   // Reset showChat to false when csvData changes
   useEffect(() => {
    setShowChat(false);
  }, [csvData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[800px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex flex-col items-center">
          <h2 className="text-xl font-semibold">CSV Data {showChat ? 'Chat' : 'Preview'}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {showChat ? 'Chat about your CSV data.' : 'Showing your uploaded CSV data.'}
          </p>
          <button 
            onClick={() => setShowChat(!showChat)}
            className="w-full max-w-md mt-2 px-4 py-2 bg-black text-white transition-colors"
          >
            {showChat ? 'Show Data' : 'Intellgence mode'}
          </button>
        </div>
        <div className="flex-grow overflow-auto">
          {showChat ? <Chat csvData={csvData} /> : <DataTable data={csvData} />}
        </div>
        <div className="p-4 border-t">
          <p className="text-sm text-gray-500">
            {showChat ? 'Chatting about' : 'Showing'} {csvData.length} rows.
          </p>
          <button 
            onClick={() => onOpenChange(false)} 
            className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightBarSheet;


'use client'

import React from 'react';
import DataTable from './DataTable';

interface RightBarSheetProps {
  csvData: any[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RightBarSheet: React.FC<RightBarSheetProps> = ({ csvData, isOpen, onOpenChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[800px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">CSV Data Preview</h2>
          <p className="text-sm text-gray-500">Showing your uploaded CSV data.</p>
        </div>
        <div className="flex-grow overflow-auto">
          <DataTable data={csvData} />
        </div>
        <div className="p-4 border-t">
          <p className="text-sm text-gray-500">
            Showing {csvData.length} rows.
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


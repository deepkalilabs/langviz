'use client'

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

interface FileWithPath extends File {
  path?: string;
}

interface DatasetResponse {
  id: number;
  name: string;
  data: Record<string, string | number>[];
  user: number;
  uploaded_at: string;
}

interface UploadCSVProps {
  onDataReceived: (data: DatasetResponse) => void;
  onUploadComplete: () => void;
}

const UploadCSV: React.FC<UploadCSVProps> = ({ onDataReceived, onUploadComplete }) => {
  const [file, setFile] = useState<FileWithPath | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string | number>[]>([]);
  const [shouldQuery, setShouldQuery] = useState(false);
  const { error, isFetching } = useQuery({
    queryKey: ['createDataset'],
    queryFn: async () => {
      const response = await axios.post('http://localhost:8000/api/datasets/', { 
        name: file?.name ?? 'Untitled',
        data: parsedData,
        user: 1,
      });
      onDataReceived(response.data);
      onUploadComplete();
      return response.data
    },
    enabled: shouldQuery,
  })

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFile(file);
      
      Papa.parse(file, {
        complete: (results: Papa.ParseResult<Record<string, string | number>>) => {
          setParsedData(results.data);
          setShouldQuery(true);
        },
        header: true,
        dynamicTyping: true,
      });
    }
  }, [setParsedData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
  });

  if (isFetching) return <p>Loading...</p>;


  return (
    <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-4 text-center cursor-pointer">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the CSV file here ...</p>
      ) : (
        <p>Drag and drop a CSV file here, or click to select one</p>
      )}
      {file && <p>Selected file: {file.name}</p>}
      {error && <p className='text-red-500'>Error: {error.message}</p>}
    </div>
  );
};

export default UploadCSV;


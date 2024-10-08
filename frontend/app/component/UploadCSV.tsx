'use client'

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import Papa from 'papaparse';
import { DataSetApiResponse, OriginalDataSet } from './types';

interface UploadCSVProps {
  onDataReceived: (originalData: OriginalDataSet, apiData: DataSetApiResponse) => void;
  onUploadComplete: () => void;
}

interface ParsedData {
  file: File;
  data: Record<string, string | number | boolean | null>[];
}


const UploadCSV: React.FC<UploadCSVProps> = ({ onDataReceived, onUploadComplete }) => {
  const uploadMutation = useMutation({
    mutationFn: async ({ file, data }: ParsedData) => {
      const formData = new FormData();
      formData.append('name', file.name);
      formData.append('description', 'test');
      formData.append('url', 'https://raw.githubusercontent.com/uwdata/draco/master/data/cars.csv');
      //formData.append('user', '1'); // Assuming user ID 1 for this example
      //formData.append('data', JSON.stringify(data));

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
        url: 'N/A'
      };
      onDataReceived(originalDataSet, apiData);
      onUploadComplete();
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error uploading file:', error.response.data);
      } else {
        console.error('Error uploading file:', error);
      }
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
  });

  return (
    <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-4 text-center cursor-pointer">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the CSV file here ...</p>
      ) : (
        <p>Drag and drop a CSV file here, or click to select one</p>
      )}
      {uploadMutation.isPending && <p>Uploading...</p>}
      {uploadMutation.isError && (
        <p className='text-red-500'>
          Error: {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Unknown error'}
        </p>
      )}
      {uploadMutation.isSuccess && <p className='text-green-500'>Upload successful!</p>}
    </div>
  );
};

export default UploadCSV;


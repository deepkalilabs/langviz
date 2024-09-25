'use client'

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

interface FileWithPath extends File {
  path?: string;
}

const UploadCSV: React.FC<{
  setData: React.Dispatch<React.SetStateAction<Record<string, string | number>[]>>;
}> = ({ setData }) => {
  const [file, setFile] = useState<FileWithPath | null>(null);
  
  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFile(file);
      
      Papa.parse(file, {
        complete: (results: Papa.ParseResult<Record<string, string | number>>) => {
          setData(results.data);
        },
        header: true,
        dynamicTyping: true,
      });
    }
  }, [setData]);

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
      {file && <p>Selected file: {file.name}</p>}
    </div>
  );
};

export default UploadCSV;


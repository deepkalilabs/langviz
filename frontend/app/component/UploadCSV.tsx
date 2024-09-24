'use client'

import React, { useState } from 'react';
import { useCSVReader, formatFileSize } from "react-papaparse";
import RightBarSheet from './RightBarSheet';

const UploadCSV: React.FC = () => {
  const { CSVReader } = useCSVReader();
  const [data, setData] = useState<any[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleOnDrop = (results: any) => {
    setData(results.data);
    setIsSheetOpen(true);
    console.log('Parsed CSV data:', results.data);
  };

  const handleOnError = (err: any) => {
    console.error('CSV parsing error:', err);
    alert('Error parsing CSV file. Please check the file and try again.');
  };

  const handleOnRemoveFile = () => {
    setData([]);
    setIsSheetOpen(false);
  };

  return (
    <div className="upload-csv-container">
      <h2>Upload CSV File</h2>
      <CSVReader
        onUploadAccepted={handleOnDrop}
        onError={handleOnError}
        config={{
          header: true,
          skipEmptyLines: true,
        }}
      >
        {({ getRootProps, acceptedFile }: any) => (
          <>
            <div {...getRootProps()} style={{border: '1px solid #ccc', padding: '20px', textAlign: 'center'}}>
              {acceptedFile ? (
                <div>
                  <strong>Uploaded file:</strong> {acceptedFile.name}
                  <button onClick={handleOnRemoveFile}>Remove</button>
                </div>
              ) : (
                <span>Drop CSV file here or click to upload.</span>
              )}
            </div>
          </>
        )}
      </CSVReader>
      <RightBarSheet 
        csvData={data} 
        isOpen={isSheetOpen} 
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
};

export default UploadCSV;


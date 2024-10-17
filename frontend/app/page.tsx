'use client'

import React, { useState, useCallback } from 'react';
import Image from "next/image";
import UploadCSV from "./component/UploadCSV";
import RightBarSheet from "./component/RightBarSheet";
import { DataSetApiResponse, OriginalDataSet } from './component/types'; 

export default function Home() {
  const [apiData, setApiData] = useState<DataSetApiResponse | null>(null);
  const [originalData, setOriginalData] = useState<OriginalDataSet | null>(null);
  const [isRightBarOpen, setIsRightBarOpen] = useState(false);

  const handleDataReceived = useCallback((originalData: OriginalDataSet, apiData: DataSetApiResponse) => {
    console.log('Papa parsed data:', originalData);
    setOriginalData(originalData);
    setApiData(apiData);
  }, [apiData, originalData]);

  const handleUploadComplete = useCallback(() => {
    console.log('Upload complete...opening right bar');
    setIsRightBarOpen(true);
  }, [isRightBarOpen]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <UploadCSV 
          onDataReceived={handleDataReceived}
          onUploadComplete={handleUploadComplete}
        />
        {isRightBarOpen && (
          <RightBarSheet 
            dataResponse={apiData as DataSetApiResponse} 
            originalData={originalData as OriginalDataSet}
            isOpen={isRightBarOpen} 
            onOpenChange={setIsRightBarOpen}
          />
        )}
      </main>
    </div>
  );
}

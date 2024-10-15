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

  console.log('isRightBarOpen', isRightBarOpen);
  console.log('apiData', apiData);
  console.log('originalData', originalData);

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
      {/* Debug output */}
      {/* <div className="fixed bottom-0 left-0 bg-white p-2">
        Data length: {0}, isRightBarOpen: {isRightBarOpen.toString()}
      </div> */}
      {/* <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer> */}
    </div>
  );
}

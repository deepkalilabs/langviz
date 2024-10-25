import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChartData } from './types/local';
import { useState } from 'react';
interface ChartContainerProps {
  message: ChatMessage;
  replyToAssistantMessageIdx: string | null;
  setReplyToAssistantMessageIdx: React.Dispatch<React.SetStateAction<string | null>>;
}

const SVGDisplay = React.memo((svgData: any) => {
  return (
    <div dangerouslySetInnerHTML={{ __html: svgData.svgData }} />
  );  
});


const ChartContainer: React.FC<ChartContainerProps> = ({ message, replyToAssistantMessageIdx, setReplyToAssistantMessageIdx }) => {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full h-full p-6 border border-white-300 rounded-lg">
      {
        message.chartData ? (
          <div className="flex flex-col h-full">
            <div className="flex-grow w-full mb-4">
              {
                message.chartData.svg_json ? 
                <div className="p-4 mx-4 w-full h-full justify-center items-center">
                  {message.chartData.svg_json ? <SVGDisplay svgData={JSON.parse(message.chartData.svg_json)['svg']} /> : <p>Loading...</p>}
                  {error && <div className="text-red-500 mt-2">Error executing code: {error}</div>}
                </div> : 
                ""
              }
            </div>
            <div className="flex justify-center items-center">
              <Button onClick={() => {
                setReplyToAssistantMessageIdx(message.chartData?.assistant_message_uuid ?? null)
              }}>
                Refine
              </Button>
            </div>
          </div>
        ) : ""
      }
    </div>
  );
};

export default ChartContainer;

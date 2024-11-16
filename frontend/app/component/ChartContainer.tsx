import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './types/local';
import { useState } from 'react';
import { DataDrawer } from './DataDrawer';

interface ChartContainerProps {
  message: ChatMessage;
  setMsgRequestedType: React.Dispatch<React.SetStateAction<string | null>>;
  setReplyToAssistantMessageIdx: React.Dispatch<React.SetStateAction<string | null>>;
  handleAnalyzeVisualization: () => void;
}

interface SVGDisplayProps {
  svgData: string;  // Assuming svgData is a string containing SVG markup
}

const SVGDisplay = React.memo(({ svgData }: SVGDisplayProps) => {
  return (
    <div dangerouslySetInnerHTML={{ __html: svgData }} />
  );  
});

SVGDisplay.displayName = 'SVGDisplay';
const ChartContainer: React.FC<ChartContainerProps> = ({ message, setMsgRequestedType, setReplyToAssistantMessageIdx, handleAnalyzeVisualization }) => {
  const [error, setError] = useState<string | null>(null);
  const [showDataDrawer, setShowDataDrawer] = useState<boolean>(false);
  const toggleDataDrawer = () => setShowDataDrawer(!showDataDrawer);

  const renderSVG = (message: ChatMessage) => {
    try {
      const parsedData = JSON.parse(message.chartData?.svg_json ?? '');
      if (!parsedData || typeof parsedData.svg !== 'string') {
        throw new Error('Invalid SVG data format');
      }
      return <SVGDisplay svgData={parsedData.svg} />;
    } catch {
      setError('Failed to parse SVG data');
      return <p>Error loading chart</p>;
    }
  };

  useEffect(() => {
    console.log("showDataDrawer", showDataDrawer);
  }, [showDataDrawer]);

  console.log("message.chartData", message);

  return (
    <div className="w-full h-full p-6 border border-white-300 rounded-lg">
      {
        message.chartData ? (
          <div className="flex flex-col h-full">
            <div className="flex-grow w-full mb-4">
              {
                message.chartData.svg_json ? 
                <div className="p-4 mx-4 w-full h-full justify-center items-center">
                  {renderSVG(message)}
                  {error && <div className="text-red-500 mt-2">{error}</div>}
                </div> : 
                ""
              }
            </div>

            <div className="flex justify-center items-center gap-4">
              <Button onClick={toggleDataDrawer}>
                Show Data
              </Button>

              <Button onClick={() => {
                setReplyToAssistantMessageIdx(message.chartData?.assistant_message_uuid ?? null)
                setMsgRequestedType("refine_visualizations")
              }}>
                Refine
              </Button>

              <Button onClick={() => {
                setReplyToAssistantMessageIdx(message.chartData?.assistant_message_uuid ?? null)
                setMsgRequestedType("analyze_visualization")
                handleAnalyzeVisualization()
              }}>
                Analyze Chart
              </Button>
            </div>

            {showDataDrawer && message?.chartData?.data && (
                <DataDrawer 
                  isOpen={showDataDrawer} 
                  onClose={toggleDataDrawer} 
                  chartData={message.chartData} 
                  originalData={null} 
                />
              )}
          </div>
        ) : ""
      }
    </div>
  );
};

export default ChartContainer;

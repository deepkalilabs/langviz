import React from 'react';
import { ChatMessage, } from './types/local';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChartContainerProps {
  message: ChatMessage;
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

const AnalyzeChartContainer: React.FC<ChartContainerProps> = ({ message }) => {
  const [error, setError] = useState<string | null>(null);
  console.log("message.chartData", message);

  const handleSvgDisplay = (message: ChatMessage) => {
    try {
      if (!message.chartData?.svg_json) {
        setError('No SVG data available');
        return <p>Error loading SVG</p>;
      }
      const parsedSvg = JSON.parse(message.chartData.svg_json)['svg'];
      return <SVGDisplay svgData={parsedSvg} />;
    } catch (err) {
      console.log("err", err);
      setError('Failed to parse SVG data');
      return <p>Error loading SVG</p>;
    }
  };

  return (
    <div className="w-full h-full p-6 border border-white-300 rounded-lg">
      {message.chartData && (
        <div className="flex flex-col h-full">
          <div className="flex-grow w-full mb-4">
            {message.chartData.svg_json && (
              <div className="p-4 mx-4 w-full h-full justify-center items-center">
                {handleSvgDisplay(message)}
                {error && <div className="text-red-500 mt-2">Error executing code: {error}</div>}
              </div>
            )}
          </div>
          {message.analysis && (
            <div className="px-4 py-2 prose dark:prose-invert max-w-none">
              <ReactMarkdown>{message.analysis}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyzeChartContainer;

import React from 'react';
import PDVisualization from './PDVisualization';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChartData } from './types/local';

interface ChartContainerProps {
  message: ChatMessage;
  replyToAssistantMessageIdx: string | null;
  setReplyToAssistantMessageIdx: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ message, replyToAssistantMessageIdx, setReplyToAssistantMessageIdx }) => {
  return (
    <div className="w-full h-full p-6 border border-white-300 rounded-lg">
      {
        message.chartData ? (
          <div className="flex flex-col h-full">
            <div className="flex-grow w-full mb-4">
              <PDVisualization
                viz_name={message.chartData?.viz_name}
                svg_json={message.chartData?.svg_json}
                pd_code={message.chartData?.pd_code}
                pd_viz_code={message.chartData?.pd_viz_code}
                reason={message.chartData?.reason}
              />
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

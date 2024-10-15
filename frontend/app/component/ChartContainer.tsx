import React from 'react';
import PDVisualization from './PDVisualization';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChartData } from './types/local';

interface ChartContainerProps {
  message: ChatMessage;
  setReplyToAssistantMessageIdx: React.Dispatch<React.SetStateAction<number | null>>;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ message, setReplyToAssistantMessageIdx }) => {
  return (
    <div className="w-full h-full p-4 border border-gray-300 rounded-lg shadow-md">
      {
        message.chartData ? (
          <div>
            <div className="w-full h-full justify-center items-center">
              <PDVisualization
                viz_name={message.chartData?.viz_name}
                svg_json={message.chartData?.svg_json}
                pd_code={message.chartData?.pd_code}
                pd_viz_code={message.chartData?.pd_viz_code}
              />
            </div>
            <div className="flex justify-center items-center">
              <Button onClick={() => {
                console.log("message.chartData?.reply_to_assistant_message_id", message.chartData?.reply_to_assistant_message_id)
                debugger;
                setReplyToAssistantMessageIdx(message.chartData?.reply_to_assistant_message_id ?? null)
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
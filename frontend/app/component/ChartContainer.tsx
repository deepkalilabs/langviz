import React from 'react';
import D3Visualization from './D3Visualization';

interface ChartData {
  viz_name: string;
  js_code: string;
  data: any;
}

interface ChartContainerProps {
  chartResponse: Record<string, ChartData>;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ chartResponse }) => {
  console.log('chartResponse:', chartResponse); // Debug log

  if (!chartResponse || Object.keys(chartResponse).length === 0) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700">
        <h3 className="font-bold">No Chart Data Available</h3>
        <p>The chart response is empty or undefined.</p>
        <details>
          <summary>Debug Info</summary>
          <pre className="text-xs mt-2 p-2 bg-gray-100 rounded">
            {JSON.stringify(chartResponse, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {Object.entries(chartResponse).map(([key, chartData], index) => {
        console.log(`Rendering chart ${index + 1}:`, chartData.viz_name, chartData); // Debug log
        return (
          <li key={index} className="border border-gray-300 p-4">
            <h3 className="text-lg font-bold mb-2">{chartData.viz_name}</h3>
            <D3Visualization
              viz_name={chartData.viz_name}
              jsCode={chartData.js_code}
              data={chartData.data}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default ChartContainer;
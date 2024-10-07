import React from 'react';
import D3Visualization from './D3Visualization';

interface ChartData {
  data: {
    [key: string]: any[];
  };
  js_code: string;
  pd_code: string;
}

interface ChartContainerProps {
  chartResponse: {
    [key: string]: ChartData;
  };
}

const ChartContainer: React.FC<ChartContainerProps> = ({ chartResponse }) => {
  console.log('chartResponse:', chartResponse); // Debug log

  if (!chartResponse || Object.keys(chartResponse).length === 0) {
    return <div>No chart data available</div>;
  }

  return (
    <ul className="space-y-4">
      {Object.entries(chartResponse).map(([chartType, chartData], index) => {
        console.log(`Rendering chart ${index + 1}:`, chartType, chartData); // Debug log
        return (
          <li key={index} className="border border-gray-300 p-4">
            <h3 className="text-lg font-bold mb-2">{chartType}</h3>
            {chartData && chartData.data ? (
              <D3Visualization
                type={'Chart'}
                data={chartData.data}
                jsCode={chartData.js_code}
                pdCode={chartData.pd_code}
              />
            ) : (
              <div>Invalid chart data for {chartType}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default ChartContainer;
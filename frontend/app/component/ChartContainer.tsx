import React from 'react';
import D3Visualization from './D3Visualization';
import { ChartData } from './types';

// TODO: Move to types.ts
interface ChartData {
  viz_name: string;
  data: object;
  js_code: string;
  pd_code: string;
}

const ChartContainer: React.FC<ChartData> = ({ viz_name, data, js_code, pd_code }) => {
  console.log('chartResponse:', viz_name, data, js_code, pd_code); // Debug log
  const chartData: ChartData = { viz_name, data, js_code, pd_code };

  if (!js_code) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700">
        <h3 className="font-bold">No Chart Data Available</h3>
        <p>The chart response is empty or undefined.</p>
        <details>
          <summary>Debug Info</summary>
          <pre className="text-xs mt-2 p-2 bg-gray-100 rounded">
            {JSON.stringify(chartData, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      <li className="border border-gray-300 p-4">
        <h3 className="text-lg font-bold mb-2">{chartData.viz_name}</h3>
        <D3Visualization
          viz_name={chartData.viz_name}
          jsCode={chartData.js_code}
          data={chartData.data}
        />
      </li>
    </ul>
  );
};

export default ChartContainer;
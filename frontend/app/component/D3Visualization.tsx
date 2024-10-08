import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface D3VisualizationProps {
  viz_name: string;
  jsCode: string;
  data: any;
}

function transformDataForD3(rawData) {
  const transformedData = [];
  const keys = Object.keys(rawData);
  const dataLength = rawData[keys[0]].length;

  for (let i = 0; i < dataLength; i++) {
    const dataPoint = {};
    keys.forEach(key => {
      dataPoint[key] = rawData[key][i];
    });
    transformedData.push(dataPoint);
  }

  return transformedData;
}


const D3Visualization: React.FC<D3VisualizationProps> = ({ viz_name, jsCode, data }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      try {
        // Clear existing content
        chartRef.current.innerHTML = '';
        console.log("data", data)
        console.log("typeof data", typeof data)
        let processedData;
        // Process the data
        if (typeof data === 'function') {
          processedData = transformDataForD3(data)
        } else if (typeof data === 'object' && data !== null) {
          processedData = transformDataForD3(data)
        } else {
          throw new Error('Invalid data format');
        }

        // Validate processed data
        // if (!Array.isArray(processedData) || processedData.length === 0) {
        //   throw new Error('Data must be a non-empty array');
        // }

        // Safely evaluate the D3 code
        const createChart = new Function('d3', 'data', `
          return (${jsCode})(data);
        `);

        console.log("createChart", createChart.toString())
        console.log("processed data", JSON.stringify(processedData))

        // Execute the code
        const chart = createChart(d3, processedData);
        if (!(chart instanceof SVGElement)) {
          throw new Error('D3 code did not return an SVG element');
        }
        chartRef.current.appendChild(chart);

        console.log("chart ref", chartRef.current)

        setError(null);
      } catch (error) {
        console.error('Error executing D3 code:', error);
        setError(error instanceof Error ? error.message : String(error));
      }
    }
  }, [jsCode, data]);

  return (
    <div className="border border-gray-300 p-4 my-4">
      <h3 className="text-lg font-bold mb-2">{viz_name}</h3>
      <div 
        ref={chartRef}
        className="w-full h-auto bg-gray-100 flex items-center justify-center"
      />
      {error && <div className="text-red-500 mt-2">Error executing code: {error}</div>}
      <details className="mt-4">
        <summary className="cursor-pointer">Debug Info</summary>
        <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
          {JSON.stringify({
            viz_name,
            dataType: typeof data,
            dataLength: Array.isArray(data) ? data.length : 'N/A',
            error,
            d3Loaded: typeof d3 !== 'undefined',
            jsCodePreview: jsCode.slice(0, 100) + '...'
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default D3Visualization;
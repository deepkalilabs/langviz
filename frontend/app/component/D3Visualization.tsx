import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3VisualizationProps {
  type: string;
  data: { [key: string]: any[] };
  jsCode: string;
  pdCode: string;
}

const D3Visualization: React.FC<D3VisualizationProps> = ({ type, data, jsCode, pdCode }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current && data) {
      // Clear any existing content
      chartRef.current.innerHTML = '';

      try {
        // Create a function from the jsCode
        const chartFunction = new Function('d3', 'data', `
          ${jsCode}
          return createChart(data);
        `);

        // Prepare the data generically
        const chartData = Object.keys(data).reduce((acc, key) => {
          return acc.concat(data[key].map((value: any, index: number) => ({
            [key]: value,
            index: index
          })));
        }, [] as any[]);

        // Call the function with d3 and the prepared data
        const svgNode = chartFunction(d3, chartData);
        console.log('svgNode:', svgNode);

        // Append the returned SVG node to the chart container
        if (svgNode && chartRef.current) {
          chartRef.current.appendChild(svgNode);
        } else {
          throw new Error('Failed to create chart');
        }

      } catch (error) {
        console.error('Error rendering chart:', error);
        if (chartRef.current) {
          chartRef.current.innerHTML = `<p>Error rendering chart: ${error.message}</p>`;
        }
      }
    }
  }, [data, jsCode]);

  return <div ref={chartRef} className="w-full h-full"></div>;
};

export default D3Visualization;
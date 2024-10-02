import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const D3Visualization: React.FC<{
  csvURL: string;
  d3Code: string;
  width: number;
  height: number;
}> = ({ csvURL, d3Code, width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!csvURL || !d3Code || !containerRef.current) return;

    //Clear the container
    containerRef.current.innerHTML = '';

    //Create the sandbox function to safely execute the D3 code
    const chartFunction = new Function('d3', 'dataUri', 'element', 'width', 'height', `return ${d3Code}`);

    try {
      // Execute the D3 code in the sandbox
      const chart = chartFunction(d3, csvURL, containerRef.current, width, height);
      chart(d3, csvURL, containerRef.current, width, height);
    } catch (error) {
      console.error('Error executing D3 code:', error);
      const errorMessage = document.createElement('div');
      errorMessage.textContent = 'Error rendering visualization';
      containerRef.current.appendChild(errorMessage);
    
    }
  }, [csvURL, d3Code, width, height]);

  return <div ref={containerRef}></div>;
};

export default D3Visualization;
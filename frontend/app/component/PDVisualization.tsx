import React, { useEffect, useRef, useState } from 'react';
import { PandasSvgViz } from './types/local';
const SVGDisplay = (svgData: any) => {
  return (
    <div dangerouslySetInnerHTML={{ __html: svgData.svgData }} />
  );  
};

const PDVisualization: React.FC<PandasSvgViz> = ({ viz_name, svg_json, pd_code, pd_viz_code }) => {
  const [error, setError] = useState<string | null>(null);
  const [svgData, setSvgData] = useState<string | null>(null);

  useEffect(() => {
    try {
        const svgObject = JSON.parse(svg_json)
        if (svgObject && svgObject['svg']) {
          setSvgData(svgObject['svg'])
        } else {
          throw new Error("No SVG data found in the response")
        } 
      }
      catch (error) {
        console.error('Error transforming data:', error);
        setError(error instanceof Error ? error.message : String(error));
      }
    }, [svg_json])

  return (
    <div className="border border-gray-300 p-4 my-4 w-full h-full justify-center items-center">
      <h3 className="text-lg font-bold mb-2">{viz_name}</h3>
      {svgData ? <SVGDisplay svgData={svgData} /> : <p>Loading...</p>}
      {error && <div className="text-red-500 mt-2">Error executing code: {error}</div>}
      <details className="mt-4">
        <summary className="cursor-pointer">Debug Info</summary>
        <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
          {svgData ? JSON.stringify({
            "viz_name": viz_name,
            "pd_viz_code": pd_viz_code,
            "svg_json": svgData,
            "pd_code": pd_code
          }, null, 2) : "No SVG Data"}
        </pre>
      </details>
    </div>
  );
};

export default PDVisualization;
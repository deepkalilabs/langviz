// import React, { useEffect, useRef, useState } from 'react';
// import { PandasSvgViz } from './types/local';

// const PDVisualization: React.FC<PandasSvgViz> = ({ viz_name, svg_json, pd_code, pd_viz_code}) => {
//   const [error, setError] = useState<string | null>(null);
//   const [svgData, setSvgData] = useState<string | null>(null);

//   useEffect(() => {
//     try {
//         const svgObject = JSON.parse(svg_json)
//         if (svgObject && svgObject['svg']) {
//           setSvgData(svgObject['svg'])
//         } else {
//           throw new Error("No SVG data found in the response")
//         } 
//       }
//       catch (error) {
//         console.error('Error transforming data:', error);
//         setError(error instanceof Error ? error.message : String(error));
//       }
//     }, [svg_json])

//   return (
//     <div className="p-4 mx-4 w-full h-full justify-center items-center">
//       {svgData ? <SVGDisplay svgData={svgData} /> : <p>Loading...</p>}
//       {error && <div className="text-red-500 mt-2">Error executing code: {error}</div>}
//     </div>
//   );
// };

// export default PDVisualization;
import React from 'react';
import PDVisualization from './PDVisualization';

// TODO: Move to types.ts
interface ChartData {
  viz_name: string;
  pd_code: string;
  pd_viz_code: string;
  svg_json: string;
}

const ChartContainer: React.FC<ChartData> = ({ viz_name, pd_code, pd_viz_code, svg_json }) => {
  return (
    svg_json ? <PDVisualization
      viz_name={viz_name}
      svg_json={svg_json}
      pd_code={pd_code}
      pd_viz_code={pd_viz_code}
    /> : "" 
  );
};

export default ChartContainer;
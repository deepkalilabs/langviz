import React, { useRef, useEffect } from 'react';

interface CanvasScriptExecutorProps {
  script: string;
  width: number;
  height: number;
  onError: (error: Error) => void;
}

const CanvasScriptExecutor: React.FC<CanvasScriptExecutorProps> = ({ script, width, height, onError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onError(new Error('Unable to get 2D context'));
      return;
    }

    try {
      // Create a new function from the script string
      const scriptFunction = new Function('ctx', script);
      
      // Execute the script function
      scriptFunction(ctx);
    } catch (error) {
      console.error('Error executing script:', error);
      onError(error as Error);
    }
  }, [script, onError]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default CanvasScriptExecutor;
import { DataSetApiResponse } from "./api";

interface OriginalDataSet {
    data: Record<string, string | number | boolean | null>[];
    name: string;
    description: string;
    uri: string;
}

interface ChatProps {
  //sessionId: string;
  originalData: OriginalDataSet;
  dataResponse: DataSetApiResponse;
}

interface ChartData {
  reason: string;
  viz_name: string;
  pd_code: string;
  pd_viz_code: string;
  svg_json: string;
  assistant_message_uuid?: string;
}

// TODO: Decouple user & server messages
interface ChatMessage {
  role: 'user' | 'assistant';
  type?: string;
  content: string;
  chartData?: ChartData;
}


interface PandasSvgViz {
  pd_code: string;
  pd_viz_code: string;
  svg_json: string;
  viz_name: string;
}
  
export type { OriginalDataSet, ChatProps, ChartData, ChatMessage, PandasSvgViz };
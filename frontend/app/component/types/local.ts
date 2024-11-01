import { DataSetApiResponse } from "./api";

interface DataSet {
    data: Record<string, string | number | boolean | null>[];
    name: string;
    description: string;
    uri: string;
}

interface SubsetData {
  data: Record<string, string | number | boolean | null>[];
}

interface ChatProps {
  //sessionId: string;
  originalData: DataSet;
  dataResponse: DataSetApiResponse;
}

interface ChartData {
  reason: string;
  viz_name: string;
  pd_code: string;
  pd_viz_code: string;
  svg_json: string;
  data: SubsetData;
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
  
export type { DataSet, ChatProps, ChartData, ChatMessage, PandasSvgViz };
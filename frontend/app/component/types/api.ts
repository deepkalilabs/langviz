interface DataSetApiResponse {
    id: number;
    name: string;
    data: Record<string, string | number>[];
    user: number;
    uploaded_at: string;
  }

export type { DataSetApiResponse };
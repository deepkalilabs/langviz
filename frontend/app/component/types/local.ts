interface OriginalDataSet {
    data: Record<string, string | number | boolean | null>[];
    name: string;
    description: string;
    uri: string;
  }
  
export type { OriginalDataSet };
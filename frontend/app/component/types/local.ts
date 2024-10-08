interface OriginalDataSet {
    data: Record<string, string | number | boolean | null>[];
    name: string;
    description: string;
    url: string;
  }
  
export type { OriginalDataSet };
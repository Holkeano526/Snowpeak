
export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  resultUrl: string | null;
  status: string;
}

export interface AppSettings {
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageSize: '1K' | '2K' | '4K';
}

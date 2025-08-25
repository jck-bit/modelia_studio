export interface Generation {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  createdAt: string;
}

export type StyleOption = 'Editorial' | 'Streetwear' | 'Vintage' | 'Minimalist' | 'Futuristic';

export interface MockAPIResponse {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  createdAt: string;
}

export interface MockAPIError {
  message: string;
}

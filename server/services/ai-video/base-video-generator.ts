import axios, { AxiosInstance } from 'axios';

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number; // in seconds, max 60
  aspectRatio?: '16:9' | '9:16' | '1:1';
  style?: 'realistic' | 'animated' | 'educational' | 'cinematic';
  quality?: 'standard' | 'high';
}

export interface VideoGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  message?: string;
  progress?: number; // 0-100
  estimatedCompletionTime?: number; // seconds
}

export interface VideoProvider {
  name: string;
  maxDuration: number;
  supportedAspectRatios: string[];
  supportedStyles: string[];
  costPerSecond?: number;
  description: string;
}

export abstract class BaseVideoGenerator {
  protected client: AxiosInstance;
  protected apiKey: string;
  protected baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds for requests
    });
  }

  abstract generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
  abstract getVideoStatus(id: string): Promise<VideoGenerationResponse>;
  abstract getProviderInfo(): VideoProvider;
  abstract isAvailable(): Promise<boolean>;

  protected async makeRequest(method: 'GET' | 'POST', endpoint: string, data?: any): Promise<any> {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data,
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'API request failed';
        throw new Error(`${this.getProviderInfo().name} API Error: ${errorMessage}`);
      } else if (error.request) {
        throw new Error(`${this.getProviderInfo().name} Network Error: Unable to reach API`);
      } else {
        throw new Error(`${this.getProviderInfo().name} Error: ${error.message}`);
      }
    }
  }

  protected validateRequest(request: VideoGenerationRequest): void {
    const provider = this.getProviderInfo();
    
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Video prompt is required');
    }

    if (request.prompt.length > 1000) {
      throw new Error('Video prompt is too long (max 1000 characters)');
    }

    if (request.duration && request.duration > provider.maxDuration) {
      throw new Error(`Duration exceeds maximum for ${provider.name} (max ${provider.maxDuration}s)`);
    }

    if (request.aspectRatio && !provider.supportedAspectRatios.includes(request.aspectRatio)) {
      throw new Error(`Aspect ratio ${request.aspectRatio} not supported by ${provider.name}`);
    }

    if (request.style && !provider.supportedStyles.includes(request.style)) {
      throw new Error(`Style ${request.style} not supported by ${provider.name}`);
    }
  }

  protected enhancePromptForEducationalContent(prompt: string, chapterTitle: string): string {
    // Enhance the prompt to make it more suitable for educational video generation
    return `Educational video content: ${prompt}. 
            Topic: ${chapterTitle}. 
            Style: Clean, professional, educational presentation suitable for learning. 
            Focus on clear visual explanation of concepts. 
            Avoid distracting elements. Duration under 60 seconds.`;
  }
}

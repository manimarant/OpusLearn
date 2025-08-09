import { BaseVideoGenerator, VideoGenerationRequest, VideoGenerationResponse, VideoProvider } from './base-video-generator';

export class PikaVideoGenerator extends BaseVideoGenerator {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.pika.art/v1');
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    this.validateRequest(request);

    const enhancedPrompt = this.enhancePromptForEducationalContent(
      request.prompt,
      'Educational Chapter'
    );

    try {
      const payload = {
        prompt: enhancedPrompt,
        aspectRatio: request.aspectRatio || '16:9',
        duration: Math.min(request.duration || 3, 3), // Pika max 3s
        style: this.mapStyleToPika(request.style),
        quality: request.quality || 'standard',
        options: {
          motion: 'medium',
          guidance_scale: 7.5,
          negative_prompt: 'blurry, low quality, distorted, watermark',
        },
      };

      const response = await this.makeRequest('POST', '/generate', payload);
      
      return {
        id: response.id,
        status: this.mapPikaStatus(response.status),
        progress: 0,
        estimatedCompletionTime: 15,
        message: response.message,
      };
    } catch (error) {
      throw new Error(`Pika video generation failed: ${error.message}`);
    }
  }

  async getVideoStatus(id: string): Promise<VideoGenerationResponse> {
    try {
      const response = await this.makeRequest('GET', `/jobs/${id}`);
      
      return {
        id: response.id,
        status: this.mapPikaStatus(response.status),
        videoUrl: response.result?.video_url,
        thumbnailUrl: response.result?.thumbnail_url,
        duration: response.result?.duration,
        progress: response.progress || (response.status === 'completed' ? 100 : 0),
        message: response.error_message || response.message,
      };
    } catch (error) {
      throw new Error(`Failed to get Pika video status: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  getProviderInfo(): VideoProvider {
    return {
      name: 'Pika Labs',
      maxDuration: 3,
      supportedAspectRatios: ['16:9', '9:16', '1:1'],
      supportedStyles: ['realistic', 'animated', 'educational'],
      costPerSecond: 0.3,
      description: 'Fast AI video generation with good quality for short clips',
    };
  }

  private mapStyleToPika(style?: string): string {
    const styleMap = {
      'realistic': 'photorealistic',
      'animated': 'animation',
      'educational': 'clean, professional presentation',
      'cinematic': 'cinematic style',
    };
    return styleMap[style || 'educational'] || 'clean, professional presentation';
  }

  private mapPikaStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      'queued': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed',
      'error': 'failed',
    };
    return statusMap[status] || 'pending';
  }
}

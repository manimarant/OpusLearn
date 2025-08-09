import { BaseVideoGenerator, VideoGenerationRequest, VideoGenerationResponse, VideoProvider } from './base-video-generator';

export class RunwayVideoGenerator extends BaseVideoGenerator {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.runwayml.com/v1');
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    this.validateRequest(request);

    const enhancedPrompt = this.enhancePromptForEducationalContent(
      request.prompt, 
      'Educational Chapter'
    );

    try {
      const payload = {
        promptText: enhancedPrompt,
        model: 'gen3a_turbo',
        aspectRatio: request.aspectRatio || '16:9',
        duration: Math.min(request.duration || 10, 10), // Runway max 10s for turbo
        watermark: false,
        style: this.mapStyleToRunway(request.style),
      };

      const response = await this.makeRequest('POST', '/video/generate', payload);
      
      return {
        id: response.id,
        status: this.mapRunwayStatus(response.status),
        progress: response.progress || 0,
        estimatedCompletionTime: response.estimatedTime || 30,
        message: response.status === 'FAILED' ? response.failure_reason : undefined,
      };
    } catch (error) {
      throw new Error(`Runway video generation failed: ${error.message}`);
    }
  }

  async getVideoStatus(id: string): Promise<VideoGenerationResponse> {
    try {
      const response = await this.makeRequest('GET', `/video/${id}`);
      
      return {
        id: response.id,
        status: this.mapRunwayStatus(response.status),
        videoUrl: response.output?.[0],
        thumbnailUrl: response.thumbnail,
        duration: response.duration,
        progress: response.progress || (response.status === 'SUCCEEDED' ? 100 : 0),
        message: response.status === 'FAILED' ? response.failure_reason : undefined,
      };
    } catch (error) {
      throw new Error(`Failed to get Runway video status: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/account');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  getProviderInfo(): VideoProvider {
    return {
      name: 'Runway ML',
      maxDuration: 10,
      supportedAspectRatios: ['16:9', '9:16', '1:1'],
      supportedStyles: ['realistic', 'cinematic', 'educational'],
      costPerSecond: 0.5,
      description: 'High-quality AI video generation with realistic and cinematic styles',
    };
  }

  private mapStyleToRunway(style?: string): string {
    const styleMap = {
      'realistic': 'photorealistic',
      'animated': 'illustration',
      'educational': 'clean, professional',
      'cinematic': 'cinematic',
    };
    return styleMap[style || 'educational'] || 'clean, professional';
  }

  private mapRunwayStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      'PENDING': 'pending',
      'RUNNING': 'processing',
      'SUCCEEDED': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'failed',
    };
    return statusMap[status] || 'pending';
  }
}

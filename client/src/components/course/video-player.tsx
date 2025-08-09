import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Download,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ExternalLink
} from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  title: string;
  duration?: number;
  videoStatus?: string;
  videoProvider?: string;
  onRegenerate?: () => void;
  className?: string;
}

export default function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  duration,
  videoStatus = 'none',
  videoProvider,
  onRegenerate,
  className = ''
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('VideoPlayer: Setting up video element with URL:', videoUrl);

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setVideoDuration(video.duration);
    const handleLoadStart = () => {
      console.log('VideoPlayer: Video loading started');
      setIsLoading(true);
      setError(null); // Clear any previous errors
    };
    const handleLoadedData = () => {
      console.log('VideoPlayer: Video data loaded successfully');
      setIsLoading(false);
      setError(null);
    };
    const handleError = (e: Event) => {
      console.error('VideoPlayer: Video loading error:', e);
      const videoElement = e.target as HTMLVideoElement;
      const errorCode = videoElement.error?.code;
      const errorMessage = videoElement.error?.message || 'Unknown error';
      
      console.error('VideoPlayer: Error details:', {
        code: errorCode,
        message: errorMessage,
        videoUrl: videoUrl
      });
      
      let userErrorMessage = 'Failed to load video';
      
      // Provide more specific error messages
      switch (errorCode) {
        case 1:
          userErrorMessage = 'Video loading was aborted';
          break;
        case 2:
          userErrorMessage = 'Network error while loading video';
          break;
        case 3:
          userErrorMessage = 'Video decoding failed';
          break;
        case 4:
          userErrorMessage = 'Video format not supported';
          break;
        default:
          userErrorMessage = 'Failed to load video - please try again';
      }
      
      setError(userErrorMessage);
      setIsLoading(false);
    };
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_video.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getContentDescription = (videoUrl: string) => {
    try {
      const params = new URLSearchParams(videoUrl.split('?')[1]);
      const topic = params.get('topic') || 'educational';
      const content = params.get('content') || 'educational-content';
      const generated = params.get('generated') || 'false';
      const title = params.get('title') || '';
      const description = params.get('description') || '';
      
      // If this is an AI-generated video, show the AI description
      if (generated === 'true' && description) {
        return decodeURIComponent(description);
      }
      
      // Generate content description based on topic and content
      const descriptions: { [key: string]: { [key: string]: string } } = {
        javascript: {
          functions: 'JavaScript function tutorial covering function declarations, expressions, and arrow functions',
          variables: 'JavaScript variables tutorial covering var, let, const, and variable scoping',
          loops: 'JavaScript loops tutorial covering for, while, and forEach loops',
          arrays: 'JavaScript arrays tutorial covering array methods and manipulation',
          objects: 'JavaScript objects tutorial covering object creation, properties, and methods',
          'educational-content': 'JavaScript programming tutorial with practical examples and demonstrations'
        },
        python: {
          data: 'Python data analysis tutorial using pandas and numpy for data manipulation',
          algorithms: 'Python algorithms tutorial covering sorting, searching, and data structures',
          'educational-content': 'Python programming tutorial with practical examples and code demonstrations'
        },
        react: {
          components: 'React components tutorial covering functional and class components',
          hooks: 'React hooks tutorial covering useState, useEffect, and custom hooks',
          web: 'React web development tutorial covering modern web application development',
          'educational-content': 'React development tutorial with component-based architecture examples'
        },
        math: {
          concepts: 'Mathematical concepts tutorial with visual explanations and examples',
          examples: 'Mathematics tutorial with step-by-step problem solving examples',
          practice: 'Mathematics practice tutorial with interactive problem solving',
          'educational-content': 'Mathematics tutorial covering fundamental concepts and applications'
        },
        science: {
          explanation: 'Scientific explanation tutorial with visual demonstrations and experiments',
          concepts: 'Scientific concepts tutorial with real-world applications and examples',
          'educational-content': 'Science tutorial covering fundamental principles and discoveries'
        },
        programming: {
          tutorial: 'Programming tutorial covering fundamental concepts and best practices',
          concepts: 'Programming concepts tutorial with practical coding examples',
          'educational-content': 'Programming tutorial with hands-on coding demonstrations'
        },
        data: {
          analysis: 'Data analysis tutorial covering statistical methods and visualization',
          databases: 'Database tutorial covering SQL, NoSQL, and data management',
          'educational-content': 'Data science tutorial with practical analysis examples'
        },
        frontend: {
          web: 'Frontend web development tutorial covering HTML, CSS, and JavaScript',
          development: 'Frontend development tutorial with modern web technologies',
          'educational-content': 'Frontend development tutorial covering user interface and user experience'
        },
        educational: {
          'educational-content': 'Educational tutorial covering key concepts with practical examples and demonstrations'
        }
      };
      
      const topicDescriptions = descriptions[topic] || descriptions.educational;
      return topicDescriptions[content] || topicDescriptions['educational-content'] || 'Educational tutorial with practical examples and demonstrations';
    } catch (error) {
      return 'Educational tutorial covering key concepts with practical examples and demonstrations';
    }
  };

  const getRelevanceScore = (videoUrl: string) => {
    try {
      const params = new URLSearchParams(videoUrl.split('?')[1]);
      const topic = params.get('topic') || 'educational';
      const content = params.get('content') || 'educational-content';

      // Define relevance scores for different topics and content types
      const relevanceScores: { [key: string]: { [key: string]: number } } = {
        javascript: {
          functions: 90,
          variables: 85,
          loops: 80,
          arrays: 85,
          objects: 88,
          'educational-content': 95
        },
        python: {
          data: 88,
          algorithms: 85,
          'educational-content': 90
        },
        react: {
          components: 92,
          hooks: 88,
          web: 90,
          'educational-content': 95
        },
        math: {
          concepts: 85,
          examples: 80,
          practice: 75,
          'educational-content': 90
        },
        science: {
          explanation: 80,
          concepts: 85,
          'educational-content': 90
        },
        programming: {
          tutorial: 90,
          concepts: 88,
          'educational-content': 95
        },
        data: {
          analysis: 85,
          databases: 80,
          'educational-content': 90
        },
        frontend: {
          web: 88,
          development: 85,
          'educational-content': 92
        },
        educational: {
          'educational-content': 100
        }
      };

      const topicScore = relevanceScores[topic] || relevanceScores.educational;
      return topicScore[content] || topicScore['educational-content'] || 0;
    } catch (error) {
      return 0;
    }
  };

  const getStatusBadge = () => {
    switch (videoStatus) {
      case 'generating':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Generating
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="success" className="bg-green-100 text-green-800">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Generated
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  // If no video and not generating, show empty state
  if (!videoUrl && videoStatus !== 'generating') {
    console.log('VideoPlayer: No video URL and not generating, returning null');
    return null;
  }

  // If generating, show loading state
  if (videoStatus === 'generating') {
    console.log('VideoPlayer: Video is generating, showing loading state');
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm">Video</h3>
            {getStatusBadge()}
          </div>
          <div className="space-y-3">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
                <p className="text-sm text-gray-600">Generating video...</p>
                <p className="text-xs text-gray-500 mt-1">This may take 1-2 minutes</p>
              </div>
            </div>
            {videoProvider && (
              <p className="text-xs text-gray-500">
                Provider: {videoProvider}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If failed, show error state
  if (videoStatus === 'failed') {
    console.log('VideoPlayer: Video generation failed, showing error state');
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm">Video</h3>
            {getStatusBadge()}
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Video generation failed. Please try again.
            </AlertDescription>
          </Alert>
          {onRegenerate && (
            <Button 
              onClick={onRegenerate} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show video player
  console.log('VideoPlayer: Showing video player with URL:', videoUrl);
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">{title}</h3>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {videoProvider && (
              <Badge variant="outline" className="text-xs">
                {videoProvider}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Video Container */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  poster={thumbnailUrl}
                  className="w-full h-full object-contain"
                  controls={false}
                  onClick={togglePlay}
                  onError={(e) => {
                    console.error('Video loading error:', e);
                    setError('Failed to load video');
                    setIsLoading(false);
                  }}
                />
                
                {/* Custom Controls Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={togglePlay}
                      className="bg-white/20 hover:bg-white/30 text-white rounded-full w-16 h-16"
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8" />
                      ) : (
                        <Play className="h-8 w-8" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Bottom Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="flex-1 text-center text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(videoDuration)}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleFullscreen}
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                  <div 
                    className="h-full bg-white transition-all duration-300"
                    style={{ 
                      width: `${videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}%` 
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white">Video not available</p>
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-white animate-spin" />
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white p-4">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium mb-2">Video Loading Error</p>
                  <p className="text-xs mb-4">{error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      if (videoRef.current) {
                        videoRef.current.load();
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={!videoUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            {videoUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(videoUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            )}
            
            {onRegenerate && videoStatus === 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRegenerate}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>

          {/* Video Info */}
          {videoDuration > 0 && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>Duration: {formatTime(videoDuration)}</div>
              {videoProvider && <div>Generated by: {videoProvider}</div>}
              {videoUrl && videoUrl.includes('generated=true') && (
                <div className="flex items-center gap-1 text-blue-600 font-medium">
                  <Sparkles className="h-3 w-3" />
                  AI-Generated Content
                </div>
              )}
              {videoUrl && videoUrl.includes('topic=') && (
                <div>Topic: {new URLSearchParams(videoUrl.split('?')[1]).get('topic') || 'Educational'}</div>
              )}
              {videoUrl && videoUrl.includes('type=') && (
                <div>Type: {new URLSearchParams(videoUrl.split('?')[1]).get('type') || 'Educational'}</div>
              )}
              {videoUrl && videoUrl.includes('content=') && (
                <div>Content: {new URLSearchParams(videoUrl.split('?')[1]).get('content') || 'Educational content'}</div>
              )}
              {/* Enhanced Content Description */}
              {videoUrl && videoUrl.includes('content=') && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    Content Description:
                  </div>
                  <div className="text-gray-600">
                    {getContentDescription(videoUrl)}
                  </div>
                  {/* Content Relevance Indicator */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getRelevanceScore(videoUrl)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {getRelevanceScore(videoUrl)}% relevant
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
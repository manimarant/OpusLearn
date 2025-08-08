import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Upload,
  AlertCircle,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LMSPlatform {
  id: string;
  name: string;
  description: string;
  apiDocUrl: string;
  requiredFields: string[];
  example: {
    apiUrl: string;
    apiKey: string;
  };
}

interface PublishDialogProps {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PublishForm {
  platform: string;
  apiUrl: string;
  apiKey: string;
  externalCourseId: string;
}

export function PublishDialog({ courseId, open, onOpenChange }: PublishDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<PublishForm>({
    platform: '',
    apiUrl: '',
    apiKey: '',
    externalCourseId: '',
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('configure');

  // Fetch available LMS platforms
  const { data: platforms, isLoading: platformsLoading } = useQuery({
    queryKey: ['lms-platforms'],
    queryFn: async () => {
      const response = await fetch('/api/lms/platforms');
      if (!response.ok) throw new Error('Failed to fetch platforms');
      return response.json() as Promise<LMSPlatform[]>;
    },
  });

  // Validate connection mutation
  const validateMutation = useMutation({
    mutationFn: async (data: { platform: string; apiUrl: string; apiKey: string }) => {
      const response = await fetch('/api/lms/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Validation failed');
      return response.json();
    },
    onSuccess: (data) => {
      setValidationResult(data.valid);
      if (data.valid) {
        toast({
          title: "Connection validated",
          description: "Successfully connected to the LMS platform.",
        });
        setActiveTab('publish');
      } else {
        toast({
          title: "Connection failed",
          description: "Could not connect to the LMS platform. Please check your credentials.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setValidationResult(false);
      toast({
        title: "Validation error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Publish course mutation
  const publishMutation = useMutation({
    mutationFn: async (data: PublishForm) => {
      const response = await fetch(`/api/courses/${courseId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: data.platform,
          apiUrl: data.apiUrl,
          apiKey: data.apiKey,
          courseId: data.externalCourseId || undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish course');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Course published successfully",
        description: `Course has been published to ${form.platform}. External ID: ${data.externalCourseId}`,
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Publish failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedPlatform = platforms?.find(p => p.id === form.platform);

  const handleValidateConnection = () => {
    if (!form.platform || !form.apiUrl || !form.apiKey) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    validateMutation.mutate({
      platform: form.platform,
      apiUrl: form.apiUrl,
      apiKey: form.apiKey,
    });
    setIsValidating(false);
  };

  const handlePublish = () => {
    if (!validationResult) {
      toast({
        title: "Connection not validated",
        description: "Please validate your connection before publishing.",
        variant: "destructive",
      });
      return;
    }

    publishMutation.mutate(form);
  };

  const resetForm = () => {
    setForm({
      platform: '',
      apiUrl: '',
      apiKey: '',
      externalCourseId: '',
    });
    setValidationResult(null);
    setActiveTab('configure');
  };

  const updateForm = (field: keyof PublishForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'platform' || field === 'apiUrl' || field === 'apiKey') {
      setValidationResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish Course to LMS
          </DialogTitle>
          <DialogDescription>
            Export and publish this course to an external Learning Management System.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="publish" disabled={!validationResult}>Publish</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label htmlFor="platform">LMS Platform *</Label>
              <Select value={form.platform} onValueChange={(value) => updateForm('platform', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select LMS platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms?.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Platform Information */}
            {selectedPlatform && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{selectedPlatform.name}</CardTitle>
                  <CardDescription>{selectedPlatform.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Required Fields:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedPlatform.requiredFields.map((field) => (
                        <Badge key={field} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={selectedPlatform.apiDocUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      API Documentation
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Connection Settings */}
            {selectedPlatform && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL *</Label>
                  <Input
                    id="apiUrl"
                    placeholder={selectedPlatform.example.apiUrl}
                    value={form.apiUrl}
                    onChange={(e) => updateForm('apiUrl', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key *</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={selectedPlatform.example.apiKey}
                    value={form.apiKey}
                    onChange={(e) => updateForm('apiKey', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalCourseId">
                    External Course ID (Optional)
                  </Label>
                  <Input
                    id="externalCourseId"
                    placeholder="Leave empty to create new course"
                    value={form.externalCourseId}
                    onChange={(e) => updateForm('externalCourseId', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter an existing course ID to update that course, or leave empty to create a new one.
                  </p>
                </div>

                {/* Validation */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleValidateConnection}
                    disabled={validateMutation.isPending || !form.platform || !form.apiUrl || !form.apiKey}
                    className="w-full"
                  >
                    {validateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating Connection...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Validate Connection
                      </>
                    )}
                  </Button>

                  {validationResult !== null && (
                    <Alert className={validationResult ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      {validationResult ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={validationResult ? "text-green-800" : "text-red-800"}>
                        {validationResult 
                          ? "Connection successful! You can now proceed to publish."
                          : "Connection failed. Please check your credentials and try again."
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="publish" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This will export your course content and publish it to {selectedPlatform?.name}. 
                The course structure, chapters, assignments, quizzes, and discussions will be created 
                in the external LMS.
              </AlertDescription>
            </Alert>

            {selectedPlatform && (
              <Card>
                <CardHeader>
                  <CardTitle>Publish Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Platform:</span>
                      <p className="text-muted-foreground">{selectedPlatform.name}</p>
                    </div>
                    <div>
                      <span className="font-medium">API URL:</span>
                      <p className="text-muted-foreground truncate">{form.apiUrl}</p>
                    </div>
                    <div>
                      <span className="font-medium">Action:</span>
                      <p className="text-muted-foreground">
                        {form.externalCourseId ? 'Update existing course' : 'Create new course'}
                      </p>
                    </div>
                    {form.externalCourseId && (
                      <div>
                        <span className="font-medium">Course ID:</span>
                        <p className="text-muted-foreground">{form.externalCourseId}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                className="flex-1"
              >
                {publishMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Publish Course
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

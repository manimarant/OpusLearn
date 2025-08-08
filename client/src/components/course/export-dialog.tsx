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
  Download,
  Package,
  Info,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  features: string[];
}

interface ExportDialogProps {
  courseId: string;
  courseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExportForm {
  format: string;
  title: string;
  organization: string;
  language: string;
  version: string;
  includeTracking: boolean;
  // SCORM specific
  masteryScore: number;
  maxTimeAllowed: string;
  timeLimitAction: string;
  // xAPI specific
  activityId: string;
  endpoint: string;
  authToken: string;
}

export function ExportDialog({ courseId, courseName, open, onOpenChange }: ExportDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('format');
  const [form, setForm] = useState<ExportForm>({
    format: '',
    title: courseName,
    organization: 'OpusLearn',
    language: 'en',
    version: '1.0',
    includeTracking: true,
    masteryScore: 80,
    maxTimeAllowed: 'PT2H',
    timeLimitAction: 'continue,no message',
    activityId: '',
    endpoint: '',
    authToken: '',
  });

  // Fetch available export formats
  const { data: formats, isLoading: formatsLoading } = useQuery({
    queryKey: ['export-formats'],
    queryFn: async () => {
      const response = await fetch('/api/export/formats');
      if (!response.ok) throw new Error('Failed to fetch export formats');
      return response.json() as Promise<ExportFormat[]>;
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (exportData: any) => {
      const response = await fetch(`/api/courses/${courseId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to export course');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = response.headers.get('Content-Disposition')
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'course_export.zip';

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { filename };
    },
    onSuccess: (data) => {
      toast({
        title: "Export successful",
        description: `Course package "${data.filename}" has been downloaded.`,
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedFormat = formats?.find(f => f.id === form.format);

  const handleExport = () => {
    if (!form.format) {
      toast({
        title: "Format required",
        description: "Please select an export format.",
        variant: "destructive",
      });
      return;
    }

    const exportData = {
      format: form.format,
      options: {
        title: form.title,
        organization: form.organization,
        language: form.language,
        version: form.version,
        includeTracking: form.includeTracking,
        ...(form.format.startsWith('scorm') && {
          masteryScore: form.masteryScore,
          maxTimeAllowed: form.maxTimeAllowed,
          timeLimitAction: form.timeLimitAction,
        }),
        ...(form.format === 'xapi' && {
          activityId: form.activityId || `http://course.example.com/${courseId}`,
          endpoint: form.endpoint,
          authToken: form.authToken,
        }),
      },
    };

    exportMutation.mutate(exportData);
  };

  const resetForm = () => {
    setForm({
      format: '',
      title: courseName,
      organization: 'OpusLearn',
      language: 'en',
      version: '1.0',
      includeTracking: true,
      masteryScore: 80,
      maxTimeAllowed: 'PT2H',
      timeLimitAction: 'continue,no message',
      activityId: '',
      endpoint: '',
      authToken: '',
    });
    setActiveTab('format');
  };

  const updateForm = (field: keyof ExportForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canProceedToOptions = form.format !== '';
  const canExport = form.format !== '' && form.title.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Export Course Package
          </DialogTitle>
          <DialogDescription>
            Export "{courseName}" as a standardized e-learning package for use in any compatible LMS.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">
              <Package className="h-4 w-4 mr-2" />
              Format
            </TabsTrigger>
            <TabsTrigger value="options" disabled={!canProceedToOptions}>
              <Settings className="h-4 w-4 mr-2" />
              Options
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!canExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="format">Export Format *</Label>
              <Select value={form.format} onValueChange={(value) => updateForm('format', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  {formats?.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFormat && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    {selectedFormat.name}
                  </CardTitle>
                  <CardDescription>{selectedFormat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-sm font-medium">Key Features:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFormat.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedFormat && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('options')}>
                  Continue to Options
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="options" className="space-y-6">
            {/* General Options */}
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Package Title *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => updateForm('title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      value={form.organization}
                      onChange={(e) => updateForm('organization', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={form.language} onValueChange={(value) => updateForm('language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={form.version}
                      onChange={(e) => updateForm('version', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SCORM Specific Options */}
            {selectedFormat?.id.startsWith('scorm') && (
              <Card>
                <CardHeader>
                  <CardTitle>SCORM Settings</CardTitle>
                  <CardDescription>Configure SCORM-specific tracking and completion settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="masteryScore">Mastery Score (%)</Label>
                      <Input
                        id="masteryScore"
                        type="number"
                        min="0"
                        max="100"
                        value={form.masteryScore}
                        onChange={(e) => updateForm('masteryScore', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTimeAllowed">Max Time Allowed</Label>
                      <Input
                        id="maxTimeAllowed"
                        placeholder="PT2H (2 hours)"
                        value={form.maxTimeAllowed}
                        onChange={(e) => updateForm('maxTimeAllowed', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeLimitAction">Time Limit Action</Label>
                    <Select value={form.timeLimitAction} onValueChange={(value) => updateForm('timeLimitAction', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continue,no message">Continue without message</SelectItem>
                        <SelectItem value="exit,message">Exit with message</SelectItem>
                        <SelectItem value="exit,no message">Exit without message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* xAPI Specific Options */}
            {selectedFormat?.id === 'xapi' && (
              <Card>
                <CardHeader>
                  <CardTitle>xAPI Settings</CardTitle>
                  <CardDescription>Configure xAPI endpoint and activity tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="activityId">Activity ID</Label>
                    <Input
                      id="activityId"
                      placeholder={`http://course.example.com/${courseId}`}
                      value={form.activityId}
                      onChange={(e) => updateForm('activityId', e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Leave empty to use default activity ID
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endpoint">xAPI Endpoint (Optional)</Label>
                    <Input
                      id="endpoint"
                      placeholder="https://your-lrs.com/xapi/"
                      value={form.endpoint}
                      onChange={(e) => updateForm('endpoint', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authToken">Auth Token (Optional)</Label>
                    <Input
                      id="authToken"
                      type="password"
                      placeholder="Authentication token for LRS"
                      value={form.authToken}
                      onChange={(e) => updateForm('authToken', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('format')}>
                Back to Format
              </Button>
              <Button onClick={() => setActiveTab('export')}>
                Continue to Export
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Ready to export "{form.title}" as a {selectedFormat?.name} package. 
                The package will be downloaded as a ZIP file that can be imported into any compatible LMS.
              </AlertDescription>
            </Alert>

            {selectedFormat && (
              <Card>
                <CardHeader>
                  <CardTitle>Export Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Format:</span>
                      <p className="text-muted-foreground">{selectedFormat.name}</p>
                    </div>
                    <div>
                      <span className="font-medium">Title:</span>
                      <p className="text-muted-foreground">{form.title}</p>
                    </div>
                    <div>
                      <span className="font-medium">Organization:</span>
                      <p className="text-muted-foreground">{form.organization}</p>
                    </div>
                    <div>
                      <span className="font-medium">Language:</span>
                      <p className="text-muted-foreground">{form.language}</p>
                    </div>
                    {selectedFormat.id.startsWith('scorm') && (
                      <>
                        <div>
                          <span className="font-medium">Mastery Score:</span>
                          <p className="text-muted-foreground">{form.masteryScore}%</p>
                        </div>
                        <div>
                          <span className="font-medium">Time Limit:</span>
                          <p className="text-muted-foreground">{form.maxTimeAllowed}</p>
                        </div>
                      </>
                    )}
                    {selectedFormat.id === 'xapi' && form.activityId && (
                      <div className="col-span-2">
                        <span className="font-medium">Activity ID:</span>
                        <p className="text-muted-foreground truncate">{form.activityId}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('options')}>
                Back to Options
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={exportMutation.isPending}
                  className="min-w-[140px]"
                >
                  {exportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Package
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

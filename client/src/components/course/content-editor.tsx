import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link,
  Image,
  Video,
  FileText,
  Save,
  Eye,
  Sparkles
} from "lucide-react";
// Video generation removed

interface ContentEditorProps {
  chapter: any;
  onSave: (chapterData: any) => void;
  isLoading?: boolean;
  forceUpdate?: number;
  onVideoGenerated?: () => void;
}

export default function ContentEditor({ chapter, onSave, isLoading, forceUpdate, onVideoGenerated }: ContentEditorProps) {
  type Block = { id: string; type: 'heading' | 'paragraph'; props: { text: string } };

  const [chapterData, setChapterData] = useState({
    title: chapter?.title || "",
    content: chapter?.content || "",
    contentJson: (chapter?.contentJson as Block[] | undefined) || undefined,
    contentType: chapter?.contentType || "text",
    duration: chapter?.duration || 0,
  });

  const [isPreview, setIsPreview] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  // const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  useEffect(() => {
    if (chapter) {
      setChapterData({
        title: chapter.title || "",
        content: chapter.content || "",
        contentJson: (chapter.contentJson as Block[] | undefined) || undefined,
        contentType: chapter.contentType || "text",
        duration: chapter.duration || 0,
      });
    }
  }, [chapter, forceUpdate]);

  const debouncedChapterData = useDebounce(chapterData, 1000); // Debounce for 1 second

  useEffect(() => {
    if (chapter && (
        debouncedChapterData.title !== chapter.title ||
        debouncedChapterData.content !== chapter.content ||
        debouncedChapterData.contentType !== chapter.contentType ||
        debouncedChapterData.duration !== chapter.duration
    )) {
      // Include the chapter ID and other necessary fields for the update
      const updatedChapter = {
        ...debouncedChapterData,
        id: chapter.id,
        moduleId: chapter.moduleId,
        orderIndex: chapter.orderIndex
      };
      setIsAutoSaving(true);
      onSave(updatedChapter);
      // Reset auto-saving state after a short delay
      setTimeout(() => setIsAutoSaving(false), 2000);
    }
  }, [debouncedChapterData, chapter]);

  const handleSave = () => {
    onSave({
      ...chapterData,
      id: chapter.id,
      moduleId: chapter.moduleId,
      orderIndex: chapter.orderIndex
    });
  };

  // Block editor helpers
  const ensureBlocks = (): Block[] => {
    if (chapterData.contentJson && Array.isArray(chapterData.contentJson)) return chapterData.contentJson as Block[];
    // Fallback: convert legacy content into a single paragraph block
    const text = (chapterData.content || '').trim();
    return text
      ? [{ id: crypto.randomUUID(), type: 'paragraph', props: { text } }]
      : [];
  };

  const [blocks, setBlocks] = useState<Block[]>(ensureBlocks());

  useEffect(() => {
    setBlocks(ensureBlocks());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterData.contentJson]);

  const syncBlocks = (next: Block[]) => {
    setBlocks(next);
    setChapterData((d) => ({ ...d, contentJson: next }));
  };

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = { id: crypto.randomUUID(), type, props: { text: type === 'heading' ? 'New heading' : 'New paragraph' } };
    syncBlocks([...(blocks || []), newBlock]);
  };

  const updateBlockText = (id: string, text: string) => {
    syncBlocks(blocks.map((b) => (b.id === id ? { ...b, props: { text } } : b)));
  };

  const removeBlock = (id: string) => {
    syncBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const tgt = idx + dir;
    if (tgt < 0 || tgt >= blocks.length) return;
    const next = blocks.slice();
    const [item] = next.splice(idx, 1);
    next.splice(tgt, 0, item);
    syncBlocks(next);
  };

  const insertFormatting = (format: string) => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = chapterData.content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        break;
      case 'orderedList':
        formattedText = `1. ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'image':
        formattedText = `![${selectedText}](image-url)`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = 
      chapterData.content.substring(0, start) + 
      formattedText + 
      chapterData.content.substring(end);

    setChapterData({ ...chapterData, content: newContent });
  };

  const renderPreview = (content: string) => {
    // Simple markdown-like preview rendering
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 rounded">$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-slate-300 pl-4 italic">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^1\. (.*$)/gim, '<li>$1</li>')
      .split('\n').map(line => line.trim() ? `<p class="mb-4">${line}</p>` : '<br>').join('');
  };

  return (
    <div className="space-y-6">
      {/* Chapter Header */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chapter-title">Chapter Title</Label>
            <Input
              id="chapter-title"
              value={chapterData.title}
              onChange={(e) => setChapterData({ ...chapterData, title: e.target.value })}
              placeholder="Enter chapter title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chapter-duration">Duration (minutes)</Label>
            <Input
              id="chapter-duration"
              type="number"
              value={chapterData.duration}
              onChange={(e) => setChapterData({ ...chapterData, duration: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content-type">Content Type</Label>
          <Select
            value={chapterData.contentType}
            onValueChange={(value) => setChapterData({ ...chapterData, contentType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Content</SelectItem>
              <SelectItem value="video">Video Chapter</SelectItem>
              <SelectItem value="interactive">Interactive Content</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Editor */}
      <Tabs defaultValue="editor" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {chapterData.contentType}
            </Badge>
            {isAutoSaving && (
              <Badge variant="secondary" className="text-green-600">
                Auto-saving...
              </Badge>
            )}
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Chapter"}
            </Button>
          </div>
        </div>

        <TabsContent value="editor" className="space-y-4">
          {/* Minimal Block Toolbar */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => addBlock('heading')}>Add Heading</Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('paragraph')}>Add Paragraph</Button>
          </div>

          {/* Block Canvas */}
          <div className="space-y-3">
            {blocks.length === 0 && (
              <Card><CardContent className="p-6 text-sm text-slate-500">No blocks. Use the toolbar to add content.</CardContent></Card>
            )}
            {blocks.map((block, idx) => (
              <Card key={block.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">{block.type}</Badge>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => moveBlock(block.id, -1)} disabled={idx === 0}>Up</Button>
                      <Button size="sm" variant="outline" onClick={() => moveBlock(block.id, 1)} disabled={idx === blocks.length - 1}>Down</Button>
                      <Button size="sm" variant="outline" onClick={() => removeBlock(block.id)}>Remove</Button>
                    </div>
                  </div>
                  {block.type === 'heading' ? (
                    <Input value={block.props.text} onChange={(e) => updateBlockText(block.id, e.target.value)} placeholder="Heading" />
                  ) : (
                    <Textarea value={block.props.text} onChange={(e) => updateBlockText(block.id, e.target.value)} rows={6} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Type Specific Options */}
          {chapterData.contentType === "video" && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium text-slate-800">Video Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-url">Video URL</Label>
                    <Input
                      id="video-url"
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video-duration">Video Duration</Label>
                    <Input
                      id="video-duration"
                      placeholder="10:30"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {chapterData.contentType === "interactive" && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium text-slate-800">Interactive Content</h3>
                <div className="space-y-2">
                  <Label htmlFor="interactive-type">Interactive Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interactive type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h5p">H5P Interactive</SelectItem>
                      <SelectItem value="embed">External Embed</SelectItem>
                      <SelectItem value="simulation">Simulation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="course-content">
                <h1>{chapterData.title}</h1>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: renderPreview(chapterData.content) 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI video generation removed */}
    </div>
  );
}

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Pin, Lock, Reply, Search, Pencil, Trash2 } from "lucide-react";
import { debounce } from "lodash";

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  status: string;
}

interface Discussion {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  locked: boolean;
  createdAt: string;
  replyCount: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | undefined;
  };
}

interface DiscussionReply {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | undefined;
  };
}

export default function Discussions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);
  const [isEditDiscussionDialogOpen, setIsEditDiscussionDialogOpen] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    content: "",
    courseId: 0,
    pinned: false,
    locked: false,
  });
  const [newReply, setNewReply] = useState("");

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: discussions } = useQuery<Discussion[]>({
    queryKey: ["/api/courses", selectedCourse, "discussions"],
    enabled: !!selectedCourse,
  });

  const { data: replies } = useQuery<DiscussionReply[]>({
    queryKey: ["/api/discussions", selectedDiscussion?.id, "replies"],
    enabled: !!selectedDiscussion,
  });

  const createDiscussionMutation = useMutation({
    mutationFn: async (discussionData: any) => {
      console.log('Creating discussion with data:', discussionData);
      const response = await apiRequest("POST", `/api/courses/${discussionData.courseId}/discussions`, discussionData);
      const result = await response.json();
      console.log('Discussion creation result:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourse, "discussions"] });
      setIsCreateDialogOpen(false);
      setNewDiscussion({ title: "", content: "", courseId: 0, pinned: false, locked: false });
      toast({
        title: "Discussion Created",
        description: "Your discussion has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Discussion creation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create discussion",
        variant: "destructive",
      });
    },
  });

  const updateDiscussionMutation = useMutation({
    mutationFn: async (discussionData: any) => {
      const response = await apiRequest("PUT", `/api/discussions/${discussionData.id}`, discussionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourse, "discussions"] });
      setIsEditDiscussionDialogOpen(false);
      toast({
        title: "Discussion Updated",
        description: "Discussion has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update discussion",
        variant: "destructive",
      });
    },
  });

  const deleteDiscussionMutation = useMutation({
    mutationFn: async (discussionId: number) => {
      const response = await apiRequest("DELETE", `/api/discussions/${discussionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourse, "discussions"] });
      setSelectedDiscussion(null);
      toast({
        title: "Discussion Deleted",
        description: "Discussion has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete discussion",
        variant: "destructive",
      });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (replyData: any) => {
      const response = await apiRequest("POST", `/api/discussions/${selectedDiscussion?.id}/replies`, replyData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discussions", selectedDiscussion?.id, "replies"] });
      setNewReply("");
      toast({
        title: "Reply Posted",
        description: "Your reply has been posted successfully.",
      });
    },
  });

  const handleCreateDiscussion = () => {
    if (!newDiscussion.title || !newDiscussion.content || !selectedCourse) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select a course.",
        variant: "destructive",
      });
      return;
    }
    createDiscussionMutation.mutate({
      ...newDiscussion,
      courseId: parseInt(selectedCourse),
      pinned: false,
      locked: false,
    });
  };

  const handleEditDiscussion = (discussion: Discussion) => {
    setEditingDiscussion(discussion);
    setIsEditDiscussionDialogOpen(true);
  };

  const handleUpdateDiscussion = () => {
    if (editingDiscussion) {
      updateDiscussionMutation.mutate(editingDiscussion);
    }
  };

  const handleDeleteDiscussion = (discussionId: number) => {
    if (window.confirm("Are you sure you want to delete this discussion?")) {
      deleteDiscussionMutation.mutate(discussionId);
    }
  };

  const handleCreateReply = () => {
    if (!newReply.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a reply.",
        variant: "destructive",
      });
      return;
    }
    createReplyMutation.mutate({ content: newReply });
  };

  const filteredDiscussions = discussions?.filter((discussion) =>
    discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discussion.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Discussions</h2>
                <p className="text-slate-600 mt-1">
                  Engage with your learning community
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Start New Discussion</DialogTitle>
                    <DialogDescription>
                      Create a new discussion topic for your course.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="course">Course</Label>
                      <Select
                        value={selectedCourse || ""}
                        onValueChange={(value) => {
                          setSelectedCourse(value);
                          setNewDiscussion({ ...newDiscussion, courseId: parseInt(value) });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses?.map((course: any) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Discussion Title</Label>
                      <Input
                        id="title"
                        value={newDiscussion.title}
                        onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                        placeholder="Enter discussion title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={newDiscussion.content}
                        onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                        placeholder="Start the discussion..."
                        rows={5}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleCreateDiscussion}
                      disabled={createDiscussionMutation.isPending}
                    >
                      {createDiscussionMutation.isPending ? "Creating..." : "Create Discussion"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Discussions List */}
            <div className="lg:col-span-2">
              {/* Course Filter and Search */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="sm:w-[200px]">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course: any) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.title}
                        </SelectItem>
                      ))}
                    
              </SelectContent>
                  </Select>
                </div>
                    
              </div>

            

              {/* Discussions */}
              <div className="space-y-4">
                {selectedCourse ? (
                  filteredDiscussions.length > 0 ? (
                    filteredDiscussions.map((discussion) => (
                      <Card 
                        key={discussion.id} 
                        className={`cursor-pointer transition-colors hover:border-slate-300 ${
                          selectedDiscussion?.id === discussion.id ? "border-blue-300 bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedDiscussion(discussion)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={discussion.user?.profileImageUrl} />
                              <AvatarFallback>
                                {discussion.user?.firstName?.[0]}{discussion.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-medium text-slate-800">{discussion.title}</h3>
                                {discussion.pinned && (
                                  <Badge variant="secondary">
                                    <Pin className="h-3 w-3 mr-1" />
                                    Pinned
                                  </Badge>
                                )}
                                {discussion.locked && (
                                  <Badge variant="outline">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Locked
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                {discussion.content}
                              </p>
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center space-x-4">
                                  <span>
                                    by {discussion.user?.firstName} {discussion.user?.lastName}
                                  </span>
                                  <span>
                                    {new Date(discussion.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{discussion.replyCount || 0} replies</span>
                                </div>
                              </div>
                            </div>
                            {user?.role === "instructor" && (
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditDiscussion(discussion); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteDiscussion(discussion.id); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                          {searchTerm ? "No discussions found matching your search." : "No discussions yet in this course."}
                        </p>
                        {!searchTerm && (
                          <Button 
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                            onClick={() => setIsCreateDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Start First Discussion
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-slate-500">
                        Select a course to view discussions.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Discussion Detail */}
            <div className="lg:col-span-1">
              {selectedDiscussion ? (
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedDiscussion.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Original Post */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedDiscussion.user?.profileImageUrl} />
                          <AvatarFallback>
                            {selectedDiscussion.user?.firstName?.[0]}{selectedDiscussion.user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {selectedDiscussion.user?.firstName} {selectedDiscussion.user?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(selectedDiscussion.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700">{selectedDiscussion.content}</p>
                    </div>

                    {/* Replies */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {replies?.map((reply) => (
                        <div key={reply.id} className="p-3 border border-slate-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reply.user?.profileImageUrl} />
                              <AvatarFallback className="text-xs">
                                {reply.user?.firstName?.[0]}{reply.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-medium">
                                {reply.user?.firstName} {reply.user?.lastName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-700">{reply.content}</p>
                        </div>
                      )) || (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No replies yet. Be the first to reply!
                        </p>
                      )}
                    </div>

                    {/* Reply Input */}
                    <div className="space-y-3 pt-4 border-t">
                      <Textarea
                        placeholder="Write a reply..."
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        rows={3}
                      />
                      <Button 
                        size="sm" 
                        onClick={handleCreateReply}
                        disabled={createReplyMutation.isPending || !newReply.trim()}
                        className="w-full"
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">
                      Select a discussion to view details and replies.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Edit Discussion Dialog */}
      <Dialog open={isEditDiscussionDialogOpen} onOpenChange={setIsEditDiscussionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Discussion</DialogTitle>
            <DialogDescription>
              Update the discussion details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-discussion-title">Discussion Title</Label>
              <Input
                id="edit-discussion-title"
                value={editingDiscussion?.title || ""}
                onChange={(e) => setEditingDiscussion(prev => prev ? {...prev, title: e.target.value} : null)}
                placeholder="Enter discussion title"
              />
            </div>
            <div>
              <Label htmlFor="edit-discussion-content">Content</Label>
              <Textarea
                id="edit-discussion-content"
                value={editingDiscussion?.content || ""}
                onChange={(e) => setEditingDiscussion(prev => prev ? {...prev, content: e.target.value} : null)}
                placeholder="Enter discussion content"
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-discussion-pinned"
                  checked={editingDiscussion?.pinned || false}
                  onChange={(e) => setEditingDiscussion(prev => prev ? {...prev, pinned: e.target.checked} : null)}
                  className="rounded"
                />
                <Label htmlFor="edit-discussion-pinned" className="text-sm">Pin this discussion</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-discussion-locked"
                  checked={editingDiscussion?.locked || false}
                  onChange={(e) => setEditingDiscussion(prev => prev ? {...prev, locked: e.target.checked} : null)}
                  className="rounded"
                />
                <Label htmlFor="edit-discussion-locked" className="text-sm">Lock discussion</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDiscussionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateDiscussion}
              disabled={updateDiscussionMutation.isPending}
            >
              {updateDiscussionMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

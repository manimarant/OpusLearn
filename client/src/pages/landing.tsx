import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Award, BarChart3, MessageSquare, FileText, Sparkles, Zap, Target, Clock, CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const handleLogin = async () => {
    try {
      // In development mode, check if login is disabled
      const response = await fetch('/api/login');
      const data = await response.json();
      
      if (data.message === "Development mode - login disabled") {
        // Redirect to dashboard in development mode
        setLocation('/');
      } else {
        // Normal login flow
        window.location.href = "/api/login";
      }
    } catch (error) {
      console.error('Error during login:', error);
      // Fallback to direct login
      window.location.href = "/api/login";
    }
  };

  return (
    <div className="saas-gradient min-h-screen">
      {/* Header */}
      <header className="saas-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-foreground">OpusLearn</h1>
                <div className="flex items-center space-x-1 px-2 py-1 bg-primary/10 rounded-full">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">AI-Powered</span>
                </div>
              </div>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => setLocation('/dashboard')}
                  className="saas-button-secondary"
                >
                  Dashboard
                </Button>
                <Button 
                  onClick={() => setLocation('/courses')}
                  className="saas-button-primary"
                >
                  Browse Courses
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleLogin}
                className="saas-button-primary"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-sm font-medium text-primary">AI-Powered Learning Platform</span>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-6 leading-tight">
            Create Engaging
            <span className="text-primary block"> Learning Experiences</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            A comprehensive e-learning platform that empowers educators to create, manage, and deliver 
            exceptional online courses with AI-powered tools, interactive content, and advanced analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <>
                <Button 
                  size="lg" 
                  onClick={() => setLocation('/dashboard')}
                  className="saas-button-primary px-8 py-4 text-lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Go to Dashboard
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setLocation('/courses')}
                  className="saas-button-secondary px-8 py-4 text-lg"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse Courses
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={handleLogin}
                  className="saas-button-primary px-8 py-4 text-lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => {
                    document.getElementById('features-section')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                  className="saas-button-secondary px-8 py-4 text-lg"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Learn More
                </Button>
              </>
            )}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">10K+</div>
              <div className="text-sm text-muted-foreground">Active Educators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">50K+</div>
              <div className="text-sm text-muted-foreground">Students Enrolled</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">95%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-4xl font-bold text-foreground">
                Everything You Need for Online Learning
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From AI-powered course creation to advanced analytics, our platform provides all the tools 
              educators need to deliver exceptional learning experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="saas-card saas-card-hover cursor-pointer animate-fade-in" 
                  onClick={isAuthenticated ? () => setLocation('/course-builder') : handleLogin}>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">AI Course Authoring</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Create rich, interactive courses with AI assistance, multimedia content, and structured learning paths.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="saas-card saas-card-hover cursor-pointer animate-fade-in"
                  onClick={isAuthenticated ? () => setLocation('/dashboard') : handleLogin}>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-foreground">Smart Student Management</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Track student progress with AI insights, manage enrollments, and provide personalized feedback at scale.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="saas-card saas-card-hover cursor-pointer animate-fade-in"
                  onClick={isAuthenticated ? () => setLocation('/dashboard') : handleLogin}>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-foreground">Advanced Analytics</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Gain deep insights into student performance and course effectiveness with AI-powered analytics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="saas-card saas-card-hover cursor-pointer animate-fade-in"
                  onClick={isAuthenticated ? () => setLocation('/discussions') : handleLogin}>
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-foreground">Interactive Discussions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Foster community learning with AI-moderated discussion forums and real-time collaboration.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="saas-card saas-card-hover cursor-pointer animate-fade-in"
                  onClick={isAuthenticated ? () => setLocation('/assignments') : handleLogin}>
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-foreground">Smart Assignments</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Create and manage assignments with AI-powered grading and detailed rubrics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="saas-card saas-card-hover cursor-pointer animate-fade-in"
                  onClick={isAuthenticated ? () => setLocation('/dashboard') : handleLogin}>
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-foreground">Digital Certificates</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Generate and issue blockchain-verified certificates automatically upon course completion.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="flex items-center space-x-2 mb-6">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-3xl font-bold text-foreground">Why Choose OpusLearn?</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">AI-Powered Course Creation</h3>
                    <p className="text-muted-foreground">Leverage AI to create engaging content and personalized learning paths.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Advanced Analytics</h3>
                    <p className="text-muted-foreground">Get deep insights into student performance and course effectiveness.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Seamless Integration</h3>
                    <p className="text-muted-foreground">Works with your existing tools and workflows.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">24/7 Support</h3>
                    <p className="text-muted-foreground">Get help whenever you need it with our dedicated support team.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="animate-fade-in">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20">
                <div className="text-center">
                  <Clock className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Start Teaching in Minutes</h3>
                  <p className="text-muted-foreground mb-6">
                    Set up your first course with our AI-powered tools and start teaching immediately.
                  </p>
                  <Button onClick={handleLogin} className="saas-button-primary">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Free Trial
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of educators who are already creating amazing learning experiences 
            with OpusLearn Platform.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Start Teaching Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-foreground">OpusLearn</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 OpusLearn Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

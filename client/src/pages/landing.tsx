import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Award, BarChart3, MessageSquare, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Frost Learning</h1>
            </div>
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-slate-800 mb-6">
            Create Engaging Learning
            <span className="text-blue-600"> Experiences</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            A comprehensive e-learning platform that empowers educators to create, manage, and deliver 
            exceptional online courses with interactive content, assessments, and analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = "/api/login"}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => {
                document.getElementById('features-section')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              className="px-8 py-3 text-lg border-slate-300 hover:bg-slate-50"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Everything You Need for Online Learning
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From course creation to student engagement, our platform provides all the tools 
              educators need to deliver exceptional learning experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow border-slate-200 cursor-pointer" 
                  onClick={() => window.location.href = "/api/login"}>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-slate-800">Course Authoring</CardTitle>
                <CardDescription>
                  Create rich, interactive courses with multimedia content, quizzes, and structured learning paths.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-slate-200 cursor-pointer"
                  onClick={() => window.location.href = "/api/login"}>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-slate-800">Student Management</CardTitle>
                <CardDescription>
                  Track student progress, manage enrollments, and provide personalized feedback at scale.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-slate-200 cursor-pointer"
                  onClick={() => window.location.href = "/api/login"}>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-slate-800">Analytics & Insights</CardTitle>
                <CardDescription>
                  Gain deep insights into student performance and course effectiveness with detailed analytics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-slate-200 cursor-pointer"
                  onClick={() => window.location.href = "/api/login"}>
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-slate-800">Discussion Forums</CardTitle>
                <CardDescription>
                  Foster community learning with integrated discussion forums and real-time collaboration.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-slate-200 cursor-pointer"
                  onClick={() => window.location.href = "/api/login"}>
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-slate-800">Assignments & Grading</CardTitle>
                <CardDescription>
                  Create and manage assignments with automated grading and detailed rubrics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-slate-200 cursor-pointer"
                  onClick={() => window.location.href = "/api/login"}>
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-slate-800">Certificates</CardTitle>
                <CardDescription>
                  Generate and issue certificates automatically upon course completion.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of educators who are already creating amazing learning experiences 
            with Frost Learning Platform.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
          >
            Start Teaching Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-slate-800">Frost Learning</span>
            </div>
            <p className="text-slate-500">
              © 2024 Frost Learning Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Rocket, 
  Wand2, 
  Users, 
  Settings, 
  HelpCircle,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Brain,
  PlayCircle,
  FileText,
  MessageSquare,
  Star
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
  badge?: string;
}

const docSections: DocSection[] = [
  {
    id: 'get-started',
    title: 'Get Started',
    description: 'Quick setup guide to begin your journey with Sparks',
    icon: Rocket,
    badge: 'Essential',
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Welcome to Sparks! 🚀</h3>
          <p className="text-muted-foreground leading-relaxed">
            Sparks is your AI-powered prompt engineering platform designed to enhance creativity, 
            streamline workflows, and unlock the full potential of AI collaboration.
          </p>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Quick Start Steps:</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <p className="font-medium">Explore the Dashboard</p>
                <p className="text-sm text-muted-foreground">Get familiar with the main interface and available tools</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <p className="font-medium">Try the Playground</p>
                <p className="text-sm text-muted-foreground">Experiment with AI tools like Enhance, Analyze, and Clean</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <p className="font-medium">Build Your Library</p>
                <p className="text-sm text-muted-foreground">Save and organize your best prompts for future use</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <p className="font-medium">Join the Community</p>
                <p className="text-sm text-muted-foreground">Connect with other AI enthusiasts and share insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'what-is-sparks',
    title: 'What is Sparks?',
    description: 'Learn about our mission, vision, and core principles',
    icon: Sparkles,
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">About Sparks ✨</h3>
          <p className="text-muted-foreground leading-relaxed">
            Sparks is a comprehensive AI prompt engineering platform that bridges the gap between 
            human creativity and artificial intelligence capabilities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Intelligence</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Harness AI to amplify human creativity and problem-solving capabilities.
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Efficiency</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Streamline workflows with intelligent automation and optimization.
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Precision</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Achieve exact results with carefully crafted prompts and tools.
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Community</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Learn, share, and grow with fellow AI enthusiasts.
            </p>
          </Card>
        </div>
      </div>
    )
  },
  {
    id: 'playground-guide',
    title: 'Playground Guide',
    description: 'Master the AI tools and features available in the playground',
    icon: PlayCircle,
    badge: 'Popular',
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Playground Tools 🛠️</h3>
          <p className="text-muted-foreground leading-relaxed">
            The Playground is your creative workspace where you can experiment with various AI tools 
            to enhance, analyze, and optimize your prompts.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Wand2 className="h-5 w-5 text-purple-500" />
              <h4 className="font-medium">Enhance Tool</h4>
              <Badge variant="secondary">AI-Powered</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Automatically improve your prompts with AI suggestions for better clarity, structure, and effectiveness.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Grammar and style improvements</li>
              <li>• Structure optimization</li>
              <li>• Clarity enhancements</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium">Analyze Tool</h4>
              <Badge variant="secondary">Insights</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Get detailed performance insights and data-driven recommendations for your prompts.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Performance metrics</li>
              <li>• Improvement suggestions</li>
              <li>• Effectiveness scoring</li>
            </ul>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-5 w-5 text-green-500" />
              <h4 className="font-medium">Clean Tool</h4>
              <Badge variant="secondary">Optimization</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Remove unnecessary elements and optimize your prompts for better performance.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Remove redundancy</li>
              <li>• Simplify structure</li>
              <li>• Optimize length</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'features-overview',
    title: 'Features Overview',
    description: 'Comprehensive guide to all Sparks features and capabilities',
    icon: Star,
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Platform Features 🌟</h3>
          <p className="text-muted-foreground leading-relaxed">
            Discover all the powerful features that make Sparks your ultimate AI companion.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Core Features</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">AI-Powered Enhancement</p>
                  <p className="text-xs text-muted-foreground">Intelligent prompt optimization</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Performance Analytics</p>
                  <p className="text-xs text-muted-foreground">Data-driven insights and metrics</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Personal Library</p>
                  <p className="text-xs text-muted-foreground">Save and organize your prompts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Community Hub</p>
                  <p className="text-xs text-muted-foreground">Connect with other users</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Advanced Features</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">YouTube Integration</p>
                  <p className="text-xs text-muted-foreground">Generate prompts from video content</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Auto-save Engine</p>
                  <p className="text-xs text-muted-foreground">Never lose your work</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Version Control</p>
                  <p className="text-xs text-muted-foreground">Track prompt evolution</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Sync Across Devices</p>
                  <p className="text-xs text-muted-foreground">Access anywhere, anytime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'faq',
    title: 'FAQ',
    description: 'Frequently asked questions and helpful answers',
    icon: HelpCircle,
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Frequently Asked Questions ❓</h3>
          <p className="text-muted-foreground leading-relaxed">
            Find answers to common questions about using Sparks effectively.
          </p>
        </div>
        
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">How do I get started with Sparks?</h4>
            <p className="text-sm text-muted-foreground">
              Simply explore the dashboard, try the playground tools, and start building your prompt library. 
              The platform is designed to be intuitive and user-friendly.
            </p>
          </Card>
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">What makes Sparks different from other AI tools?</h4>
            <p className="text-sm text-muted-foreground">
              Sparks focuses specifically on prompt engineering with advanced AI enhancement, 
              comprehensive analytics, and a collaborative community approach.
            </p>
          </Card>
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Can I save and organize my prompts?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! The Library feature allows you to save, categorize, and manage all your prompts 
              with version control and sync capabilities.
            </p>
          </Card>
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Is there a community aspect to Sparks?</h4>
            <p className="text-sm text-muted-foreground">
              Absolutely! Join our vibrant community to share prompts, learn from others, 
              and collaborate on AI projects.
            </p>
          </Card>
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">How does the AI enhancement work?</h4>
            <p className="text-sm text-muted-foreground">
              Our AI analyzes your prompts for clarity, structure, and effectiveness, 
              then provides intelligent suggestions for improvement.
            </p>
          </Card>
        </div>
      </div>
    )
  }
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('get-started');
  
  const currentSection = docSections.find(section => section.id === activeSection);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Documentation</h1>
            </div>
            <Badge variant="outline" className="hidden sm:flex">
              Everything you need to know
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {docSections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        activeSection === section.id 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      )}
                    >
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{section.title}</span>
                          {section.badge && (
                            <Badge 
                              variant={activeSection === section.id ? "secondary" : "outline"} 
                              className="text-xs px-1.5 py-0.5"
                            >
                              {section.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs opacity-80 truncate">{section.description}</p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="min-h-[600px]">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  {currentSection && (
                    <>
                      <currentSection.icon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-xl">{currentSection.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentSection.description}
                        </p>
                      </div>
                      {currentSection.badge && (
                        <Badge variant="outline" className="ml-auto">
                          {currentSection.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {currentSection?.content}
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Try the Playground</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Start experimenting with AI tools right away.
                </p>
                <Button size="sm" className="w-full group">
                  Go to Playground
                  <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Join Community</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with other AI enthusiasts and experts.
                </p>
                <Button variant="outline" size="sm" className="w-full group">
                  Join Community
                  <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
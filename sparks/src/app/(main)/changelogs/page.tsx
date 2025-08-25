'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitCommit,
  Calendar,
  User,
  Search,
  Filter,
  Download,
  ExternalLink,
  Rocket,
  Bot,
  Palette,
  Shield,
  Database,
  Zap,
  Users,
  Settings,
  Globe,
  Bug,
  Wrench,
  Plus,
  Minus,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const fullChangelog = [
  {
    version: '1.3.0',
    date: '2025-01-21',
    title: 'Browser Extension & Enhanced Integration',
    commit: '826bb1ce',
    author: 'Hmanxyz',
    timeAgo: '6 hours ago',
    type: 'major',
    changes: {
      added: [
        'Complete browser extension implementation with Plasmo framework',
        'Web content capture capabilities for seamless prompt creation',
        'Tabbed navigation interface in extension popup',
        'Background service worker for persistent functionality',
        'Context menu integration for quick access',
        'Extension settings and preferences management'
      ],
      improved: [
        'Enhanced popup interface with better user experience',
        'Streamlined integration between extension and main app',
        'Optimized content script performance',
        'Better error handling and user feedback'
      ],
      fixed: [
        'Extension manifest configuration issues',
        'Content script injection timing problems',
        'Popup window sizing and responsiveness'
      ]
    }
  },
  {
    version: '1.2.0',
    date: '2025-01-19',
    title: 'Complete Sparks AI Platform Launch',
    commit: 'd1eb6cff',
    author: 'Hmanxyz',
    timeAgo: '2 days ago',
    type: 'major',
    changes: {
      added: [
        'Complete Sparks AI project foundation with 155+ features',
        'Interactive AI-powered playground with real-time processing',
        'Comprehensive AI tools dock system with 12+ tools',
        'Advanced prompt management and versioning system',
        'Community platform with prompt sharing and collaboration',
        'Robust authentication system with role-based access control',
        'Multi-backend database support (Firebase/Supabase)',
        'Comprehensive backup system with automatic and manual options',
        'Advanced settings system with theme customization',
        'Analytics and monitoring dashboard',
        'Mobile-responsive design with touch optimization',
        'Search engine with full-text and vector indexing',
        'Auto-save engine with intelligent draft management',
        'Sync system for cross-device data synchronization',
        'Admin panel with system management tools'
      ],
      improved: [
        'Modern UI/UX with consistent design system',
        'Performance optimizations for large datasets',
        'Enhanced security with proper authentication flows',
        'Better error handling and user feedback',
        'Optimized build process and deployment pipeline'
      ],
      technical: [
        'Next.js 14 with App Router architecture',
        'TypeScript for type safety and better DX',
        'Tailwind CSS with custom design system',
        'Shadcn/ui components for consistent UI',
        'Firebase integration for real-time features',
        'Supabase integration for production scalability',
        'Comprehensive testing setup',
        'Docker containerization support',
        'CI/CD pipeline with automated deployments'
      ]
    }
  },
  {
    version: '1.1.0',
    date: '2025-01-17',
    title: 'Foundation & Core Systems',
    commit: 'foundation',
    author: 'Development Team',
    timeAgo: '4 days ago',
    type: 'minor',
    changes: {
      added: [
        'Project initialization and core architecture setup',
        'Basic authentication system implementation',
        'Initial UI component library',
        'Database schema design and implementation',
        'Basic routing and navigation structure'
      ],
      technical: [
        'Project scaffolding with Next.js',
        'TypeScript configuration and setup',
        'Tailwind CSS integration',
        'ESLint and Prettier configuration',
        'Git repository initialization'
      ]
    }
  },
  {
    version: '1.0.0',
    date: '2025-01-15',
    title: 'Initial Concept & Planning',
    commit: 'initial',
    author: 'Product Team',
    timeAgo: '6 days ago',
    type: 'major',
    changes: {
      added: [
        'Project concept and vision definition',
        'Technical requirements specification',
        'UI/UX design mockups and wireframes',
        'Architecture planning and technology selection',
        'Development roadmap and milestone planning'
      ],
      technical: [
        'Technology stack evaluation and selection',
        'Development environment setup guidelines',
        'Code standards and best practices definition',
        'Security requirements and compliance planning'
      ]
    }
  }
];

const getVersionTypeColor = (type: string) => {
  switch (type) {
    case 'major':
      return 'bg-red-500/10 text-red-700 border-red-200';
    case 'minor':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'patch':
      return 'bg-green-500/10 text-green-700 border-green-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'added':
      return Plus;
    case 'improved':
      return Wrench;
    case 'fixed':
      return Bug;
    case 'removed':
      return Minus;
    case 'technical':
      return Settings;
    default:
      return AlertTriangle;
  }
};

const getChangeColor = (type: string) => {
  switch (type) {
    case 'added':
      return 'text-green-600';
    case 'improved':
      return 'text-blue-600';
    case 'fixed':
      return 'text-red-600';
    case 'removed':
      return 'text-orange-600';
    case 'technical':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
};

export default function ChangelogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const filteredChangelog = fullChangelog.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.version.includes(searchQuery) ||
    Object.values(entry.changes).flat().some(change => 
      change.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const totalChanges = fullChangelog.reduce((acc, entry) => {
    return acc + Object.values(entry.changes).flat().length;
  }, 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-bold text-4xl tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Complete Changelog
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Comprehensive version history and detailed record of all changes since app creation.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{fullChangelog.length}</p>
                <p className="text-sm text-muted-foreground">Total Versions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalChanges}</p>
                <p className="text-sm text-muted-foreground">Total Changes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-muted-foreground">Days Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Contributors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search versions, features, or changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Changelog
        </Button>
      </div>

      {/* Changelog Timeline */}
      <div className="space-y-8">
        {filteredChangelog.map((entry, index) => (
          <Card key={entry.version} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                      v{entry.version}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`${getVersionTypeColor(entry.type)} capitalize`}
                    >
                      {entry.type} Release
                    </Badge>
                    {index === 0 && (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Latest
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl mb-2">{entry.title}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {entry.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {entry.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitCommit className="h-4 w-4" />
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {entry.commit}
                        </code>
                      </div>
                      <span className="text-muted-foreground">{entry.timeAgo}</span>
                    </div>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="added" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  {Object.entries(entry.changes).map(([type, changes]) => {
                    const IconComponent = getChangeIcon(type);
                    return (
                      <TabsTrigger key={type} value={type} className="flex items-center gap-1">
                        <IconComponent className={`h-3 w-3 ${getChangeColor(type)}`} />
                        <span className="capitalize">{type}</span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {changes.length}
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {Object.entries(entry.changes).map(([type, changes]) => {
                  const IconComponent = getChangeIcon(type);
                  return (
                    <TabsContent key={type} value={type} className="mt-4">
                      <div className="space-y-3">
                        {changes.map((change: string, changeIndex: number) => (
                          <div key={changeIndex} className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center`}>
                              <IconComponent className={`h-3 w-3 ${getChangeColor(type)}`} />
                            </div>
                            <p className="text-sm text-foreground flex-1">
                              {change}
                            </p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
          <p className="text-muted-foreground mb-4">
            Want to be notified about new releases and updates?
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/whats-new">
                Latest Updates
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/supportcenter">
                Get Support
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
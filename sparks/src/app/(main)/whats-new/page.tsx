'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Rocket, 
  Bot, 
  Palette, 
  Shield,
  Database,
  Zap,
  Users,
  Settings,
  Globe,
  GitCommit,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const updates = [
  {
    version: '1.3.0',
    date: '2025-01-21',
    title: 'Browser Extension & Enhanced Integration',
    commit: '826bb1ce',
    author: 'Hmanxyz',
    timeAgo: '6 hours ago',
    changes: [
      {
        category: 'New Feature',
        description: 'Complete browser extension implementation with web content capture capabilities',
        icon: Globe,
        type: 'feature'
      },
      {
        category: 'Enhancement',
        description: 'Enhanced popup interface with tabbed navigation for better user experience',
        icon: Palette,
        type: 'improvement'
      },
      {
        category: 'Integration',
        description: 'Seamless integration between browser extension and main application',
        icon: Zap,
        type: 'feature'
      }
    ],
  },
  {
    version: '1.2.0',
    date: '2025-01-19',
    title: 'Complete Sparks AI Platform Launch',
    commit: 'd1eb6cff',
    author: 'Hmanxyz',
    timeAgo: '2 days ago',
    changes: [
      {
        category: 'Major Release',
        description: 'Complete Sparks AI project with community enhancements and advanced features',
        icon: Rocket,
        type: 'feature'
      },
      {
        category: 'Community Features',
        description: 'Enhanced community platform with prompt sharing and collaboration tools',
        icon: Users,
        type: 'feature'
      },
      {
        category: 'Backup System',
        description: 'Comprehensive backup system for development workflows and IDE integration',
        icon: Database,
        type: 'feature'
      },
      {
        category: 'AI Tools Dock',
        description: 'Advanced AI tools dock system with customizable interface and settings',
        icon: Bot,
        type: 'feature'
      },
      {
        category: 'Authentication',
        description: 'Robust authentication system with role-based access control',
        icon: Shield,
        type: 'feature'
      },
      {
        category: 'Settings & Customization',
        description: 'Comprehensive settings system with theme customization and tool management',
        icon: Settings,
        type: 'feature'
      }
    ],
  }
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'feature':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'improvement':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'fix':
      return 'bg-red-500/10 text-red-700 border-red-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

export default function WhatsNewPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-bold text-4xl tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          What's New
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Stay up to date with the latest features, improvements, and changes to Sparks AI.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Recent Commits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">New Features</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Improvements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Updates Timeline */}
      <div className="space-y-8">
        {updates.map((update, index) => (
          <Card key={update.version} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      v{update.version}
                    </Badge>
                    {update.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {update.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {update.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitCommit className="h-4 w-4" />
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {update.commit}
                        </code>
                      </div>
                      <span className="text-muted-foreground">{update.timeAgo}</span>
                    </div>
                  </CardDescription>
                </div>
                {index === 0 && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    Latest
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {update.changes.map((change, changeIndex) => {
                  const IconComponent = change.icon;
                  return (
                    <div key={changeIndex} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getTypeColor(change.type)}`}
                          >
                            {change.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground">
                          {change.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="mt-12 text-center">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Want to see more?</h3>
          <p className="text-muted-foreground mb-4">
            Check out our comprehensive changelog for the complete version history.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/changelogs">
                View Full Changelog
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/supportcenter">
                Support Center
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { 
  Wand2, 
  Sparkles, 
  ClipboardCheck, 
  BarChart2, 
  Lightbulb, 
  Play,
  Zap,
  ArrowRight,
  Plus,
  Folder,
  Settings
} from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface PlaygroundTool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  usage: number;
}

const playgroundTools: PlaygroundTool[] = [
  {
    id: 'enhance',
    name: 'Enhance',
    description: 'AI-powered prompt optimization',
    icon: Wand2,
    color: 'from-purple-500 to-pink-500',
    usage: 85
  },
  {
    id: 'clean',
    name: 'Clean',
    description: 'Remove unnecessary elements',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    usage: 72
  },
  {
    id: 'organize',
    name: 'Organize',
    description: 'Auto-categorize and tag',
    icon: ClipboardCheck,
    color: 'from-green-500 to-emerald-500',
    usage: 68
  },
  {
    id: 'analyze',
    name: 'Analyze',
    description: 'Get detailed insights',
    icon: BarChart2,
    color: 'from-orange-500 to-red-500',
    usage: 91
  },
  {
    id: 'library',
    name: 'Library',
    description: 'Browse saved prompts',
    icon: Folder,
    color: 'from-indigo-500 to-purple-500',
    usage: 0
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Configure AI tools',
    icon: Settings,
    color: 'from-gray-500 to-slate-500',
    usage: 0
  }
];

interface PlaygroundPreviewProps {
  className?: string;
}

export default function PlaygroundPreview({ className }: PlaygroundPreviewProps) {
  const router = useRouter();
  const { trackComponentView, trackComponentClick, trackNavigation } = useAnalytics();
  const [activeToolIndex, setActiveToolIndex] = useState(0);

  // Auto-rotate featured tool
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveToolIndex((prev) => (prev + 1) % playgroundTools.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Track component view
  useEffect(() => {
    trackComponentView('playground-preview', {
      toolCount: playgroundTools.length,
      activeTool: playgroundTools[activeToolIndex].id
    });
  }, [activeToolIndex, trackComponentView]);

  const handlePlaygroundClick = () => {
    trackComponentClick('playground-preview', 'open-playground');
    trackNavigation('playground-preview', '/playground');
    router.push('/playground');
  };

  const handleToolClick = (toolId: string) => {
    trackComponentClick('playground-preview', 'tool-click', { toolId });
    trackNavigation('playground-preview', '/playground', { tool: toolId });
    router.push(`/playground?tool=${toolId}`);
  };

  const activeTool = playgroundTools[activeToolIndex];
  const IconComponent = activeTool.icon;

  return (
    <div className={`relative ${className || ''}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Play className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                AI Dock
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your creative toolkit
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePlaygroundClick}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800"
          >
            <Zap className="mr-2 h-4 w-4" />
            Open Playground
          </Button>
        </div>
      </div>

      {/* Dock Container */}
      <div className="relative">
        {/* Dock Background */}
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl" />
        
        {/* Dock Content */}
        <div className="relative p-6">
          {/* Tool Icons Dock */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {playgroundTools.map((tool, index) => {
              const ToolIcon = tool.icon;
              const isActive = index === activeToolIndex;
              
              return (
                <div
                  key={tool.id}
                  className="group relative"
                  onClick={() => handleToolClick(tool.id)}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10">
                    <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap">
                      {tool.name}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
                    </div>
                  </div>
                  
                  {/* Icon */}
                  <div className={cn(
                    "w-16 h-16 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center shadow-lg",
                    "bg-gradient-to-br", tool.color,
                    "hover:scale-110 hover:shadow-2xl hover:-translate-y-2",
                    "active:scale-95",
                    isActive && "scale-110 -translate-y-2 shadow-2xl"
                  )}>
                    <ToolIcon className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Usage Indicator */}
                  {tool.usage > 0 && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{tool.usage}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Tool Info */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full border border-purple-200/50 dark:border-purple-700/50">
          <IconComponent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Featured: {activeTool.name}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {activeTool.description}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mt-6 justify-center">
        <Button 
          onClick={handlePlaygroundClick}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Play className="mr-2 h-4 w-4" />
          Start Creating
        </Button>
        <Button 
          variant="outline"
          onClick={() => router.push('/library')}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800"
        >
          <Folder className="mr-2 h-4 w-4" />
          Library
        </Button>
      </div>
    </div>
  );
}
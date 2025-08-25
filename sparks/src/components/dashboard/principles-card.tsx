'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Rocket, 
  Brain, 
  Zap, 
  Target, 
  Sparkles, 
  Users,
  ArrowRight
} from 'lucide-react';
import { Progress } from '../ui/progress';
import { useState, useEffect } from 'react';
import { PrinciplesCardProps, PrincipleItem } from './types';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

const newPrinciples: PrincipleItem[] = [
  {
    id: 'innovate',
    title: 'Innovate',
    description: 'Push the boundaries of AI creativity with cutting-edge prompt engineering techniques.',
    icon: Rocket,
    progress: 95
  },
  {
    id: 'intelligence',
    title: 'Intelligence',
    description: 'Harness the power of AI to amplify human creativity and problem-solving capabilities.',
    icon: Brain,
    progress: 88
  },
  {
    id: 'efficiency',
    title: 'Efficiency',
    description: 'Streamline your workflow with intelligent automation and smart prompt optimization.',
    icon: Zap,
    progress: 92
  },
  {
    id: 'precision',
    title: 'Precision',
    description: 'Achieve exact results with carefully crafted prompts and advanced AI tools.',
    icon: Target,
    progress: 87
  },
  {
    id: 'creativity',
    title: 'Creativity',
    description: 'Unlock unlimited creative potential through AI-human collaboration.',
    icon: Sparkles,
    progress: 94
  },
  {
    id: 'community',
    title: 'Community',
    description: 'Learn, share, and grow together in our vibrant community of AI enthusiasts.',
    icon: Users,
    progress: 89
  }
];

export default function PrinciplesCard({
  className,
  principles = newPrinciples,
  autoRotate = true,
  rotationInterval = 4000,
  showIndicators = true
}: PrinciplesCardProps = {}) {
  const router = useRouter();
  const [currentPrinciple, setCurrentPrinciple] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!autoRotate || isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentPrinciple((prev) => (prev + 1) % principles.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotationInterval, principles.length, isHovered]);

  const principle = principles[currentPrinciple];
  const IconComponent = principle.icon;

  if (!principle) {
    return (
      <Card className={cn("bg-card/50", className)}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No principles available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn("bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Our Principles
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {currentPrinciple + 1} of {principles.length}
          </div>
        </div>
        <Progress value={principle.progress} className="h-2 bg-primary/10" />
      </CardHeader>
      <CardContent className="text-center pb-6">
        <div className="w-fit mx-auto bg-gradient-to-br from-primary/10 to-primary/20 p-4 rounded-full mb-4 shadow-lg">
          <div className="w-fit bg-gradient-to-br from-primary/20 to-primary/30 p-3 rounded-full">
            <IconComponent className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{principle.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {principle.description}
        </p>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Progress:</span>
          <span className="text-sm font-semibold text-primary">{principle.progress}%</span>
        </div>

        {showIndicators && principles.length > 1 && (
          <div className="flex justify-center gap-2 mb-4">
            {principles.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentPrinciple 
                    ? 'bg-primary w-6' 
                    : 'bg-muted hover:bg-primary/50'
                )}
                onClick={() => setCurrentPrinciple(index)}
                aria-label={`Go to principle ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Action button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full group"
          onClick={() => router.push('/community')}
        >
          Explore Community
          <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}

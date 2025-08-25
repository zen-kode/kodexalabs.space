'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { X, Settings } from 'lucide-react';
import {
  EnhancedToolsDockProps,
  ToolButtonProps,
  ICON_PACKS,
  ToolColor
} from './ai-dock-types';
import { useAIDockSettings, colorToString } from '@/hooks/use-ai-dock-settings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

// Enhanced theme configuration - modular and customizable
const ENHANCED_THEME = {
  // Colors
  colors: {
    background: 'transparent', // Clean transparent background for easy integration
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    tooltip: {
      background: 'rgba(8, 12, 20, 0.98)',
      text: '#f1f5f9',
      border: 'rgba(255, 255, 255, 0.12)',
    },
  },
  // Sizes
  dock: {
    borderRadius: '16px',
    padding: 12,
    iconSize: 48,
    spacing: 8,
  },
  // Animation
  animation: {
    duration: '0.35s',
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    magnification: 1.6,
    effectWidth: 200,
  },
  // Effects
  effects: {
    blur: 'blur(24px)',
    particles: {
      count: 12,
      colors: ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#f87171'],
    },
  },
  // DockTheme properties
  magnificationEnabled: true,
  magnification: 1.6,
  effectWidth: 200,
  animationDuration: '0.35s',
  animationEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  particlesEnabled: true,
  particleCount: 12,
};

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

// Enhanced tool button component with magnification
function ToolButton({ 
  tool, 
  icon: Icon, 
  isLoading, 
  isDisabled, 
  onClick, 
  onToggle, 
  showToggle = false,
  className,
  scale = 1,
  position = { x: 0, y: 0 },
  isHovered = false,
  isClicked = false,
  onHover,
  particles = []
}: ToolButtonProps & {
  scale?: number;
  position?: { x: number; y: number };
  isHovered?: boolean;
  isClicked?: boolean;
  onHover?: () => void;
  particles?: Particle[];
}) {
  const [showDisableButton, setShowDisableButton] = useState(false);
  
  const colorStyle = {
    '--tool-color': colorToString(tool.color),
    '--tool-color-hover': colorToString({
      r: Math.min(255, tool.color.r + 20),
      g: Math.min(255, tool.color.g + 20),
      b: Math.min(255, tool.color.b + 20)
    }),
    '--tool-color-disabled': colorToString({
      r: Math.floor(tool.color.r * 0.5),
      g: Math.floor(tool.color.g * 0.5),
      b: Math.floor(tool.color.b * 0.5)
    })
  } as React.CSSProperties;

  const scaledSize = ENHANCED_THEME.dock.iconSize * scale;
  const iconSize = Math.max(20, scaledSize * 0.45);

  return (
    <div 
      className="absolute group"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${scaledSize}px`,
        height: `${scaledSize}px`,
        transformOrigin: 'center',
        zIndex: Math.round(scale * 30),
      }}
      onMouseEnter={() => {
        showToggle && setShowDisableButton(true);
        onHover?.();
      }}
      onMouseLeave={() => setShowDisableButton(false)}
    >
      <Button
        variant="secondary"
        className={cn(
          "flex flex-col h-full w-full p-0 gap-1 items-center justify-center text-center rounded-lg transition-all duration-200",
          "bg-secondary/70 hover:bg-secondary border-2 border-transparent",
          isLoading && "animate-pulse",
          !tool.enabled && "opacity-50 grayscale",
          tool.enabled && "hover:border-[var(--tool-color)] hover:shadow-lg hover:shadow-[var(--tool-color)]/20",
          isHovered && "border-[var(--tool-color)] shadow-lg shadow-[var(--tool-color)]/20",
          className
        )}
        style={{
          ...colorStyle,
          borderRadius: `${scaledSize * 0.25}px`,
          boxShadow: `
            0 ${scale > 1.3 ? 8 : 3}px ${scale > 1.3 ? 25 : 12}px rgba(0,0,0,${0.2 + (scale - 1) * 0.2}),
            0 0 0 1px rgba(255,255,255,${0.06 + (scale - 1) * 0.1}),
            ${isHovered ? `0 0 25px var(--tool-color)40` : '0 0 0 transparent'},
            inset 0 1px 0 rgba(255,255,255,${0.1 + (scale - 1) * 0.05})
          `,
          transform: `translateZ(0) ${scale > 1.4 ? 'translateY(-3px)' : ''}`,
          animation: isClicked ? 'spin 0.7s ease-in-out' : isLoading ? 'pulse 2s ease-in-out infinite' : 'none',
          transitionDuration: ENHANCED_THEME.animation.duration,
          transitionTimingFunction: ENHANCED_THEME.animation.easing
        }}
        onClick={onClick}
        disabled={isDisabled || !tool.enabled}
      >
        <Icon 
          size={iconSize}
          className={cn(
            "transition-colors duration-200",
            tool.enabled ? "text-[var(--tool-color)]" : "text-[var(--tool-color-disabled)]"
          )} 
        />
        {scale > 1.2 && (
          <span className="text-xs font-medium" style={{ fontSize: `${Math.min(12, scaledSize * 0.2)}px` }}>
            {tool.description}
          </span>
        )}
        
        {!tool.enabled && (
          <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs px-1 py-0">
            OFF
          </Badge>
        )}
      </Button>
      
      {showToggle && showDisableButton && (
        <Button
          size="sm"
          variant="destructive"
          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Main enhanced tools dock component with magnification
export default function EnhancedToolsDock({ 
  isLoading, 
  onRunTool, 
  settings: externalSettings,
  onSettingsChange,
  className 
}: EnhancedToolsDockProps) {
  const {
    settings: internalSettings,
    toggleTool,
    updateSettings
  } = useAIDockSettings();
  
  // Use external settings if provided, otherwise use internal settings
  const settings = externalSettings || internalSettings;
  const handleSettingsChange = onSettingsChange || updateSettings;
  
  // Use theme from settings or fallback to default
  const theme = settings.theme || ENHANCED_THEME;
  
  const iconPack = ICON_PACKS[settings.iconPack];
  const enabledTools = Object.values(settings.tools).filter(tool => tool.enabled);
  const disabledCount = Object.values(settings.tools).length - enabledTools.length;

  // Enhanced state for magnification
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [mouseY, setMouseY] = useState<number | null>(null);
  const [currentScales, setCurrentScales] = useState<number[]>([]);
  const [currentPositions, setCurrentPositions] = useState<{ x: number; y: number }[]>([]);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [clickedTool, setClickedTool] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const dockRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const particleAnimationRef = useRef<number | undefined>(undefined);
  const lastMouseMoveTime = useRef<number>(0);

  const { dock, animation, effects } = ENHANCED_THEME;

  const tools = [
    { id: 'enhance', icon: iconPack.icons.enhance },
    { id: 'clean', icon: iconPack.icons.clean },
    { id: 'organize', icon: iconPack.icons.organize },
    { id: 'analyze', icon: iconPack.icons.analyze },
    { id: 'suggest', icon: iconPack.icons.suggest },
    { id: 'tts', icon: iconPack.icons.tts }
  ];

  // Enhanced 2D magnification algorithm for grid layout
  const calculateTargetMagnification = useCallback((mousePos: { x: number; y: number } | null) => {
    if (mousePos === null || !(theme.magnificationEnabled ?? true)) {
      return tools.map(() => 1);
    }

    const cols = 3;
    const rows = Math.ceil(tools.length / cols);
    
    return tools.map((_, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const iconCenterX = col * (dock.iconSize + dock.spacing) + (dock.iconSize / 2);
      const iconCenterY = row * (dock.iconSize + dock.spacing) + (dock.iconSize / 2);
      
      const distance = Math.sqrt(
        Math.pow(mousePos.x - iconCenterX, 2) + 
        Math.pow(mousePos.y - iconCenterY, 2)
      );
      
      const maxDistance = (theme.effectWidth ?? ENHANCED_THEME.animation.effectWidth) / 2;
      
      if (distance > maxDistance) {
        return 1;
      }
      
      const normalizedDistance = distance / maxDistance;
      const scaleFactor = Math.cos(normalizedDistance * Math.PI / 2);
      
      return 1 + (scaleFactor * ((theme.magnification ?? ENHANCED_THEME.animation.magnification) - 1));
    });
  }, [tools, dock.iconSize, dock.spacing, theme, animation.effectWidth, animation.magnification]);

  // Calculate grid positions with dynamic spacing
  const calculatePositions = useCallback((scales: number[]) => {
    const cols = 3;
    const positions: { x: number; y: number }[] = [];
    
    for (let i = 0; i < tools.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const scale = scales[i];
      
      const baseX = col * (dock.iconSize + dock.spacing);
      const baseY = row * (dock.iconSize + dock.spacing);
      
      // Add slight offset based on scale for more natural feel
      const offsetX = (scale - 1) * dock.iconSize * 0.1;
      const offsetY = (scale - 1) * dock.iconSize * 0.1;
      
      positions.push({
        x: baseX + offsetX,
        y: baseY + offsetY
      });
    }
    
    return positions;
  }, [tools, dock.iconSize, dock.spacing]);

  // Enhanced particle system
  const createParticles = useCallback((x: number, y: number, toolColor: ToolColor) => {
    if (!(theme.particlesEnabled ?? true)) return;
    
    const newParticles: Particle[] = [];
    const particleCount = theme.particleCount ?? ENHANCED_THEME.effects.particles.count;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const velocity = 3 + Math.random() * 4;
      const color = Math.random() > 0.6 ? colorToString(toolColor) : 
                  effects.particles.colors[Math.floor(Math.random() * effects.particles.colors.length)];
      
      newParticles.push({
        id: `particle-${Date.now()}-${i}`,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color,
        life: 80,
        maxLife: 80,
        size: 2 + Math.random() * 3,
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  }, [theme.particlesEnabled ?? true, theme.particleCount ?? 12, ENHANCED_THEME.effects.particles]);

  const updateParticles = useCallback(() => {
    setParticles(prev => {
      const updated = prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.97,
        vy: particle.vy * 0.97 + 0.15,
        life: particle.life - 1,
        size: particle.size * 0.99,
      })).filter(particle => particle.life > 0);
      
      if (updated.length > 0) {
        particleAnimationRef.current = requestAnimationFrame(updateParticles);
      }
      
      return updated;
    });
  }, []);

  // Initialize positions
  useEffect(() => {
    const initialScales = tools.map(() => 1);
    const initialPositions = calculatePositions(initialScales);
    setCurrentScales(initialScales);
    setCurrentPositions(initialPositions);
  }, [tools, calculatePositions]);

  // Enhanced animation loop
  const animateToTarget = useCallback(() => {
    const mousePos = mouseX !== null && mouseY !== null ? { x: mouseX, y: mouseY } : null;
    const targetScales = calculateTargetMagnification(mousePos);
    const targetPositions = calculatePositions(targetScales);
    const lerpFactor = mousePos !== null ? 0.25 : 0.15;

    setCurrentScales(prevScales => {
      return prevScales.map((currentScale, index) => {
        const diff = targetScales[index] - currentScale;
        return currentScale + (diff * lerpFactor);
      });
    });

    setCurrentPositions(prevPositions => {
      return prevPositions.map((currentPos, index) => {
        const targetPos = targetPositions[index];
        return {
          x: currentPos.x + (targetPos.x - currentPos.x) * lerpFactor,
          y: currentPos.y + (targetPos.y - currentPos.y) * lerpFactor,
        };
      });
    });

    const needsUpdate = currentScales.some((scale, index) => 
      Math.abs(scale - targetScales[index]) > 0.001
    ) || mousePos !== null;
    
    if (needsUpdate && settings.animationsEnabled) {
      animationFrameRef.current = requestAnimationFrame(animateToTarget);
    }
  }, [mouseX, mouseY, calculateTargetMagnification, calculatePositions, currentScales, settings.animationsEnabled]);

  // Start/stop animation loop
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animateToTarget);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animateToTarget]);

  // Enhanced mouse movement handler
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = performance.now();
    
    if (now - lastMouseMoveTime.current < 10) {
      return;
    }
    
    lastMouseMoveTime.current = now;
    
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left - dock.padding);
      setMouseY(e.clientY - rect.top - dock.padding);
    }
  }, [dock.padding]);

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
    setMouseY(null);
    setHoveredTool(null);
  }, []);

  const handleToolClick = (toolId: string, index: number) => {
    if (settings.tools[toolId]?.enabled) {
      // Trigger click animation
      setClickedTool(toolId);
      
      // Create particles at tool position
      if (dockRef.current && currentPositions[index]) {
        const pos = currentPositions[index];
        const x = pos.x + dock.iconSize / 2;
        const y = pos.y + dock.iconSize / 2;
        const toolColor = settings.tools[toolId].color;
        
        createParticles(x, y, toolColor);
      }
      
      // Start particle animation
      if (particleAnimationRef.current) {
        cancelAnimationFrame(particleAnimationRef.current);
      }
      updateParticles();
      
      // Reset click animation
      setTimeout(() => setClickedTool(null), 700);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([30, 10, 30]);
      }
      
      onRunTool(toolId);
    }
  };

  const handleToggleTool = (toolId: string) => {
    if (externalSettings && onSettingsChange) {
      // External settings management - pass partial update
      onSettingsChange({
        tools: {
          ...settings.tools,
          [toolId]: {
            ...settings.tools[toolId],
            enabled: !settings.tools[toolId].enabled
          }
        },
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Internal settings management
      toggleTool(toolId);
    }
  };

  const handleToolHover = (toolId: string) => {
    setHoveredTool(toolId);
  };

  // Calculate content dimensions
  const cols = 3;
  const rows = Math.ceil(tools.length / cols);
  const contentWidth = cols * dock.iconSize + (cols - 1) * dock.spacing;
  const contentHeight = rows * dock.iconSize + (rows - 1) * dock.spacing;

  return (
    <Card className={cn('backdrop-blur-xl relative overflow-hidden', className)}>
      <CardContent 
        ref={dockRef}
        className="p-0"
        style={{
          width: `${contentWidth + dock.padding * 2}px`,
          height: `${contentHeight + dock.padding * 2 + 60}px`, // Extra space for header
          background: ENHANCED_THEME.colors.background,
          borderRadius: dock.borderRadius,
          border: `1px solid ${ENHANCED_THEME.colors.border}`,
          boxShadow: `
            0 12px 40px ${ENHANCED_THEME.colors.shadow},
            0 6px 20px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3)
          `,
          padding: `${dock.padding}px`,
          transition: `all ${animation.duration} ${animation.easing}`
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg) scale(1); }
            20% { transform: rotate(72deg) scale(1.15); }
            40% { transform: rotate(144deg) scale(1.15); }
            60% { transform: rotate(216deg) scale(1.15); }
            80% { transform: rotate(288deg) scale(1.15); }
            100% { transform: rotate(360deg) scale(1); }
          }
        `}</style>
        
        {/* Enhanced Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}px`,
              top: `${particle.y + 40}px`, // Offset for header
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderRadius: '50%',
              backgroundColor: particle.color,
              opacity: (particle.life / particle.maxLife) * 0.8,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 1000,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
        
        {/* Header with settings and status */}
        <div className="flex items-center justify-between mb-2 px-1" style={{ height: '40px' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              AI Tools
            </span>
            {disabledCount > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {disabledCount} disabled
              </Badge>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => window.open('/settings#ai-dock', '_blank')}>
                <Settings className="h-4 w-4 mr-2" />
                Open Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleSettingsChange({ 
                  compactMode: !settings.compactMode 
                })}
              >
                {settings.compactMode ? 'Expand View' : 'Compact View'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSettingsChange({ 
                  showLabels: !settings.showLabels 
                })}
              >
                {settings.showLabels ? 'Hide Labels' : 'Show Labels'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleSettingsChange({ 
                  animationsEnabled: !settings.animationsEnabled 
                })}
              >
                {settings.animationsEnabled ? 'Disable Animations' : 'Enable Animations'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Enhanced Tools with Magnification */}
        <div 
          className="relative"
          style={{
            width: `${contentWidth}px`,
            height: `${contentHeight}px`
          }}
        >
          {tools.map((tool, index) => {
            const toolConfig = settings.tools[tool.id];
            if (!toolConfig) return null;
            
            const scale = currentScales[index] || 1;
            const position = currentPositions[index] || { x: 0, y: 0 };
            const isHovered = hoveredTool === tool.id;
            const isClicked = clickedTool === tool.id;
            const isToolLoading = isLoading === tool.id;
            
            return (
              <ToolButton
                key={tool.id}
                tool={toolConfig}
                icon={tool.icon}
                isLoading={isToolLoading}
                isDisabled={!!isLoading}
                onClick={() => handleToolClick(tool.id, index)}
                onToggle={() => handleToggleTool(tool.id)}
                showToggle={true}
                scale={scale}
                position={position}
                isHovered={isHovered}
                isClicked={isClicked}
                onHover={() => handleToolHover(tool.id)}
                particles={particles}
                className={cn(
                  settings.compactMode && "p-2 gap-1",
                  !settings.showLabels && "pb-2",
                  settings.animationsEnabled && "transition-all duration-300 ease-in-out"
                )}
              />
            );
          })}
        </div>

        {/* Footer info */}
        {!settings.compactMode && (
          <div className="mt-2 px-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Pack: {iconPack.name}</span>
              <span>{enabledTools.length}/{tools.length} active</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ColorWheelProps {
  color: { r: number; g: number; b: number };
  onChange: (color: { r: number; g: number; b: number }) => void;
  size?: number;
  className?: string;
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  if (diff !== 0) {
    if (max === r) h = ((g - b) / diff) % 6;
    else if (max === g) h = (b - r) / diff + 2;
    else h = (r - g) / diff + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  
  return [h, s, v];
}

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

export function ColorWheel({ color, onChange, size = 200, className }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<'wheel' | 'brightness' | null>(null);
  
  const [h, s, v] = rgbToHsv(color.r, color.g, color.b);
  const center = size / 2;
  const wheelRadius = size * 0.42;
  const brightnessBarWidth = 24;
  const brightnessBarHeight = size * 0.75;
  
  // Enhanced drawing function with better quality
  const drawColorWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true }); // Changed from alpha: false to alpha: true
    if (!ctx) return;
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clear canvas with transparency instead of white background
    ctx.clearRect(0, 0, size, size);
    
    // Create high-quality color wheel using ImageData for pixel-perfect rendering
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= wheelRadius) {
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          const normalizedAngle = angle < 0 ? angle + 360 : angle;
          const saturation = Math.min(distance / wheelRadius, 1);
          
          const [r, g, b] = hsvToRgb(normalizedAngle, saturation, v);
          
          const index = (y * size + x) * 4;
          data[index] = r;     // Red
          data[index + 1] = g; // Green
          data[index + 2] = b; // Blue
          data[index + 3] = 255; // Alpha
        } else {
          // Fully transparent outside the wheel
          const index = (y * size + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0; // Transparent
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add subtle border to the wheel
    ctx.beginPath();
    ctx.arc(center, center, wheelRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw enhanced brightness bar with rounded corners
    const brightnessX = size - brightnessBarWidth - 15;
    const brightnessY = (size - brightnessBarHeight) / 2;
    const borderRadius = 8;
    
    // Create rounded rectangle path
    ctx.beginPath();
    ctx.roundRect(brightnessX, brightnessY, brightnessBarWidth, brightnessBarHeight, borderRadius);
    
    // Create high-quality gradient
    const gradient = ctx.createLinearGradient(0, brightnessY, 0, brightnessY + brightnessBarHeight);
    gradient.addColorStop(0, `hsl(${h}, ${s * 100}%, 100%)`);
    gradient.addColorStop(1, `hsl(${h}, ${s * 100}%, 0%)`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add border to brightness bar
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw enhanced brightness indicator with shadow
    const brightnessIndicatorY = brightnessY + (1 - v) * brightnessBarHeight;
    
    // Shadow
    ctx.beginPath();
    ctx.arc(brightnessX + brightnessBarWidth / 2 + 1, brightnessIndicatorY + 1, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();
    
    // Main indicator
    ctx.beginPath();
    ctx.arc(brightnessX + brightnessBarWidth / 2, brightnessIndicatorY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Inner ring for better visibility
    ctx.beginPath();
    ctx.arc(brightnessX + brightnessBarWidth / 2, brightnessIndicatorY, 5, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw enhanced color wheel indicator with shadow and better visibility
    const indicatorAngle = h * Math.PI / 180;
    const indicatorRadius = s * wheelRadius;
    const indicatorX = center + Math.cos(indicatorAngle) * indicatorRadius;
    const indicatorY = center + Math.sin(indicatorAngle) * indicatorRadius;
    
    // Shadow
    ctx.beginPath();
    ctx.arc(indicatorX + 1, indicatorY + 1, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    
    // Outer ring
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Inner color preview
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
  }, [h, s, v, size, center, wheelRadius, brightnessBarWidth, brightnessBarHeight, color.r, color.g, color.b]);
  
  useEffect(() => {
    drawColorWheel();
  }, [drawColorWheel]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (size / rect.width);
    const y = (e.clientY - rect.top) * (size / rect.height);
    
    const brightnessX = size - brightnessBarWidth - 15;
    const brightnessY = (size - brightnessBarHeight) / 2;
    
    // Check if clicking on brightness bar
    if (x >= brightnessX && x <= brightnessX + brightnessBarWidth &&
        y >= brightnessY && y <= brightnessY + brightnessBarHeight) {
      setDragTarget('brightness');
      setIsDragging(true);
      
      const newV = 1 - (y - brightnessY) / brightnessBarHeight;
      const [r, g, b] = hsvToRgb(h, s, Math.max(0, Math.min(1, newV)));
      onChange({ r, g, b });
    } else {
      // Check if clicking on color wheel
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= wheelRadius) {
        setDragTarget('wheel');
        setIsDragging(true);
        
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const normalizedAngle = angle < 0 ? angle + 360 : angle;
        const saturation = Math.min(distance / wheelRadius, 1);
        
        const [r, g, b] = hsvToRgb(normalizedAngle, saturation, v);
        onChange({ r, g, b });
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragTarget) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (size / rect.width);
    const y = (e.clientY - rect.top) * (size / rect.height);
    
    if (dragTarget === 'brightness') {
      const brightnessY = (size - brightnessBarHeight) / 2;
      const newV = 1 - (y - brightnessY) / brightnessBarHeight;
      const [r, g, b] = hsvToRgb(h, s, Math.max(0, Math.min(1, newV)));
      onChange({ r, g, b });
    } else if (dragTarget === 'wheel') {
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= wheelRadius) {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const normalizedAngle = angle < 0 ? angle + 360 : angle;
        const saturation = Math.min(distance / wheelRadius, 1);
        
        const [r, g, b] = hsvToRgb(normalizedAngle, saturation, v);
        onChange({ r, g, b });
      }
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
  };
  
  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="cursor-crosshair rounded-xl shadow-lg border border-gray-200/50" // Removed bg-white
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            width: size, 
            height: size,
            imageRendering: 'pixelated' // Prevents blurring on high-DPI displays
          }}
        />
      </div>
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            RGB({color.r}, {color.g}, {color.b})
          </div>
          <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            #{color.r.toString(16).padStart(2, '0')}{color.g.toString(16).padStart(2, '0')}{color.b.toString(16).padStart(2, '0')}
          </div>
        </div>
        <div 
          className="w-20 h-10 rounded-lg border-2 border-white shadow-md mx-auto ring-1 ring-gray-200/50"
          style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
        />
      </div>
    </div>
  );
}
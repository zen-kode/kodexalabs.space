'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAIDockSettings, colorToString } from '@/hooks/use-ai-dock-settings';
import {
  ICON_PACKS,
  IconPackType,
  ToolColor,
  SettingsExport
} from '@/components/playground/ai-dock-types';
import {
  Palette,
  Download,
  Upload,
  Cloud,
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  Sparkles,
  Zap,
  MousePointer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColorWheel } from '@/components/ui/color-wheel';

// Color picker component
// Replace the existing ColorPicker component with this modern version:
function ColorPicker({ 
  color, 
  onChange, 
  label, 
  disabled = false 
}: {
  color: ToolColor;
  onChange: (color: ToolColor) => void;
  label?: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);

  const applyColor = () => {
    onChange(tempColor);
    setIsOpen(false);
  };

  const resetColor = () => {
    setTempColor(color);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 hover:bg-accent/50 transition-colors"
          disabled={disabled}
        >
          <div 
            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: colorToString(color) }}
          />
          {label && <span className="font-medium">{label}</span>}
          <span className="ml-auto text-xs text-muted-foreground font-mono">
            #{color.r.toString(16).padStart(2, '0')}{color.g.toString(16).padStart(2, '0')}{color.b.toString(16).padStart(2, '0')}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customize Color
          </DialogTitle>
          <DialogDescription>
            Choose a color for {label || 'this tool'} using the color wheel
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center py-4">
          <ColorWheel
            color={tempColor}
            onChange={setTempColor}
            size={240}
          />
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={resetColor}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={applyColor} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <Check className="h-4 w-4 mr-2" />
            Apply Color
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Icon pack preview component
function IconPackPreview({ pack }: { pack: typeof ICON_PACKS[IconPackType] }) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg">
      <div className="flex gap-1">
        {Object.entries(pack.icons).slice(0, 3).map(([key, Icon]) => (
          <Icon key={key} className="h-4 w-4 text-muted-foreground" />
        ))}
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{pack.name}</div>
        <div className="text-xs text-muted-foreground">{pack.description}</div>
      </div>
    </div>
  );
}

export default function AIDockSettings() {
  const {
    settings,
    updateSettings,
    updateToolColor,
    toggleTool,
    resetToDefaults,
    exportSettings,
    importSettings,
    saveToCloud,
    loadFromCloud,
    isLoading,
    error
  } = useAIDockSettings();
  
  const { toast } = useToast();
  const [cloudBackupName, setCloudBackupName] = useState('');
  const [cloudBackupDescription, setCloudBackupDescription] = useState('');
  const [showCloudDialog, setShowCloudDialog] = useState(false);

  const handleExportSettings = () => {
    try {
      const exported = exportSettings();
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-dock-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Settings Exported',
        description: 'Your AI Dock Tools settings have been downloaded.'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export settings. Please try again.'
      });
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as SettingsExport;
        const success = importSettings(imported);
        
        if (success) {
          toast({
            title: 'Settings Imported',
            description: 'Your AI Dock Tools settings have been restored.'
          });
        } else {
          throw new Error('Invalid settings file');
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: 'Invalid settings file. Please check the file and try again.'
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handleCloudBackup = async () => {
    if (!cloudBackupName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name Required',
        description: 'Please enter a name for your backup.'
      });
      return;
    }

    const success = await saveToCloud(cloudBackupName, cloudBackupDescription);
    if (success) {
      toast({
        title: 'Backup Saved',
        description: 'Your settings have been backed up to the cloud.'
      });
      setShowCloudDialog(false);
      setCloudBackupName('');
      setCloudBackupDescription('');
    }
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    toast({
      title: 'Settings Reset',
      description: 'AI Dock Tools settings have been reset to defaults.'
    });
  };

  const tools = Object.entries(settings.tools);
  const enabledCount = tools.filter(([, tool]) => tool.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Dock Tools</h2>
        <p className="text-muted-foreground">
          Customize your AI tools dock with colors, icons, and behavior settings.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          {/* Icon Pack Info - Now using Default pack only */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Icon Pack
              </CardTitle>
              <CardDescription>
                Using the default icon pack with classic, clean design.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Pack</Label>
                <IconPackPreview pack={ICON_PACKS.default} />
              </div>
            </CardContent>
          </Card>

          {/* Color Customization */}
          <Card>
            <CardHeader>
              <CardTitle>Tool Colors</CardTitle>
              <CardDescription>
                Customize the color of each AI tool individually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {tools.map(([toolId, tool]) => (
                  <div key={toolId} className="flex items-center gap-3">
                    <div className="flex-1">
                      <ColorPicker
                        color={tool.color}
                        onChange={(color) => updateToolColor(toolId, color)}
                        label={tool.description}
                        disabled={!tool.enabled}
                      />
                    </div>
                    {!tool.enabled && (
                      <Badge variant="secondary" className="text-xs">
                        Disabled
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Theme Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Advanced Theme
              </CardTitle>
              <CardDescription>
                Customize magnification, animations, and visual effects for the dock.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Magnification Settings */}
              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Magnification Effect
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="magnification-enabled" className="text-sm">
                      Enable Magnification
                    </Label>
                    <Switch
                      id="magnification-enabled"
                      checked={settings.theme?.magnificationEnabled ?? true}
                      onCheckedChange={(checked) => updateSettings({ 
                        theme: { 
                          ...settings.theme, 
                          magnificationEnabled: checked 
                        } 
                      })}
                    />
                  </div>
                  
                  {(settings.theme?.magnificationEnabled ?? true) && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Magnification Strength</Label>
                          <span className="text-xs text-muted-foreground">
                            {settings.theme?.magnification ?? 1.6}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1.2"
                          max="2.5"
                          step="0.1"
                          value={settings.theme?.magnification ?? 1.6}
                        onChange={(e) => updateSettings({ 
                          theme: { 
                            ...settings.theme, 
                            magnification: parseFloat(e.target.value) 
                          } 
                        })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Effect Range</Label>
                          <span className="text-xs text-muted-foreground">
                            {settings.theme?.effectWidth ?? 200}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="300"
                          step="10"
                          value={settings.theme?.effectWidth ?? 200}
                        onChange={(e) => updateSettings({ 
                          theme: { 
                            ...settings.theme, 
                            effectWidth: parseInt(e.target.value) 
                          } 
                        })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Animation Settings */}
              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Animation Settings
                </Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Animation Speed</Label>
                      <span className="text-xs text-muted-foreground">
                        {settings.theme?.animationDuration ?? '0.35'}s
                      </span>
                    </div>
                    <Select
                      value={settings.theme?.animationDuration ?? '0.35'}
                      onValueChange={(value) => updateSettings({ 
                        theme: { 
                          ...settings.theme, 
                          animationDuration: value 
                        } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.15">Fast (0.15s)</SelectItem>
                        <SelectItem value="0.25">Medium (0.25s)</SelectItem>
                        <SelectItem value="0.35">Normal (0.35s)</SelectItem>
                        <SelectItem value="0.5">Slow (0.5s)</SelectItem>
                        <SelectItem value="0.75">Very Slow (0.75s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Animation Style</Label>
                    <Select
                      value={settings.theme?.animationEasing ?? 'cubic-bezier(0.34, 1.56, 0.64, 1)'}
                      onValueChange={(value) => updateSettings({ 
                        theme: { 
                          ...settings.theme, 
                          animationEasing: value 
                        } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ease">Ease</SelectItem>
                        <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
                        <SelectItem value="cubic-bezier(0.34, 1.56, 0.64, 1)">Bouncy</SelectItem>
                        <SelectItem value="cubic-bezier(0.25, 0.46, 0.45, 0.94)">Smooth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Particle Effects */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Particle Effects</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="particles-enabled" className="text-sm">
                      Enable Particles
                    </Label>
                    <Switch
                      id="particles-enabled"
                      checked={settings.theme?.particlesEnabled ?? true}
                      onCheckedChange={(checked) => updateSettings({ 
                        theme: { 
                          ...settings.theme, 
                          particlesEnabled: checked 
                        } 
                      })}
                    />
                  </div>
                  
                  {(settings.theme?.particlesEnabled ?? true) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Particle Count</Label>
                        <span className="text-xs text-muted-foreground">
                          {settings.theme?.particleCount ?? 12}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="24"
                        step="2"
                        value={settings.theme?.particleCount ?? 12}
                        onChange={(e) => updateSettings({ 
                          theme: { 
                            ...settings.theme, 
                            particleCount: parseInt(e.target.value) 
                          } 
                        })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Presets */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Theme Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings({ 
                      theme: {
                        magnificationEnabled: true,
                        magnification: 1.4,
                        effectWidth: 150,
                        animationDuration: '0.25',
                        animationEasing: 'ease-in-out',
                        particlesEnabled: false,
                        particleCount: 8
                      }
                    })}
                  >
                    Minimal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings({ 
                      theme: {
                        magnificationEnabled: true,
                        magnification: 1.6,
                        effectWidth: 200,
                        animationDuration: '0.35',
                        animationEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                        particlesEnabled: true,
                        particleCount: 12
                      }
                    })}
                  >
                    Default
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings({ 
                      theme: {
                        magnificationEnabled: true,
                        magnification: 2.2,
                        effectWidth: 280,
                        animationDuration: '0.5',
                        animationEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                        particlesEnabled: true,
                        particleCount: 18
                      }
                    })}
                  >
                    Dynamic
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings({ 
                      theme: {
                        magnificationEnabled: false,
                        magnification: 1.0,
                        effectWidth: 0,
                        animationDuration: '0.15',
                        animationEasing: 'ease',
                        particlesEnabled: false,
                        particleCount: 0
                      }
                    })}
                  >
                    Static
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tool Management</span>
                <Badge variant="outline">
                  {enabledCount}/{tools.length} enabled
                </Badge>
              </CardTitle>
              <CardDescription>
                Enable or disable individual AI tools. Disabled tools won't appear in the dock.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {tools.map(([toolId, tool]) => {
                  const Icon = ICON_PACKS[settings.iconPack].icons[toolId as keyof typeof ICON_PACKS[typeof settings.iconPack]['icons']];
                  
                  return (
                    <div key={toolId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg border"
                          style={{ 
                            backgroundColor: tool.enabled 
                              ? `${colorToString(tool.color)}20` 
                              : 'transparent'
                          }}
                        >
                          <Icon 
                            className={cn(
                              "h-5 w-5",
                              tool.enabled 
                                ? "text-[var(--tool-color)]" 
                                : "text-muted-foreground"
                            )}
                            style={{
                              '--tool-color': colorToString(tool.color)
                            } as React.CSSProperties}
                          />
                        </div>
                        <div>
                          <div className="font-medium">{tool.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {tool.enabled ? 'Active in dock' : 'Hidden from dock'}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={tool.enabled}
                        onCheckedChange={() => toggleTool(toolId)}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
              <CardDescription>
                Configure how the AI tools dock appears and behaves.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-labels" className="flex flex-col space-y-1">
                  <span>Show Tool Labels</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Display descriptive text under each tool icon.
                  </span>
                </Label>
                <Switch
                  id="show-labels"
                  checked={settings.showLabels}
                  onCheckedChange={(checked) => updateSettings({ showLabels: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode" className="flex flex-col space-y-1">
                  <span>Compact Mode</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Reduce spacing and padding for a denser layout.
                  </span>
                </Label>
                <Switch
                  id="compact-mode"
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="animations" className="flex flex-col space-y-1">
                  <span>Animations</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Enable smooth transitions and hover effects.
                  </span>
                </Label>
                <Switch
                  id="animations"
                  checked={settings.animationsEnabled}
                  onCheckedChange={(checked) => updateSettings({ animationsEnabled: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hover-effects" className="flex flex-col space-y-1">
                  <span>Hover Effects</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Show enhanced visual feedback on hover.
                  </span>
                </Label>
                <Switch
                  id="hover-effects"
                  checked={settings.hoverEffects}
                  onCheckedChange={(checked) => updateSettings({ hoverEffects: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings Management</CardTitle>
              <CardDescription>
                Export, import, or backup your AI Dock Tools settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Local Export/Import */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Local Backup</Label>
                <div className="flex gap-2">
                  <Button onClick={handleExportSettings} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      className="hidden"
                      id="import-settings"
                    />
                    <Button asChild variant="outline" className="w-full">
                      <Label htmlFor="import-settings" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Settings
                      </Label>
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cloud Backup */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Cloud Backup</Label>
                <Dialog open={showCloudDialog} onOpenChange={setShowCloudDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Cloud className="h-4 w-4 mr-2" />
                      )}
                      Save to Cloud
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cloud Backup</DialogTitle>
                      <DialogDescription>
                        Save your AI Dock Tools settings to the cloud for easy access across devices.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="backup-name">Backup Name *</Label>
                        <Input
                          id="backup-name"
                          value={cloudBackupName}
                          onChange={(e) => setCloudBackupName(e.target.value)}
                          placeholder="My AI Dock Settings"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="backup-description">Description (Optional)</Label>
                        <Input
                          id="backup-description"
                          value={cloudBackupDescription}
                          onChange={(e) => setCloudBackupDescription(e.target.value)}
                          placeholder="Custom colors and premium icons"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCloudDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCloudBackup} disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Cloud className="h-4 w-4 mr-2" />
                        )}
                        Save Backup
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              {/* Reset to Defaults */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Reset Settings</Label>
                <Button 
                  variant="destructive" 
                  onClick={handleResetToDefaults}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <p className="text-xs text-muted-foreground">
                  This will restore all AI Dock Tools settings to their default values. This action cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
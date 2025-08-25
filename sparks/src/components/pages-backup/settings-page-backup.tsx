'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIDockSettings from '@/components/settings/ai-dock-settings';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const compactMode = localStorage.getItem('compact-mode') === 'true';
        setIsCompact(compactMode);
        if (compactMode) {
            document.body.classList.add('compact');
        }
    }, []);

    const toggleCompactMode = () => {
        const newValue = !isCompact;
        setIsCompact(newValue);
        localStorage.setItem('compact-mode', String(newValue));
        if (newValue) {
            document.body.classList.add('compact');
        } else {
            document.body.classList.remove('compact');
        }
    }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-4xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Manage your account and customize your experience.
        </p>
      </div>
      <Separator />
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai-dock" id="ai-dock">AI Dock Tools</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Update your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue="Prompt Engineer" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue="kodexalabs.space@gmail.com" disabled />
                        </div>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>Customize the app's appearance and behavior.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
                                <span>Dark Mode</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    The app is currently in dark mode.
                                </span>
                            </Label>
                            <Switch id="theme-mode" checked disabled />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="compact-mode" className="flex flex-col space-y-1">
                                <span>Compact UI</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Reduce padding and margins for a denser look.
                                </span>
                            </Label>
                            <Switch id="compact-mode" checked={isCompact} onCheckedChange={toggleCompactMode} />
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-dock">
          <AIDockSettings />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Advanced configuration options for power users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Advanced settings will be available in future updates.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

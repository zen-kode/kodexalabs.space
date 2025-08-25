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
import { User, Settings, Cpu, Shield, Palette, Monitor, Bell, Lock } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

export default function SettingsPage() {
    const [isCompact, setIsCompact] = useState(false);
    const { theme, setTheme, actualTheme } = useTheme();

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

    const toggleDarkMode = () => {
        const newTheme = actualTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    const getThemeDescription = () => {
        if (theme === 'system') {
            return `Following system (${actualTheme})`;
        }
        return actualTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
    }


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg">
            <Settings className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Manage your account and customize your experience
            </p>
          </div>
        </div>
      
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card backdrop-blur-xl border border-border shadow-lg rounded-2xl p-2">
            <TabsTrigger 
              value="general" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <User className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="ai-dock" 
              id="ai-dock"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Cpu className="w-4 h-4" />
              AI Dock Tools
            </TabsTrigger>
            <TabsTrigger 
              value="advanced"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Shield className="w-4 h-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-card backdrop-blur-xl border border-border shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-muted border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary shadow-lg">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
                        <CardDescription>Update your personal details and account information</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</Label>
                        <Input 
                          id="name" 
                          defaultValue="Prompt Engineer" 
                          className="bg-input border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          defaultValue="kodexalabs.space@gmail.com" 
                          disabled 
                          className="bg-muted border-border rounded-xl text-muted-foreground"
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6">
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card backdrop-blur-xl border border-border shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-muted border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary shadow-lg">
                        <Bell className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold">Notifications</CardTitle>
                        <CardDescription>Manage your notification preferences</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-foreground">Email Notifications</span>
                        <span className="text-sm text-muted-foreground">
                          Receive updates about your account and activities
                        </span>
                      </div>
                      <Switch className="data-[state=checked]:bg-primary" />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-foreground">Push Notifications</span>
                        <span className="text-sm text-muted-foreground">
                          Get notified about important updates instantly
                        </span>
                      </div>
                      <Switch className="data-[state=checked]:bg-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card className="bg-card backdrop-blur-xl border border-border shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-muted border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary shadow-lg">
                        <Palette className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold">Appearance</CardTitle>
                        <CardDescription>Customize the app's look and feel</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-muted-foreground" />
                        <div className="flex flex-col space-y-1">
                          <span className="font-medium text-foreground">Dark Mode</span>
                          <span id="theme-description" className="text-sm text-muted-foreground">
                            {getThemeDescription()}
                          </span>
                        </div>
                      </div>
                      <Switch 
                        id="theme-mode" 
                        checked={actualTheme === 'dark'} 
                        onCheckedChange={toggleDarkMode}
                        className="data-[state=checked]:bg-primary"
                        aria-label={`Toggle dark mode. Currently ${actualTheme === 'dark' ? 'enabled' : 'disabled'}`}
                        aria-describedby="theme-description"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                        <div className="flex flex-col space-y-1">
                          <span className="font-medium text-foreground">Compact UI</span>
                          <span className="text-sm text-muted-foreground">
                            Reduce spacing for denser layout
                          </span>
                        </div>
                      </div>
                      <Switch 
                        id="compact-mode" 
                        checked={isCompact} 
                        onCheckedChange={toggleCompactMode} 
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-muted border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary shadow-lg">
                        <Lock className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-foreground">Security</CardTitle>
                        <CardDescription className="text-muted-foreground">Manage your account security settings</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-foreground">Two-Factor Authentication</span>
                        <span className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </span>
                      </div>
                      <Switch className="data-[state=checked]:bg-primary" />
                    </div>
                    <div className="pt-4 border-t border-border">
                      <Button variant="outline" className="rounded-xl">
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-dock" className="space-y-8">
            <div className="bg-card border-border shadow-xl rounded-2xl overflow-hidden">
              <div className="bg-muted border-b border-border p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary shadow-lg">
                    <Cpu className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">AI Dock Tools</h3>
                    <p className="text-sm text-muted-foreground">Configure your AI-powered development tools</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <AIDockSettings />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-8">
            <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary shadow-lg">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">Advanced Settings</CardTitle>
                    <CardDescription className="text-muted-foreground">Advanced configuration options for power users</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                    <Shield className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h4>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Advanced settings and configuration options will be available in future updates. Stay tuned for more powerful customization features.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

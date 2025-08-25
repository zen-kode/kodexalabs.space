'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Mail, 
  FileText, 
  ExternalLink,
  HelpCircle,
  Bug,
  Lightbulb,
  Users
} from 'lucide-react';

export default function SupportPage() {
  const supportOptions = [
    {
      title: 'Documentation',
      description: 'Browse our comprehensive guides and tutorials',
      icon: FileText,
      action: 'Browse Docs',
      href: '/docs',
      color: 'bg-blue-500'
    },
    {
      title: 'Community Forum',
      description: 'Connect with other users and get help from the community',
      icon: Users,
      action: 'Join Forum',
      href: '/community',
      color: 'bg-green-500'
    },
    {
      title: 'Contact Support',
      description: 'Get direct help from our support team',
      icon: Mail,
      action: 'Contact Us',
      href: 'mailto:support@sparks.dev',
      color: 'bg-purple-500'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: MessageCircle,
      action: 'Start Chat',
      href: '#',
      color: 'bg-orange-500'
    }
  ];

  const quickHelp = [
    {
      title: 'Getting Started',
      description: 'New to Sparks? Start here for a quick overview',
      type: 'guide'
    },
    {
      title: 'Report a Bug',
      description: 'Found an issue? Let us know so we can fix it',
      type: 'bug'
    },
    {
      title: 'Feature Request',
      description: 'Have an idea for a new feature? Share it with us',
      type: 'feature'
    },
    {
      title: 'FAQ',
      description: 'Find answers to commonly asked questions',
      type: 'faq'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide': return HelpCircle;
      case 'bug': return Bug;
      case 'feature': return Lightbulb;
      case 'faq': return FileText;
      default: return HelpCircle;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'guide': return 'default';
      case 'bug': return 'destructive';
      case 'feature': return 'secondary';
      case 'faq': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Support Center</h1>
        <p className="text-xl text-muted-foreground">
          Get the help you need to make the most of Sparks
        </p>
      </div>

      {/* Support Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {supportOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center">
                <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    if (option.href.startsWith('mailto:')) {
                      window.location.href = option.href;
                    } else if (option.href.startsWith('http')) {
                      window.open(option.href, '_blank');
                    } else {
                      window.location.href = option.href;
                    }
                  }}
                >
                  {option.action}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="my-12" />

      {/* Quick Help */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Quick Help</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickHelp.map((item, index) => {
            const Icon = getTypeIcon(item.type);
            return (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                    <Badge variant={getTypeBadge(item.type) as any}>
                      {item.type}
                    </Badge>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contact Information */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>
            Our support team is here to help you succeed with Sparks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-semibold mb-1">Email Support</h3>
              <p className="text-sm text-muted-foreground">support@sparks.dev</p>
            </div>
            <div className="text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-semibold mb-1">Live Chat</h3>
              <p className="text-sm text-muted-foreground">Available 24/7</p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-semibold mb-1">Community</h3>
              <p className="text-sm text-muted-foreground">Join our forum</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
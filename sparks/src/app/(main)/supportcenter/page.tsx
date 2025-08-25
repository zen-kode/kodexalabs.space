'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Mail, 
  FileText, 
  ExternalLink,
  HelpCircle,
  Bug,
  Lightbulb,
  Users,
  Search,
  BookOpen,
  Video,
  MessageSquare,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const supportCategories = [
  {
    title: 'Getting Started',
    description: 'New to Sparks? Start here for guides and tutorials',
    icon: BookOpen,
    color: 'bg-blue-500',
    articles: [
      'Quick Start Guide',
      'Setting up your first project',
      'Understanding the interface',
      'Basic AI tools overview'
    ]
  },
  {
    title: 'AI Tools & Features',
    description: 'Learn about our AI-powered tools and capabilities',
    icon: Lightbulb,
    color: 'bg-purple-500',
    articles: [
      'AI Dock System Guide',
      'Prompt Engineering Best Practices',
      'Using the Playground',
      'Advanced AI Features'
    ]
  },
  {
    title: 'Account & Settings',
    description: 'Manage your account, preferences, and customizations',
    icon: Users,
    color: 'bg-green-500',
    articles: [
      'Account Management',
      'Theme Customization',
      'Privacy Settings',
      'Backup & Sync'
    ]
  },
  {
    title: 'Troubleshooting',
    description: 'Common issues and their solutions',
    icon: Bug,
    color: 'bg-red-500',
    articles: [
      'Common Error Messages',
      'Performance Issues',
      'Browser Compatibility',
      'Connection Problems'
    ]
  }
];

const contactOptions = [
  {
    title: 'Live Chat',
    description: 'Get instant help from our support team',
    icon: MessageCircle,
    action: 'Start Chat',
    availability: 'Available 24/7',
    responseTime: 'Usually responds in minutes',
    color: 'bg-green-500'
  },
  {
    title: 'Email Support',
    description: 'Send us a detailed message about your issue',
    icon: Mail,
    action: 'Send Email',
    availability: 'Always available',
    responseTime: 'Response within 24 hours',
    color: 'bg-blue-500'
  },
  {
    title: 'Community Forum',
    description: 'Connect with other users and get community help',
    icon: Users,
    action: 'Visit Forum',
    availability: 'Community-driven',
    responseTime: 'Varies by community',
    color: 'bg-purple-500'
  },
  {
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides',
    icon: Video,
    action: 'Watch Videos',
    availability: 'Available anytime',
    responseTime: 'Self-paced learning',
    color: 'bg-orange-500'
  }
];

const faqs = [
  {
    question: 'How do I get started with Sparks AI?',
    answer: 'Start by creating an account and exploring the Playground. Our Quick Start Guide will walk you through the basic features and help you create your first AI-powered prompt.'
  },
  {
    question: 'What AI models does Sparks support?',
    answer: 'Sparks integrates with multiple AI providers and models. You can configure your preferred AI service in the Settings panel under AI Configuration.'
  },
  {
    question: 'Can I customize the AI tools dock?',
    answer: 'Yes! The AI tools dock is fully customizable. You can rearrange tools, change colors, select different icon packs, and enable/disable specific tools in the Settings.'
  },
  {
    question: 'How does the backup system work?',
    answer: 'Sparks includes an automatic backup system that saves your prompts and settings. You can also manually export your data or sync with cloud storage providers.'
  },
  {
    question: 'Is there a mobile app available?',
    answer: 'Currently, Sparks is a web-based application optimized for desktop and mobile browsers. We also offer a browser extension for enhanced functionality.'
  }
];

export default function SupportCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-bold text-4xl tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Support Center
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Get help, find answers, and learn how to make the most of Sparks AI.
        </p>
        
        {/* Search Bar */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {contactOptions.map((option, index) => {
          const IconComponent = option.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${option.color} flex items-center justify-center mb-3`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {option.availability}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {option.responseTime}
                  </div>
                </div>
                <Button className="w-full" size="sm">
                  {option.action}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {supportCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex}>
                        <Link 
                          href="#" 
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                        >
                          <FileText className="h-3 w-3" />
                          {article}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View All Articles
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader 
                className="cursor-pointer" 
                onClick={() => setSelectedFaq(selectedFaq === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                  <HelpCircle className={`h-5 w-5 transition-transform ${
                    selectedFaq === index ? 'rotate-180' : ''
                  }`} />
                </div>
              </CardHeader>
              {selectedFaq === index && (
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Still Need Help?
          </CardTitle>
          <CardDescription>
            Can't find what you're looking for? Send us a message and we'll get back to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input type="email" placeholder="your@email.com" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input placeholder="Brief description of your issue" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea 
                placeholder="Please describe your issue in detail..." 
                rows={5}
              />
            </div>
            <Button className="w-full">
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer Links */}
      <div className="mt-12 text-center">
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/whats-new" className="hover:text-foreground transition-colors">
            What's New
          </Link>
          <Link href="/changelogs" className="hover:text-foreground transition-colors">
            Changelog
          </Link>
          <Link href="/status" className="hover:text-foreground transition-colors">
            System Status
          </Link>
          <Link href="/community" className="hover:text-foreground transition-colors">
            Community
          </Link>
        </div>
      </div>
    </div>
  );
}
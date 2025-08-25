'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MessengerButton, { FacebookMessengerButton } from './messenger-button';
import { MessageCircle, User, Mail } from 'lucide-react';

// Example of integrating messenger button into a contact card
export function ContactCard({ 
  name = 'Joel Ross', 
  role = 'Product Manager', 
  email = 'joel.ross@kodexalabs.space',
  messengerMessage = 'Hi Joel! I saw your profile and wanted to connect.' 
}) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-xl">{name}</CardTitle>
        <Badge variant="secondary" className="w-fit mx-auto">
          {role}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4" />
          {email}
        </div>
        
        <div className="flex gap-2">
          <MessengerButton
            recipientName={name}
            message={messengerMessage}
            variant="outline"
            size="sm"
            className="flex-1"
          />
          <FacebookMessengerButton
            recipientName={name}
            message={messengerMessage}
            className="flex-1 text-sm py-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Example of a floating messenger button
export function FloatingMessengerButton({ 
  recipientName = 'Joel Ross',
  message = 'Hi! I have a question for you.',
  position = 'bottom-right' 
}: {
  recipientName?: string;
  message?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <MessengerButton
        recipientName={recipientName}
        message={message}
        size="lg"
        className="shadow-lg hover:shadow-xl rounded-full px-6 py-3 bg-blue-600 hover:bg-blue-700"
        customText="Chat Now"
      />
    </div>
  );
}

// Example of messenger button in a team directory
export function TeamMemberCard({ 
  member = {
    name: 'Joel Ross',
    role: 'Product Manager',
    department: 'Product',
    avatar: '/avatars/joel.jpg',
    status: 'online'
  }
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              {member.status === 'online' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold">{member.name}</h3>
              <p className="text-sm text-muted-foreground">{member.role}</p>
              <Badge variant="outline" className="text-xs mt-1">
                {member.department}
              </Badge>
            </div>
          </div>
          
          <MessengerButton
            recipientName={member.name}
            message={`Hi ${member.name}! I wanted to reach out regarding a project.`}
            variant="ghost"
            size="sm"
            customText="Message"
          />
        </div>
      </CardContent>
    </Card>
  );
}
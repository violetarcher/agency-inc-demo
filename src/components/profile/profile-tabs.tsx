'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Key, Shield, Lock, Settings } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: {
    overview: React.ReactNode;
    tokens: React.ReactNode;
    security: React.ReactNode;
    sessions: React.ReactNode;
    preferences: React.ReactNode;
  };
}

export function ProfileTabs({ activeTab, onTabChange, children }: ProfileTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="tokens" className="flex items-center gap-2">
          <Key className="w-4 h-4" />
          <span className="hidden sm:inline">Tokens</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Security</span>
        </TabsTrigger>
        <TabsTrigger value="sessions" className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">Sessions</span>
        </TabsTrigger>
        <TabsTrigger value="preferences" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Preferences</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        {children.overview}
      </TabsContent>

      <TabsContent value="tokens" className="mt-6">
        {children.tokens}
      </TabsContent>

      <TabsContent value="security" className="mt-6">
        {children.security}
      </TabsContent>

      <TabsContent value="sessions" className="mt-6">
        {children.sessions}
      </TabsContent>

      <TabsContent value="preferences" className="mt-6">
        {children.preferences}
      </TabsContent>
    </Tabs>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Monitor, Smartphone, Tablet, Globe, Calendar, MapPin, Shield, X } from 'lucide-react';
import moment from 'moment';

interface UserSession {
  id: string;
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    name: string;
    os: string;
    browser: string;
  };
  location: {
    city: string;
    country: string;
    ip: string;
  };
  lastActivity: Date;
  created: Date;
  current: boolean;
}

export function UserSessions() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockSessions: UserSession[] = [
        {
          id: 'current',
          device: {
            type: 'desktop',
            name: 'MacBook Pro',
            os: 'macOS 14.0',
            browser: 'Chrome 118'
          },
          location: {
            city: 'New York',
            country: 'United States',
            ip: '192.168.1.100'
          },
          lastActivity: new Date(),
          created: new Date(Date.now() - 2 * 60 * 60 * 1000),
          current: true
        },
        {
          id: 'mobile-1',
          device: {
            type: 'mobile',
            name: 'iPhone 15',
            os: 'iOS 17.0',
            browser: 'Safari Mobile'
          },
          location: {
            city: 'New York',
            country: 'United States',
            ip: '192.168.1.101'
          },
          lastActivity: new Date(Date.now() - 30 * 60 * 1000),
          created: new Date(Date.now() - 24 * 60 * 60 * 1000),
          current: false
        }
      ];

      setSessions(mockSessions);
      setLoading(false);
    };

    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    if (sessionId === 'current') {
      toast.error("Cannot revoke current session", {
        description: "You cannot revoke your current active session."
      });
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    setSessions(sessions.filter(session => session.id !== sessionId));

    toast.success("Session revoked", {
      description: "The session has been successfully terminated."
    });
  };

  const handleRevokeAllOtherSessions = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSessions(sessions.filter(session => session.current));

    toast.success("All other sessions revoked", {
      description: "All sessions except your current one have been terminated."
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      case 'desktop': return <Monitor className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const getActivityColor = (lastActivity: Date) => {
    const minutesAgo = moment().diff(moment(lastActivity), 'minutes');
    if (minutesAgo < 30) return 'bg-green-500';
    if (minutesAgo < 60 * 24) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading sessions...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage your active login sessions across devices
              </CardDescription>
            </div>
            {sessions.filter(s => !s.current).length > 0 && (
              <Button
                variant="outline"
                onClick={handleRevokeAllOtherSessions}
                className="text-destructive hover:text-destructive"
              >
                Revoke All Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div key={session.id}>
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getDeviceIcon(session.device.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">
                          {session.device.name}
                        </h4>
                        {session.current && (
                          <Badge variant="default">Current Session</Badge>
                        )}
                        <div
                          className={`w-2 h-2 rounded-full ${getActivityColor(session.lastActivity)}`}
                          title="Activity indicator"
                        />
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>{session.device.os} • {session.device.browser}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{session.location.city}, {session.location.country}</span>
                          <span className="text-xs">({session.location.ip})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Last active: {moment(session.lastActivity).fromNow()}</span>
                          </div>
                          <span>•</span>
                          <span>Created: {moment(session.created).format('MMM D, YYYY')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {index < sessions.length - 1 && <Separator />}
              </div>
            ))}
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions found.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Green:</strong> Active within the last 30 minutes
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Yellow:</strong> Active within the last 24 hours
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Gray:</strong> Inactive for more than 24 hours
              </div>
            </div>
            <Separator />
            <p className="text-muted-foreground">
              If you see any sessions you don't recognize, revoke them immediately and consider changing your password.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

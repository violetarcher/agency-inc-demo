// src/components/admin/session-management.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, Monitor, Clock, MapPin, Shield, RefreshCw, AlertTriangle, User, Mail, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface SessionInfo {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: string;
  lastActivity: string;
  lastInteracted: string;
  expiresAt: string;
  idleExpiresAt: string;
  device: {
    userAgent?: string;
    ipAddress?: string;
    asn?: string;
  };
  clients: Array<{ client_id: string }>;
  authentication: {
    methods: Array<{
      name: string;
      timestamp: string;
      type?: string;
    }>;
  };
  isCurrentUser: boolean;
  isCurrentSession: boolean;
}

interface OrganizationSession extends SessionInfo {
  // This matches your backend data structure
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<OrganizationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [terminating, setTerminating] = useState<string[]>([]);
  const [enforcing, setEnforcing] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/session/list');
      const result = await response.json();
      
      if (result.success) {
        setSessions(result.sessions);
        setCurrentSessionId(result.currentSessionId);
        setUserId(result.userId);
      } else {
        console.error('Failed to fetch sessions:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const isCurrentSession = session?.isCurrentSession;
    
    if (isCurrentSession && !confirm('This will log you out. Are you sure?')) {
      return;
    }

    try {
      setTerminating(prev => [...prev, sessionId]);
      
      const response = await fetch('/api/auth/session/terminate', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      const result = await response.json();

      if (result.success) {
        if (isCurrentSession) {
          window.location.href = '/api/auth/logout';
        } else {
          await fetchSessions();
        }
      } else {
        console.error('Failed to terminate session:', result.error);
        alert('Failed to terminate session: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to terminate session:', error);
      alert('Failed to terminate session');
    } finally {
      setTerminating(prev => prev.filter(id => id !== sessionId));
    }
  };

  const enforceSessionLimit = async () => {
    try {
      setEnforcing(true);
      
      const response = await fetch('/api/auth/session/enforce-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentSessionId })
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.terminatedCount > 0) {
          alert(`Terminated ${result.terminatedCount} other session(s)`);
          await fetchSessions();
        } else {
          alert('No other sessions found to terminate');
        }
      } else {
        console.error('Failed to enforce session limit:', result.error);
        alert('Failed to enforce session limit: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to enforce session limit:', error);
      alert('Failed to enforce session limit');
    } finally {
      setEnforcing(false);
    }
  };

  const formatUserAgent = (userAgent?: string) => {
    if (!userAgent) return 'Unknown device';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox'; 
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Mobile')) return 'Mobile Browser';
    return 'Unknown browser';
  };

  const formatAuthMethods = (methods: SessionInfo['authentication']['methods']) => {
    return methods.map(method => {
      if (method.name === 'pwd') return 'Password';
      if (method.name === 'mfa') return `MFA${method.type ? ` (${method.type})` : ''}`;
      return method.name;
    }).join(', ');
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Group sessions by user
  const sessionsByUser = sessions.reduce((acc, session) => {
    if (!acc[session.userId]) {
      acc[session.userId] = {
        userInfo: {
          userId: session.userId,
          userName: session.userName,
          userEmail: session.userEmail,
          isCurrentUser: session.isCurrentUser
        },
        sessions: []
      };
    }
    acc[session.userId].sessions.push(session);
    return acc;
  }, {} as Record<string, { userInfo: any, sessions: OrganizationSession[] }>);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 animate-spin" />
            <span>Loading sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Session Management
            </span>
            <div className="flex gap-2">
              <Button 
                onClick={fetchSessions} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold">{sessions.length}</div>
              <div className="text-sm text-gray-500">Total Sessions</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold">{Object.keys(sessionsByUser).length}</div>
              <div className="text-sm text-gray-500">Unique Users</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold">
                {sessions.filter(s => s.isCurrentSession).length}
              </div>
              <div className="text-sm text-gray-500">Current Sessions</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold">
                {sessions.filter(s => s.isCurrentUser).length}
              </div>
              <div className="text-sm text-gray-500">Your Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions by User */}
      {Object.entries(sessionsByUser).map(([userId, { userInfo, sessions: userSessions }]) => (
        <Card key={userId}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <div className="flex items-center gap-2 flex-wrap">
                <span>{userInfo.userName}</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {userInfo.userEmail}
                </Badge>
                {userInfo.isCurrentUser && (
                  <Badge variant="default">You</Badge>
                )}
                <Badge variant="outline">
                  {userSessions.length} session{userSessions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userSessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`border rounded-lg p-4 ${
                    session.isCurrentSession ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      {/* Session Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">Session {session.id.substring(0, 8)}...</h4>
                        {session.isCurrentSession && (
                          <Badge variant="default">Current</Badge>
                        )}
                        <Badge variant="outline">
                          {formatUserAgent(session.device.userAgent)}
                        </Badge>
                        {session.clients?.length > 0 && (
                          <Badge variant="secondary">
                            {session.clients.length} client{session.clients.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Timestamps Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="font-medium">Created</div>
                            <div className="text-gray-500">{getTimeAgo(session.createdAt)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium">Last Activity</div>
                            <div className="text-gray-500">{getTimeAgo(session.lastActivity)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <div>
                            <div className="font-medium">Last Interaction</div>
                            <div className="text-gray-500">{getTimeAgo(session.lastInteracted)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-500" />
                          <div>
                            <div className="font-medium">Expires</div>
                            <div className="text-gray-500">{getTimeAgo(session.expiresAt)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Device and Network Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {session.device.ipAddress && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>IP: {session.device.ipAddress}</span>
                          </div>
                        )}
                        {session.device.asn && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>ASN: {session.device.asn}</span>
                          </div>
                        )}
                        {session.device.userAgent && (
                          <div className="flex items-center gap-2 col-span-full">
                            <Monitor className="h-4 w-4" />
                            <span className="truncate" title={session.device.userAgent}>
                              {session.device.userAgent}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Authentication Methods */}
                      <div className="text-sm">
                        <span className="font-medium">Authentication: </span>
                        <span>{formatAuthMethods(session.authentication.methods)}</span>
                      </div>

                      {/* Expiration Info */}
                      <div className="text-xs text-gray-500 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>Session expires: {formatDateTime(session.expiresAt)}</div>
                        <div>Idle expires: {formatDateTime(session.idleExpiresAt)}</div>
                      </div>

                      {/* Client Info */}
                      {session.clients?.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Clients: </span>
                          <span className="text-gray-500">
                            {session.clients.map(c => c.client_id).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <Button
                      variant={session.isCurrentSession ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => terminateSession(session.id)}
                      disabled={terminating.includes(session.id)}
                      className="flex items-center gap-2 ml-4"
                    >
                      {terminating.includes(session.id) ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {session.isCurrentSession ? 'Logout' : 'Terminate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {sessions.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <p className="text-gray-500 text-center">No active sessions found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
// src/components/admin/session-management.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, Monitor, Clock, MapPin, Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface SessionInfo {
  id: string;
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
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
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
    const isCurrentSession = sessionId === currentSessionId;
    
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
          // Redirect to logout if terminating current session
          window.location.href = '/api/auth/logout';
        } else {
          // Refresh sessions list
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

  useEffect(() => {
    fetchSessions();
    // Auto-refresh every 30 seconds
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
      {/* Header */}
      {/* <Card>
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
              {sessions.length > 1 && (
                <Button 
                  onClick={enforceSessionLimit} 
                  variant="destructive" 
                  size="sm"
                  disabled={enforcing}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {enforcing ? 'Enforcing...' : 'Limit to 1 Session'}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold">{sessions.length}</div>
              <div className="text-sm text-gray-500">Active Sessions</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold">1</div>
              <div className="text-sm text-gray-500">Session Limit</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold">{Math.max(0, sessions.length - 1)}</div>
              <div className="text-sm text-gray-500">Sessions to Terminate</div>
            </div>
          </div>
          
          {sessions.length > 1 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Multiple sessions detected. Consider enforcing the single session limit to prevent account sharing.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card> */}

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active sessions found.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`border rounded-lg p-4 ${
                    session.id === currentSessionId ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      {/* Session Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">Session {session.id.substring(0, 8)}...</h3>
                        {session.id === currentSessionId && (
                          <Badge variant="default">Current Session</Badge>
                        )}
                        <Badge variant="outline">
                          {formatUserAgent(session.device.userAgent)}
                        </Badge>
                      </div>
                      
                      {/* Timestamps */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Created {getTimeAgo(session.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Active {getTimeAgo(session.lastInteracted)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Expires {getTimeAgo(session.expiresAt)}</span>
                        </div>
                      </div>

                      {/* Device Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {session.device.ipAddress && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>IP: {session.device.ipAddress}</span>
                          </div>
                        )}
                        {session.device.asn && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">ASN: {session.device.asn}</span>
                          </div>
                        )}
                      </div>

                      {/* Authentication Methods */}
                      <div className="text-sm">
                        <span className="font-medium">Authentication: </span>
                        <span>{formatAuthMethods(session.authentication.methods)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      variant={session.id === currentSessionId ? "outline" : "destructive"}
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
                      {session.id === currentSessionId ? 'Logout' : 'Terminate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
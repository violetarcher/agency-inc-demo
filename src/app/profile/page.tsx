import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProfileClient } from '@/components/profile/profile-client';
import { User, Key, Shield, Lock, Settings, CheckCircle2, Mail } from 'lucide-react';

export default withPageAuthRequired(async function ProfilePage() {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load user profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 px-2 sm:px-0">
      {/* Header */}
      <header className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Profile Management</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Manage your account settings, security, and preferences
        </p>
      </header>

      {/* Profile Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <Card className="overflow-hidden border-0 shadow-lg">
            {/* Header with gradient background */}
            <div className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-background px-6 pt-10 pb-8">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Avatar with ring and verification badge */}
                <div className="relative">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      className="w-24 h-24 rounded-full ring-4 ring-white/50 shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 ring-4 ring-white/50 shadow-xl flex items-center justify-center">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                  {/* Verification badge */}
                  {user.email_verified && (
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1.5 ring-4 ring-background shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Name and email */}
                <div className="w-full space-y-1.5 px-2">
                  <h3 className="text-xl font-bold break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {user.name}
                  </h3>
                  <p className="text-sm text-muted-foreground break-words leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Content */}
            <CardContent className="space-y-4 p-6">
              {/* User ID - Full display */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</label>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs font-mono break-all leading-relaxed">{user.sub?.split('|')[1]}</p>
                </div>
              </div>

              {/* Verification Status */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verification Status</label>
                <div className="space-y-2">
                  {/* Email verification */}
                  {user.email && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-all">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Email</span>
                      </div>
                      {user.email_verified ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                          Pending
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Phone verification */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-all">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Phone</span>
                    </div>
                    {user.phone_number && user.phone_verified ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Provider */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auth Provider</label>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
                  <Badge variant="outline" className="text-sm font-semibold uppercase px-4 py-1">
                    {user.sub?.split('|')[0]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Tabs */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="tokens" className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2">
                <Key className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Tokens</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Security</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Sessions</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Preferences</span>
              </TabsTrigger>
            </TabsList>

            <ProfileClient user={user as any} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}, { returnTo: '/profile' });

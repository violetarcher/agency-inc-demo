'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Shield,
  Smartphone,
  Key,
  Mail,
  Check,
  Plus,
  Trash2,
  Fingerprint,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface User {
  sub: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  phone_verified?: boolean;
}

interface AuthenticationMethod {
  id: string;
  type: string;
  name?: string;
  confirmed: boolean;
  created_at: string;
  last_auth_at?: string;
  phone_number?: string;
  email?: string;
}

interface MFAFactor {
  type: string;
  enabled: boolean;
  name: string;
  description: string;
}

interface MFAEnrollmentProps {
  user?: User;
}

export function MFAEnrollment({ user }: MFAEnrollmentProps) {
  const [enrolledMethods, setEnrolledMethods] = useState<AuthenticationMethod[]>([]);
  const [availableFactors, setAvailableFactors] = useState<MFAFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState<MFAFactor | null>(null);
  const [enrollmentData, setEnrollmentData] = useState({ phoneNumber: '', email: '', name: '' });
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<AuthenticationMethod | null>(null);

  useEffect(() => {
    fetchEnrolledMethods();
    fetchAvailableFactors();
  }, []);

  const fetchEnrolledMethods = async () => {
    try {
      const response = await fetch('/api/mfa/methods');
      if (response.ok) {
        const data = await response.json();
        setEnrolledMethods(data.methods || []);
        console.log('✅ Loaded enrolled methods:', data.methods?.length || 0);
      } else {
        console.error('❌ Failed to fetch enrolled methods:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching enrolled methods:', error);
    }
  };

  const fetchAvailableFactors = async () => {
    try {
      const response = await fetch('/api/mfa/factors');
      if (response.ok) {
        const data = await response.json();
        setAvailableFactors(data.factors || []);
        console.log('✅ Loaded available factors:', data.factors?.length || 0);
      } else {
        console.error('❌ Failed to fetch available factors:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching available factors:', error);
    }
  };

  const handleEnrollFactor = async () => {
    if (!selectedFactor) return;

    setLoading(true);
    try {
      const requestBody: any = {
        type: selectedFactor.type,
      };

      // Add required fields based on factor type
      if (selectedFactor.type === 'sms' || selectedFactor.type === 'phone') {
        if (!enrollmentData.phoneNumber) {
          toast.error('Phone number required', {
            description: 'Please enter your phone number to enroll SMS authentication.',
          });
          setLoading(false);
          return;
        }
        requestBody.phoneNumber = enrollmentData.phoneNumber;
      }

      if (selectedFactor.type === 'email') {
        if (!enrollmentData.email) {
          toast.error('Email required', {
            description: 'Please enter your email address to enroll email authentication.',
          });
          setLoading(false);
          return;
        }
        requestBody.email = enrollmentData.email;
      }

      if (enrollmentData.name) {
        requestBody.name = enrollmentData.name;
      }

      const response = await fetch('/api/mfa/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('MFA Factor Enrolled', {
          description: `${selectedFactor.name} has been successfully enrolled.`,
        });

        // Refresh methods and close dialog
        await fetchEnrolledMethods();
        setEnrollDialogOpen(false);
        setSelectedFactor(null);
        setEnrollmentData({ phoneNumber: '', email: '', name: '' });
      } else if (response.status === 403 && data.requiresStepUp) {
        // Handle step-up authentication requirement
        toast.info('Additional Verification Required', {
          description: 'Redirecting to complete multi-factor authentication...',
        });

        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1500);
      } else {
        toast.error('Enrollment Failed', {
          description: data.message || 'Failed to enroll MFA factor. Please try again.',
        });
      }
    } catch (error) {
      toast.error('Network Error', {
        description: 'Failed to connect to server. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = async () => {
    if (!methodToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/mfa/methods/${methodToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('MFA Method Removed', {
          description: 'The authentication method has been removed from your account.',
        });

        // Refresh methods and close dialog
        await fetchEnrolledMethods();
        setDeleteDialogOpen(false);
        setMethodToDelete(null);
      } else if (response.status === 403 && data.requiresStepUp) {
        // Handle step-up authentication requirement
        toast.info('Additional Verification Required', {
          description: 'Redirecting to complete multi-factor authentication...',
        });

        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1500);
      } else {
        toast.error('Removal Failed', {
          description: data.message || 'Failed to remove MFA method. Please try again.',
        });
      }
    } catch (error) {
      toast.error('Network Error', {
        description: 'Failed to connect to server. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllMFA = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to remove ALL MFA methods? This will disable multi-factor authentication on your account.'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch('/api/mfa/methods', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('MFA Reset Complete', {
          description: 'All authentication methods have been removed from your account.',
        });

        // Refresh methods
        await fetchEnrolledMethods();
      } else if (response.status === 403 && data.requiresStepUp) {
        // Handle step-up authentication requirement
        toast.info('Additional Verification Required', {
          description: 'Redirecting to complete multi-factor authentication...',
        });

        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1500);
      } else {
        toast.error('Reset Failed', {
          description: data.message || 'Failed to reset MFA. Please try again.',
        });
      }
    } catch (error) {
      toast.error('Network Error', {
        description: 'Failed to connect to server. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailVerification = async () => {
    setEmailVerificationLoading(true);
    try {
      const response = await fetch('/api/email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast.success('Email verification sent', {
          description: 'Please check your email for the verification link.',
        });
      } else {
        const error = await response.json();
        toast.error('Failed to send email', {
          description: error.details || 'Failed to send email verification link',
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Failed to connect to server. Please try again.',
      });
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  const getFactorIcon = (type: string) => {
    const iconClass = 'w-5 h-5';
    switch (type.toLowerCase()) {
      case 'sms':
      case 'phone':
        return <Smartphone className={iconClass} />;
      case 'totp':
        return <Key className={iconClass} />;
      case 'email':
        return <Mail className={iconClass} />;
      case 'webauthn-roaming':
      case 'webauthn-platform':
        return <Fingerprint className={iconClass} />;
      default:
        return <Shield className={iconClass} />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Verification
          </CardTitle>
          <CardDescription>
            Verify your email address to secure your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Mail
                className={`w-5 h-5 ${user?.email_verified ? 'text-green-600' : 'text-blue-600'}`}
              />
              <div>
                <p className="font-medium">
                  {user?.email_verified ? 'Email Verified' : 'Email Not Verified'}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email || 'No email set'}</p>
              </div>
            </div>
            {user?.email_verified ? (
              <Badge variant="default" className="bg-green-600">
                <Check className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Button
                onClick={handleSendEmailVerification}
                disabled={emailVerificationLoading}
                size="sm"
              >
                {emailVerificationLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Verification Email'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Multi-Factor Authentication Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Multi-Factor Authentication
              </CardTitle>
              <CardDescription>
                Manage your MFA methods for enhanced account security
              </CardDescription>
            </div>
            {enrolledMethods.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetAllMFA}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Reset All MFA
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enrolled Methods Section */}
          {enrolledMethods.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Enrolled Methods</h3>
                <div className="space-y-2">
                  {enrolledMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-green-600">{getFactorIcon(method.type)}</div>
                        <div>
                          <p className="font-medium">
                            {method.name || method.type.toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Enrolled on {formatDate(method.created_at)}
                            {method.phone_number && ` • ${method.phone_number}`}
                            {method.email && ` • ${method.email}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={method.confirmed ? 'default' : 'secondary'}
                          className={method.confirmed ? 'bg-green-600' : ''}
                        >
                          {method.confirmed ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            'Pending'
                          )}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setMethodToDelete(method);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No MFA methods enrolled yet. Add a method to secure your account.
              </p>
            </div>
          )}

          {/* Add New Method Section */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Available Authentication Methods</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableFactors.map((factor) => (
                <Dialog
                  key={factor.type}
                  open={enrollDialogOpen && selectedFactor?.type === factor.type}
                  onOpenChange={(open) => {
                    setEnrollDialogOpen(open);
                    if (!open) {
                      setSelectedFactor(null);
                      setEnrollmentData({ phoneNumber: '', email: '', name: '' });
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <button
                      onClick={() => setSelectedFactor(factor)}
                      disabled={loading}
                      className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors text-left w-full"
                    >
                      {getFactorIcon(factor.type)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{factor.name}</p>
                        <p className="text-xs text-muted-foreground">{factor.description}</p>
                      </div>
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getFactorIcon(factor.type)}
                        Enroll {factor.name}
                      </DialogTitle>
                      <DialogDescription>{factor.description}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* Phone Number Input for SMS */}
                      {(factor.type === 'sms' || factor.type === 'phone') && (
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={enrollmentData.phoneNumber}
                            onChange={(e) =>
                              setEnrollmentData({ ...enrollmentData, phoneNumber: e.target.value })
                            }
                          />
                        </div>
                      )}

                      {/* Email Input for Email */}
                      {factor.type === 'email' && (
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={enrollmentData.email}
                            onChange={(e) =>
                              setEnrollmentData({ ...enrollmentData, email: e.target.value })
                            }
                          />
                        </div>
                      )}

                      {/* Optional Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Display Name (Optional)</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Personal Phone, Work Email"
                          value={enrollmentData.name}
                          onChange={(e) =>
                            setEnrollmentData({ ...enrollmentData, name: e.target.value })
                          }
                        />
                      </div>

                      {/* Info Box */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> You may be prompted to complete multi-factor
                          authentication before enrolling this method.
                        </p>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEnrollDialogOpen(false);
                          setSelectedFactor(null);
                          setEnrollmentData({ phoneNumber: '', email: '', name: '' });
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleEnrollFactor} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          'Enroll Method'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Authentication Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this authentication method? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {methodToDelete && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                {getFactorIcon(methodToDelete.type)}
                <div>
                  <p className="font-medium">{methodToDelete.name || methodToDelete.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {methodToDelete.phone_number || methodToDelete.email || methodToDelete.id}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setMethodToDelete(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMethod}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Method'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

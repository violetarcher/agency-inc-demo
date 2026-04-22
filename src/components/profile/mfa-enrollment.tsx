'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
  RefreshCw,
  Info,
  Copy,
  Send,
  Terminal,
} from 'lucide-react';
import { hasMyAccountAudience, hasMyAccountScopes, getMyAccountAuthUrl } from '@/lib/my-account-token';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [enrollmentData, setEnrollmentData] = useState({ phoneNumber: '', email: '' });
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<AuthenticationMethod | null>(null);
  const [totpEnrollment, setTotpEnrollment] = useState<{
    id: string;
    barcode_uri: string;
    manual_input_code: string;
    auth_session: string;
  } | null>(null);
  const [otpEnrollment, setOtpEnrollment] = useState<{
    id: string;
    type: string;
    auth_session: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean;
    hasMyAccountAudience: boolean;
    hasMyAccountScopes: boolean;
    needsReauth: boolean;
  }>({
    hasToken: false,
    hasMyAccountAudience: false,
    hasMyAccountScopes: false,
    needsReauth: false,
  });

  // API Testing state
  const [accessToken, setAccessToken] = useState<string>('');
  const [myAccountDomain, setMyAccountDomain] = useState<string>('');
  const [testEndpoint, setTestEndpoint] = useState<string>('/me/v1/authentication-methods');
  const [testMethod, setTestMethod] = useState<string>('GET');
  const [testBody, setTestBody] = useState<string>('');
  const [testResponse, setTestResponse] = useState<{
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: any;
    error?: string;
  }>({});
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    // Fetch available factors and check token status on mount
    fetchAvailableFactors();
    checkTokenCapabilities();
  }, []);

  const fetchAccessToken = async () => {
    try {
      console.log('🔄 Requesting My Account API token via token exchange...');

      // Call the on-demand token exchange endpoint
      const response = await fetch('/api/mfa/auth/get-token', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessToken) {
          setAccessToken(data.accessToken);
          // CRITICAL: Use custom domain to match token audience
          // Token audience is https://login.authskye.org/me/ so API calls MUST use custom domain
          setMyAccountDomain('https://login.authskye.org');
          console.log('✅ My Account API token received:', {
            audience: data.audience,
            expiresIn: data.expiresIn,
            scope: data.scope,
          });

          toast.success('My Account API token ready', {
            description: 'Loading your MFA methods...',
          });

          // Now fetch enrolled methods
          await fetchEnrolledMethods();
        } else {
          console.error('❌ Token exchange response missing token:', data);
          toast.error('Token exchange failed', {
            description: data.message || 'Could not get My Account API token',
          });
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Token exchange failed:', errorData);

        toast.error('Token exchange not configured', {
          description: errorData.message || 'Please configure CTE Action and credentials',
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch My Account API token:', error);
      toast.error('Failed to get token', {
        description: 'Check console for details',
      });
    }
  };

  const checkTokenCapabilities = async () => {
    try {
      const response = await fetch('/api/auth/token');
      if (response.ok) {
        const data = await response.json();
        if (data.accessToken) {
          const hasAudience = hasMyAccountAudience(data.accessToken);
          const hasScopes = hasMyAccountScopes(data.accessToken);

          console.log('🔍 Token Analysis:', {
            hasToken: true,
            hasMyAccountAudience: hasAudience,
            hasMyAccountScopes: hasScopes,
            needsReauth: !hasAudience || !hasScopes,
          });

          setTokenInfo({
            hasToken: true,
            hasMyAccountAudience: hasAudience,
            hasMyAccountScopes: hasScopes,
            needsReauth: !hasAudience || !hasScopes,
          });

          // If token is valid, set it and fetch enrolled methods
          if (hasAudience && hasScopes) {
            setAccessToken(data.accessToken);
            setMyAccountDomain(process.env.NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL || 'https://login.authskye.org');

            // Fetch enrolled methods automatically
            await fetchEnrolledMethods();

            console.log('✅ Token is valid, enrolled methods loaded');
          }
        } else {
          setTokenInfo({
            hasToken: false,
            hasMyAccountAudience: false,
            hasMyAccountScopes: false,
            needsReauth: true,
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to check token:', error);
    }
  };

  const fetchEnrolledMethods = async () => {
    try {
      const response = await fetch('/api/mfa/methods');
      if (response.ok) {
        const data = await response.json();

        // Filter out non-MFA authentication methods (e.g., email verification)
        // Only include actual MFA types: phone (SMS), totp, webauthn, push-notification, email (OTP)
        const mfaTypes = ['phone', 'totp', 'webauthn', 'webauthn-roaming', 'webauthn-platform', 'push-notification', 'email'];
        const mfaMethods = (data.methods || []).filter((method: AuthenticationMethod) =>
          mfaTypes.includes(method.type)
        );

        setEnrolledMethods(mfaMethods);
        console.log('✅ Loaded enrolled MFA methods:', mfaMethods.length, '(filtered from', data.methods?.length || 0, 'total)');
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

  const handleVerifyOtp = async () => {
    if (!otpEnrollment || !verificationCode) {
      toast.error('Please enter verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/mfa/methods/${otpEnrollment.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          code: verificationCode,
          auth_session: otpEnrollment.auth_session,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verified!', {
          description: `${otpEnrollment.type === 'sms' ? 'SMS' : 'Email'} enrolled successfully.`,
        });

        // Refresh methods
        await fetchEnrolledMethods();

        // Close dialog
        setOtpEnrollment(null);
        setVerificationCode('');
        setSelectedFactor(null);
      } else {
        toast.error('Verification Failed', {
          description: data.message || 'Invalid code. Please try again.',
        });
      }
    } catch (error) {
      toast.error('Network Error', {
        description: 'Failed to verify code.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (!totpEnrollment || !verificationCode) {
      toast.error('Please enter verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/mfa/methods/${totpEnrollment.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          code: verificationCode,
          auth_session: totpEnrollment.auth_session,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('TOTP Verified!', {
          description: 'Authenticator app enrolled successfully.',
        });

        // Refresh methods
        await fetchEnrolledMethods();

        // Close dialog
        setTotpEnrollment(null);
        setVerificationCode('');
        setSelectedFactor(null);
      } else {
        toast.error('Verification Failed', {
          description: data.message || 'Invalid code. Please try again.',
        });
      }
    } catch (error) {
      toast.error('Network Error', {
        description: 'Failed to verify code.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollFactor = async () => {
    if (!selectedFactor) return;

    // WebAuthn requires special handling with browser credential API
    if (selectedFactor.type === 'webauthn-roaming' || selectedFactor.type === 'webauthn-platform') {
      await handleWebAuthnEnrollment(selectedFactor.type);
      return;
    }

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

      const response = await fetch('/api/mfa/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok || response.status === 202) {
        // Check if verification is required (TOTP, SMS, email, etc.)
        if (data.requiresVerification && data.method) {
          console.log('📋 Enrollment pending verification:', data.method);

          // Store TOTP enrollment data to show QR code
          if (data.method.barcode_uri) {
            setTotpEnrollment({
              id: data.method.id,
              barcode_uri: data.method.barcode_uri,
              manual_input_code: data.method.manual_input_code,
              auth_session: data.method.auth_session,
            });
            setVerificationCode('');
            toast.success('Enrollment Initiated', {
              description: `${selectedFactor.name} enrollment started. Scan the QR code.`,
            });
          } else {
            // SMS/Email/etc - needs verification but no QR code
            setOtpEnrollment({
              id: data.method.id,
              type: selectedFactor.type,
              auth_session: data.method.auth_session,
            });
            setVerificationCode('');
            toast.success('Verification Code Sent', {
              description: `Check your ${selectedFactor.type === 'sms' ? 'phone' : 'email'} for a verification code.`,
            });
          }

          // Close enroll dialog
          setEnrollDialogOpen(false);
        } else {
          toast.success('MFA Factor Enrolled', {
            description: `${selectedFactor.name} has been successfully enrolled.`,
          });

          // Refresh methods and close dialog
          await fetchEnrolledMethods();
          setEnrollDialogOpen(false);
          setSelectedFactor(null);
          setEnrollmentData({ phoneNumber: '', email: '' });
        }
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

  const handleWebAuthnEnrollment = async (type: string) => {
    setLoading(true);
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        toast.error('Not Supported', {
          description: 'WebAuthn is not supported in this browser.',
        });
        setLoading(false);
        return;
      }

      // Step 1: Initiate WebAuthn enrollment to get challenge from Auth0
      toast.info('Initiating enrollment...', {
        description: 'Contacting Auth0 to begin WebAuthn setup.',
      });

      const initiateResponse = await fetch('/api/mfa/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ type }),
      });

      const initiateData = await initiateResponse.json();

      if (!initiateResponse.ok) {
        throw new Error(initiateData.message || 'Failed to initiate WebAuthn enrollment');
      }

      console.log('✅ WebAuthn challenge received:', initiateData);

      // Step 2: Use browser's WebAuthn API to create credential
      const { method } = initiateData;
      const { authn_params_public_key } = method;

      if (!authn_params_public_key) {
        throw new Error('No WebAuthn challenge received from Auth0');
      }

      // Convert base64url challenge to ArrayBuffer
      const challenge = Uint8Array.from(
        atob(authn_params_public_key.challenge.replace(/-/g, '+').replace(/_/g, '/')),
        c => c.charCodeAt(0)
      );

      // Convert user.id from base64url to ArrayBuffer
      const userId = Uint8Array.from(
        atob(authn_params_public_key.user.id.replace(/-/g, '+').replace(/_/g, '/')),
        c => c.charCodeAt(0)
      );

      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: authn_params_public_key.rp,
        user: {
          ...authn_params_public_key.user,
          id: userId,
        },
        pubKeyCredParams: authn_params_public_key.pubKeyCredParams,
        timeout: authn_params_public_key.timeout,
        attestation: authn_params_public_key.attestation,
        authenticatorSelection: authn_params_public_key.authenticatorSelection,
      };

      toast.info('Waiting for authenticator...', {
        description: 'Please use your biometric sensor or security key.',
      });

      // Step 3: Create credential with browser API
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('No credential returned from authenticator');
      }

      console.log('✅ Credential created:', credential);

      // Step 4: Send credential response back to Auth0 via verify endpoint
      const response = credential.response as AuthenticatorAttestationResponse;

      // Convert ArrayBuffers to base64url
      const arrayBufferToBase64Url = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      };

      const credentialResponse = {
        id: credential.id,
        rawId: arrayBufferToBase64Url(credential.rawId),
        type: credential.type,
        response: {
          attestationObject: arrayBufferToBase64Url(response.attestationObject),
          clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
        },
      };

      toast.info('Completing enrollment...', {
        description: 'Verifying your credential with Auth0.',
      });

      const verifyResponse = await fetch(`/api/mfa/methods/${method.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          credential: credentialResponse,
          auth_session: method.auth_session,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok) {
        toast.success('Biometric Enrolled!', {
          description: 'Your biometric authentication has been successfully enrolled.',
        });

        // Refresh methods and close dialog
        await fetchEnrolledMethods();
        setEnrollDialogOpen(false);
        setSelectedFactor(null);
      } else {
        throw new Error(verifyData.message || 'Failed to verify credential');
      }
    } catch (error: any) {
      console.error('❌ WebAuthn enrollment failed:', error);

      if (error.name === 'NotAllowedError') {
        toast.error('Enrollment Cancelled', {
          description: 'You cancelled the biometric enrollment.',
        });
      } else if (error.name === 'NotSupportedError') {
        toast.error('Not Supported', {
          description: 'This authenticator type is not supported on your device.',
        });
      } else {
        toast.error('Enrollment Failed', {
          description: error.message || 'Failed to enroll biometric authentication.',
        });
      }
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
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
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

  const handleTestMyAccountAPI = async () => {
    setLoading(true);
    try {
      // First check the token
      const tokenResponse = await fetch('/api/mfa/auth/test-token');
      const tokenData = await tokenResponse.json();

      console.log('🧪 Token Test Results:', tokenData);

      if (!tokenData.diagnosis.canCallMyAccountAPI) {
        toast.error('Token Issue Detected', {
          description: tokenData.diagnosis.issues.join('. '),
        });
        return;
      }

      // Token looks good, try calling My Account API
      const myAccountResponse = await fetch('/api/mfa/auth/test-myaccount');
      const myAccountData = await myAccountResponse.json();

      console.log('🧪 My Account API Test Results:', myAccountData);

      if (myAccountData.success) {
        toast.success('My Account API Working!', {
          description: `Found ${myAccountData.data?.length || 0} authentication methods.`,
        });
      } else {
        toast.error('My Account API Call Failed', {
          description: myAccountData.recommendations?.[0] || myAccountData.message,
        });
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Test Failed', {
        description: 'Failed to test My Account API integration.',
      });
    } finally {
      setLoading(false);
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
      case 'webauthn':
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleTestEndpoint = async () => {
    setTestLoading(true);
    setTestResponse({});

    try {
      // Validate JSON if body is provided
      let parsedBody = null;
      if (testMethod !== 'GET' && testBody) {
        try {
          parsedBody = JSON.parse(testBody);
        } catch (e) {
          setTestResponse({
            error: 'Invalid JSON in request body',
          });
          setTestLoading(false);
          return;
        }
      }

      const fullUrl = `${myAccountDomain}${testEndpoint}`;

      console.log('🧪 Testing My Account API via proxy:', {
        url: fullUrl,
        method: testMethod,
        endpoint: testEndpoint,
        hasBody: !!parsedBody,
      });

      // Call the proxy endpoint
      const response = await fetch('/api/mfa/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: testMethod,
          endpoint: testEndpoint,
          body: parsedBody,
        }),
      });

      const data = await response.json();

      console.log('🧪 My Account API Response:', data);

      // The proxy returns the actual status in the body
      setTestResponse({
        status: data.status,
        statusText: data.statusText,
        headers: data.headers,
        body: data.body,
        error: data.error,
      });
    } catch (error: any) {
      console.error('🧪 My Account API Error:', error);
      setTestResponse({
        error: error.message || 'Request failed',
      });
    } finally {
      setTestLoading(false);
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-600';
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* My Account API Token Status */}
      {tokenInfo.needsReauth && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-orange-900">Authentication Required</CardTitle>
                <CardDescription className="text-orange-700 mt-1">
                  To manage MFA methods, you need to re-authenticate with My Account API permissions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Token Status Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 rounded bg-white/50">
                <span className="text-orange-800">Access Token</span>
                <Badge variant={tokenInfo.hasToken ? 'default' : 'secondary'}>
                  {tokenInfo.hasToken ? 'Present' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white/50">
                <span className="text-orange-800">My Account API Audience</span>
                <Badge variant={tokenInfo.hasMyAccountAudience ? 'default' : 'secondary'}>
                  {tokenInfo.hasMyAccountAudience ? 'Valid' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white/50">
                <span className="text-orange-800">My Account API Scopes</span>
                <Badge variant={tokenInfo.hasMyAccountScopes ? 'default' : 'secondary'}>
                  {tokenInfo.hasMyAccountScopes ? 'Valid' : 'Missing'}
                </Badge>
              </div>
            </div>

            <Separator className="bg-orange-200" />

            {/* Re-authenticate Button */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-orange-700">
                  Click below to authenticate with My Account API permissions
                </div>
                <Button
                  onClick={() => {
                    const authUrl = getMyAccountAuthUrl('/profile?tab=security');
                    console.log('🔄 Redirecting to My Account API auth:', authUrl);
                    window.location.href = authUrl;
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-authenticate
                </Button>
              </div>

              {/* Test My Account API Button */}
              {tokenInfo.hasToken && (
                <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                  <div className="text-sm text-orange-700">
                    Test My Account API integration
                  </div>
                  <Button
                    onClick={handleTestMyAccountAPI}
                    disabled={loading}
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Test API
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Exchange Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Token Exchange
          </CardTitle>
          <CardDescription>
            Exchange tokens for different API audiences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* My Account API Token */}
            <Button
              onClick={fetchAccessToken}
              disabled={loading || !!accessToken}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting Token...
                </>
              ) : accessToken ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  My Account API Token Ready
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Get My Account API Token
                </>
              )}
            </Button>

            {/* Standard API Token (placeholder for future) */}
            <Button
              variant="outline"
              disabled
              className="w-full"
            >
              <Key className="w-4 h-4 mr-2" />
              Get Standard API Token
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </Button>
          </div>

          {accessToken && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Token active - You can now manage MFA methods below
              </p>
            </div>
          )}
        </CardContent>
      </Card>
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
                      setEnrollmentData({ phoneNumber: '', email: '' });
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

                      {/* Info Box */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> You can enroll multiple authentication methods
                          to secure your account.
                        </p>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEnrollDialogOpen(false);
                          setSelectedFactor(null);
                          setEnrollmentData({ phoneNumber: '', email: '' });
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

      {/* TOTP QR Code Dialog */}
      <Dialog open={!!totpEnrollment} onOpenChange={() => setTotpEnrollment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white rounded-lg">
              {totpEnrollment && (
                <QRCodeSVG
                  value={totpEnrollment.barcode_uri}
                  size={200}
                  level="M"
                />
              )}
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label>Or enter manually:</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={totpEnrollment?.manual_input_code || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (totpEnrollment?.manual_input_code) {
                      navigator.clipboard.writeText(totpEnrollment.manual_input_code);
                      toast.success('Copied to clipboard');
                    }
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="space-y-2">
              <Label htmlFor="verify-code">Enter 6-digit code from your app</Label>
              <Input
                id="verify-code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>

            {/* Instructions */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>After scanning:</strong> Enter the 6-digit code shown in your authenticator app to complete enrollment.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTotpEnrollment(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifyTotp}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Complete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SMS/Email OTP Verification Dialog */}
      <Dialog open={!!otpEnrollment} onOpenChange={() => setOtpEnrollment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Verification Code</DialogTitle>
            <DialogDescription>
              {otpEnrollment?.type === 'sms'
                ? 'Enter the code sent to your phone via SMS'
                : 'Enter the code sent to your email'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Verification Code Input */}
            <div className="space-y-2">
              <Label htmlFor="otp-code">6-digit code</Label>
              <Input
                id="otp-code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
              />
            </div>

            {/* Instructions */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Didn't receive it?</strong> Check your spam folder or try enrolling again.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOtpEnrollment(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifyOtp}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Complete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

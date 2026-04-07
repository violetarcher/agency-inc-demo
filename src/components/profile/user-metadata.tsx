'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, Settings, Save, RotateCcw } from 'lucide-react';

const userMetadataSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name is too long'),
  bio: z.string().max(500, 'Bio is too long').optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location is too long').optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  company: z.string().max(100, 'Company name is too long').optional(),
  jobTitle: z.string().max(100, 'Job title is too long').optional(),
});

type UserMetadataForm = z.infer<typeof userMetadataSchema>;

interface UserMetadataProps {
  user: any;
}

export function UserMetadata({ user }: UserMetadataProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [initialData, setInitialData] = useState<UserMetadataForm>({
    displayName: '',
    bio: '',
    website: '',
    location: '',
    timezone: '',
    language: '',
    company: '',
    jobTitle: '',
  });

  const form = useForm<UserMetadataForm>({
    resolver: zodResolver(userMetadataSchema),
    defaultValues: initialData,
  });

  const fetchUserData = async () => {
    setFetchingUser(true);
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        setCurrentUser(userData);
      } else {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setCurrentUser(user);
    } finally {
      setFetchingUser(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const userData: UserMetadataForm = {
      displayName: currentUser?.name || '',
      bio: currentUser?.user_metadata?.bio || '',
      website: currentUser?.user_metadata?.website || '',
      location: currentUser?.user_metadata?.location || '',
      timezone: currentUser?.user_metadata?.timezone || 'UTC',
      language: currentUser?.user_metadata?.language || 'en',
      company: currentUser?.user_metadata?.company_name || currentUser?.user_metadata?.company || '',
      jobTitle: currentUser?.user_metadata?.job_title || '',
    };

    setInitialData(userData);
    form.reset(userData);
  }, [currentUser, form]);

  const onSubmit = async (data: UserMetadataForm) => {
    setLoading(true);

    try {
      const response = await fetch('/api/user/metadata', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_metadata: {
            bio: data.bio,
            website: data.website,
            location: data.location,
            timezone: data.timezone,
            language: data.language,
            company_name: data.company,
            job_title: data.jobTitle,
          },
          name: data.displayName,
        }),
      });

      if (response.ok) {
        await fetchUserData();
        toast.success("Profile updated", {
          description: "Your profile information has been saved successfully."
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating user metadata:', error);
      toast.error("Update failed", {
        description: "There was an error updating your profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.reset(initialData);
    toast.success("Changes discarded", {
      description: "All unsaved changes have been discarded."
    });
  };

  const isDirty = form.formState.isDirty;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and preferences
            {fetchingUser && <span className="text-muted-foreground"> (Loading latest data...)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your display name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is how your name will appear to others
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/500 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Preferences
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <Input placeholder="UTC" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your preferred timezone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <FormControl>
                          <Input placeholder="English" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your preferred language
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Professional Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Your company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Your job title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !isDirty}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={!isDirty}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

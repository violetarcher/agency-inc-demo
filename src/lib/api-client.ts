export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  details?: any;
}

class ApiClient {
  private async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.error || `HTTP ${response.status}`,
        data?.details
      );
    }

    return data;
  }

  // Organization members
  async getOrganizationMembers() {
    return this.request('/api/organization/members');
  }

  async inviteMember(email: string, roles: string[]) {
    return this.request('/api/organization/members', {
      method: 'POST',
      body: JSON.stringify({ email, roles }),
    });
  }

  async removeMember(memberId: string) {
    return this.request(`/api/organization/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  async updateMemberRoles(memberId: string, roles: string[]) {
    return this.request(`/api/organization/members/${memberId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roles }),
    });
  }

  // Session management
  async getOrganizationSessions() {
    return this.request('/api/auth/session/list');
  }

  async validateSession() {
    return this.request('/api/auth/session/validate');
  }

  // Access requests
  async requestAccess(role: string, reason: string) {
    return this.request('/api/request-access', {
      method: 'POST',
      body: JSON.stringify({ accessRequest: { role, reason } }),
    });
  }

  // Generic methods
  get<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  post<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T = any>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
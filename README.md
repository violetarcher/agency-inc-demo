# Agency Inc. - B2B RBAC Dashboard

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Auth0](https://img.shields.io/badge/Auth0-EB5424?style=for-the-badge&logo=auth0&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

This project is a demonstration of a B2B Software-as-a-Service (SaaS) application built with a modern, full-stack architecture. It showcases complex identity and authorization patterns using **Auth0** for a fictional company, "Agency Inc."

The application serves as a robust template for building multi-tenant, secure, and feature-rich enterprise applications.

## Key Features

### Authentication & Identity
* **Multi-Tenant Logins**: Supports logins for multiple distinct organizations using Auth0 Organizations.
* **Custom Login Flow**: A custom, in-app page prompts users for their organization name, supporting organization-specific connections (e.g., a customer's private SSO).
* **Invitation-Based Sign-up**: A secure flow allows admins to invite new users, who can then sign up and be automatically added to the correct organization.
* **Secure Session Management**: Uses the `@auth0/nextjs-auth0` SDK for secure, server-side session management.
* **Federated Logout**: Ensures users are logged out of both the application and their central Auth0 session.

### Authorization
* **Role-Based Access Control (RBAC)**: Implements a multi-role system (`viewer`, `editor`, `admin`, `Data Analyst`) where UI elements and API access are controlled by the user's assigned roles.
* **Permission-Based API Security**: Backend API routes are protected and verify specific permissions (e.g., `create:reports`) before executing actions.
* **Step-up Authentication with MFA**: Sensitive actions, like deleting a report, require the user to "step up" their session by completing a Multi-factor Authentication (MFA) challenge.
* **Server-Side Enforcement**: All authorization checks are securely performed on the backend, preventing client-side bypass.

### Admin Dashboard
* **Protected Admin Route**: A dedicated `/admin` dashboard is only visible and accessible to users with the `admin` role.
* **Full Member Management UI**: Admins can perform all necessary user management tasks directly within the application:
    * View members and their assigned roles.
    * Invite new members to the organization.
    * Remove existing members from the organization.
    * Assign and update roles for any member.
* **Auth0 Management API Integration**: All admin actions are securely proxied through the Next.js backend, which uses a Machine-to-Machine (M2M) application to interact with the Auth0 Management API.

### In-App Access Requests
* **Gated Content**: The `/analytics` page is only accessible to users with the `Data Analyst` role.
* **Request Access Flow**: Users without the role are presented with a "Request Access" button.
* **Automated Notification**: Clicking the button updates the user's `app_metadata` in Auth0 and triggers a Post-Login Auth0 Action to send a detailed access request notification to a Slack channel.

### UI/UX & Development
* **Modern Stack**: Built with the Next.js App Router.
* **Component-Based UI**: Styled with Tailwind CSS and `shadcn/ui`.
* **Persistent Layout**: A consistent sidebar and header are used across all protected application routes.
* **Dynamic UI**: The sidebar dynamically highlights the active page and conditionally renders links based on user roles.
* **Dark Mode**: Includes a dark grayscale theme with a theme toggle.
* **Debugging Tools**: Features a `/inspector` page for logged-in users to view the decoded contents of their `idToken` and `accessToken`.

---

## Local Setup Instructions

### Prerequisites

* Node.js (v18 or later)
* Git
* A free [Auth0 Account](https://auth0.com)
* A free [Firebase Account](https://firebase.google.com)
* A free [ngrok Account](https://ngrok.com)

---

### **Phase 1: Auth0 Configuration**

1.  **Create an API**: Go to **Applications > APIs** and create an API (`Agency Inc API`) with the identifier `https://b2b-saas-api.example.com`.
    * In its **Permissions** tab, add: `read:reports`, `create:reports`, `edit:reports`, `delete:reports`, `read:analytics`.
    * In its **Settings** tab, enable **Enable RBAC** and **Add Permissions in the Access Token**.

2.  **Create the Main Application**: Go to **Applications > Applications** and create a **Next.js** application named `Agency Inc Dashboard`.

3.  **Define Roles**: Go to **User Management > Roles** and create the roles: `viewer`, `editor`, `admin`, and `Data Analyst`. Assign the API permissions to these roles as needed.

4.  **Create a Machine-to-Machine (M2M) Application**: Go to **Applications > Applications** and create an **M2M** application named `Agency Inc Backend Manager`.
    * Authorize it for the **Auth0 Management API**.
    * Grant it the following permissions (scopes): `read:organization_members`, `create:organization_invitations`, `delete:organization_members`, `read:organization_member_roles`, `create:organization_member_roles`, `delete:organization_member_roles`, `read:roles`, `update:users`, `read:users_app_metadata`, `update:users_app_metadata`.

5.  **Create Organization**: Go to **Organizations** and create `Agency Inc`.
    * In its **Applications** tab, enable `Agency Inc Dashboard`.
    * In its **Connections** tab, enable your `Username-Password-Authentication` database connection. Click `...` > `Connection details` and ensure **Show sign-up** is enabled and **Auto-Membership** is configured for your desired security flow.

6.  **Create Login Actions**: Go to **Actions > Flows > Login**. Create any necessary custom actions (e.g., `Handle Organization Login`) and add required secrets (like your M2M credentials and Slack Webhook URL).

---

### **Phase 2: Firebase Configuration**

1.  Create a project in the [Firebase Console](https://console.firebase.google.com) and enable **Firestore Database**.
2.  Go to **Project settings > Service accounts** and **Generate new private key** to download your service account `.json` file.

---

### **Phase 3: `ngrok` Setup**

Auth0 requires HTTPS for many features. `ngrok` provides this for your local server.

1.  **Authenticate**: Get your authtoken from the [ngrok Dashboard](https://dashboard.ngrok.com) and run `ngrok config add-authtoken <YOUR_TOKEN>`.
2.  **Claim Domain**: In the ngrok dashboard, go to **Cloud Edge > Domains** and claim a free static domain.
3.  **Start Tunnel**: In a terminal, run `ngrok http 4020 --domain your-static-domain.ngrok-free.app`. Keep this running.

---

### **Phase 4: Project and URL Configuration**

1.  **Clone Repository**: `git clone https://github.com/violetarcher/agency-inc-demo.git` and `cd agency-inc-demo`.

2.  **Create `.env.local` File**: Create this file in the project root. **`AUTH0_BASE_URL` must be your `https://` ngrok domain.**

    ```
    # Auth0 App
    AUTH0_SECRET='<generate a long, secure secret>'
    AUTH0_BASE_URL='<your-https-ngrok-domain>'
    AUTH0_ISSUER_BASE_URL='<your-auth0-domain>'
    AUTH0_CLIENT_ID='<your-agency-inc-dashboard-client-id>'
    AUTH0_CLIENT_SECRET='<your-agency-inc-dashboard-client-secret>'
    AUTH0_AUDIENCE='[https://b2b-saas-api.example.com](https://b2b-saas-api.example.com)'

    # Auth0 Management API (from your M2M App)
    AUTH0_MGMT_DOMAIN='<your-auth0-domain-without-https>'
    AUTH0_MGMT_CLIENT_ID='<your-m2m-app-client-id>'
    AUTH0_MGMT_CLIENT_SECRET='<your-m2m-app-client-secret>'

    # Firebase
    FIREBASE_SERVICE_ACCOUNT_BASE64='<your-base64-encoded-firebase-key-json>'
    ```

3.  **Update Auth0 Dashboard URLs**: In your `Agency Inc Dashboard` application settings in Auth0:
    * Set the **Allowed Callback URLs** and **Allowed Logout URLs** to your `https://` ngrok domain.
    * Set the **Application Login URI** to your `https://` ngrok domain followed by `/api/auth/login`.

---

### **Phase 5: Install and Run**

1.  **Install Dependencies**: `npm install`
2.  **Run Application**: In a new terminal (while `ngrok` is running), start the app: `npm run dev`.

Your application is now fully running and accessible at your public `https://` ngrok domain.
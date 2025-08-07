# Agency Inc. - B2B RBAC Dashboard

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Auth0](https://img.shields.io/badge/Auth0-EB5424?style=for-the-badge&logo=auth0&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

This project is a demonstration of a B2B Software-as-a-Service (SaaS) application built with Next.js. It showcases how to use **Auth0 Organizations** to implement Role-Based Access Control (RBAC) and build an in-app dashboard for managing organization members.

## Features

* **Public Homepage & On-Demand Login**: The application has a public landing page, with logins triggered when accessing protected features.
* **Role-Based Access Control (RBAC)**:
    * **Admin**: Can view reports and access the admin dashboard to manage users.
    * **Editor**: Can view, create, edit, and delete reports they own.
    * **Viewer**: Can only view reports.
* **In-App User Management**: A complete admin dashboard to view, invite, remove, and assign roles to organization members, powered by the Auth0 Management API.
* **Secure API**: Backend API routes are protected and verify permissions for every action.
* **Modern UI**: Built with shadcn/ui and Tailwind CSS.

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

* Node.js (v18 or later)
* Git
* A free [Auth0 Account](https://auth0.com)
* A free [Firebase Account](https://firebase.google.com)
* A free [ngrok Account](https://ngrok.com)

---

### **Phase 1: Auth0 Configuration**

1.  **Create an API**
    * In your Auth0 Dashboard, go to **Applications > APIs**.
    * Create a new API named `Agency Inc API` with the Identifier (Audience) `https://b2b-saas-api.example.com`.
    * In the API's **Permissions** tab, add: `read:reports`, `create:reports`, `edit:reports`, `delete:reports`.
    * In the API's **Settings** tab, enable **Enable RBAC** and **Add Permissions in the Access Token**.

2.  **Create the Main Application**
    * Go to **Applications > Applications** and create a **Next.js** application named `Agency Inc Dashboard`.

3.  **Define Roles**
    * Go to **User Management > Roles** and create three roles: `viewer`, `editor`, and `admin`.
    * Assign the API permissions you created in step 1 to these roles accordingly.

4.  **Create a Machine-to-Machine (M2M) Application**
    * Go to **Applications > Applications** and create an **M2M** application named `Agency Inc Backend Manager`.
    * In the M2M app's **APIs** tab, authorize the **Auth0 Management API**.
    * Grant it the following permissions (scopes): `read:organization_members`, `create:organization_invitations`, `delete:organization_members`, `read:organization_member_roles`, `create:organization_member_roles`, `delete:organization_member_roles`, `read:roles`, and `update:users`.

5.  **Create the Organization**
    * Go to **Organizations** and create a new organization named `Agency Inc`.
    * In the organization's **Applications** tab, enable the `Agency Inc Dashboard` application.
    * In the organization's **Connections** tab, enable your `Username-Password-Authentication` database connection. Then, click the `...` menu on the connection, select `Connection details`, and ensure both **Auto-Membership** and **Show sign-up** are enabled.

6.  **Create the "Add Roles" Action**
    * Go to **Actions > Flows** and select the **Login** flow.
    * Create a new custom action named `Add Roles to Token`.
    * Use the following code:
        ```javascript
        exports.onExecutePostLogin = async (event, api) => {
        const namespace = 'https://agency-inc-demo.com';
        if (event.authorization) {
        api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
        }
      };
        ```
    * Deploy the action and drag it into the Login flow diagram.

---

### **Phase 2: Firebase Configuration**

1.  Create a new project in the [Firebase Console](https://console.firebase.google.com).
2.  Enable **Firestore Database** in **Production mode**.
3.  Go to **Project settings > Service accounts** and **Generate new private key** to download your service account `.json` file.

---

### **Phase 3: `ngrok` Setup**

Auth0 invitations require a secure HTTPS URL. `ngrok` provides one for your local server.

1.  **Sign up and Authenticate**: Go to the [ngrok Dashboard](https://dashboard.ngrok.com), get your authtoken, and add it to your local CLI: `ngrok config add-authtoken <YOUR_TOKEN>`.
2.  **Claim a Static Domain**: In the ngrok dashboard, go to **Cloud Edge > Domains** and claim your free static domain (e.g., `agency-inc-demo.ngrok-free.app`).
3.  **Start the Tunnel**: Open a dedicated terminal window and run:
    ```bash
    ngrok http 4020 --domain your-static-domain.ngrok-free.app
    ```
    Keep this terminal running.

---

### **Phase 4: Project and URL Configuration**

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/violetarcher/agency-inc-demo.git](https://github.com/violetarcher/agency-inc-demo.git)
    cd agency-inc-demo
    ```

2.  **Create `.env.local` File**
    * Create a `.env.local` file in the project root.
    * **IMPORTANT**: `AUTH0_BASE_URL` must be your `https://` ngrok domain.

    ```
    # Auth0 App
    AUTH0_SECRET='<generate a long, secure secret using: openssl rand -hex 32>'
    AUTH0_BASE_URL='<your-https-ngrok-domain>'
    AUTH0_ISSUER_BASE_URL='<your-auth0-domain>'
    AUTH0_CLIENT_ID='<your-agency-inc-dashboard-client-id>'
    AUTH0_CLIENT_SECRET='<your-agency-inc-dashboard-client-secret>'
    AUTH0_AUDIENCE='https://b2b-saas-api.example.com'

    # Auth0 Management API (from your M2M App)
    AUTH0_MGMT_DOMAIN='<your-auth0-domain-without-https>'
    AUTH0_MGMT_CLIENT_ID='<your-m2m-app-client-id>'
    AUTH0_MGMT_CLIENT_SECRET='<your-m2m-app-client-secret>'

    # Firebase
    FIREBASE_SERVICE_ACCOUNT_BASE64='<your-base64-encoded-firebase-key-json>'
    ```

3.  **Update Auth0 Dashboard URLs**
    * Go to your `Agency Inc Dashboard` application settings in Auth0.
    * Set the **Allowed Callback URLs** and **Allowed Logout URLs** to use your `https://` ngrok domain.
    * In the same settings page, find the **Application Login URI** field and set it to your `https://` ngrok domain followed by `/api/auth/login`.

---

### **Phase 5: Install and Run**

1.  **Install Dependencies**
    ```bash
    npm install
    ```
2.  **Run the Application**
    * In a new terminal (while `ngrok` is running in another), start the app:
    ```bash
    npm run dev
    ```
    Your application will be accessible via your public `https://` ngrok domain.
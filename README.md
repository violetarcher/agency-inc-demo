# Agency Inc. - B2B RBAC Dashboard

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Auth0](https://img.shields.io/badge/Auth0-EB5424?style=for-the-badge&logo=auth0&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

This project is a demonstration of a B2B Software-as-a-Service (SaaS) application built with Next.js. It showcases how to use **Auth0 Organizations** to implement Role-Based Access Control (RBAC) for different users within a single customer organization.

The application is an expense reporting dashboard for a fictional company, "Agency Inc."

## Features

* **Organization-Based Logins**: Users log in under the context of their organization.
* **Role-Based Access Control (RBAC)**:
    * **Admin**: Can Create, Read, Update, and Delete reports.
    * **Editor**: Can Create, Read, and Update reports.
    * **Viewer**: Can only Read reports.
* **Secure API**: Backend API routes are protected and verify permissions for every action.
* **Modern UI**: Built with shadcn/ui and Tailwind CSS.
* **Persistent Storage**: Expense reports are stored in Google Firestore.

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or later)
* [Git](https://git-scm.com/)
* A free [Auth0 Account](https://auth0.com)
* A free [Firebase Account](https://firebase.google.com)

---

### **Phase 1: Auth0 Configuration**

1.  **Create an API**
    * In your Auth0 Dashboard, go to **Applications > APIs**.
    * Click **+ Create API**.
    * **Name**: `Agency Inc API`
    * **Identifier (Audience)**: `https://b2b-saas-api.example.com`

2.  **Define API Permissions**
    * In your new API's **Permissions** tab, add the following permissions:
        * `read:reports`
        * `create:reports`
        * `edit:reports`
        * `delete:reports`

3.  **Enable RBAC for the API**
    * In the API's **Settings** tab, scroll down and enable both:
        * **Enable RBAC**
        * **Add Permissions in the Access Token**

4.  **Create an Application**
    * Go to **Applications > Applications** and click **+ Create Application**.
    * **Name**: `Agency Inc Dashboard`
    * **Application Type**: **Next.js**
    * Configure the following URLs:
        * **Allowed Callback URLs**: `http://localhost:4020/api/auth/callback`
        * **Allowed Logout URLs**: `http://localhost:4020/`

5.  **Create an Organization**
    * Go to **Organizations** and click **+ Create Organization**.
    * **Name**: `Agency Inc`

6.  **Define Roles and Assign Permissions**
    * Go to **User Management > Roles** and create three roles:
    * **Role 1: `viewer`**
        * Assign it the `read:reports` permission.
    * **Role 2: `editor`**
        * Assign it `read:reports`, `create:reports`, and `edit:reports`.
    * **Role 3: `admin`**
        * Assign it all four permissions.

7.  **Invite Users**
    * Go to your `Agency Inc` organization, select the **Members** tab, and invite three users.
    * Assign each user their corresponding role within the organization.

---

### **Phase 2: Firebase Configuration**

1.  **Create a Firebase Project**
    * Go to the [Firebase Console](https://console.firebase.google.com) and create a new project.
2.  **Enable Firestore**
    * From your project's dashboard, go to **Build > Firestore Database**.
    * Click **Create database** and start in **Production mode**.
3.  **Generate Service Account Key**
    * Click the gear icon ⚙️ next to Project Overview and select **Project settings**.
    * Go to the **Service accounts** tab.
    * Click **Generate new private key**. A `.json` file will be downloaded.

---

### **Phase 3: Local Project Setup**

1.  **Clone the Repository**
    ```bash
    git clone <your-repo-url>
    cd <repo-folder>
    ```

2.  **Create Environment File**
    * Create a file named `.env.local` in the root of the project.
    * Copy the content of `.env.example` (if present) or use the template below.

    ```
    # Auth0
    AUTH0_SECRET='<generate a long, secure secret using: openssl rand -hex 32>'
    AUTH0_BASE_URL='http://localhost:4020'
    AUTH0_ISSUER_BASE_URL='<your-auth0-domain, e.g., [https://your-tenant.us.auth0.com](https://your-tenant.us.auth0.com)>'
    AUTH0_CLIENT_ID='<your-auth0-application-client-id>'
    AUTH0_CLIENT_SECRET='<your-auth0-application-client-secret>'
    AUTH0_AUDIENCE='[https://b2b-saas-api.example.com](https://b2b-saas-api.example.com)'

    # Firebase
    # Generate this by Base64 encoding your entire service account JSON file
    FIREBASE_SERVICE_ACCOUNT_BASE64='<your-base64-encoded-firebase-key>'
    ```
    * **To get `FIREBASE_SERVICE_ACCOUNT_BASE64`**: Run one of the following commands on the `.json` file you downloaded from Firebase:
        * **macOS:** `base64 -i service-account.json`
        * **Linux:** `base64 -w 0 service-account.json`

3.  **Install Dependencies**
    ```bash
    npm install
    ```

4.  **Run the Application**
    ```bash
    npm run dev -- -p 4020
    ```
    Your application will be running at **http://localhost:4020**.

## Testing the Application

Log in with the different user accounts you created to see the RBAC in action. Remember to add your **Organization ID** to the login link in `src/app/page.tsx`.

* **Viewer**: Can only see the list of reports.
* **Editor**: Can add and edit reports.
* **Admin**: Can add, edit, and delete reports.
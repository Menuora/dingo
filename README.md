# Dingo Sellable Hotel/Restaurant Template

A portable, white-label, serverless restaurant website template with a client-side administration dashboard. It supports persistent database storage, user authentication, and image uploads without requiring a custom Node.js server.

---

## 🚀 Key Features

*   **Fully Serverless/Static Friendly:** Deployable on GitHub Pages, Netlify, Vercel, or any static provider.
*   **White-Label Ready:** Hotel/restaurant owners can own their website data by swapping Firebase and Cloudinary credentials in a simple config file (`js/env.js`).
*   **Dual Mode Architecture:**
    1.  **Firebase Mode:** Production-ready real-time synchronization, Firestore database storage, Firebase Authentication, and Cloudinary uploads.
    2.  **Fallback Mode:** Uses browser `localStorage` automatically if Firebase keys are missing/empty. Perfect for zero-setup local development or instant templates!
*   **Admin Dashboard:**
    *   Manage general website settings (name, social links, opening times, map location).
    *   Update homepage background/corner images.
    *   Upload, view, and delete menu and food gallery images.
    *   View and delete reservation/table bookings.
    *   View and delete customer contact form submissions.
    *   Change admin access password.

---

## 🛠️ Client-Side White-Label Configuration

To configure the website for a specific hotel/restaurant owner:

1.  Copy `js/env.example.js` to `js/env.js`:
    ```bash
    cp js/env.example.js js/env.js
    ```
2.  Provide the hotel owner's Firebase and Cloudinary credentials in `js/env.js`:
    ```javascript
    window.ENV = {
      firebase: {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
        projectId: "YOUR_FIREBASE_PROJECT_ID",
        storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
        messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
        appId: "YOUR_FIREBASE_APP_ID"
      },
      cloudinary: {
        cloudName: "YOUR_CLOUDINARY_CLOUD_NAME",
        uploadPreset: "YOUR_CLOUDINARY_UPLOAD_PRESET"
      }
    };
    ```

3.  Set up **Firestore Database Security Rules** using the provided `firestore.rules` file in your Firebase project.

---

## 💻 Optional Local Node Server Setup

For developers wanting to test or run local builds with the Express fallback:

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Copy `.env.example` to `.env` and fill in credentials:
    ```bash
    cp .env.example .env
    ```
3.  Run locally:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:3000`.
5.  Access the admin panel at `http://localhost:3000/admin`.

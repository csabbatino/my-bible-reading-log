# My Bible Reading Log — Setup Guide

## Overview
This is a React + Firebase web app. You'll need to:
1. Set up Firebase (free)
2. Add your Firebase credentials to the code
3. Deploy to Vercel (free)

---

## STEP 1: Set Up Firebase

### Create a Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it something like `my-bible-reading-log`
4. Disable Google Analytics (not needed) and click **Create project**

### Add a Web App
1. On your project dashboard, click the **`</>`** (Web) icon
2. Register the app with a nickname (e.g. "Bible Log")
3. You'll see a `firebaseConfig` object — **copy it**, you'll need it soon

### Enable Authentication
1. In the left sidebar, click **Build → Authentication**
2. Click **"Get started"**
3. Click **Google** → toggle Enable → Save
4. Click **Apple** → toggle Enable → follow the prompts (you'll need an Apple Developer account for Apple Sign-In; Google-only is fine to start)

### Create Firestore Database
1. In the sidebar, click **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** → select a region → Enable

### Set Security Rules
1. In Firestore, click the **Rules** tab
2. Copy the rules from `FIREBASE_RULES.md` and paste them in
3. Click **Publish**

---

## STEP 2: Add Your Firebase Credentials

Open the file: `src/utils/firebase.js`

Find the section near the top that looks like this:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  ...
};
```

Replace the placeholder values with the `firebaseConfig` you copied from Step 1.

---

## STEP 3: Deploy to Vercel

### First-Time Setup
1. Go to https://github.com and create a free account if you don't have one
2. Create a new repository called `my-bible-reading-log`
3. Upload all the project files to that repository

   If you're not familiar with GitHub, the easiest way is:
   - On your new repo page, click **"uploading an existing file"**
   - Drag and drop all the project files
   - Click **"Commit changes"**

### Deploy on Vercel
1. Go to https://vercel.com and sign in with your GitHub account
2. Click **"Add New Project"**
3. Find and select your `my-bible-reading-log` repository
4. Vercel will auto-detect it's a Vite/React project
5. Click **Deploy**

That's it! In about 60 seconds your app will be live at a URL like:
`https://my-bible-reading-log.vercel.app`

### Updating the App Later
Any time you want to make changes, update the files on GitHub and Vercel will automatically redeploy.

---

## STEP 4: Add Family Members

1. Share the app URL with your family
2. Have each person sign in with Google (or Apple)
3. In the app, go to **Settings → Create Family Group**
4. Once the group exists, enter each family member's email to add them
   - Note: they need to sign in at least once before you can add them

---

## File Structure Reference

```
my-bible-reading-log/
├── index.html              # App entry point
├── package.json            # Dependencies
├── vite.config.js          # Build config
├── FIREBASE_RULES.md       # Paste into Firebase console
├── SETUP.md                # This file
└── src/
    ├── main.jsx            # React entry
    ├── App.jsx             # Root component, navigation
    ├── data/
    │   ├── bibleData.js    # All 66 books, chapters, structure
    │   └── themes.js       # Color themes
    ├── utils/
    │   ├── firebase.js     # ← PUT YOUR CREDENTIALS HERE
    │   └── progress.js     # Progress calculation helpers
    ├── components/
    │   └── UI.jsx          # Reusable components
    └── pages/
        ├── SignIn.jsx      # Google/Apple sign in
        ├── Dashboard.jsx   # Personal progress home
        ├── Books.jsx       # Book/section list
        ├── Chapters.jsx    # Chapter checklist + notes
        ├── Family.jsx      # Family comparison view
        └── Settings.jsx    # Themes, family management
```

---

## Troubleshooting

**"Sign in failed"** — Double-check that Google Authentication is enabled in Firebase and that your `authDomain` in the config matches your Firebase project.

**"Permission denied"** — Make sure you published the security rules from `FIREBASE_RULES.md`.

**App shows blank screen** — Open browser DevTools (F12) and check the Console tab for errors. Usually this means a missing or incorrect Firebase credential.

**Apple Sign-In not working** — Apple requires a paid Apple Developer account and additional domain configuration. Start with Google Sign-In only — it works for both iPhone and Android users.

---

## Push Notifications (Optional but Recommended)

Firebase Cloud Messaging (FCM) is **completely free** for a family app — no charges at this scale.

### Setup Steps
1. In Firebase Console → **Project Settings → Cloud Messaging**
2. Scroll to "Web configuration" and click **Generate key pair**
3. Copy the key shown — this is your **VAPID key**
4. Open `src/utils/goals.js` and replace `"YOUR_VAPID_PUBLIC_KEY"` with it

### Create the Service Worker File
Create a new file at `public/firebase-messaging-sw.js` with this content
(paste your actual firebaseConfig values):

```js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon-192.png'
  });
});
```

That's all the client setup needed. Family members will be asked to allow
notifications the first time they toggle it on in Settings. It works best
when the app is saved to the home screen on their phone.

To actually **send** daily reminder notifications, you'd use Firebase Cloud
Functions (a small backend script) — this is an optional next step we can
set up together later.

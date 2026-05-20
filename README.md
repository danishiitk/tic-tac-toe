# Online Tic Tac Toe

A React + Vite tic-tac-toe game where two players can play the same match from different browsers through a shared Firebase room link.

## What It Does

- Signs players in with Firebase Anonymous Auth behind the scenes.
- Lets a player enter a display name and create a room.
- Generates a shareable `?room=` link for the second player.
- Syncs the board, turn, winner, and draw state through Cloud Firestore.
- Uses Firestore transactions so simultaneous clicks cannot overwrite each other.
- Keeps the board locked unless the room is active and it is your turn.
- Supports a new round after a win or draw.
- Lets a player leave the room and shows the other player when someone disconnects.

## Tech Stack

- React 19
- Vite
- Firebase Authentication with Anonymous sign-in
- Cloud Firestore
- Firebase Hosting

## Keep It Free

Use the Firebase **Spark** plan only.

To avoid paid features:

- Do not add billing.
- Do not upgrade to Blaze.
- Do not use Cloud Functions.
- Do not use Phone Auth.
- Do not use Firebase App Hosting.
- Use regular Firebase Hosting, Cloud Firestore, and Anonymous Auth.

For a small tic-tac-toe app, the free plan is enough unless the app gets heavy public traffic.

## Full Firebase Setup

### 1. Create A Firebase Project

1. Open Firebase Console.
2. Click **Add project**.
3. Name it something like `tic-tac-toe-online`.
4. Disable Google Analytics. This app does not need it.
5. Create the project.
6. Confirm the project is on the Spark/free plan.

### 2. Add A Web App

1. Inside the Firebase project, click the web icon: `</>`.
2. App nickname: `tic-tac-toe-web`.
3. When Firebase shows **Also set up Firebase Hosting for this app**, leave it unchecked.
4. Click **Register app**.
5. Firebase will show config values like `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId`.

Leave the Hosting checkbox unchecked because this repo already has `firebase.json` configured for Firebase Hosting.

### 3. Create `.env.local`

Use `.env.local` for real local Firebase values:

```bash
cp .env.example .env.local
```

Fill `.env.local` with the values from Firebase:

```env
VITE_FIREBASE_API_KEY=your_apiKey
VITE_FIREBASE_AUTH_DOMAIN=your_authDomain
VITE_FIREBASE_PROJECT_ID=your_projectId
VITE_FIREBASE_STORAGE_BUCKET=your_storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messagingSenderId
VITE_FIREBASE_APP_ID=your_appId
```

Use `.env.local` instead of `.env` for your real machine-specific values. `.env.example` is only a template and is safe to commit.

Vite exposes browser environment variables through `import.meta.env`, so this code is correct:

```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

The variable names must start with `VITE_`. If you create or change `.env.local` while the dev server is running, stop and restart `npm run dev`.

Firebase web config values are visible in the browser build. That is normal. Security comes from Firebase Auth and Firestore rules, not from hiding these config values.

### 4. Enable Anonymous Authentication

1. In Firebase Console, go to **Build** -> **Authentication**.
2. Click **Get started**.
3. Open **Sign-in method**.
4. Select **Anonymous**.
5. Enable it and save.

The UI only asks for a display name, but Anonymous Auth gives each browser a Firebase user id so Firestore rules can protect rooms and moves.

### 5. Create Cloud Firestore Database

1. In Firebase Console, go to **Build** -> **Firestore Database**.
2. Click **Create database**.
3. Choose **Production mode**.
4. Choose a nearby region.
5. Create the database.

Choose the region carefully because Firestore location is generally not something you casually change later.

### 6. Install And Login To Firebase CLI

Install the Firebase CLI:

```bash
npm install -g firebase-tools
```

Log in with the same Google account:

```bash
firebase login
```

### 7. Connect This Repo To Firebase

From this project folder:

```bash
firebase use --add
```

Choose the Firebase project you created. When asked for an alias, type:

```text
default
```

This creates `.firebaserc`.

### 8. Deploy Firestore Rules

Deploy the included rules before testing with real players:

```bash
firebase deploy --only firestore
```

The rules in `firestore.rules` are important because they prevent random users from freely editing game data.

## Local Development

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Test two-player online behavior:

1. Enter your name.
2. Click **Create Room**.
3. Copy the room link.
4. Open an incognito/private browser window.
5. Paste the room link.
6. Enter a second player name.
7. Join the room.
8. Play from both windows.
9. Click **Leave Room** in one window and confirm the other window shows that the room can no longer continue.
10. Close one tab without leaving and wait about 30 seconds; the other window should show that the player disconnected.

## Build And Deploy

Check the app:

```bash
npm run lint
npm run build
```

Deploy the React app to Firebase Hosting:

```bash
firebase deploy --only hosting
```

Firebase will give hosted URLs like:

```text
https://your-project-id.web.app
https://your-project-id.firebaseapp.com
```

This repo already has Hosting configured in `firebase.json`:

```json
{
  "hosting": {
    "public": "dist"
  }
}
```

The `dist` folder is created by `npm run build`. Firebase Hosting serves that folder.

## Updating The Hosted App

The hosted app does not update automatically when local frontend files change.

After changing React, CSS, or other frontend files, run:

```bash
npm run build
firebase deploy --only hosting
```

If you change Firestore rules, deploy those too:

```bash
firebase deploy --only firestore
```

To deploy both Hosting and Firestore rules:

```bash
firebase deploy --only hosting,firestore
```

## Useful Command Sequence

For first setup:

```bash
cp .env.example .env.local
npm install
firebase login
firebase use --add
firebase deploy --only firestore
npm run lint
npm run build
firebase deploy --only hosting
```

For later frontend updates:

```bash
npm run lint
npm run build
firebase deploy --only hosting
```

## Notes

- Use Firebase Hosting, not Firebase App Hosting.
- Leave the Firebase Console Hosting checkbox unchecked when registering the web app because this repo already has Hosting config.
- Restart the Vite dev server after changing `.env.local`.
- Keep `.env.local` private and commit `.env.example` as the template.
- Room links keep working after deployment because `firebase.json` rewrites all routes to `index.html`.

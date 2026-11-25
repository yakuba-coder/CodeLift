# CodeLift — MERN learning platform starter

This is the first working foundation for CodeLift:
- Student registration starts in `pending` state.
- Only an administrator can approve student accounts.
- Students can request enrollment in courses.
- Only an administrator can approve course enrollment.
- Only administrators can create courses and upload videos.
- Students can request playback tokens only for published videos in courses they are enrolled in.
- Video files are stored and streamed by Cloudflare Stream; MongoDB stores metadata and progress.

## Requirements
- Node.js 20+
- MongoDB Atlas database
- Cloudflare Stream account
- Firebase CLI for frontend hosting
- Google Cloud CLI for backend deployment

## 1. Configure the backend

```powershell
cd server
Copy-Item .env.example .env
npm install
```

Fill in `.env`. Generate long random values for `JWT_SECRET` and `ADMIN_BOOTSTRAP_SECRET`.
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the first administrator account. Do not commit `.env`.

Start the API:
```powershell
npm run dev
```

The server creates the administrator account on startup if that email does not already exist. The bootstrap password is hashed before storage. After first login, change it using the account settings workflow when that feature is added; keep the bootstrap credentials private.

## 2. Configure the frontend

```powershell
cd ../client
Copy-Item .env.example .env
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:5000/api` for local development.

## 3. Initial workflow
1. Sign in using the provisioned admin account.
2. Open the Admin page and approve pending registrations.
3. Create a course.
4. Approve a student's enrollment request for that course.
5. Upload a video from the admin page.
6. Publish the video.
7. The enrolled student can see and play it in the course library.

## Security notes
- Never expose Cloudflare API tokens, MongoDB URI, JWT secret, or admin bootstrap credentials to the browser.
- The API checks roles and enrollment on every protected request.
- Cloudflare Stream signed playback tokens are short-lived.
- This starter is a development foundation, not a completed production security audit. Before public launch, add email verification, password reset, CSRF protection appropriate to the chosen cookie setup, stronger audit logging, backups, privacy/terms pages, and rate-limit tuning.
- Do not store video binaries in MongoDB or send large video files through the Express API.


## 4. Deployment outline (after local testing)
- Build the frontend with `npm run build` inside `client`.
- Deploy `server` as Cloud Run service `codelift-api` in `asia-south1` (or change `firebase.json` to your chosen region).
- Configure Cloud Run environment variables/secrets from `server/.env.example`; never upload `.env` to Git.
- Deploy Firebase Hosting from the repository root with `firebase deploy --only hosting`.
- The Firebase rewrite sends `/api/**` requests to the Cloud Run service. Ensure Cloud Run allows the Firebase Hosting request path and that `CLIENT_ORIGIN` matches your deployed site origin.

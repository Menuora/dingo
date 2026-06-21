# Dingo Sellable Hotel/Restaurant Template

This version keeps the original Dingo public design and adds a Vercel-ready admin/API layer for bookings, Cloudinary menu images, website settings and homepage image settings.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env`.
3. Fill:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Run locally:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.
6. Give the hotel owner `http://localhost:3000/admin` for admin access.

Local development uses the included Node server and does not ask for a Vercel login.

## Vercel Deployment

1. Push this folder to GitHub.
2. Import the repository in Vercel.
3. Add the same environment variables in Vercel Project Settings.
4. Deploy.
5. Open `/admin` on the deployed domain and log in.

## Notes

- Public pages stay static-friendly, but bookings/admin/API require Vercel or another Node host.
- Cloudinary is used for uploaded menu and item images.
- Settings and bookings use lightweight JSON storage for the ready-made template. For heavy production traffic, connect the same API shape to a persistent database.

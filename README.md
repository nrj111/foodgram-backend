# Foodgram – Food App (MERN)

An Instagram-like food discovery app with short “reels,” user and food-partner roles, cart and ordering flow, and partner profiles with a grid of uploaded reels.

- Frontend: React, React Router, Axios
- Backend: Node.js, Express, MongoDB (Mongoose), JWT cookies, Multer (memory), ImageKit (video hosting)
- Auth: Separate flows for Users and Food Partners

## Project Structure

```
food-app/
├─ backend/
│  ├─ src/
│  │  ├─ controllers/        # Express controllers
│  │  ├─ middlewares/        # Auth middlewares
│  │  ├─ models/             # Mongoose models
│  │  ├─ routes/             # Express routes
│  │  └─ services/           # ImageKit upload service
│  └─ .env                    # Backend environment (see below)
│
└─ frontend/
   └─ src/
      ├─ components/         # ReelFeed, BottomNav, etc.
      ├─ pages/              # Auth, Home, Saved, Cart, Profiles, CreateFood
      └─ styles/             # App CSS (auth, reels, cart, etc.)
```

## Features

- IG-style vertical reels feed with autoplay, like, save, comments count
- Primary CTAs per reel:
  - Add to Cart (animated feedback)
  - Visit Store (food partner profile)
- Reel content
  - Title, truncated description with “more/less”
  - Business name + Follow button
  - Price in INR (set by partner during upload)
- Cart page
  - Add, remove, increment/decrement quantities
  - Order summary and placeholder checkout
- User auth
  - Register/Login with cookies, logout from menu
  - User Profile page with avatar upload (+ overlay, stored client-side)
- Food partner auth
  - Register/Login, Create Food with video upload (ImageKit), price, name, description
  - Partner Profile page with Instagram-like 3-column grid of uploaded reels
- Saved feed
  - View saved reels, unsave, order directly from saved

## Demo (Local)

1) Start backend (port 3000)
2) Start frontend (dev server)
3) Register a user, sign in, browse feed
4) Optional: Register a Food Partner, upload a reel with price; it appears in feed
5) Add to Cart, see items in Cart page (+ and – work)
6) Visit Store to see partner grid

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- ImageKit account (for video hosting) – optional if you swap out upload service

## Backend Setup

1) Install dependencies
```
cd backend
npm install
```

2) Create .env in backend (same folder as package.json)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/foodapp
JWT_SECRET=replace-with-a-strong-secret

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint
```

3) Start backend
```
npm run dev   # if nodemon is configured
# or
npm start     # if a start script is configured
# else
node src/server.js or node src/index.js  # adjust to your entry point
```

Routes summary (base URL http://localhost:3000):
- Auth (Users)
  - POST /api/auth/user/register
  - POST /api/auth/user/login
  - GET  /api/auth/user/logout
- Auth (Food Partners)
  - POST /api/auth/foodPartner/register
  - POST /api/auth/foodPartner/login
  - GET  /api/auth/foodPartner/logout
- Food
  - GET  /api/food/upload/auth        (Food Partner auth; returns ImageKit signature/token/expire/publicKey/urlEndpoint)
  - POST /api/food                    (Food Partner auth; accepts videoUrl or multipart 'video'; fields: name, description, price)
  - GET  /api/food                    (Public; returns feed with foodPartner.name populated)
  - POST /api/food/like               (User auth; body: { foodId })
  - POST /api/food/save               (User auth; body: { foodId })
  - GET  /api/food/save               (User auth; returns saved foods with foodPartner.name)
- Food Partner
  - GET  /api/food-partner/:id        (Public; partner details + uploaded reels)
- Comments
  - GET /api/food/comments/:foodId  (optional auth)
  - POST /api/food/comment          (user or partner auth)
  - POST /api/food/comment/like     (user or partner auth)

Notes
- Cookies: userToken, partnerToken
- Multer memoryStorage + ImageKit upload (see src/services/storage.service.js)

## Frontend Setup

1) Install dependencies
```
cd frontend
npm install
```

2) Start frontend
```
npm run dev   # Vite default
# or
npm start     # CRA or other tooling
```

By default, the frontend uses hard-coded API base http://localhost:3000 in Axios calls. If you change backend port or host, update the URLs in the code (or introduce a frontend .env and refactor API calls to use it).

## How It Works

- Authentication
  - On successful login/register, backend sets a cookie (userToken or partnerToken). Frontend stores display info (name, email) in localStorage for the menu/profile header.
  - Logout removes cookies server-side and clears local profile cache client-side.

- Reels Flow
  - Home feed fetches GET /api/food, which returns items with populated foodPartner.name.
  - Each reel shows business name, price (INR), title, and a truncated description with “more/less.”
  - Add to Cart stores items in localStorage with qty, price, and description; “Added!” animation confirms.

- Cart
  - Local-only cart with increment/decrement, remove, clear, totals computed from price*qty.
  - Checkout is a placeholder; integrate your payment/order API later.

- Food Partner
  - Create Food accepts a video and fields (name, description, price) and uploads via ImageKit; saved URL is returned and stored.
  - Partner Profile page shows an Instagram-like 3-column grid of uploaded reels (newest first).

## Environment Variables Recap

Backend (.env):
- PORT
- MONGODB_URI
- JWT_SECRET
- IMAGEKIT_PUBLIC_KEY
- IMAGEKIT_PRIVATE_KEY
- IMAGEKIT_URL_ENDPOINT

Frontend:
- Currently uses hard-coded http://localhost:3000; you can refactor to use a Vite .env (e.g., VITE_API_BASE) and replace usages.

## Screenshots

Create a folder and drop screenshots to reference here:
```
food-app/docs/screenshots/
```

Example (replace with your images):
```
![Home Feed](docs/screenshots/home-feed.png)
![Cart Page](docs/screenshots/cart.png)
![Partner Profile Grid](docs/screenshots/partner-profile.png)
```

## Troubleshooting

- 401 Unauthorized on feed:
  - Ensure you’re signed in as a user (not only a partner). The feed requires user auth.
- Video upload fails:
  - Verify ImageKit keys and URL endpoint in backend .env.
  - Check your request uses field name video (multipart).
- CORS or cookie issues:
  - Backend should allow your frontend origin and credentials. Start both on localhost and use withCredentials: true in Axios (already set in code).
- Mongo connection:
  - Check MONGODB_URI and ensure MongoDB is running.
- PowerShell removing .git:
  - Use `Remove-Item -LiteralPath .git -Recurse -Force` (not `rm -rf`).

## Roadmap

- Real checkout and orders
- Profile settings page
- Comments UI and API
- Follow API (currently local UI state only)

## License

MIT (or your chosen license)

## Deploy Frontend to Vercel

1) Prepare the frontend
- Ensure package.json has a build script (Vite: "build": "vite build", output: dist).
- Add an API base env for production (Vite .env.production): VITE_API_BASE=https://your-backend.vercel.app
- Axios: baseURL from import.meta.env.VITE_API_BASE, withCredentials: true (and Authorization: Bearer <token> if used).

2) Allow the frontend domain in backend CORS
- Set in backend Vercel Project Settings:
  - FRONTEND_ORIGIN=https://your-frontend.vercel.app
  - FRONTEND_ORIGIN_2=optional second origin
- Redeploy backend.

3) Deploy the frontend on Vercel
- Import the frontend repo as a New Project.
- If monorepo, set Root Directory to frontend.
- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist
- Environment Variables (Production and Preview):
  - VITE_API_BASE=https://your-backend.vercel.app
- Deploy.

4) Test
- Open your frontend URL, login/signup, then load the feed (GET /api/food).

### Troubleshooting (Frontend deploy)
- Vercel build error: Cannot find package '@vitejs/plugin-react'
  1) In frontend folder:
     - npm i -D vite @vitejs/plugin-react
     - npm i react react-dom
  2) vite.config.js:
     import { defineConfig } from 'vite'
     import react from '@vitejs/plugin-react'
     export default defineConfig({ plugins: [react()] })
  3) Commit package-lock.json and ensure Vercel Root Directory is frontend.
  4) Redeploy.

- 401 after login
  - Ensure Axios withCredentials: true, HTTPS API base, backend CORS includes your frontend origin, and cookies are SameSite=None; Secure with trust proxy enabled.

---
Happy hacking!

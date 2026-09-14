# Task 3 — JWT Authentication: Vampire Token

A Node.js, Express, and MongoDB authentication API for the AVIP Backend Development training. It implements registration, login, hashed passwords, JWT authentication, protected routes, and simple role-based access.

## The vampire-token twist

Each login creates a unique JWT with **10 protected requests**. Every successful request to a protected route removes one use. Request number 10 still succeeds and revokes the token. Request number 11 returns `401`, so the user must log in again.

The usage count is stored in MongoDB, not memory. This makes it work correctly across server restarts and Vercel serverless functions.

## Features

- Register and login endpoints
- Passwords hashed with `bcryptjs` (12 salt rounds)
- Signed JWTs with expiry
- Protected profile endpoint
- Admin-only endpoint using `user` and `admin` roles
- Token revocation after 10 protected requests
- Request validation and clear HTTP error responses
- Basic browser test page at `/`
- Ready for Vercel deployment

## Project structure

```text
api/index.js                 Vercel function entry point
public/index.html            browser test page
src/config/db.js             MongoDB connection
src/controllers/             HTTP request handling
src/middleware/              JWT and role guards
src/models/                  User and token-usage schemas
src/routes/                  API routes
src/services/                authentication business logic
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`.

3. Fill in the environment variables:

   ```env
   PORT=3002
   DB_URI=mongodb+srv://<username>:<password>@<cluster-url>/Arithmetic_Task_3?retryWrites=true&w=majority
   JWT_SECRET=a_long_random_secret_at_least_32_characters
   JWT_EXPIRES_IN=1h
   ```

   Generate a secure secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Start the API:

   ```bash
   npm run dev
   ```

Open `http://localhost:3002` for the test page.

## Endpoints

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API health check |
| `POST` | `/api/auth/register` | Public | Create a standard user account |
| `POST` | `/api/auth/login` | Public | Log in and issue a new JWT with 10 uses |
| `GET` | `/api/auth/profile` | Bearer token | Return the logged-in user profile; consumes one use |
| `GET` | `/api/auth/admin` | Admin Bearer token | Admin-only example; consumes one use |

## Authentication flow

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "password": "securepass123"
}
```

### Log in

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "securepass123"
}
```

The response contains `data.token`. Send it as a Bearer token:

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

Each successful protected request includes an `X-Token-Uses-Remaining` response header. After the tenth protected request the header is `0`; the next protected request returns `401` with a revoked-token message.

## Roles

Registration always creates a `user` account. The API deliberately ignores a submitted `role` field so nobody can register themselves as an admin. To demonstrate the admin endpoint, change a test user's `role` to `admin` in MongoDB Atlas/Compass, then log in again to receive a token containing that role.

## Deploy on Vercel

1. Push this folder to a public GitHub repository.
2. Import that repository into Vercel.
3. Add `DB_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN` in **Settings → Environment Variables**.
4. Deploy. Do not add your `.env` file to GitHub.

For MongoDB Atlas, add Vercel access in **Network Access**. For a class demo you can use `0.0.0.0/0`; for a real production project restrict access as much as possible.

## Suggested repository name

`BD_3_JWTAuthentication_byte`


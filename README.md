# CampusKart v2

CampusKart v2 is a split-stack web app with an Express backend, a React + Vite frontend, and SQL migrations for the database layer.

## Project Layout

- `backend/` - Express API, auth, controllers, routes, middleware, and server utilities.
- `frontend/` - React UI built with Vite.
- `database/` - SQL migration scripts.

## Prerequisites

- Node.js 20+ recommended
- npm
- A Supabase project
- Cloudinary account for media uploads

## Setup

### 1. Install dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

### 2. Configure environment variables

Create a `backend/.env` file and provide the values required by the backend.

Example:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_long_random_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

If the frontend needs environment variables later, add a `frontend/.env` file and document the values there.

### 3. Run the app locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

## Database

The initial SQL migration lives in `database/migration_v2.sql`. Apply it to your database before testing the app against a fresh environment.

## Commit Structure

Use small, focused commits and keep backend and frontend changes separate whenever possible.

Recommended commit format:

```text
type(scope): short summary
```

Examples:

```text
feat(backend): add product listing endpoint
fix(frontend): handle empty cart state
docs(readme): add local setup steps
chore(db): update migration for new columns
```

Rules that keep history readable:

- Commit backend and frontend changes separately when they are independent.
- Keep database migration changes in their own commit.
- Avoid mixing docs, config, and feature work in one commit unless they are tightly related.
- Write commit messages that explain the user-visible change, not just the file edited.

## Sharing the Repo

The repository is private now. If you want to share it with friends, invite them as collaborators from GitHub or make the repository public again later.
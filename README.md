# Fullstack ML demo (FastAPI backend + Vite frontend)

This project wires your existing Vite React frontend to a FastAPI backend that loads the sklearn model artifacts in `outputs/` and exposes a `/predict-file` endpoint which accepts CSV uploads and returns predictions.

What I added
- `backend/app/main.py` - FastAPI app with `/predict-file` endpoint
- `backend/app/model.py` - small ModelWrapper to load pickled artifacts and predict
- `backend/requirements.txt` - Python deps
- `backend/Dockerfile` - container image for backend
- `Dockerfile.frontend` - builds the Vite app and serves via nginx
- `docker-compose.yml` - runs backend + frontend together
- Updated `src/pages/Upload.tsx` to POST CSV uploads to the backend

Model artifacts used (already present in `outputs/`):
- `model.pkl`
- `scaler.pkl` (optional)
- `numeric_cols.pkl` (optional)
- `le.pkl` (optional label encoder)

Quick local run (Docker recommended)

1) Build and start both services with Docker Compose:

```powershell
docker compose up --build
```

This will:
- build and run the backend on http://localhost:8000
- build and serve the frontend on http://localhost:3000

2) Try a quick prediction (PowerShell example):

```powershell
# Replace sample.csv with your CSV path
$resp = Invoke-RestMethod -Uri http://localhost:8000/predict-file -Method Post -Form @{'file' = Get-Item .\sample.csv}
$resp
```

Notes and next steps
- I updated the Upload page to send the CSV to the backend. If you want the result shown in a dedicated results page, I can add navigation and a results UI.
- For production deployment you can push images to a registry and use any container platform (Render, Fly, DigitalOcean App Platform, etc.). I can produce detailed deploy steps for a provider you prefer.

If you'd like, I can now:
- run the backend locally here and perform a test request (requires environment allowing docker or python runtime), or
- add a `tests/` script that exercises the `/predict-file` endpoint with a small sample CSV.# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/03a05799-30ef-4aee-8d87-ab181b1a87cb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/03a05799-30ef-4aee-8d87-ab181b1a87cb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/03a05799-30ef-4aee-8d87-ab181b1a87cb) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

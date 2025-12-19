# Deploying to Render

Steps to deploy this project to Render.com (two services: backend and frontend):

1) Ensure model files are present
   - Download `outputs.zip` from your Drive link and extract it into the repository root `outputs/` folder.
   - The backend Docker image expects model artifacts at `outputs/` (they are copied into the image during build).

2) Connect repository to Render
   - Go to Render.com and create a new account (or sign in).
   - In Render dashboard, you can either:
     - Use the `render.yaml` in this repo to create both services via the Render web UI (Add > New > Import from repo). OR
     - Create two services manually:
       - Backend: Type "Web Service", Environment "Docker", Dockerfile path: `backend/Dockerfile`, Port: `8000`.
       - Frontend: Type "Web Service", Environment "Docker", Dockerfile path: `Dockerfile.frontend`.

3) Configure environment variables on Render
   - For backend, Render will set `$PORT`. The Dockerfile uses `$PORT` when present (fallback 8000).
   - For frontend, set `VITE_API_URL` to the production backend URL (e.g. `https://ipdr-backend.onrender.com`).

4) Deploy
   - If using `render.yaml`, Render will create and deploy services automatically when you import the repo.
   - Otherwise, create the services manually and trigger a deploy. Verify logs in Render dashboard.

   Notes
      - This repository's `docker-compose.yml` is adjusted for production builds (no host `outputs` volume). For local development you may re-add volumes.
      - Render builds images from the repo; you have two options to provide model artifacts to the backend:
        1) Commit the extracted `outputs/` folder into the repository (the Docker build copies it into the image). OR
        2) Let the backend download the model at startup by setting the `MODEL_DRIVE_FILE_ID` environment variable in Render to your Google Drive file ID. The backend includes a startup script `backend/fetch_and_start.py` which will download and extract the model zip into `/app/outputs` before starting the app.
      - If your `outputs` artifacts are large or private, consider hosting them in an object store (S3/GCS) and modifying the startup script to fetch from there instead.

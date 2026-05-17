# BhashaDocs Local Development Guide

## Backend

1. Open a terminal in `backend/`.
2. Copy the example environment file:

   ```bash
   Copy-Item .env.example .env
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the API:

   ```bash
   uvicorn main:app --reload
   ```

5. Verify health at `http://localhost:8000/health`.

## Frontend

1. Open a terminal in `frontend/`.
2. Copy the example environment file:

   ```bash
   Copy-Item .env.local.example .env.local
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the UI:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` and confirm uploads are sent to the backend URL in `NEXT_PUBLIC_API_URL`.

## Useful Environment Variables

- `CORS_ORIGINS` controls allowed frontend origins.
- `MAX_FILE_SIZE` controls the PDF upload cap in bytes.
- `LOG_LEVEL` controls backend logging verbosity.
- `NEXT_PUBLIC_API_URL` points the frontend at the API.
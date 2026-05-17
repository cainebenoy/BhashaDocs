# BhashaDocs Deployment Guide

## Backend: Hugging Face Spaces

1. Create a new Space at https://huggingface.co/spaces/new.
2. Choose `Docker` as the runtime.
3. Point the Space at the `backend/` directory in this repository.
4. Add these secrets or variables in the Space settings:
   - `CORS_ORIGINS=https://bhasha-docs.vercel.app`
   - `LOG_LEVEL=INFO`
   - `MAX_FILE_SIZE=52428800`
   - `TORCH_NUM_THREADS=2`
5. Deploy and verify the service at `/health`.

## Frontend: Vercel

1. Import the repository into Vercel.
2. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.
3. Deploy the frontend and confirm it can reach the backend `POST /api/translate-doc` endpoint.

## Production Checks

- Confirm `GET /health` returns `{"status":"ok","model":"IndicTrans2","ready":true}`.
- Confirm CORS is restricted to the frontend origin.
- Confirm the translation endpoint is rate limited to 5 requests per minute per client IP.
- Confirm the backend logs show request start, extraction success, and failures.
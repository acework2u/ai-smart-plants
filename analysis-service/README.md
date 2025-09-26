# Smart Plant AI — Analysis Service (Local Mock)

FastAPI-based analysis microservice used for local development. Provides mock responses for plant image analysis and can be swapped for real ML inference later.

## Endpoints
- `GET /v1/health` — readiness check
- `POST /v1/analyze` — accepts `{ "imageUrl": "https://..." }` or `{ "imageBase64": "..." }` and returns mock analysis payload aligning with API spec.

## Local Development
```bash
cd analysis-service
cp .env.example .env.local
uvicorn app.main:app --reload
```

When using Docker Compose from `backend/`, this service builds automatically and runs on port `5000`.

## Extending
- Replace logic in `app/services/analyzer.py` with real model loading/inference.
- Mount model weights via volume and point `MODEL_PATH` env variable accordingly.

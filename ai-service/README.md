# AgriSense AI Service

FastAPI microservice for plant leaf disease detection used by AgriSense.

**No trained model is bundled.** By default the service uses a deterministic mock predictor based on image color statistics. Point `MODEL_PATH` at your own PyTorch `.pt` / `.pth` checkpoint when you have one; the torch stub will load it and is ready for you to implement inference.

## Layout

```
ai-service/
├── app/
│   ├── main.py              # FastAPI app, CORS, /health
│   ├── models/schemas.py    # PredictionResponse
│   ├── services/
│   │   ├── predictor.py     # Protocol + TorchModelPredictor stub
│   │   └── mock_predictor.py
│   └── routes/predict.py    # POST /predict, POST /predict/json
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

```bash
cd ai-service
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Optional: install PyTorch separately when you have a real model (`pip install torch`), then set `MODEL_PATH` in `.env`.

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `POST` | `/predict` | Multipart image upload → `PredictionResponse` |
| `POST` | `/predict/json` | Same upload contract; explicit JSON body |

Upload field name: `file`. Content-Type must be `image/*`.

### Example

```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@leaf.jpg;type=image/jpeg"
```

### Response shape

```json
{
  "crop": "Tomato",
  "disease": "Early Blight",
  "confidence": 0.87,
  "description": "...",
  "treatment": ["..."],
  "prevention": ["..."],
  "recommendations": ["..."]
}
```

## CORS

Allowed origins: `http://localhost:8080`, `http://localhost:5173` (and `127.0.0.1` equivalents).

## Plugging in a real model

1. Train or export a classification checkpoint to a `.pt` file.
2. Set `MODEL_PATH=/absolute/or/relative/path/to/model.pt` in `.env`.
3. Implement `TorchModelPredictor._run_inference` in `app/services/predictor.py` (preprocess → forward → map class index to `PredictionResponse`).
4. Keep using `get_predictor()` from routes so the swap stays transparent.

Until `_run_inference` returns a result, requests still use `MockPredictor` even if a checkpoint loads successfully.

## Demo crops

Mock catalog covers **Tomato**, **Potato**, **Corn**, **Chili**, **Rice** / **Paddy**, including Tomato **Early Blight** as the default-ish result for typical green leaf images.

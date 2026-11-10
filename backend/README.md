# AgriSense Backend

Spring Boot 3.3.5 API for the AgriSense agricultural intelligence platform.

## Requirements

- Java 21
- Maven 3.9+
- PostgreSQL 16 (see root `docker-compose.yml`)

## Quick start

```bash
# From repo root
docker compose up -d

# From backend/
./mvnw spring-boot:run
# or
mvn spring-boot:run
```

API: `http://localhost:8080`

Demo user (seeded on first run):

- Email: `pugalini@agrisense.com`
- Password: `password123`

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | `postgres` | DB password |
| `JWT_SECRET` | local default in `application.yml` | JWT signing secret |

## Key endpoints

- `POST /api/auth/register`, `POST /api/auth/login`
- CRUD `/api/farms`, `/api/fields`, `/api/crops`
- `GET /api/sensors/{fieldId}/readings`, `GET /api/sensors/field/{fieldId}`
- `GET /api/sensors/stream/{fieldId}` (SSE)
- `GET /api/weather`, `GET /api/market-prices`, `GET /api/alerts`
- `POST /api/disease-detection` (multipart), `POST /api/yield-prediction`
- `GET /api/irrigation/recommendation?fieldId=`, `POST /api/irrigation/start`
- `GET /api/dashboard/stats`
- WebSocket: `/ws` → `/topic/sensors/{fieldId}`

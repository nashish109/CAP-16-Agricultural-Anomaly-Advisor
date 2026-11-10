# AgriSense — Agricultural Crop Input & Yield Anomaly Advisor

**CAP-16 | Full-Stack AgriTech Analytics Platform**

AgriSense is a full-stack agricultural analytics platform designed to help farmers and agricultural analysts understand crop input efficiency, evaluate yield performance, and identify unusual patterns in agricultural data.

The platform combines farm and crop-cycle management with agricultural dataset processing, input normalization, data-quality assessment, and analytical anomaly detection.

Its primary objective is to compare agricultural performance across comparable plots and identify cases where fertilizer, water, pesticide, or other crop inputs may be unusually high or low relative to the resulting yield.

---

## 1. Problem Statement

Agricultural productivity depends on several interacting factors, including crop selection, cultivated area, soil characteristics, seasonal conditions, water availability, and agricultural input usage.

However, agricultural data is often fragmented across records and datasets. This makes it difficult to:

- Compare input consumption across different farms and plots.
- Understand how efficiently agricultural inputs are being utilized.
- Identify unusually high input consumption or unexpectedly low yields.
- Detect incomplete, inconsistent, or duplicate agricultural records.
- Make informed decisions using historical agricultural performance.

AgriSense aims to address these challenges through a unified data-processing and analytics workflow.

## 2. Project Objectives

1. Provide a centralized platform for managing farms, plots, crops, and crop cycles.
2. Accept agricultural datasets through structured uploads.
3. Validate and clean incoming agricultural records.
4. Normalize agricultural input quantities against cultivated area.
5. Identify incomplete, duplicate, and invalid records.
6. Compare input efficiency and yield across comparable agricultural plots.
7. Detect and explain unusual input–yield relationships.
8. Present analytical findings through interactive dashboards and reports.

## 3. System Architecture

The proposed end-to-end architecture separates application management, data processing, storage, analytical computation, and visualization.

```text
                    React Frontend
                          |
                          v
               Spring Boot REST API
                  Authentication
                 Authorization
                 Application Logic
                          |
                          v
                  Python FastAPI
              Agricultural Data Processing
                 Validation & Cleaning
                 Input Normalization
                          |
                          v
                     AWS S3
                Raw / Processed Data
                          |
                          v
                     Snowflake
                Analytical Data Warehouse
                Cross-Plot Comparisons
                  Anomaly Detection
                          |
                          v
                      Power BI
                 Interactive Reports
                          |
                          v
                  React Dashboard
```

PostgreSQL serves as the operational application database for application users, farms, plots, crop cycles, and associated metadata. Snowflake serves as the separate analytical warehouse.

**Important:** The architecture represents the intended end-to-end solution. Components are integrated incrementally; AWS S3, Snowflake, and Power BI integrations are development milestones rather than completed features at this stage.

## 4. Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React 19, TypeScript, Vite | User interface and dashboards |
| Styling | Tailwind CSS | Responsive interface |
| Backend | Java 21, Spring Boot 3 | REST APIs and application logic |
| Security | Spring Security, JWT | Authentication and authorization |
| Backend persistence | Spring Data JPA | Operational database access |
| Operational database | PostgreSQL 16 | Application records |
| Local development DB | H2 | Local development and testing |
| Data processing | Python, FastAPI | Agricultural data processing |
| Data manipulation | Pandas, NumPy | Validation and normalization |
| Object storage | AWS S3 | Raw and processed datasets |
| Analytical warehouse | Snowflake | Agricultural analytics and anomaly detection |
| Visualization | Power BI | Analytical reports and dashboards |
| Containerization | Docker, Docker Compose | Local infrastructure |
| Deployment | AWS EC2 / Elastic Beanstalk | Application deployment |

## 5. Core Application Modules

### 5.1 User Authentication

- User registration and login.
- JWT-based authentication.
- Protected application routes.
- Role-aware application access.

### 5.2 Farm and Plot Management

- Create and manage farms.
- Register agricultural plots and fields.
- Maintain cultivated-area information.
- Associate plots with agricultural activities.

### 5.3 Crop and Crop-Cycle Management

- Manage crop information.
- Track crop cycles.
- Maintain sowing and harvesting dates.
- Associate agricultural input and yield records with crop cycles.

### 5.4 Agricultural Dataset Upload

The dataset upload module accepts agricultural records for processing.

Supported processing workflows include:

- Structured JSON input.
- CSV dataset uploads.
- Field validation.
- Missing-value identification.
- Duplicate-record identification.
- Invalid-value detection.

### 5.5 Agricultural Data Processing

The Python FastAPI service handles agricultural data validation and preprocessing.

Processing responsibilities include:

- Validating agricultural record structures.
- Checking numerical values and date consistency.
- Identifying incomplete records.
- Detecting duplicate records.
- Calculating normalized input quantities per hectare.
- Generating record-level data-quality information.
- Returning structured processing results.

Example normalized metrics:

| Metric | Unit |
|---|---|
| Fertilizer consumption | kg/hectare |
| Water consumption | litres/hectare |
| Pesticide consumption | Based on supplied measurement unit |
| Crop yield | tonnes/hectare |

Normalization enables comparisons between plots with different cultivated areas.

### 5.6 Data Quality Assessment

Agricultural records are classified using quality statuses:

| Status | Meaning |
|---|---|
| VALID | Record passes the implemented validation checks |
| INCOMPLETE | Required agricultural information is missing |
| DUPLICATE | Record matches an existing duplicate according to the implemented duplicate checks |

The processing response also includes record-level quality issues and aggregate processing statistics.

### 5.7 Agricultural Analytics and Anomaly Detection

Snowflake will serve as the analytical computation layer.

The analytical workflow is designed to:

1. Group comparable agricultural records using relevant characteristics.
2. Compare crop input quantities across plots.
3. Evaluate normalized input consumption.
4. Compare yield performance.
5. Identify unusual input–yield relationships.
6. Generate understandable explanations for detected anomalies.

Comparisons should account for relevant contextual factors such as crop type, cultivated area, soil characteristics, season, and available weather information.

An anomaly should be treated as an analytical indicator requiring investigation, not automatically as proof of poor farming practices.

### 5.8 Dashboard and Reporting

The React dashboard provides the application interface for agricultural information and operational metrics.

Power BI integration is planned to provide richer analytical reporting, including:

- Input consumption comparisons.
- Crop yield performance.
- Plot-level efficiency analysis.
- Agricultural data-quality summaries.
- Anomaly distribution and explanations.

Private reports will require an appropriately secured Power BI embedding approach.

## 6. Python FastAPI Service

The agricultural processing service is located in:

```text
ai-service/
├── app/
│   ├── main.py
│   ├── models/
│   │   └── schemas.py
│   ├── routes/
│   │   └── agricultural.py
│   └── services/
│       └── agricultural_processor.py
├── requirements.txt
└── README.md
```

### Available endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Service health check |
| POST | `/api/agricultural/process` | Process structured agricultural records |
| POST | `/api/agricultural/upload-csv` | Upload and process CSV data |
| GET | `/docs` | Interactive API documentation |

### Processing responsibilities

The service performs:

- Input validation.
- Data-quality checks.
- Duplicate identification.
- Missing-value assessment.
- Input-per-hectare calculations.
- Structured response generation.

The processing service does not currently persist processed records to S3 or Snowflake.

The existing prediction-related endpoints and mock predictor are separate from the CAP-16 agricultural processing workflow. A trained and validated predictive model must not be assumed to exist.

## 7. Project Structure

```text
CAP-16-Agricultural-Anomaly-Advisor/
│
├── ai-service/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── main.py
│   ├── requirements.txt
│   └── README.md
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   ├── pom.xml
│   └── README.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── docs/
│   └── screenshots/
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 8. Prerequisites

Install the following tools before running the application:

- Node.js 20 or later.
- Java JDK 21.
- Apache Maven 3.9 or later.
- Python 3.11 or later.
- Docker Desktop.
- Git.

Additional AWS, Snowflake, and Power BI accounts or access will be required for their respective integration stages.

## 9. Local Setup and Execution

Run each application component in a separate terminal.

### 9.1 Clone the repository

```bash
git clone https://github.com/nashish109/CAP-16-Agricultural-Anomaly-Advisor.git

cd CAP-16-Agricultural-Anomaly-Advisor
```

### 9.2 Start PostgreSQL

From the project root:

```bash
docker compose up -d
```

The current Docker Compose configuration provides PostgreSQL 16.

Default local development connection:

| Parameter | Value |
|---|---|
| Host | localhost |
| Port | 5432 |
| Database | agrisense |
| Username | postgres |
| Password | postgres |

Use environment-based credentials for deployment rather than relying on development defaults.

### 9.3 Run the Spring Boot backend

```bash
cd backend

mvn spring-boot:run
```

For local H2 development:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Backend API:

```text
http://localhost:8080
```

Run backend tests:

```bash
mvn test
```

Build the backend:

```bash
mvn clean package -DskipTests
```

### 9.4 Run the Python FastAPI service

Open another terminal:

```bash
cd ai-service
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the service:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Service health:

```text
http://127.0.0.1:8000/health
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 9.5 Run the React frontend

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

The Vite development server will display its local URL, typically:

```text
http://localhost:5173
```

## 10. Environment Configuration

### Frontend

Create `frontend/.env` using the following configuration:

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

### Backend

Configure the appropriate environment variables for the application:

| Variable | Purpose |
|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL database password |
| `JWT_SECRET` | JWT signing secret |
| `agrisense.ai-service-url` | FastAPI service base URL |

### Python service

| Variable | Purpose |
|---|---|
| `MODEL_PATH` | Optional path to a trained PyTorch model |

Never commit actual credentials, private keys, or production environment files to GitHub.

## 11. API Overview

The existing Spring Boot application exposes REST endpoints for its operational modules.

| Module | Endpoint |
|---|---|
| Authentication | `/api/auth/register`, `/api/auth/login` |
| Dashboard | `/api/dashboard/stats` |
| Farms | `/api/farms` |
| Fields | `/api/fields` |
| Crops | `/api/crops` |
| Sensor readings | `/api/sensors/{fieldId}/readings` |
| Sensor stream | `/api/sensors/stream/{fieldId}` |
| Weather | `/api/weather` |
| Market prices | `/api/market-prices` |
| Disease detection | `/api/disease-detection` |
| Yield prediction | `/api/yield-prediction` |
| Irrigation recommendation | `/api/irrigation/recommendation` |
| Irrigation execution | `/api/irrigation/start` |
| Alerts | `/api/alerts` |

WebSocket endpoint:

```text
/ws
```

Sensor topic:

```text
/topic/sensors/{fieldId}
```

Python agricultural processing endpoints are documented separately in the FastAPI Swagger interface.

## 12. Development Roadmap

The following stages define the remaining implementation direction.

| Stage | Workstream | Status |
|---|---|---|
| 1 | Repository setup and version control | Completed |
| 2 | Python agricultural data processing | Implemented and tested |
| 3 | React CAP-16 dashboard and data-management pages | Partially implemented |
| 4 | Spring Boot application integration | In progress |
| 5 | PostgreSQL operational database verification | Pending |
| 6 | AWS S3 dataset storage integration | Pending |
| 7 | Snowflake analytical warehouse configuration | Pending |
| 8 | Cross-plot input-efficiency and anomaly analysis | Pending |
| 9 | Power BI dashboard integration | Pending |
| 10 | End-to-end testing and deployment | Pending |

The status of each stage should be updated as implementation and verification are completed.

## 13. Testing and Validation

The Python processing service has been tested for:

- Health endpoint availability.
- JSON agricultural record processing.
- CSV upload processing.
- Invalid numerical input rejection.
- Invalid date-sequence rejection.
- Missing harvest and yield information.
- Duplicate-record detection.
- Normalized input calculations.
- Record-level quality classification.

The React frontend has also undergone a production build check, and the Spring Boot backend has successfully completed a Maven package build with tests skipped.

These checks represent component-level verification, not completion of the full end-to-end system.

## 14. Important Design Principles

- Keep operational application data separate from analytical warehouse data.
- Use Python for agricultural record validation, cleaning, and normalization.
- Use Snowflake for cross-plot analytical comparisons and anomaly detection.
- Use AWS S3 for dataset object storage rather than treating it as a relational database.
- Account for crop and environmental context when comparing agricultural performance.
- Distinguish missing or incomplete records from actual agricultural anomalies.
- Secure authentication, authorization, dataset access, and embedded reports.
- Report only verified implementation and testing results.

## 15. Repository

**GitHub:**  
https://github.com/nashish109/CAP-16-Agricultural-Anomaly-Advisor

The repository is maintained as a private development repository during active implementation.

## 16. License

MIT License — subject to verification that all inherited source code and assets are compatible with the repository's licensing terms.

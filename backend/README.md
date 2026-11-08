
# FinTrack AI

**An AI-powered personal finance management platform built with FastAPI, PostgreSQL, Machine Learning and OpenAI.**

FinTrack AI helps users manage their finances, understand spending patterns, track budgets and savings goals, and receive intelligent financial insights.

## Features

### 1. Financial Management
- Secure user registration and login.
- JWT-based authentication.
- Expense and income management.
- Category-based transaction organization.
- Budget creation and tracking.
- Savings goal management.

### 2. Financial Analytics
- Monthly income and expense summaries.
- Spending breakdown by category.
- Financial dashboard.
- Budget utilization.
- Savings goal progress.
- Transaction CSV export.

### 3. Transaction Import
- CSV transaction import.
- Transaction preview before confirmation.
- Automatic transaction categorization.
- Duplicate transaction detection.
- File size and row-count restrictions.

### 4. AI and Machine Learning
- ML-based transaction categorization.
- Expense forecasting.
- Statistical expense anomaly detection.
- Recurring transaction detection.
- Smart financial insights.
- AI-powered financial assistant using OpenAI.

### 5. Security
- Password hashing.
- JWT authentication.
- User-scoped database operations.
- API rate limiting.
- CORS restrictions.
- Trusted-host validation.
- Request validation.
- Environment-based configuration.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI |
| Database | PostgreSQL 18 |
| ORM | SQLAlchemy 2 |
| Migrations | Alembic |
| Authentication | JWT, pwdlib |
| Validation | Pydantic |
| Machine Learning | Scikit-learn |
| Model Storage | Joblib |
| AI Assistant | OpenAI API |
| API Protection | SlowAPI |
| Containerization | Docker, Docker Compose |

## Architecture

```text
FinTrackAI/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── ml/
│   │
│   ├── migrations/
│   ├── tests/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── main.py
│   ├── .env.example
│   └── .gitignore
│
└── README.md
```

## Local Backend Setup

### Prerequisites

- Python 3.12 or compatible version.
- PostgreSQL 18.
- Git.
- OpenAI API key for AI assistant functionality.

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd FinTrackAI/backend
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows:

```cmd
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file using `.env.example` as a template.

Configure:
- PostgreSQL database connection.
- JWT secret key.
- OpenAI API key.
- CORS origins.
- Allowed hosts.

Never commit your actual `.env` file.

### 5. Apply database migrations

```bash
python -m alembic upgrade head
```

### 6. Start the backend

```bash
python -m uvicorn main:app --reload
```

Backend address:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

## Docker Setup

From the backend directory:

```bash
docker compose up --build -d
```

To view running containers:

```bash
docker compose ps
```

To stop containers:

```bash
docker compose down
```

To stop containers while preserving database data:

```bash
docker compose down
```

Database data is stored in the Docker volume `fintrack_postgres_data`.

## API Modules

| Module | Base route | Purpose |
|---|---|---|
| Authentication | `/auth` | Registration, login and current user |
| Expenses | `/expenses` | Expense management |
| Income | `/incomes` | Income management |
| Analytics | `/analytics` | Financial analytics |
| Budgets | `/budgets` | Budget management |
| Savings Goals | `/savings-goals` | Savings tracking |
| Dashboard | `/dashboard` | Dashboard summary |
| Imports | `/imports` | CSV transaction imports |
| Insights | `/insights` | Forecasts, anomalies and insights |
| Assistant | `/assistant` | AI financial assistant |
| Exports | `/exports` | Transaction CSV exports |
| Notifications | `/notifications` | Financial alerts |

See `backend/docs/API.md` for the API reference.

## Machine Learning

FinTrack AI includes multiple analytical approaches:

- Transaction categorization using text classification.
- Expense forecasting using historical spending.
- Anomaly detection using statistical analysis.
- Recurring transaction pattern detection.

These features are intended to provide decision-support insights, not guaranteed financial predictions.

## Security and Privacy

- Credentials and API keys are stored in environment variables.
- Passwords are stored as hashes.
- Financial records are scoped to authenticated users.
- API requests are rate-limited.
- Cross-origin access is restricted through configuration.

AI assistant requests may send relevant financial context to the configured OpenAI API provider. Review applicable provider policies and disclose this processing in the application's privacy policy before public launch.

## Project Status

**Backend implementation:** Core modules implemented.

**Testing:** Pending.

**Frontend:** Planned / in development.

**Deployment:** Pending.

## Future Improvements

- React and Tailwind frontend.
- Interactive financial dashboard.
- Advanced ML forecasting and model evaluation.
- Persistent notification preferences.
- Improved statement parsing.
- Production deployment and monitoring.

## Disclaimer

FinTrack AI is an educational and personal finance management project. Its predictions and insights are informational and should not be treated as professional financial advice.

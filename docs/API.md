
# FinTrack AI — API Reference

## Base URL

Local development:

`http://127.0.0.1:8000`

## Authentication

Protected endpoints require a JWT access token.

Include the following HTTP header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Never share your access token.

## Authentication Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate and obtain access token |
| GET | `/auth/me` | Retrieve authenticated user |

## Expense Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/expenses` | Retrieve expenses |
| POST | `/expenses` | Create expense |
| GET | `/expenses/{expense_id}` | Retrieve an expense |
| PUT | `/expenses/{expense_id}` | Update an expense |
| DELETE | `/expenses/{expense_id}` | Delete an expense |

## Income Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/incomes` | Retrieve income records |
| POST | `/incomes` | Create income |
| GET | `/incomes/{income_id}` | Retrieve an income record |
| PUT | `/incomes/{income_id}` | Update an income record |
| DELETE | `/incomes/{income_id}` | Delete an income record |

## Analytics Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/summary` | Retrieve financial analytics |

## Budget Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/budgets` | Retrieve budgets |
| POST | `/budgets` | Create budget |
| GET | `/budgets/{budget_id}` | Retrieve budget |
| PUT | `/budgets/{budget_id}` | Update budget |
| DELETE | `/budgets/{budget_id}` | Delete budget |

## Savings Goals

| Method | Endpoint | Description |
|---|---|---|
| GET | `/savings-goals` | Retrieve savings goals |
| POST | `/savings-goals` | Create savings goal |
| GET | `/savings-goals/{goal_id}` | Retrieve savings goal |
| PUT | `/savings-goals/{goal_id}` | Update savings goal |
| DELETE | `/savings-goals/{goal_id}` | Delete savings goal |

## Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/summary` | Retrieve dashboard summary |

## Transaction Imports

| Method | Endpoint | Description |
|---|---|---|
| POST | `/imports/preview` | Preview CSV transactions |
| POST | `/imports/confirm` | Confirm CSV transaction import |

## AI Insights

| Method | Endpoint | Description |
|---|---|---|
| GET | `/insights/expense-forecast` | Expense forecast |
| GET | `/insights/anomalies` | Detect unusual expenses |
| GET | `/insights/recurring` | Detect recurring transactions |
| GET | `/insights/smart` | Retrieve smart financial insights |

## AI Assistant

| Method | Endpoint | Description |
|---|---|---|
| POST | `/assistant/chat` | Send a message to the assistant |
| GET | `/assistant/conversations` | Retrieve conversation history |
| GET | `/assistant/conversations/{conversation_id}/messages` | Retrieve conversation messages |
| DELETE | `/assistant/conversations/{conversation_id}` | Delete a conversation |

## Exports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/exports/transactions` | Export transactions as CSV |

## Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications/` | Retrieve generated financial notifications |

## Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API welcome response |
| GET | `/health` | Health response |

## API Documentation Interface

During development, FastAPI provides interactive documentation at:

`/docs`

OpenAPI schema:

`/openapi.json`

Note: These documentation endpoints are disabled when `APP_ENV=production` in the current application configuration.

## Important Notes

- Protected routes require authentication.
- Records are scoped to the authenticated user.
- Request and response schemas are defined in the backend Pydantic schema modules.
- Query parameters and filters depend on the individual route implementation.
- This reference describes the implemented route structure; use the generated OpenAPI specification for exact request and response schemas.

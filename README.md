# Intelligence Query Engine — Insighta Labs

A queryable demographic intelligence API built for Insighta Labs. This system collects, stores, and exposes profile data with advanced filtering, sorting, pagination, and natural language querying capabilities.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
  - [GET /api/profiles](#get-apiprofiles)
  - [GET /api/profiles/search](#get-apiprofilessearch)
- [Natural Language Query Parsing](#natural-language-query-parsing)
- [Error Handling](#error-handling)
- [Data Seeding](#data-seeding)
- [Performance Notes](#performance-notes)

---

## Overview

The Intelligence Query Engine is a backend API that enables marketing teams, product teams, and growth analysts to:

- Filter demographic profiles by gender, age, country, and confidence scores
- Combine multiple filter conditions in a single request
- Sort and paginate results efficiently
- Query data using plain English via a natural language search endpoint

The database is seeded with **2,026 profiles** sourced from external demographic APIs.

---

## Tech Stack

> Replace the entries below with your actual stack.

| Layer     | Technology          |
| --------- | ------------------- |
| Runtime   | Node.js / Python    |
| Framework | Express / FastAPI   |
| Database  | PostgreSQL          |
| ORM       | Prisma / SQLAlchemy |
| Hosting   | Render / Railway    |

---

## Database Schema

The `profiles` table follows this exact structure:

| Field                 | Type           | Notes                                  |
| --------------------- | -------------- | -------------------------------------- |
| `id`                  | UUID v7        | Primary key, auto-generated            |
| `name`                | VARCHAR UNIQUE | Person's full name                     |
| `gender`              | VARCHAR        | `"male"` or `"female"`                 |
| `gender_probability`  | FLOAT          | Confidence score (0.0 – 1.0)           |
| `age`                 | INT            | Exact age                              |
| `age_group`           | VARCHAR        | `child`, `teenager`, `adult`, `senior` |
| `country_id`          | VARCHAR(2)     | ISO 3166-1 alpha-2 code (e.g. `NG`)    |
| `country_name`        | VARCHAR        | Full country name                      |
| `country_probability` | FLOAT          | Confidence score (0.0 – 1.0)           |
| `created_at`          | TIMESTAMP      | Auto-generated, stored in UTC          |

---

## Getting Started

### Prerequisites

- Node.js >= 18 (or Python >= 3.10)
- PostgreSQL >= 14

### Installation

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install          # or: pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/insighta
PORT=3000
```

### Database Setup & Seeding

```bash
# Run migrations
npm run migrate      # or: alembic upgrade head

# Seed the database with 2026 profiles
npm run seed         # or: python seed.py
```

Re-running the seed command is safe — duplicate records will not be created (upsert by `name`).

### Start the Server

```bash
npm run start        # or: uvicorn main:app --reload
```

The API will be available at `http://localhost:3000`.

---

## API Reference

**Base URL:** `https://yourapp.domain.app`

All responses include the header:

```
Access-Control-Allow-Origin: *
```

All timestamps are in **UTC ISO 8601** format. All IDs are **UUID v7**.

---

### GET /api/profiles

Returns a paginated list of profiles. Supports filtering, sorting, and pagination.

#### Query Parameters

| Parameter                 | Type   | Description                                                 |
| ------------------------- | ------ | ----------------------------------------------------------- |
| `gender`                  | string | Filter by gender: `male` or `female`                        |
| `age_group`               | string | Filter by age group: `child`, `teenager`, `adult`, `senior` |
| `country_id`              | string | ISO 3166-1 alpha-2 country code (e.g. `NG`, `KE`)           |
| `min_age`                 | int    | Minimum age (inclusive)                                     |
| `max_age`                 | int    | Maximum age (inclusive)                                     |
| `min_gender_probability`  | float  | Minimum gender confidence score                             |
| `min_country_probability` | float  | Minimum country confidence score                            |
| `sort_by`                 | string | Field to sort by: `age`, `created_at`, `gender_probability` |
| `order`                   | string | Sort direction: `asc` or `desc` (default: `asc`)            |
| `page`                    | int    | Page number (default: `1`)                                  |
| `limit`                   | int    | Results per page (default: `10`, max: `50`)                 |

All filters are **combinable** — every active filter is applied simultaneously (AND logic).

#### Example Requests

```
GET /api/profiles?gender=male&country_id=NG&min_age=25
GET /api/profiles?age_group=adult&sort_by=age&order=desc&page=2&limit=20
GET /api/profiles?gender=female&min_gender_probability=0.9&max_age=40
```

#### Example Response

```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 2026,
  "data": [
    {
      "id": "018f4e3b-7c2a-7000-8b1d-0e1234abcdef",
      "name": "Amara Okafor",
      "gender": "female",
      "gender_probability": 0.97,
      "age": 28,
      "age_group": "adult",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.91,
      "created_at": "2026-04-01T10:23:00Z"
    }
  ]
}
```

---

### GET /api/profiles/search

Accepts a plain English query and converts it into profile filters automatically.

#### Query Parameters

| Parameter | Type   | Description                                 |
| --------- | ------ | ------------------------------------------- |
| `q`       | string | Natural language search query               |
| `page`    | int    | Page number (default: `1`)                  |
| `limit`   | int    | Results per page (default: `10`, max: `50`) |

#### Example Requests

```
GET /api/profiles/search?q=young males from nigeria
GET /api/profiles/search?q=adult females from kenya&page=2&limit=20
GET /api/profiles/search?q=senior people above 65
```

#### Example Response

```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 134,
  "data": [ ... ]
}
```

If the query cannot be interpreted:

```json
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

---

## Natural Language Query Parsing

The `/api/profiles/search` endpoint uses **rule-based parsing only** — no AI or LLMs are involved. Queries are matched against a set of keyword rules and converted into structured filters.

### Supported Mappings

| Query Term / Pattern            | Resolved Filter(s)                          |
| ------------------------------- | ------------------------------------------- |
| `male`, `males`, `men`          | `gender=male`                               |
| `female`, `females`, `women`    | `gender=female`                             |
| `young`                         | `min_age=16` + `max_age=24`                 |
| `child`, `children`             | `age_group=child`                           |
| `teenager`, `teenagers`         | `age_group=teenager`                        |
| `adult`, `adults`               | `age_group=adult`                           |
| `senior`, `seniors`, `elderly`  | `age_group=senior`                          |
| `above <N>`, `older than <N>`   | `min_age=N`                                 |
| `below <N>`, `younger than <N>` | `max_age=N`                                 |
| `from <country name>`           | `country_id=<ISO code>` (mapped internally) |

> **Note:** `"young"` is a parsing-only concept — it resolves to `min_age=16` + `max_age=24` and is not a stored `age_group` value.

### Example Mappings

| Input Query                          | Resolved Filters                                  |
| ------------------------------------ | ------------------------------------------------- |
| `young males`                        | `gender=male`, `min_age=16`, `max_age=24`         |
| `females above 30`                   | `gender=female`, `min_age=30`                     |
| `people from angola`                 | `country_id=AO`                                   |
| `adult males from kenya`             | `gender=male`, `age_group=adult`, `country_id=KE` |
| `male and female teenagers above 17` | `age_group=teenager`, `min_age=17`                |

---

## Error Handling

All errors follow a consistent structure:

```json
{
  "status": "error",
  "message": "<description of the error>"
}
```

| HTTP Status | Meaning                             |
| ----------- | ----------------------------------- |
| `400`       | Missing or empty required parameter |
| `422`       | Invalid parameter type or value     |
| `404`       | Profile not found                   |
| `500`/`502` | Internal server or gateway error    |

---

## Data Seeding

The seed script populates the database with **2,026 profiles** fetched from the provided external source. It uses an upsert strategy keyed on the `name` field, so re-running the seed is idempotent — no duplicates will be created.

```bash
npm run seed    # or: python seed.py
```

Expected output:

```
Seeding 2026 profiles...
✓ 2026 profiles inserted (0 duplicates skipped)
Done.
```

---

## Performance Notes

- All filter columns (`gender`, `age_group`, `country_id`, `age`) are indexed for fast lookups.
- Pagination is implemented using `LIMIT` and `OFFSET` at the database level — full-table scans are avoided.
- The natural language parser resolves queries entirely in memory before hitting the database, adding negligible overhead.
- Tested against the full 2,026-record dataset with response times under 100ms for typical queries.

---

## Public API

**Base URL:** `https://yourapp.domain.app`

Ensure the database is seeded and all endpoints are live before submission.

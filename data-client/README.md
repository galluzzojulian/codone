# Codone Data Client

## Overview

This is the data client for the Codone Webflow application. It provides OAuth integration with Webflow, data storage, and API endpoints for the designer extension.

## Features

- Webflow OAuth integration
- Data persistence (SQLite and Supabase)
- API endpoints for the Webflow designer extension
- JWT-based authentication

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Webflow developer account with OAuth app credentials
- Supabase account with a project set up

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables:
   ```
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` with your Webflow and Supabase credentials.

### Development

Run the development server:
```
npm run dev
```

This will start the server on port 3000 by default.

## Project Structure

```
data-client/
├── app/                # Next.js application
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── sites/      # Site management endpoints
│   │   └── supabase-sites/ # Supabase-specific endpoints
│   ├── lib/            # Utility functions and modules
│   │   └── utils/      # Helper utilities
│   │       ├── database.ts     # SQLite database client
│   │       ├── jwt.ts          # JWT authentication
│   │       └── supabase.ts     # Supabase client
│   └── ...             # Other app files
├── docs/               # Documentation
│   └── supabase-integration.md # Supabase integration details
├── db/                 # SQLite database directory
├── public/             # Static assets
└── scripts/            # Build and development scripts
```

## Key Components

### Auth Flow

The authentication flow with Webflow OAuth is implemented in `app/api/auth/`. The process:

1. User initiates auth at `/api/auth/authorize`
2. After approval, Webflow redirects to `/api/auth/callback`
3. The callback stores site information and establishes the session

### Data Storage

The app uses two storage systems:

1. **SQLite** (Legacy): Simple key-value storage for site authorizations
2. **Supabase** (Primary): Structured storage with additional site metadata

See [Supabase Integration](./docs/supabase-integration.md) for more details.

### API Endpoints

- **Authentication**
  - `GET /api/auth/authorize`: Initiates OAuth flow
  - `POST /api/auth/token`: Generates authentication token
  
- **Site Management**
  - `GET /api/sites`: Get list of authorized sites (SQLite)
  - `GET /api/supabase-sites`: Get list of sites with metadata (Supabase)
  - `POST /api/supabase-sites`: Update site data in Supabase

## Documentation

- [Supabase Integration](./docs/supabase-integration.md): Details about the Supabase database setup and API

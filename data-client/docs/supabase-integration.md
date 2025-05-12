# Supabase Integration

This document outlines how Supabase is integrated into the Webflow app for data persistence.

## Overview

Supabase is used to store information about authorized Webflow sites. When a user authorizes the app through Webflow's OAuth flow, site information is saved to the Supabase database.

## Configuration

### Environment Variables

The Supabase connection requires the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tqvssbhfbxjeyahuopkz.supabase.co
```

For production deployments, use the service role key to bypass RLS:
```
# Service role key is hardcoded in the supabase.ts file for now
# This should be moved to an environment variable in production
```

### Database Schema

The database contains a `Sites` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Auto-generated primary key |
| created_at | timestamp | Auto-generated timestamp |
| owner | text | User ID or identifier for the site owner |
| webflow_site_id | text | Webflow site ID (should have a unique constraint) |
| pages | jsonb | JSON array of pages for the site |
| head_code | text | Custom code for the site head |
| body_code | text | Custom code for the site body |

## Key Files

- `app/lib/utils/supabase.ts`: Supabase client and utility functions
- `app/api/auth/callback/route.ts`: OAuth callback handler that stores site data
- `app/api/supabase-sites/route.ts`: API endpoints for retrieving and updating site data

## Authorization Flow

1. User clicks "Authorize" in the app
2. User is redirected to Webflow's OAuth authorization page
3. After authorizing, Webflow redirects to our callback URL
4. The callback handler:
   - Gets the access token from Webflow
   - Retrieves site information
   - Stores site data in SQLite (legacy)
   - Stores site data in Supabase with the site ID, owner, and empty fields for pages/code

## API Endpoints

### GET /api/supabase-sites

Retrieves all sites stored in Supabase.

**Authentication**: Required via JWT

**Response**:
```json
{
  "success": true,
  "message": "Sites retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "created_at": "timestamp",
      "owner": "user-id",
      "webflow_site_id": "site-id",
      "pages": [],
      "head_code": "",
      "body_code": ""
    }
  ]
}
```

### POST /api/supabase-sites

Updates site data in Supabase.

**Authentication**: Required via JWT

**Request Body**:
```json
{
  "webflow_site_id": "site-id",
  "pages": [],
  "head_code": "<script>...</script>",
  "body_code": "<script>...</script>",
  "owner": "user-id" // Optional
}
```

**Response**:
```json
{
  "success": true,
  "message": "Site data updated successfully"
}
```

## Known Issues and Considerations

1. **Service Role Key**: Currently using a hardcoded service role key in the Supabase client. This should be moved to an environment variable for production.

2. **Row Level Security (RLS)**: The system is bypassing RLS with the service role key. In a production environment, properly configured RLS policies should be implemented.

3. **Data Redundancy**: The system stores data in both SQLite and Supabase. This approach ensures backward compatibility but may cause data synchronization issues over time.

## Future Improvements

1. Move the service role key to an environment variable
2. Implement proper RLS policies instead of bypassing them
3. Consider migrating fully to Supabase and phasing out SQLite
4. Add more robust error handling and retry mechanisms
5. Implement pagination for site listing endpoints 
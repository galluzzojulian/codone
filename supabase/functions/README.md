# Codone Edge Functions

This directory contains Supabase Edge Functions that power dynamic code injection for the Codone app.

## Functions

### code-loader

The `code-loader` function is responsible for fetching code snippets based on file IDs stored in the Supabase database and returning them to be injected into Webflow pages.

#### How it works

1. When a user adds files to a page in Codone (head or body), the app registers a loader script with Webflow.
2. This loader script runs when the page loads and calls the `code-loader` Edge Function.
3. The Edge Function:
   - Receives the page ID and location (head/body)
   - Fetches the associated file IDs from the database
   - Retrieves the actual code content for each file
   - Returns the HTML, CSS, and JS code organized by type

4. The loader script then injects this code into the appropriate part of the page.

## Deployment

To deploy the Edge Functions:

1. Install the Supabase CLI:
   ```
   npm install -g supabase
   ```

2. Login to Supabase:
   ```
   supabase login
   ```

3. Link to your project:
   ```
   supabase link --project-ref your-project-ref
   ```

4. Deploy the function:
   ```
   supabase functions deploy code-loader --no-verify-jwt
   ```

## Configuration

Make sure your Supabase project has:

1. The appropriate Row Level Security (RLS) policies to allow the function to read from the `Pages` and `Files` tables.
2. The service role key set as an environment variable for the Edge Function to access the database.

## Testing

You can test the function locally using:

```
supabase start
supabase functions serve code-loader
```

And then sending a POST request:

```
curl -X POST http://localhost:54321/functions/v1/code-loader \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"id": "123", "type": "page", "location": "head"}'
``` 
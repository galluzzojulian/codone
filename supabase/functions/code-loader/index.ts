import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    
    // Parse request data
    const { id, location } = await req.json()
    
    console.log(`Processing request: ${location} for page ID ${id}`)
    
    if (!id || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Load page code
    let fileIds: number[] = []
    const { data: page, error } = await supabaseClient
      .from('Pages')
      .select(location === 'head' ? 'head_files' : 'body_files')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error(`Page query error: ${error.message}`)
      return new Response(
        JSON.stringify({ error: `Page not found: ${error.message}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Page data found:`, page)
    
    // Parse the file IDs as JSON if they're stored as strings
    const fileIdsField = location === 'head' ? page.head_files : page.body_files
    console.log(`Raw ${location} files data:`, fileIdsField)
    
    fileIds = parseFileIds(fileIdsField)
    
    console.log(`Parsed file IDs:`, fileIds)
    
    if (!fileIds || !fileIds.length) {
      return new Response(
        JSON.stringify({ html: '', css: '', js: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Fetch all required files
    const { data: files, error: filesError } = await supabaseClient
      .from('Files')
      .select('*')
      .in('id', fileIds)
    
    if (filesError) {
      console.error(`Files query error: ${filesError.message}`)
      return new Response(
        JSON.stringify({ error: `Error fetching files: ${filesError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Found ${files?.length} files:`, files.map(f => ({ id: f.id, name: f.name, lang: f.language })))
    
    // Organize files by language
    const html = files.filter(f => f.language === 'html').map(f => f.code).join('\n')
    const css = files.filter(f => f.language === 'css').map(f => f.code).join('\n')
    const js = files.filter(f => f.language === 'js').map(f => f.code).join('\n')
    
    return new Response(
      JSON.stringify({ html, css, js }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error(`Uncaught error: ${error.message}`)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Helper function to parse file IDs from various formats
 * @param fileIdsField The value from the database (can be string, array, or null)
 * @returns Array of file IDs as numbers
 */
function parseFileIds(fileIdsField: any): number[] {
  if (!fileIdsField) return []
  
  try {
    // If it's already an array, use it directly
    if (Array.isArray(fileIdsField)) {
      return fileIdsField.map(id => typeof id === 'object' && id !== null ? Number(id.id) : Number(id))
        .filter(id => !isNaN(id))
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof fileIdsField === 'string') {
      try {
        const parsed = JSON.parse(fileIdsField)
        if (Array.isArray(parsed)) {
          return parsed.map(id => typeof id === 'object' && id !== null ? Number(id.id) : Number(id))
            .filter(id => !isNaN(id))
        }
        return []
      } catch (e) {
        console.error(`Failed to parse file IDs string: ${fileIdsField}`)
        return []
      }
    }
    
    // Fallback: return empty array
    return []
  } catch (err) {
    console.error(`Error parsing file IDs: ${err.message}`)
    return []
  }
} 
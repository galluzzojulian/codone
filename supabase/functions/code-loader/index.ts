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
    const { id, type, location } = await req.json()
    
    if (!id || !type || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Determine if we're loading page or site code
    let fileIds = []
    if (type === 'page') {
      const { data: page, error } = await supabaseClient
        .from('Pages')
        .select(location === 'head' ? 'head_files' : 'body_files')
        .eq('id', id)
        .single()
      
      if (error) {
        return new Response(
          JSON.stringify({ error: `Page not found: ${error.message}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Parse the file IDs as JSON if they're stored as strings
      const fileIdsString = location === 'head' ? page.head_files : page.body_files
      try {
        if (typeof fileIdsString === 'string') {
          fileIds = JSON.parse(fileIdsString)
        } else {
          fileIds = fileIdsString
        }
      } catch (err) {
        return new Response(
          JSON.stringify({ error: `Invalid file IDs format: ${err.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else if (type === 'site') {
      // Implement site-wide code loading if needed
      const { data: site, error } = await supabaseClient
        .from('Sites')
        .select('head_code, body_code')
        .eq('webflow_site_id', id)
        .single()
        
      if (error) {
        return new Response(
          JSON.stringify({ error: `Site not found: ${error.message}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // For now, return empty content for sites
      return new Response(
        JSON.stringify({ html: '', css: '', js: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!fileIds || !fileIds.length) {
      return new Response(
        JSON.stringify({ html: '', css: '', js: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Fetch all required files
    const { data: files, error } = await supabaseClient
      .from('Files')
      .select('*')
      .in('id', fileIds)
    
    if (error) {
      return new Response(
        JSON.stringify({ error: `Error fetching files: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Organize files by language
    const html = files.filter(f => f.language === 'html').map(f => f.code).join('\n')
    const css = files.filter(f => f.language === 'css').map(f => f.code).join('\n')
    const js = files.filter(f => f.language === 'js').map(f => f.code).join('\n')
    
    return new Response(
      JSON.stringify({ html, css, js }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 
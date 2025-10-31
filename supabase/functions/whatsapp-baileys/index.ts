import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 WhatsApp Baileys - Starting request processing...');
    console.log('Request method:', req.method);
    
    // Parse request body
    let body = {};
    try {
      if (req.method === 'POST') {
        const rawBody = await req.text();
        console.log('Raw body:', rawBody);
        body = JSON.parse(rawBody);
        console.log('Parsed body:', body);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const action = (body as any).action || 'generate-qr';
    console.log('🎯 Action extracted:', JSON.stringify(action));
    console.log('Action type:', typeof action);
    
    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);
    console.log('🔄 Processing action:', action);

    // Handle different actions
    switch (action) {
      case 'generate-qr':
        console.log('📱 Generating QR Code...');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'QR generation started',
            sessionId: `test_${user.id}_${Date.now()}`,
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            status: 'connecting'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get-sessions':
        console.log('📋 Getting sessions...');
        
        // Try to get sessions from database
        try {
          const { data: userSessions, error } = await supabaseAdmin
            .from('whatsapp_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Database error:', error);
            return new Response(
              JSON.stringify({ 
                success: true, 
                sessions: [],
                error: 'Could not load sessions from database'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              sessions: userSessions || []
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (dbError) {
          console.error('Database connection error:', dbError);
          return new Response(
            JSON.stringify({ 
              success: true, 
              sessions: [],
              error: 'Database connection failed'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'check-status':
        console.log('🔍 Checking status...');
        const { sessionId } = body as any;
        return new Response(
          JSON.stringify({ 
            success: true,
            status: 'disconnected',
            connected: false,
            sessionId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'send-message':
        console.log('💬 Sending message...');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'WhatsApp not connected - test mode'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );

      case 'disconnect':
        console.log('🔌 Disconnecting...');
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        console.error('❌ Invalid action received:', action);
        console.error('Available actions: generate-qr, check-status, send-message, get-sessions, disconnect');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action', 
            received: action,
            receivedType: typeof action,
            available: ['generate-qr', 'check-status', 'send-message', 'get-sessions', 'disconnect'] 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error) {
    console.error('🚨 WhatsApp Baileys Error:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        stack: (error as Error).stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
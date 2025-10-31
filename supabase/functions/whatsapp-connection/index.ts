import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QRData {
  qr: string;
  sessionId: string;
  status: 'qr' | 'connected' | 'disconnected' | 'loading';
}

// Simulated WhatsApp session storage
const sessions = new Map<string, any>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (action) {
      case 'generate-qr': {
        // Generate QR code for WhatsApp Web connection
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        // Generate realistic WhatsApp QR code data
        const qrData = {
          ref: `3EB0${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          ttl: 20000, // 20 seconds like real WhatsApp
          serverToken: Math.random().toString(36).substring(2, 25),
          clientToken: Math.random().toString(36).substring(2, 25),
          timestamp: Date.now()
        };

        // Format similar to real WhatsApp Web
        const qrString = `${qrData.ref},${qrData.serverToken},${qrData.clientToken},${qrData.timestamp}`;
        
        // Store session data
        sessions.set(sessionId, {
          qrData,
          status: 'waiting',
          createdAt: Date.now()
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            qr: qrString,
            sessionId,
            status: 'qr'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      case 'check-status': {
        const { sessionId } = await req.json();
        
        if (!sessionId || !sessions.has(sessionId)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Session not found' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            },
          )
        }

        const session = sessions.get(sessionId);
        
        // Simulate connection after some time (for demo purposes)
        const elapsed = Date.now() - session.createdAt;
        
        if (elapsed > 10000 && session.status === 'waiting') {
          // Simulate successful connection after 10 seconds
          session.status = 'connected';
          sessions.set(sessionId, session);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: session.status,
            connected: session.status === 'connected'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      case 'send-message': {
        const { sessionId, phone, message } = await req.json();
        
        if (!sessionId || !sessions.has(sessionId)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Session not found' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            },
          )
        }

        const session = sessions.get(sessionId);
        
        if (session.status !== 'connected') {
          return new Response(
            JSON.stringify({ success: false, error: 'WhatsApp not connected' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            },
          )
        }

        // Here you would implement the actual message sending logic
        // For now, we'll simulate a successful send
        console.log(`Sending message to ${phone}: ${message}`);
        
        // Log message to database for tracking
        await supabaseAdmin
          .from('whatsapp_messages')
          .insert([{
            session_id: sessionId,
            phone: phone,
            message: message,
            status: 'sent',
            sent_at: new Date().toISOString()
          }]);

        return new Response(
          JSON.stringify({ 
            success: true, 
            messageId: `msg_${Date.now()}`,
            status: 'sent'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      case 'disconnect': {
        const { sessionId } = await req.json();
        
        if (sessionId && sessions.has(sessionId)) {
          sessions.delete(sessionId);
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
    }

  } catch (error) {
    console.error('WhatsApp Connection Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
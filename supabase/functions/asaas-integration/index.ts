import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASAAS_BASE_URL = 'https://www.asaas.com/api/v3';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Asaas Integration - Starting request processing...');
    
    // Parse request body
    let body = {};
    try {
      if (req.method === 'POST') {
        const rawBody = await req.text();
        console.log('Raw body received, length:', rawBody.length);
        if (rawBody.trim()) {
          body = JSON.parse(rawBody);
          console.log('Parsed body action:', (body as any).action);
        } else {
          console.log('Empty body received');
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const action = (body as any).action;
    console.log('🎯 Action extracted:', JSON.stringify(action));
    
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

    // Get Asaas API Key from environment
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    
    switch (action) {
      case 'configure': {
        console.log('⚙️ Configuring Asaas...');
        const { apiKey, webhookUrl } = body as any;
        
        if (!apiKey) {
          return new Response(
            JSON.stringify({ success: false, error: 'API Key é obrigatória' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Test API Key with Asaas
        try {
          const testResponse = await fetch(`${ASAAS_BASE_URL}/customers?limit=1`, {
            headers: {
              'access_token': apiKey,
              'Content-Type': 'application/json'
            }
          });

          if (!testResponse.ok) {
            throw new Error('API Key inválida');
          }

          // Store configuration in user metadata or database
          // For now, we'll just validate it
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Asaas configurado com sucesso',
              webhookUrl 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
          
        } catch (error) {
          console.error('API Key validation failed:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'API Key inválida ou sem acesso à API do Asaas' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
      }

      case 'create-charge': {
        console.log('💰 Creating charge...');
        
        if (!asaasApiKey) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Asaas não configurado. Configure sua API Key primeiro.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const { customer, billingType, value, dueDate, description } = body as any;

        if (!customer || !customer.name || !customer.email || !value) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Dados obrigatórios: nome, email e valor' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        try {
          // First, create or get customer
          const customerResponse = await fetch(`${ASAAS_BASE_URL}/customers`, {
            method: 'POST',
            headers: {
              'access_token': asaasApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              cpfCnpj: customer.cpfCnpj
            })
          });

          const customerData = await customerResponse.json();
          
          if (!customerResponse.ok) {
            // If customer already exists, try to find it
            if (customerData.errors?.[0]?.description?.includes('already exists')) {
              const searchResponse = await fetch(`${ASAAS_BASE_URL}/customers?email=${customer.email}`, {
                headers: {
                  'access_token': asaasApiKey,
                  'Content-Type': 'application/json'
                }
              });
              const searchData = await searchResponse.json();
              if (searchData.data?.[0]) {
                customerData.id = searchData.data[0].id;
              } else {
                throw new Error('Erro ao criar/encontrar cliente');
              }
            } else {
              throw new Error(customerData.errors?.[0]?.description || 'Erro ao criar cliente');
            }
          }

          // Create charge
          const chargePayload = {
            customer: customerData.id,
            billingType: billingType || 'BOLETO',
            value: parseFloat(value),
            dueDate: dueDate || undefined,
            description: description || undefined
          };

          const chargeResponse = await fetch(`${ASAAS_BASE_URL}/payments`, {
            method: 'POST',
            headers: {
              'access_token': asaasApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(chargePayload)
          });

          const chargeData = await chargeResponse.json();

          if (!chargeResponse.ok) {
            throw new Error(chargeData.errors?.[0]?.description || 'Erro ao criar cobrança');
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              charge: {
                id: chargeData.id,
                status: chargeData.status,
                value: chargeData.value,
                dueDate: chargeData.dueDate,
                description: chargeData.description,
                invoiceUrl: chargeData.invoiceUrl,
                customer: customer
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error: any) {
          console.error('Error creating charge:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error.message || 'Erro ao criar cobrança'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }

      case 'get-charges': {
        console.log('📋 Getting charges...');
        
        if (!asaasApiKey) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              charges: [],
              error: 'Asaas não configurado'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const response = await fetch(`${ASAAS_BASE_URL}/payments?limit=50`, {
            headers: {
              'access_token': asaasApiKey,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.errors?.[0]?.description || 'Erro ao buscar cobranças');
          }

          // Get customer details for each charge
          const charges = await Promise.all(
            (data.data || []).map(async (charge: any) => {
              try {
                const customerResponse = await fetch(`${ASAAS_BASE_URL}/customers/${charge.customer}`, {
                  headers: {
                    'access_token': asaasApiKey,
                    'Content-Type': 'application/json'
                  }
                });
                const customerData = await customerResponse.json();

                return {
                  id: charge.id,
                  status: charge.status,
                  value: charge.value,
                  dueDate: charge.dueDate,
                  description: charge.description,
                  invoiceUrl: charge.invoiceUrl,
                  customer: customerResponse.ok ? {
                    name: customerData.name,
                    email: customerData.email,
                    phone: customerData.phone
                  } : null
                };
              } catch (error) {
                return {
                  id: charge.id,
                  status: charge.status,
                  value: charge.value,
                  dueDate: charge.dueDate,
                  description: charge.description,
                  invoiceUrl: charge.invoiceUrl,
                  customer: null
                };
              }
            })
          );

          return new Response(
            JSON.stringify({ 
              success: true, 
              charges 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error: any) {
          console.error('Error getting charges:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error.message || 'Erro ao buscar cobranças'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }

      case 'get-charge-status': {
        console.log('🔍 Getting charge status...');
        const { chargeId } = body as any;
        
        if (!asaasApiKey || !chargeId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Asaas não configurado ou ID da cobrança não fornecido'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        try {
          const response = await fetch(`${ASAAS_BASE_URL}/payments/${chargeId}`, {
            headers: {
              'access_token': asaasApiKey,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.errors?.[0]?.description || 'Erro ao buscar status da cobrança');
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              charge: {
                id: data.id,
                status: data.status,
                value: data.value,
                dueDate: data.dueDate,
                description: data.description,
                invoiceUrl: data.invoiceUrl
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error: any) {
          console.error('Error getting charge status:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error.message || 'Erro ao buscar status da cobrança'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }

      case 'cancel-charge': {
        console.log('❌ Canceling charge...');
        const { chargeId } = body as any;
        
        if (!asaasApiKey || !chargeId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Asaas não configurado ou ID da cobrança não fornecido'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        try {
          const response = await fetch(`${ASAAS_BASE_URL}/payments/${chargeId}`, {
            method: 'DELETE',
            headers: {
              'access_token': asaasApiKey,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.errors?.[0]?.description || 'Erro ao cancelar cobrança');
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Cobrança cancelada com sucesso'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (error: any) {
          console.error('Error canceling charge:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error.message || 'Erro ao cancelar cobrança'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }

      default:
        console.error('❌ Invalid action received:', action);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action', 
            received: action,
            available: ['configure', 'create-charge', 'get-charges', 'get-charge-status', 'cancel-charge'] 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error: any) {
    console.error('🚨 Asaas Integration Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
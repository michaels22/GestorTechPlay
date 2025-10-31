// Testador específico para descobrir a API do usuário

export const testUserWhatsAppAPI = async (baseUrl: string, apiKey?: string) => {
  const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  console.log('🔍 Iniciando teste da API WhatsApp...');
  console.log('URL base:', url);

  // 1. Testar endpoint que sabemos que funciona
  try {
    console.log('📋 Testando /instances...');
    const instancesResponse = await fetch(`${url}/instances`, {
      method: 'GET',
      headers,
    });
    
    if (instancesResponse.ok) {
      const instancesData = await instancesResponse.json();
      console.log('✅ /instances funcionando:', instancesData);
    }
  } catch (error) {
    console.log('❌ Erro no /instances:', error);
  }

  // 2. Tentar descobrir outros endpoints baseados na estrutura comum
  const testEndpoints = [
    // Criar/inicializar instância
    { path: '/instance', method: 'POST', body: { name: 'test' } },
    { path: '/instances', method: 'POST', body: { name: 'test' } },
    { path: '/create', method: 'POST', body: { instance: 'test' } },
    
    // QR Code endpoints
    { path: '/qr', method: 'GET' },
    { path: '/qrcode', method: 'GET' },
    { path: '/qr/test', method: 'GET' },
    { path: '/qrcode/test', method: 'GET' },
    { path: '/instance/qr', method: 'GET' },
    { path: '/instance/test/qr', method: 'GET' },
    { path: '/instances/test/qr', method: 'GET' },
    
    // Conectar/Start endpoints
    { path: '/connect', method: 'POST', body: { instance: 'test' } },
    { path: '/start', method: 'POST', body: { instance: 'test' } },
    { path: '/instance/connect', method: 'POST', body: { name: 'test' } },
    { path: '/instance/start', method: 'POST', body: { name: 'test' } },
  ];

  const workingEndpoints = [];

  for (const endpoint of testEndpoints) {
    try {
      console.log(`🧪 Testando: ${endpoint.method} ${endpoint.path}`);
      
      const response = await fetch(`${url}${endpoint.path}`, {
        method: endpoint.method,
        headers,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (response.ok) {
        console.log(`✅ ${endpoint.path} (${response.status}):`, responseData);
        workingEndpoints.push({
          ...endpoint,
          status: response.status,
          response: responseData
        });
      } else if (response.status !== 404) {
        console.log(`⚠️ ${endpoint.path} (${response.status}):`, responseData);
        // Mesmo com erro, pode ser útil saber que o endpoint existe
        workingEndpoints.push({
          ...endpoint,
          status: response.status,
          response: responseData,
          error: true
        });
      }
    } catch (error) {
      console.log(`❌ Erro em ${endpoint.path}:`, error.message);
    }

    // Pequeno delay entre requisições para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('🎯 Endpoints que funcionaram ou existem:', workingEndpoints);
  return workingEndpoints;
};
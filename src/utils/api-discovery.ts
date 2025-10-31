// Utilitário para descobrir endpoints da API de WhatsApp

interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST';
  body?: any;
  response?: any; // Adicionar o campo response
}

export class WhatsAppApiDiscovery {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };

    if (apiKey) {
      this.headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  // Descobrir endpoints disponíveis
  async discoverEndpoints(): Promise<string[]> {
    const commonEndpoints = [
      '/',
      '/instances',
      '/instance',
      '/docs',
      '/swagger',
      '/api-docs',
      '/health',
      '/status',
      '/help',
    ];

    const available = [];
    
    for (const endpoint of commonEndpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: this.headers,
        });
        
        if (response.ok) {
          available.push(endpoint);
          console.log(`✅ Endpoint encontrado: ${endpoint}`);
        }
      } catch (error) {
        console.log(`❌ Endpoint não disponível: ${endpoint}`);
      }
    }

    return available;
  }

  // Tentar descobrir endpoints de QR Code baseado na estrutura da API
  async findQrEndpoints(instanceName: string = 'default'): Promise<ApiEndpoint[]> {
    const qrEndpoints: ApiEndpoint[] = [
      // Criar instância primeiro
      { path: '/instance/create', method: 'POST', body: { name: instanceName } },
      { path: '/create-instance', method: 'POST', body: { instanceName } },
      { path: '/instances/create', method: 'POST', body: { name: instanceName } },
      
      // Gerar QR Code
      { path: `/instance/${instanceName}/qr`, method: 'GET' },
      { path: `/instances/${instanceName}/qr`, method: 'GET' },
      { path: `/qr/${instanceName}`, method: 'GET' },
      { path: '/qr', method: 'GET' },
      { path: '/qrcode', method: 'GET' },
      { path: '/generate-qr', method: 'POST', body: { instance: instanceName } },
      
      // Conectar/Iniciar
      { path: `/instance/${instanceName}/connect`, method: 'POST' },
      { path: `/instances/${instanceName}/connect`, method: 'POST' },
      { path: `/instance/${instanceName}/start`, method: 'POST' },
      { path: `/instances/${instanceName}/start`, method: 'POST' },
      { path: '/start', method: 'POST', body: { instance: instanceName } },
      { path: '/connect', method: 'POST', body: { instance: instanceName } },
    ];

    const workingEndpoints: ApiEndpoint[] = [];

    for (const endpoint of qrEndpoints) {
      try {
        console.log(`Testando: ${endpoint.method} ${endpoint.path}`);
        
        const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: this.headers,
          body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Endpoint funcional: ${endpoint.method} ${endpoint.path}`, data);
          workingEndpoints.push({ ...endpoint, response: data });
        } else {
          console.log(`❌ Endpoint ${endpoint.path} retornou ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Erro no endpoint ${endpoint.path}:`, error.message);
      }
    }

    return workingEndpoints;
  }

  // Fazer uma requisição para um endpoint específico
  async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
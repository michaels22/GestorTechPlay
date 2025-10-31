import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, TestTube } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppConfigProps {
  onConfigSave: (config: { apiUrl: string; apiKey?: string; instanceName?: string }) => void;
  currentConfig?: { apiUrl: string; apiKey?: string; instanceName?: string };
}

export default function WhatsAppConfig({ onConfigSave, currentConfig }: WhatsAppConfigProps) {
  const [apiUrl, setApiUrl] = useState(currentConfig?.apiUrl || 'https://89ec2d19a7c2.ngrok-free.app');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [instanceName, setInstanceName] = useState(currentConfig?.instanceName || 'default');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Carregar configuração salva do localStorage
    const savedConfig = localStorage.getItem('whatsapp-api-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setApiUrl(config.apiUrl || '');
        setApiKey(config.apiKey || '');
        setInstanceName(config.instanceName || 'default');
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    }
  }, []);

  const handleSave = () => {
    if (!apiUrl) {
      toast.error('URL da API é obrigatória');
      return;
    }

    const config = {
      apiUrl: apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl,
      apiKey: apiKey || undefined,
      instanceName: instanceName || 'default'
    };

    // Salvar no localStorage
    localStorage.setItem('whatsapp-api-config', JSON.stringify(config));
    
    // Notificar componente pai
    onConfigSave(config);
    
    toast.success('Configuração salva com sucesso!');
  };

  const testConnection = async () => {
    if (!apiUrl) {
      toast.error('Configure a URL da API primeiro');
      return;
    }

    setTesting(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Para contornar warning do ngrok
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const testUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      
      // Primeiro, vamos testar endpoints que sabemos que existem
      const testEndpoints = [
        '/instances', // Este sabemos que funciona
        '/instance', 
        '/health',
        '/status',
        '/api/status',
        '/docs', // Pode ter documentação
        '/swagger', // Pode ter documentação da API
        '/', // Root pode ter informações
      ];

      let connected = false;
      let availableEndpoints = [];
      
      // Testar endpoints conhecidos
      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(`${testUrl}${endpoint}`, {
            method: 'GET',
            headers,
          });
          
          if (response.ok) {
            connected = true;
            availableEndpoints.push(endpoint);
            
            // Se é o endpoint /instances, vamos ver o que retorna
            if (endpoint === '/instances') {
              const data = await response.json();
              console.log('Resposta do /instances:', data);
            }
          }
        } catch (error) {
          // Continuar tentando outros endpoints
        }
      }

      console.log('Endpoints disponíveis encontrados:', availableEndpoints);

      if (connected) {
        toast.success('✅ Conexão com a API estabelecida!');
      } else {
        toast.error('❌ Não foi possível conectar com a API. Verifique a URL e credenciais.');
      }
    } catch (error) {
      toast.error('Erro ao testar conexão: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração da API WhatsApp
          <Badge variant="outline" className="text-xs">Personalizada</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure sua API de WhatsApp (Evolution API, Baileys, etc.)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">URL da API *</Label>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8080 ou https://suaapi.com"
            />
            <p className="text-xs text-muted-foreground">
              URL base da sua API de WhatsApp
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key (opcional)</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Sua chave de API"
            />
            <p className="text-xs text-muted-foreground">
              Token de autenticação se necessário
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instance-name">Nome da Instância</Label>
          <Input
            id="instance-name"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            placeholder="default"
          />
          <p className="text-xs text-muted-foreground">
            Nome da instância WhatsApp na sua API
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Salvar Configuração
          </Button>
          
          <Button 
            onClick={testConnection} 
            variant="outline" 
            disabled={testing || !apiUrl}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>📋 APIs Suportadas:</strong><br />
            • Evolution API<br />
            • Baileys<br />
            • WhatsApp Web JS<br />
            • Outras APIs compatíveis
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
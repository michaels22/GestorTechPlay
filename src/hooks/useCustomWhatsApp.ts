
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { testUserWhatsAppAPI } from '@/utils/whatsapp-api-tester';

interface WhatsAppSession {
  sessionId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  qrCode?: string;
  phoneNumber?: string;
  deviceName?: string;
  lastActivity?: string;
  createdAt?: string;
}

interface CustomWhatsAppConfig {
  apiUrl: string;
  apiKey?: string;
  instanceName?: string;
}

export const useCustomWhatsApp = (config: CustomWhatsAppConfig) => {
  const [currentSession, setCurrentSession] = useState<WhatsAppSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [qrRefreshInterval, setQrRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Limpar intervalos quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (qrRefreshInterval) clearInterval(qrRefreshInterval);
      if (statusCheckInterval) clearInterval(statusCheckInterval);
    };
  }, [qrRefreshInterval, statusCheckInterval]);

  // Função para fazer requisições à sua API
  const makeApiRequest = useCallback(async (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }, [config.apiUrl, config.apiKey]);

  // Função para buscar apenas o QR Code atualizado
  const refreshQRCode = useCallback(async (sessionId: string) => {
    try {
      const qrEndpoints = [
        `/qr/${sessionId}`,
        `/qrcode/${sessionId}`,
        `/instance/${sessionId}/qr`,
        `/instances/${sessionId}/qr`,
        `/qr`,
        `/qrcode`,
      ];

      for (const endpoint of qrEndpoints) {
        try {
          console.log(`🔄 Atualizando QR em: ${endpoint}`);
          const qrResponse = await makeApiRequest(endpoint, 'GET');
          
          if (qrResponse.qr || qrResponse.qrCode || qrResponse.qrcode || qrResponse.base64) {
            let qrCode = '';
            if (qrResponse.qrcode) {
              qrCode = qrResponse.qrcode;
            } else if (qrResponse.qr) {
              qrCode = qrResponse.qr;
            } else if (qrResponse.qrCode) {
              qrCode = qrResponse.qrCode;
            } else if (qrResponse.base64) {
              qrCode = qrResponse.base64.startsWith('data:image') ? qrResponse.base64 : `data:image/png;base64,${qrResponse.base64}`;
            }

            setCurrentSession(prev => prev ? { ...prev, qrCode } : null);
            console.log(`✅ QR Code atualizado de: ${endpoint}`);
            return true;
          }
        } catch (error) {
          console.log(`❌ Falha ao atualizar QR em ${endpoint}:`, error.message);
        }
      }
      
      // Não remover o QR Code se falhar a renovação - manter o QR atual
      console.log('⚠️ Mantendo QR Code atual (falha na renovação)');
      return false;
    } catch (error) {
      console.error('Erro ao atualizar QR Code:', error);
      return false;
    }
  }, [makeApiRequest]);

  // Gerar QR Code - versão otimizada
  const generateQRCode = useCallback(async () => {
    console.log('🚀 Iniciando geração de QR Code...');
    setConnecting(true);
    
    // Limpar intervalos anteriores
    if (qrRefreshInterval) clearInterval(qrRefreshInterval);
    if (statusCheckInterval) clearInterval(statusCheckInterval);
    
    try {
      const instanceName = config.instanceName || 'default';
      
      console.log('🔍 Testando sua API para descobrir endpoints...');
      const workingEndpoints = await testUserWhatsAppAPI(config.apiUrl, config.apiKey);
      
      let qrData = null;
      let usedEndpoint = null;
      let createdInstanceResponse = null;

      // Tentar criar instância primeiro
      console.log('🔧 Criando nova instância...');
      const createEndpoints = [
        { path: '/instance', body: { name: instanceName } },
        { path: '/instances', body: { name: instanceName } },
        { path: '/create', body: { instance: instanceName } },
      ];

      for (const endpoint of createEndpoints) {
        try {
          const createResponse = await makeApiRequest(endpoint.path, 'POST', endpoint.body);
          console.log(`✅ Instância criada com ${endpoint.path}:`, createResponse);
          
          createdInstanceResponse = createResponse;
          break;
          
        } catch (error) {
          console.log(`❌ Criar instância em ${endpoint.path} falhou:`, error.message);
        }
      }

      // Aguardar um pouco para a instância ser inicializada
      await new Promise(resolve => setTimeout(resolve, 2000));

      const sessionId = createdInstanceResponse?.sessionId || createdInstanceResponse?.instanceId || createdInstanceResponse?.id || instanceName;
      
      // Tentar pegar QR Code
      const qrCheckEndpoints = [
        `/qr/${sessionId}`,
        `/qrcode/${sessionId}`,
        `/instance/${sessionId}/qr`,
        `/instances/${sessionId}/qr`,
        `/qr/${instanceName}`,
        `/qrcode/${instanceName}`,
        `/instance/${instanceName}/qr`,
        `/instances/${instanceName}/qr`,
        `/qr`,
        `/qrcode`,
      ];
      
      for (const qrEndpoint of qrCheckEndpoints) {
        try {
          console.log(`🔍 Tentando QR em: ${qrEndpoint}`);
          const qrResponse = await makeApiRequest(qrEndpoint, 'GET');
          if (qrResponse.qr || qrResponse.qrCode || qrResponse.qrcode || qrResponse.base64) {
            qrData = qrResponse;
            usedEndpoint = qrEndpoint;
            console.log(`✅ QR Code encontrado em: ${qrEndpoint}`);
            break;
          }
        } catch (error) {
          console.log(`❌ ${qrEndpoint} falhou:`, error.message);
        }
      }

      if (!qrData) {
        throw new Error('Não consegui encontrar como gerar QR Code na sua API.');
      }

      // Extrair QR Code da resposta
      let qrCode = '';
      if (qrData.qrcode) {
        qrCode = qrData.qrcode;
      } else if (qrData.qr) {
        qrCode = qrData.qr;
      } else if (qrData.qrCode) {
        qrCode = qrData.qrCode;
      } else if (qrData.base64) {
        qrCode = qrData.base64.startsWith('data:image') ? qrData.base64 : `data:image/png;base64,${qrData.base64}`;
      }

      const newSession: WhatsAppSession = {
        sessionId,
        status: 'connecting',
        qrCode,
      };

      setCurrentSession(newSession);
      toast.success(`QR Code gerado com sucesso! (via ${usedEndpoint})`);
      
      // Configurar renovação automática do QR Code a cada 25 segundos (mais tempo para escanear)
      const qrInterval = setInterval(async () => {
        console.log('🔄 Renovando QR Code automaticamente...');
        const updated = await refreshQRCode(sessionId);
        if (!updated) {
          console.log('⚠️ Falha ao renovar QR Code');
        }
      }, 25000); // 25 segundos - mais tempo para o usuário escanear
      
      setQrRefreshInterval(qrInterval);
      
      // Iniciar verificação de status menos frequente
      const statusInterval = setInterval(async () => {
        const connected = await checkConnectionStatus(sessionId);
        if (connected) {
          clearInterval(qrInterval);
          clearInterval(statusInterval);
          setQrRefreshInterval(null);
          setStatusCheckInterval(null);
        }
      }, 5000); // A cada 5 segundos
      
      setStatusCheckInterval(statusInterval);
      
      // Limpar após 2 minutos se não conectar
      setTimeout(() => {
        clearInterval(qrInterval);
        clearInterval(statusInterval);
        setQrRefreshInterval(null);
        setStatusCheckInterval(null);
      }, 120000);
      
      return newSession;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code: ' + error.message);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [config, makeApiRequest, refreshQRCode]);

  // Verificar status da conexão
  const checkConnectionStatus = useCallback(async (sessionId: string) => {
    try {
      const statusEndpoints = [
        `/instance/connectionState/${sessionId}`,
        `/instance/status/${sessionId}`,
        `/status/${sessionId}`,
        `/instance/${sessionId}/status`,
        `/instances/${sessionId}/status`,
        `/instance/${sessionId}`,
        `/instances/${sessionId}`,
        `/status`,
        `/instance/status`,
      ];

      let data = null;

      for (const endpoint of statusEndpoints) {
        try {
          data = await makeApiRequest(endpoint, 'GET');
          break;
        } catch (error) {
          // Silencioso para não poluir o console
        }
      }

      if (!data) {
        return false;
      }
      
      let status: WhatsAppSession['status'] = 'disconnected';
      let phoneNumber = '';
      let deviceName = '';

      if (data.state === 'open' || data.status === 'connected' || data.connected === true || data.instance?.state === 'open') {
        status = 'connected';
        phoneNumber = data.phoneNumber || data.number || data.phone || data.instance?.phoneNumber || '';
        deviceName = data.deviceName || data.device || data.instance?.deviceName || 'WhatsApp Web';
      } else if (data.state === 'connecting' || data.status === 'connecting' || data.instance?.state === 'connecting') {
        status = 'connecting';
      } else {
        status = 'disconnected';
      }

      const updatedSession: WhatsAppSession = {
        sessionId,
        status,
        phoneNumber,
        deviceName,
      };

      setCurrentSession(updatedSession);

      if (status === 'connected') {
        toast.success(`WhatsApp conectado! ${phoneNumber} - ${deviceName}`);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }, [makeApiRequest]);

  // Enviar mensagem
  const sendMessage = useCallback(async (phone: string, message: string) => {
    if (!currentSession || currentSession.status !== 'connected') {
      throw new Error('WhatsApp não está conectado');
    }

    setLoading(true);
    try {
      const data = await makeApiRequest(`/message/sendText/${currentSession.sessionId}`, 'POST', {
        number: phone,
        text: message,
      });

      toast.success('Mensagem enviada com sucesso!');
      return data.messageId || data.id || Date.now().toString();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentSession, makeApiRequest]);

  // Desconectar
  const disconnect = useCallback(async () => {
    if (!currentSession) return;

    // Limpar intervalos
    if (qrRefreshInterval) {
      clearInterval(qrRefreshInterval);
      setQrRefreshInterval(null);
    }
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }

    try {
      await makeApiRequest(`/instance/logout/${currentSession.sessionId}`, 'POST');
      
      setCurrentSession(null);
      toast.success('WhatsApp desconectado');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar WhatsApp');
    }
  }, [currentSession, makeApiRequest, qrRefreshInterval, statusCheckInterval]);

  return {
    currentSession,
    loading,
    connecting,
    generateQRCode,
    checkConnectionStatus,
    sendMessage,
    disconnect,
    isConnected: currentSession?.status === 'connected'
  };
};

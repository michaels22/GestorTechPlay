import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { whatsappDebug } from '@/utils/whatsapp-debug';

interface WhatsAppSession {
  sessionId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  qrCode?: string;
  phoneNumber?: string;
  deviceName?: string;
  lastActivity?: string;
  createdAt?: string;
}

interface WhatsAppMessage {
  id: string;
  sessionId: string;
  phone: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageId?: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
}

export const useRealWhatsApp = () => {
  const [currentSession, setCurrentSession] = useState<WhatsAppSession | null>(null);
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Carregar sessões do usuário
  const loadSessions = useCallback(async () => {
    try {
      const payload = { action: 'get-sessions' };
      whatsappDebug.log('Carregando sessões com payload:', payload);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-baileys', {
        body: payload
      });
      
      if (error) {
        console.error('Erro na Edge Function:', error);
        return;
      }
      
      if (data?.success) {
        setSessions(data.sessions || []);
        
        // Encontrar sessão ativa (recente e conectada)
        const now = new Date();
        const activeSession = data.sessions?.find((s: any) => {
          if (s.status !== 'connected' || !s.last_activity) return false;
          
          // Verificar se a sessão é recente (últimas 2 horas)
          const lastActivity = new Date(s.last_activity);
          const timeDiff = now.getTime() - lastActivity.getTime();
          const hoursDiff = timeDiff / (1000 * 3600);
          
          return hoursDiff < 2; // Sessão ativa só se foi ativa nas últimas 2 horas
        });
        
        if (activeSession) {
          setCurrentSession({
            sessionId: activeSession.session_id,
            status: activeSession.status,
            phoneNumber: activeSession.phone_number,
            deviceName: activeSession.device_name,
            lastActivity: activeSession.last_activity,
            createdAt: activeSession.created_at
          });
        } else {
          // Limpar sessão atual se não há nenhuma ativa recente
          setCurrentSession(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  }, []);

  // Carregar sessões ao inicializar
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Gerar QR Code para novo pareamento
  const generateQRCode = useCallback(async () => {
    whatsappDebug.log('Iniciando geração de QR Code...');
    setConnecting(true);
    try {
      const payload = { action: 'generate-qr' };
      whatsappDebug.log('Enviando payload:', payload);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-baileys', {
        body: payload
      });

      if (error) {
        whatsappDebug.error('Erro na Edge Function:', error);
        throw error;
      }

      whatsappDebug.log('Resposta da Edge Function:', data);

      if (data?.success) {
        const newSession: WhatsAppSession = {
          sessionId: data.sessionId,
          status: 'connecting',
          qrCode: data.qrCode
        };
        
        setCurrentSession(newSession);
        whatsappDebug.log('QR Code gerado com sucesso:', { sessionId: data.sessionId, hasQR: !!data.qrCode });
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
        
        return newSession;
      } else {
        throw new Error(data?.error || 'Erro ao gerar QR Code');
      }
    } catch (error) {
      whatsappDebug.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code. Tente novamente.');
      throw error;
    } finally {
      setConnecting(false);
    }
  }, []);

  // Verificar status da conexão
  const checkConnectionStatus = useCallback(async (sessionId: string) => {
    try {
      // Vamos checar pelo banco, pois a memória da Edge pode reiniciar
      const payload = { action: 'check-status', sessionId };
      whatsappDebug.log('Verificando status com payload:', payload);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-baileys', {
        body: payload
      });

      if (error) {
        console.error('Erro na Edge Function:', error);
        return false;
      }

      if (data?.success) {
        const updatedSession: WhatsAppSession = {
          sessionId,
          status: data.status,
          phoneNumber: data.phoneNumber,
          deviceName: data.deviceName
        };
        setCurrentSession(updatedSession);

        if (data.status === 'connected') {
          toast.success(`WhatsApp conectado! ${data.phoneNumber} - ${data.deviceName}`);
          loadSessions();
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return false;
    }
  }, [loadSessions]);

  // Enviar mensagem
  const sendMessage = useCallback(async (phone: string, message: string) => {
    if (!currentSession || currentSession.status !== 'connected') {
      throw new Error('WhatsApp não está conectado');
    }

    const formattedPhone = whatsappDebug.formatPhoneNumber(phone);
    whatsappDebug.log('Enviando mensagem:', { originalPhone: phone, formattedPhone, message });

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-baileys', {
        body: { 
          action: 'send-message',
          sessionId: currentSession.sessionId, 
          phone: formattedPhone, 
          message 
        }
      });

      if (error) {
        whatsappDebug.error('Erro na Edge Function:', error);
        throw error;
      }

      whatsappDebug.log('Resposta do envio:', data);

      if (data?.success) {
        const newMessage: WhatsAppMessage = {
          id: data.messageId,
          sessionId: currentSession.sessionId,
          phone: formattedPhone,
          message,
          status: 'sent',
          messageId: data.messageId,
          sentAt: data.timestamp
        };

        setMessages(prev => [newMessage, ...prev]);
        toast.success('Mensagem enviada com sucesso!');
        
        return data.messageId;
      } else {
        throw new Error(data?.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      whatsappDebug.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentSession]);

  // Enviar mensagens em massa
  const sendBulkMessages = useCallback(async (contacts: Array<{ phone: string; message: string; name?: string }>) => {
    if (!currentSession || currentSession.status !== 'connected') {
      throw new Error('WhatsApp não está conectado');
    }

    const results = [];
    setLoading(true);

    try {
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        
        try {
          const messageId = await sendMessage(contact.phone, contact.message);
          results.push({ 
            phone: contact.phone, 
            name: contact.name,
            success: true, 
            messageId 
          });
          
          // Delay entre mensagens para evitar spam
          if (i < contacts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos
          }
        } catch (error) {
          results.push({ 
            phone: contact.phone, 
            name: contact.name,
            success: false, 
            error: error.message 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      toast.success(`${successCount}/${contacts.length} mensagens enviadas com sucesso!`);
      
      return results;
    } finally {
      setLoading(false);
    }
  }, [currentSession, sendMessage]);

  // Desconectar WhatsApp
  const disconnect = useCallback(async () => {
    if (!currentSession) return;

    try {
      await supabase.functions.invoke('whatsapp-baileys', {
        body: { action: 'disconnect', sessionId: currentSession.sessionId }
      });

      setCurrentSession(null);
      toast.success('WhatsApp desconectado');
      loadSessions(); // Recarregar sessões
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar WhatsApp');
    }
  }, [currentSession, loadSessions]);

  // Limpar todas as sessões antigas
  const clearOldSessions = useCallback(async () => {
    try {
      // Marcar todas as sessões antigas como desconectadas
      const { error } = await supabase
        .from('whatsapp_sessions')
        .update({ status: 'disconnected' })
        .neq('status', 'disconnected');

      if (error) throw error;

      setCurrentSession(null);
      setSessions([]);
      toast.success('Sessões antigas removidas');
      loadSessions();
    } catch (error) {
      console.error('Erro ao limpar sessões:', error);
      toast.error('Erro ao limpar sessões antigas');
    }
  }, [loadSessions]);

  return {
    currentSession,
    sessions,
    messages,
    loading,
    connecting,
    generateQRCode,
    checkConnectionStatus,
    sendMessage,
    sendBulkMessages,
    disconnect,
    clearOldSessions,
    loadSessions,
    isConnected: currentSession?.status === 'connected'
  };
};
// Utility para debug do WhatsApp
export const whatsappDebug = {
  log: (message: string, data?: any) => {
    console.log(`[WHATSAPP DEBUG] ${message}`, data);
  },
  
  error: (message: string, error?: any) => {
    console.error(`[WHATSAPP ERROR] ${message}`, error);
  },
  
  formatPhoneNumber: (phone: string): string => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem código do país
    if (cleanPhone.length === 11 && cleanPhone.startsWith('55')) {
      return cleanPhone;
    } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) {
      return '55' + cleanPhone;
    } else if (cleanPhone.length === 10 && !cleanPhone.startsWith('55')) {
      return '55' + cleanPhone;
    }
    
    return cleanPhone;
  },
  
  validateSession: (session: any): boolean => {
    if (!session) {
      whatsappDebug.error('Session is null or undefined');
      return false;
    }
    
    if (!session.sessionId) {
      whatsappDebug.error('Session ID is missing');
      return false;
    }
    
    return true;
  }
};
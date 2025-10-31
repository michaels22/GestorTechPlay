import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppSessionProps {
  session: {
    sessionId: string;
    status: 'connecting' | 'connected' | 'disconnected' | 'failed';
    phoneNumber?: string;
    deviceName?: string;
    lastActivity?: string;
    createdAt?: string;
  };
  onDisconnect?: (sessionId: string) => void;
  isActive?: boolean;
}

export default function WhatsAppSession({ session, onDisconnect, isActive }: WhatsAppSessionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'disconnected':
        return 'Desconectado';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  return (
    <Card className={`transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            {session.phoneNumber || 'Sessão WhatsApp'}
          </CardTitle>
          <Badge className={getStatusColor(session.status)}>
            {getStatusText(session.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          {session.deviceName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Dispositivo:</span>
              <span className="font-medium">{session.deviceName}</span>
            </div>
          )}
          
          {session.lastActivity && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Última atividade:</span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(session.lastActivity), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </span>
            </div>
          )}
          
          {session.createdAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Criado:</span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(session.createdAt), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </span>
            </div>
          )}
        </div>
        
        {onDisconnect && session.status !== 'disconnected' && (
          <div className="mt-4 pt-3 border-t">
            <Button
              onClick={() => onDisconnect(session.sessionId)}
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Desconectar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
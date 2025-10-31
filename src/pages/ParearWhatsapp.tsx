import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Send, CheckCircle, AlertCircle, QrCode, RefreshCw, Wifi, Settings } from "lucide-react";
import { toast } from "sonner";
import { useClientes } from "@/hooks/useDatabase";
import { useCustomWhatsApp } from "@/hooks/useCustomWhatsApp";
import WhatsAppConfig from "@/components/WhatsAppConfig";

export default function ParearWhatsapp() {
  // Estados para teste de mensagem
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do seu sistema IPTV.");
  const [sendingTest, setSendingTest] = useState(false);
  
  // Configuração da API customizada
  const [apiConfig, setApiConfig] = useState(() => {
    const saved = localStorage.getItem('whatsapp-api-config');
    return saved ? JSON.parse(saved) : { apiUrl: '', apiKey: '', instanceName: 'default' };
  });

  // Usar o hook customizado do WhatsApp
  const {
    currentSession: session,
    loading,
    connecting,
    generateQRCode,
    checkConnectionStatus,
    sendMessage,
    disconnect,
    isConnected
  } = useCustomWhatsApp(apiConfig);

  const { buscar: buscarClientes } = useClientes();

  // SEO
  useEffect(() => {
    document.title = "Parear WhatsApp Real | Gestor Tech Play";
    const d =
      document.querySelector('meta[name="description"]') ||
      document.createElement("meta");
    d.setAttribute("name", "description");
    d.setAttribute(
      "content",
      "Conecte seu WhatsApp real usando Baileys para envio automático de mensagens."
    );
    if (!d.parentElement) document.head.appendChild(d);
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
  }, []);

  // Verificar status periodicamente quando conectando
  useEffect(() => {
    if (session?.status === 'connecting' && session?.sessionId) {
      const interval = setInterval(() => {
        checkConnectionStatus(session.sessionId);
      }, 3000);

      // Limpar interval após 30 segundos ou quando status mudar
      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 30000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [session?.status, session?.sessionId, checkConnectionStatus]);

  // Função para iniciar conexão
  const handleGenerateQR = async () => {
    try {
      await generateQRCode();
    } catch (error) {
      toast.error("Erro ao gerar QR Code");
    }
  };

  // Função para enviar mensagem de teste
  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      toast.error("Preencha o telefone e mensagem de teste");
      return;
    }

    setSendingTest(true);
    try {
      await sendMessage(testPhone, testMessage);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setSendingTest(false);
    }
  };

  // Função para enviar para todos os clientes
  const handleSendToAllClients = async () => {
    try {
      const clientes = await buscarClientes();
      if (!clientes?.length) {
        toast.error("Nenhum cliente encontrado");
        return;
      }

      const clientesComWhatsapp = clientes.filter(c => c.whatsapp);
      
      if (!clientesComWhatsapp.length) {
        toast.error("Nenhum cliente com WhatsApp cadastrado");
        return;
      }

      // Enviar uma por uma com delay
      for (const cliente of clientesComWhatsapp) {
        try {
          await sendMessage(cliente.whatsapp, `Olá ${cliente.nome}! ${testMessage}`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3s delay
        } catch (error) {
          console.error(`Erro ao enviar para ${cliente.nome}:`, error);
        }
      }
      
      toast.success(`Mensagens enviadas para ${clientesComWhatsapp.length} clientes!`);
    } catch (error) {
      toast.error("Erro ao enviar mensagens");
    }
  };

  const handleConfigSave = (config: { apiUrl: string; apiKey?: string; instanceName?: string }) => {
    setApiConfig(config);
  };

  return (
    <main className="container mx-auto max-w-4xl space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">🔥 WhatsApp Real - Conexão 100%</h1>
        <p className="text-muted-foreground">Conecte seu WhatsApp real usando sua API customizada - Sem simulação, sem limitações!</p>
      </header>

      <WhatsAppConfig onConfigSave={handleConfigSave} currentConfig={apiConfig} />

      <Tabs defaultValue="qrcode" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
          <TabsTrigger value="qrcode" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Code
            {isConnected && <Badge variant="secondary" className="bg-green-100 text-green-800">Conectado</Badge>}
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Enviar Mensagens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Instruções de Integração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-blue-900">🔗 Como integrar sua API:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Configure a URL da sua API no formulário acima</li>
                  <li>Adicione a API Key se sua API exigir autenticação</li>
                  <li>Defina o nome da instância (padrão: "default")</li>
                  <li>Teste a conexão para verificar se está funcionando</li>
                  <li>Salve a configuração e vá para a aba "QR Code"</li>
                </ol>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-green-900">📋 APIs Suportadas:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• <strong>Evolution API:</strong> Endpoints padrão para instâncias</li>
                  <li>• <strong>Baileys:</strong> Biblioteca nativa JavaScript</li>
                  <li>• <strong>WhatsApp Web JS:</strong> Puppeteer-based</li>
                  <li>• <strong>Outras:</strong> Qualquer API com endpoints similares</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900">⚠️ Importante:</h4>
                <p className="text-sm text-orange-800">
                  Certifique-se de que sua API está rodando e acessível antes de tentar gerar o QR Code.
                  O sistema tentará automaticamente detectar os endpoints corretos da sua API.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qrcode">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-600" />
                Conexão Real via API Customizada - WhatsApp Official
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Conecte seu WhatsApp real usando sua API configurada. Conexão direta, sem limitações!
              </p>
              {!apiConfig.apiUrl && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Configure sua API na aba "Config" antes de gerar o QR Code
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected ? (
                <div className="flex flex-col items-center space-y-4">
                  {!session?.qrCode || session?.status !== 'connecting' ? (
                    <div className="text-center space-y-4">
                      <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Clique no botão abaixo para gerar o QR Code
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleGenerateQR}
                        disabled={connecting || !apiConfig.apiUrl}
                        size="lg"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {connecting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Gerando QR Code...
                          </>
                        ) : (
                          <>
                            <Wifi className="h-4 w-4" />
                            {apiConfig.apiUrl ? 'Conectar WhatsApp Real' : 'Configure a API primeiro'}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border shadow-lg">
                        {session.qrCode?.startsWith('data:image') ? (
                          <img 
                            src={session.qrCode} 
                            alt="QR Code para conectar WhatsApp Real" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                            <div className="text-center">
                              <div className="font-mono text-xs break-all p-2 bg-white border rounded">
                                {session.qrCode}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                QR Code gerado - escaneie com o WhatsApp
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {session?.status === "connecting" && (
                          <div className="flex items-center justify-center gap-2 text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm font-medium">Aguardando conexão...</span>
                          </div>
                        )}
                        
                        <div className="bg-blue-50 p-3 rounded-lg max-w-sm mx-auto">
                          <p className="text-xs text-blue-700 text-center">
                            <strong>⚡ API Customizada Ativa:</strong><br />
                            QR Code gerado pela sua API: {apiConfig.apiUrl}<br />
                            Instância: {apiConfig.instanceName}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-center">
                        <Button 
                          onClick={handleGenerateQR}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Gerar Novo QR
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="max-w-md">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Como conectar:
                    </h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Abra o WhatsApp no seu celular</li>
                      <li>Vá em Menu → Aparelhos conectados</li>
                      <li>Toque em "Conectar um aparelho"</li>
                      <li>Escaneie o QR Code acima</li>
                      <li>Aguarde a confirmação de conexão</li>
                    </ol>
                  </div>
                </div>
              ) : (
                  <div className="text-center space-y-4">
                    <div className="w-64 h-64 mx-auto flex items-center justify-center bg-green-50 rounded-lg border border-green-200">
                      <div className="text-center">
                        <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-2" />
                        <h3 className="text-lg font-medium text-green-800">WhatsApp Conectado!</h3>
                        <p className="text-sm text-green-600">Pronto para enviar mensagens</p>
                        {session?.phoneNumber && (
                          <p className="text-xs text-green-600 mt-1">
                            {session.phoneNumber} - {session.deviceName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={disconnect}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Desconectar
                      </Button>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg max-w-md mx-auto">
                      <p className="text-sm text-center text-green-700">
                        <strong>🚀 Sistema 100% Operacional!</strong><br />
                        Agora você pode enviar mensagens reais via WhatsApp usando a aba "Enviar Mensagens"
                      </p>
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Enviar Mensagem de Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-phone">Telefone (com código do país)</Label>
                    <Input
                      id="test-phone"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="5511999999999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status da Conexão</Label>
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      {isConnected ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">WhatsApp Web Conectado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm">Não conectado</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-message">Mensagem</Label>
                  <Textarea
                    id="test-message"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={4}
                    placeholder="Digite sua mensagem de teste..."
                  />
                </div>

                <Button 
                  onClick={handleSendTest}
                  disabled={sendingTest || !isConnected || loading}
                  className="w-full"
                >
                  {sendingTest ? "Enviando..." : "Enviar Teste"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Envio em Massa para Clientes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Envia a mensagem acima para todos os clientes que têm WhatsApp cadastrado
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSendToAllClients}
                  disabled={!isConnected || loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? "Enviando..." : "Enviar para Todos os Clientes"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

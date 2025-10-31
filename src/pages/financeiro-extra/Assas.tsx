import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Settings, 
  Key, 
  Plus, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Users,
  BarChart3,
  Webhook
} from "lucide-react";
import { toast } from "sonner";
import { useAssas } from "@/hooks/useAssas";

export default function Assas() {
  // Estados para configuração
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Estados para criar cobrança
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [chargeValue, setChargeValue] = useState("");
  const [chargeDescription, setChargeDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const {
    isConfigured,
    charges,
    loading,
    configureAsaas,
    createCharge,
    getCharges,
    getChargeStatus
  } = useAssas();

  // SEO
  useEffect(() => {
    document.title = "Asaas - Gateway de Pagamentos | Gestor Tech Play";
    const d = 
      document.querySelector('meta[name="description"]') ||
      document.createElement("meta");
    d.setAttribute("name", "description");
    d.setAttribute(
      "content",
      "Configure e gerencie pagamentos com Asaas. Crie cobranças, PIX instantâneo e boletos automaticamente."
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

  // Carregar cobranças ao inicializar
  useEffect(() => {
    if (isConfigured) {
      getCharges();
    }
  }, [isConfigured, getCharges]);

  const handleConfigureAsaas = async () => {
    if (!apiKey.trim()) {
      toast.error("Por favor, insira a API Key do Asaas");
      return;
    }

    const formatAsaasError = (raw: any) => {
      const msg = typeof raw === 'string' ? raw : raw?.message || JSON.stringify(raw);
      if (/Failed to fetch|NetworkError/i.test(msg)) return "Falha de rede ao acessar a função. Verifique sua conexão e se a função 'asaas-integration' está ativa.";
      if (/Invalid token|Authorization required|401/i.test(msg)) return "Sessão expirada ou inválida. Faça login novamente.";
      if (/API Key inválida/i.test(msg)) return "API Key do Asaas inválida ou sem permissão.";
      if (/Invalid JSON/i.test(msg)) return "Dados enviados inválidos. Revise a API Key e tente novamente.";
      return msg;
    };

    setErrorDetails(null);
    const delays = [0, 700, 1500];
    for (let i = 0; i < delays.length; i++) {
      if (delays[i] > 0) await new Promise((r) => setTimeout(r, delays[i]));
      console.groupCollapsed(`[Asaas] Configurar - Tentativa ${i + 1}`);
      console.log("Webhook URL:", webhookUrl || "(vazio)");
      try {
        const ok = await configureAsaas(apiKey, webhookUrl);
        console.log("Resultado:", ok);
        console.groupEnd();
        setRetryCount(i);
        toast.success("Asaas configurado com sucesso!");
        return;
      } catch (e: any) {
        console.error("Erro:", e);
        console.groupEnd();
        if (i === delays.length - 1) {
          const friendly = formatAsaasError(e);
          setErrorDetails(friendly);
          toast.error(friendly);
        }
      }
    }
  };

  const handleCreateCharge = async () => {
    if (!customerName || !customerEmail || !chargeValue) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const charge = await createCharge({
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          cpfCnpj: customerCpf
        },
        billingType: "BOLETO", // PIX, CREDIT_CARD, DEBIT_CARD
        value: parseFloat(chargeValue),
        dueDate: dueDate || undefined,
        description: chargeDescription
      });

      toast.success("Cobrança criada com sucesso!");
      
      // Limpar formulário
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerCpf("");
      setChargeValue("");
      setChargeDescription("");
      setDueDate("");
      
      // Recarregar cobranças
      getCharges();
    } catch (error) {
      toast.error("Erro ao criar cobrança");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para área de transferência`);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      RECEIVED: { label: "Recebido", variant: "default" as const, icon: CheckCircle },
      CONFIRMED: { label: "Confirmado", variant: "default" as const, icon: CheckCircle },
      OVERDUE: { label: "Vencido", variant: "destructive" as const, icon: AlertCircle },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <main className="container mx-auto max-w-6xl space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">💳 Asaas - Gateway de Pagamentos</h1>
        <p className="text-muted-foreground">
          Configure e gerencie pagamentos com PIX, boleto e cartão de crédito de forma automatizada
        </p>
      </header>

      <Tabs defaultValue={isConfigured ? "charges" : "config"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuração
            {!isConfigured && <Badge variant="destructive" className="ml-1">!</Badge>}
          </TabsTrigger>
          <TabsTrigger value="charges" className="flex items-center gap-2" disabled={!isConfigured}>
            <CreditCard className="h-4 w-4" />
            Cobranças
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2" disabled={!isConfigured}>
            <Plus className="h-4 w-4" />
            Nova Cobrança
          </TabsTrigger>
          <TabsTrigger value="webhook" className="flex items-center gap-2" disabled={!isConfigured}>
            <Webhook className="h-4 w-4" />
            Webhook
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Configuração do Asaas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure sua API Key do Asaas para começar a processar pagamentos
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConfigured ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Para usar o Asaas, você precisa configurar sua API Key. 
                    <a 
                      href="https://www.asaas.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      Crie sua conta gratuita aqui.
                    </a>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Asaas configurado e pronto para uso!
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key do Asaas *</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Encontre sua API Key no painel do Asaas em Configurações → Integrações
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL do Webhook (opcional)</Label>
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://seusite.com/webhook/asaas"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL para receber notificações de pagamento em tempo real
                  </p>
                </div>

                <Button 
                  onClick={handleConfigureAsaas}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Configurando..." : "Configurar Asaas"}
                </Button>
                {errorDetails && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errorDetails}
                      {retryCount > 0 && (
                        <span className="block mt-1 text-xs text-muted-foreground">
                          Tentativas realizadas: {retryCount + 1}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">📋 Como configurar:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-blue-800">
                  <li>Acesse <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="underline">asaas.com</a> e crie sua conta</li>
                  <li>Vá em Configurações → Integrações</li>
                  <li>Copie sua API Key</li>
                  <li>Cole aqui e clique em "Configurar Asaas"</li>
                  <li>Pronto! Você pode criar cobranças automaticamente</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Cobranças</p>
                      <p className="text-2xl font-bold">{charges.length}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-2xl font-bold">
                        R$ {charges.reduce((sum, charge) => sum + (charge.value || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Recebidas</p>
                      <p className="text-2xl font-bold">
                        {charges.filter(c => c.status === 'RECEIVED' || c.status === 'CONFIRMED').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charges List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cobranças Recentes</CardTitle>
                  <Button onClick={getCharges} variant="outline" size="sm">
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {charges.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma cobrança encontrada. Crie sua primeira cobrança na aba "Nova Cobrança".
                  </p>
                ) : (
                  <div className="space-y-4">
                    {charges.map((charge) => (
                      <div key={charge.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{charge.customer?.name}</h4>
                            {getStatusBadge(charge.status)}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">R$ {charge.value?.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {charge.dueDate && new Date(charge.dueDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        {charge.description && (
                          <p className="text-sm text-muted-foreground mb-2">{charge.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{charge.customer?.email}</span>
                          {charge.customer?.phone && (
                            <>
                              <span>•</span>
                              <span>{charge.customer.phone}</span>
                            </>
                          )}
                        </div>

                        {charge.invoiceUrl && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(charge.invoiceUrl!, "Link do boleto")}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar Link
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(charge.invoiceUrl, '_blank')}
                            >
                              Ver Boleto
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Criar Nova Cobrança
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Crie cobranças via PIX, boleto ou cartão de crédito
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Dados do Cliente</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Nome *</Label>
                    <Input
                      id="customer-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nome completo do cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-email">E-mail *</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Telefone</Label>
                    <Input
                      id="customer-phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-cpf">CPF/CNPJ</Label>
                    <Input
                      id="customer-cpf"
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Dados da Cobrança</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="charge-value">Valor (R$) *</Label>
                    <Input
                      id="charge-value"
                      type="number"
                      step="0.01"
                      value={chargeValue}
                      onChange={(e) => setChargeValue(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due-date">Data de Vencimento</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="charge-description">Descrição</Label>
                    <Textarea
                      id="charge-description"
                      value={chargeDescription}
                      onChange={(e) => setChargeDescription(e.target.value)}
                      placeholder="Descrição da cobrança..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreateCharge}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Criando Cobrança..." : "Criar Cobrança"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-purple-600" />
                Configuração de Webhook
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure webhooks para receber notificações de pagamento em tempo real
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Os webhooks permitem que seu sistema seja notificado automaticamente quando um pagamento é confirmado.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">URL do Webhook configurada:</h4>
                <code className="text-sm bg-white p-2 rounded border block">
                  {webhookUrl || "Nenhuma URL configurada"}
                </code>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Eventos que você receberá:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <code>PAYMENT_RECEIVED</code> - Pagamento confirmado</li>
                  <li>• <code>PAYMENT_OVERDUE</code> - Pagamento vencido</li>
                  <li>• <code>PAYMENT_DELETED</code> - Cobrança cancelada</li>
                  <li>• <code>PAYMENT_RESTORED</code> - Cobrança restaurada</li>
                </ul>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Dica:</strong> Configure o webhook na aba "Configuração" para receber notificações automáticas de pagamento.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
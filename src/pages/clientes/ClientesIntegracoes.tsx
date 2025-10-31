import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Rocket, ArrowLeft, Info, Shield, Eye, CheckCircle, XCircle, Edit, Pause, RefreshCw, Trash2, Check, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ClientesIntegracoes() {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResultModal, setTestResultModal] = useState<{
    isOpen: boolean;
    success: boolean;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    success: false,
    message: "",
    details: ""
  });
  const [formData, setFormData] = useState({
    nomePainel: "Painel Sigma Principal",
    urlPainel: "https://painel.sigma.st",
    usuario: "seu_usuario",
    senha: "sua_senha"
  });

  const { toast, dismiss } = useToast();

  const [panels, setPanels] = useState<Array<{
    id: string;
    nome: string;
    url: string;
    usuario: string;
    senha: string;
    status: 'Ativo' | 'Inativo';
    autoRenovacao: boolean;
  }>>([]);

  const [createResultModal, setCreateResultModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; panel: { id: string; nome: string } | null }>({
    isOpen: false,
    panel: null,
  });

  useEffect(() => {
    document.title = "Clientes - Integrações | Gestor Tech Play";
    loadPanels();
  }, []);

  // Carregar painéis do banco de dados
  const loadPanels = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from('paineis_integracao' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setPanels(data.map((p: any) => ({
          id: String(p.id),
          nome: p.nome,
          url: p.url,
          usuario: p.usuario,
          senha: p.senha,
          status: p.status as 'Ativo' | 'Inativo',
          autoRenovacao: p.auto_renovacao
        })));
      }
    } catch (error: any) {
      console.error('Erro ao carregar painéis:', error);
      toast({ title: "Erro", description: "Não foi possível carregar os painéis" });
    }
  };

  const handleCreatePanel = async () => {
    // Validações básicas
    const baseUrl = formData.urlPainel.trim().replace(/\/$/, "");
    if (!formData.nomePainel.trim() || !formData.usuario.trim() || !formData.senha.trim() || !baseUrl) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos marcados com *" });
      return;
    }
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(baseUrl)) {
      toast({ title: "URL inválida", description: "Informe uma URL válida iniciando com http:// ou https://" });
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({ title: "Erro", description: "Você precisa estar logado" });
        return;
      }

      const { data, error } = await supabase
        .from('paineis_integracao' as any)
        .insert([{
          user_id: session.session.user.id,
          nome: formData.nomePainel.trim(),
          url: baseUrl,
          usuario: formData.usuario.trim(),
          senha: formData.senha.trim(),
          status: 'Ativo',
          auto_renovacao: autoRenewal
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPanels((prev) => [...prev, {
          id: String((data as any).id),
          nome: (data as any).nome,
          url: (data as any).url,
          usuario: (data as any).usuario,
          senha: (data as any).senha,
          status: (data as any).status as 'Ativo' | 'Inativo',
          autoRenovacao: (data as any).auto_renovacao
        }]);
      }

      setCreateResultModal({ isOpen: true, message: `Painel '${formData.nomePainel}' criado com sucesso!` });
    } catch (error: any) {
      console.error('Erro ao criar painel:', error);
      toast({ title: "Erro", description: "Não foi possível criar o painel" });
    }
  };

const handleTestConnection = async () => {
  setIsTestingConnection(true);
  try {
    const baseUrl = formData.urlPainel.trim().replace(/\/$/, '');
    const usuario = formData.usuario.trim();
    const senha = formData.senha.trim();
    const nomePainel = formData.nomePainel.trim();

    if (!nomePainel || !usuario || !senha || !baseUrl) {
      setTestResultModal({
        isOpen: true,
        success: false,
        message: "Dados Obrigatórios Ausentes",
        details: "❌ Preencha nome, URL, usuário e senha com dados reais antes de testar."
      });
      return;
    }

    // 🚀 Testa a API do OnWave diretamente (igual ao código Sigma que funciona)
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        captcha: "not-a-robot",
        captchaChecked: true,
        username: usuario,
        password: senha,
        twofactor_code: "",
        twofactor_recovery_code: "",
        twofactor_trusted_device_id: ""
      })
    });

    const data = await response.json();

    if (response.ok && data?.token) {
      // guarda o token se quiser usar em chamadas futuras
      localStorage.setItem("auth_token", data.token);

      setTestResultModal({
        isOpen: true,
        success: true,
        message: "CONEXÃO REAL BEM-SUCEDIDA!",
        details: `✅ Painel: ${nomePainel}\n🔗 Endpoint: ${baseUrl}/api/auth/login\n👤 Usuário: ${usuario}\n📡 Status: OK\n\nToken recebido: ${data.token.slice(0, 20)}...`
      });
    } else {
      setTestResultModal({
        isOpen: true,
        success: false,
        message: "FALHA NA AUTENTICAÇÃO",
        details: data?.message || "Usuário/senha inválidos ou URL incorreta."
      });
    }
  } catch (error: any) {
    setTestResultModal({
      isOpen: true,
      success: false,
      message: "Erro no Teste",
      details: `Erro inesperado durante o teste: ${error.message}`
    });
  } finally {
    setIsTestingConnection(false);
  }
};

// Testar conexão diretamente a partir da lista de painéis
const testPanel = async (panel: { id: string; nome: string; url: string; usuario: string; senha: string }) => {
  setIsTestingConnection(true);
  try {
    const baseUrl = panel.url.trim().replace(/\/$/, '');

    const { data, error } = await supabase.functions.invoke('test-panel-connection', {
      body: {
        baseUrl,
        username: panel.usuario,
        password: panel.senha,
        endpointPath: '/api/auth/login',
        endpointMethod: 'POST',
        loginPayload: {
          captcha: 'not-a-robot',
          captchaChecked: true,
          username: panel.usuario,
          password: panel.senha,
          twofactor_code: '',
          twofactor_recovery_code: '',
          twofactor_trusted_device_id: ''
        },
        extraHeaders: { Accept: 'application/json' }
      },
    });

    if (error || !data) {
      setTestResultModal({
        isOpen: true,
        success: false,
        message: 'Erro no Teste',
        details: `Não foi possível executar o teste agora. ${error?.message ?? ''}`.trim(),
      });
      return;
    }

    if (data.success) {
      const account = data.account;
      setTestResultModal({
        isOpen: true,
        success: true,
        message: 'CONEXÃO REAL BEM-SUCEDIDA!',
        details: `✅ Painel: ${panel.nome}\n🔗 Endpoint: ${data.endpoint}\n👤 Usuário: ${panel.usuario}\n📡 Status: ${(account?.status ?? 'OK')}\n⏱️ Expira: ${account?.exp_date ?? 'n/d'}\n\n✅ Autenticação realizada com sucesso no painel.`,
      });
    } else {
      const logs = Array.isArray(data.logs)
        ? data.logs
            .slice(0, 4)
            .map((l: any) => {
              const s = [
                l.status ? `status: ${l.status}` : null,
                l.ok !== undefined ? `ok: ${l.ok}` : null,
              ]
                .filter(Boolean)
                .join(', ');
              const head = s ? `(${s})` : '';
              return `• ${l.url} ${head}\n${(l.snippet || '').slice(0, 200)}`;
            })
            .join('\n\n')
        : '';

      setTestResultModal({
        isOpen: true,
        success: false,
        message: 'FALHA NA AUTENTICAÇÃO',
        details: `${data.details || 'Usuário/senha inválidos ou URL incorreta.'}${logs ? '\n\nTentativas:\n' + logs : ''}`,
      });
    }
  } catch (error: any) {
    setTestResultModal({
      isOpen: true,
      success: false,
      message: 'Erro no Teste',
      details: `Erro inesperado durante o teste: ${error.message}`,
    });
  } finally {
    setIsTestingConnection(false);
  }
};

  // Edit modal state and handlers
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ id: string; nome: string; url: string }>({ id: "", nome: "", url: "" });

  const startEditPanel = (panel: { id: string; nome: string; url: string; status: 'Ativo' | 'Inativo'; autoRenovacao: boolean; }) => {
    setEditForm({ id: panel.id, nome: panel.nome, url: panel.url });
    setIsEditModalOpen(true);
  };

  const handleSaveEditPanel = async () => {
    // Fecha qualquer toast visível ao clicar em Salvar
    dismiss();

    if (!editForm.nome.trim() || !editForm.url.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha nome e URL' });
      return;
    }
    const baseUrl = editForm.url.trim().replace(/\/$/, '');
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(baseUrl)) {
      toast({ title: 'URL inválida', description: 'Informe uma URL válida iniciando com http:// ou https://' });
      return;
    }

    try {
      const { error } = await supabase
        .from('paineis_integracao' as any)
        .update({
          nome: editForm.nome.trim(),
          url: baseUrl
        })
        .eq('id', editForm.id);

      if (error) throw error;

      setPanels((prev) => prev.map((p) => (p.id === editForm.id ? { ...p, nome: editForm.nome.trim(), url: baseUrl } : p)));
      setIsEditModalOpen(false);
      setCreateResultModal({ isOpen: true, message: `Painel '${editForm.nome}' atualizado com sucesso!` });
    } catch (error: any) {
      console.error('Erro ao atualizar painel:', error);
      toast({ title: "Erro", description: "Não foi possível atualizar o painel" });
    }
  };

  const handleToggleStatus = async (id: string) => {
    const panel = panels.find(p => p.id === id);
    if (!panel) return;

    const newStatus = panel.status === 'Ativo' ? 'Inativo' : 'Ativo';

    try {
      const { error } = await supabase
        .from('paineis_integracao' as any)
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({ title: "Erro", description: "Não foi possível atualizar o status" });
    }
  };

  const openDeleteConfirm = (panel: { id: string; nome: string; url: string; status: 'Ativo' | 'Inativo'; autoRenovacao: boolean; }) => {
    setDeleteConfirmModal({ isOpen: true, panel: { id: panel.id, nome: panel.nome } });
  };

  const handleDeletePanel = async () => {
    if (!deleteConfirmModal.panel) return;

    try {
      const { error } = await supabase
        .from('paineis_integracao' as any)
        .delete()
        .eq('id', deleteConfirmModal.panel.id);

      if (error) throw error;

      setPanels((prev) => prev.filter((p) => p.id !== deleteConfirmModal.panel!.id));
      setDeleteConfirmModal({ isOpen: false, panel: null });
      setCreateResultModal({ isOpen: true, message: `Painel '${deleteConfirmModal.panel.nome}' excluído com sucesso!` });
    } catch (error: any) {
      console.error('Erro ao excluir painel:', error);
      toast({ title: "Erro", description: "Não foi possível excluir o painel" });
      setDeleteConfirmModal({ isOpen: false, panel: null });
    }
  };

  return (
    <main className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white">
            <span className="text-sm font-bold">⚡</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Dashboard de Integrações IPTV</h2>
            <p className="text-sm text-muted-foreground">Gerencie suas integrações IPTV de forma centralizada</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-cyan-500 text-white border-cyan-500">
            📊 {panels.length} Painéis
          </Badge>
          <Badge variant="outline" className="bg-green-500 text-white border-green-500">
            ● {panels.filter((p) => p.status === 'Ativo').length} Ativos
          </Badge>
        </div>
      </div>

      {/* Sigma IPTV Integration Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-card border hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Sigma IPTV</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span className="text-sm text-muted-foreground">Configurar</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span className="text-sm text-muted-foreground">Configurar</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Painel IPTV Sigma com suporte a múltiplos painéis
            </p>
            
            <Button 
              onClick={() => setIsConfigModalOpen(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              <span className="mr-2">+</span>
              Configurar Agora
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Panel List */}
      <div className="mt-6">
        <div className="bg-cyan-600 text-white rounded-t-lg px-4 py-2 flex items-center gap-2">
          <span className="text-sm">≡</span>
          <span className="font-medium">Painéis Sigma Configurados ({panels.length})</span>
        </div>
        <div className="border border-cyan-600/40 rounded-b-lg overflow-hidden">
          <div className="grid grid-cols-12 bg-amber-200 text-slate-800 font-medium px-4 py-2">
            <div className="col-span-6">Painel</div>
            <div className="col-span-3 text-center">Status</div>
            <div className="col-span-3 text-right">Ações</div>
          </div>
          {panels.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Nenhum painel configurado ainda.</div>
          ) : (
            <div className="divide-y divide-slate-700">
              {panels.map((p) => (
                <div key={p.id} className="grid grid-cols-12 items-center px-4 py-3 bg-slate-900">
                  <div className="col-span-6 flex items-start gap-3">
                    <div className={`w-6 h-6 ${p.status === 'Ativo' ? 'bg-green-500' : 'bg-gray-500'} rounded-full flex items-center justify-center mt-0.5`}>
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{p.nome}</div>
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-cyan-400 text-xs hover:underline">
                        {p.url}
                      </a>
                    </div>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <span className={`${p.status === 'Ativo' ? 'bg-green-500' : 'bg-gray-500'} text-white text-xs px-3 py-1 rounded`}>{p.status}</span>
                  </div>
                  <div className="col-span-3 flex justify-end gap-2">
                    <Button onClick={() => startEditPanel(p)} variant="outline" size="icon" className="h-8 w-8 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"><Edit className="h-4 w-4" /></Button>
                    <Button onClick={() => handleToggleStatus(p.id)} variant="outline" size="icon" className="h-8 w-8 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">{p.status === 'Ativo' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
                    <Button onClick={() => testPanel(p)} title="Testar conexão" disabled={isTestingConnection} variant="outline" size="icon" className="h-8 w-8 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"><RefreshCw className="h-4 w-4" /></Button>
                    <Button onClick={() => openDeleteConfirm(p)} variant="outline" size="icon" className="h-8 w-8 border-red-500 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="sr-only">Configurar Credenciais Dos Servidores IPTV</DialogTitle>
              <DialogDescription className="sr-only">Formulário de configuração e teste de conexão do painel Sigma IPTV</DialogDescription>
            </DialogHeader>
            {/* Header */}
          <div className="bg-cyan-500 -m-6 mb-6 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                <span className="text-xs">≡</span>
              </div>
              <h1 className="text-lg font-semibold">Credenciais Dos Servidores IPTV</h1>
            </div>
            <p className="text-sm text-white/90">Configure suas integrações IPTV para renovação automática</p>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center justify-between gap-2 text-sm mb-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 p-0">
                🏠 Dashboard
              </Button>
              <span className="text-gray-400">&gt;</span>
              <span className="text-white">Sigma IPTV</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsConfigModalOpen(false)}
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>

          {/* Sigma IPTV Header */}
          <div className="flex items-center gap-2 mb-6">
            <Rocket className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Sigma IPTV</h2>
          </div>

          {/* Action Buttons Section */}
          <div className="flex gap-4 mb-6">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <span className="mr-2">🔧</span>
              Configurações
            </Button>
            
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <Info className="w-4 h-4 mr-2" />
              Tutorial de Integração
            </Button>
          </div>

          {/* Add New Panel Section */}
          <div className="bg-green-500 rounded-lg p-4 text-white mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm">+</span>
              <span className="font-medium">Adicionar Novo Painel Sigma</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-orange-400 text-xs">⚠️</span>
              <span className="text-sm font-medium text-orange-400">IMPORTANTE:</span>
              <span className="text-sm text-gray-300">Desabilite 2FA no painel Sigma</span>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                <Info className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                <Shield className="w-4 h-4 mr-2" />
                AES-256 Criptografado
              </Button>
              <Button size="sm" variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                ▶️
              </Button>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Nome do Painel */}
            <div className="space-y-2">
              <Label className="text-cyan-400 flex items-center gap-2">
                <span className="text-cyan-400">💼</span>
                Nome do Painel *
              </Label>
              <Input
                value={formData.nomePainel}
                onChange={(e) => setFormData(prev => ({ ...prev, nomePainel: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-gray-400">Nome para identificar este painel</p>
            </div>

            {/* URL do Painel */}
            <div className="space-y-2">
              <Label className="text-cyan-400 flex items-center gap-2">
                <span className="text-cyan-400">🔗</span>
                URL do Painel *
              </Label>
              <Input
                value={formData.urlPainel}
                onChange={(e) => setFormData(prev => ({ ...prev, urlPainel: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-gray-400">URL do seu painel Sigma</p>
            </div>

            {/* Usuário do Painel */}
            <div className="space-y-2">
              <Label className="text-cyan-400 flex items-center gap-2">
                <span className="text-cyan-400">👤</span>
                Usuário do Painel *
              </Label>
              <Input
                value={formData.usuario}
                onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-gray-400">Username usado para acessar o painel</p>
            </div>

            {/* Senha do Painel */}
            <div className="space-y-2">
              <Label className="text-red-400 flex items-center gap-2">
                <span className="text-red-400">🔒</span>
                Senha do Painel *
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.senha}
                  onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400">Senha para acessar o painel</p>
            </div>
          </div>

          {/* Configurações Section */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="text-sm">⚙️</span>
              <h3 className="font-medium">Configurações</h3>
            </div>
            
            <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔄</span>
                </div>
                <div>
                  <p className="text-white font-medium">Renovação Automática</p>
                  <p className="text-sm text-gray-400">Clientes serão renovados automaticamente neste painel</p>
                </div>
              </div>
              <Switch 
                checked={autoRenewal}
                onCheckedChange={setAutoRenewal}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={handleCreatePanel}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <span className="mr-2">+</span>
              Criar Painel
            </Button>
            
            <Button 
              onClick={handleTestConnection}
              variant="outline" 
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
              disabled={isTestingConnection}
            >
              <span className="mr-2">🔧</span>
              {isTestingConnection ? "Testando..." : "Testar Conexão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Result Modal */}
      <Dialog open={createResultModal.isOpen} onOpenChange={(open) => setCreateResultModal((prev) => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="sr-only">Resultado da Criação de Painel</DialogTitle>
            <DialogDescription className="sr-only">Mensagem de sucesso ao criar painel</DialogDescription>
          </DialogHeader>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-green-400 mb-2">Sucesso</h3>
            <p className="text-sm text-green-300 mb-6">{createResultModal.message}</p>
            <Button 
              onClick={() => {
                setCreateResultModal((prev) => ({ ...prev, isOpen: false }));
                setIsConfigModalOpen(false);
              }} 
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Panel Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Painel</DialogTitle>
            <DialogDescription className="text-gray-300">Atualize as informações do painel selecionado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-cyan-400">Nome do Painel</Label>
              <Input
                value={editForm.nome}
                onChange={(e) => setEditForm((prev) => ({ ...prev, nome: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-cyan-400">URL do Painel</Label>
              <Input
                value={editForm.url}
                onChange={(e) => setEditForm((prev) => ({ ...prev, url: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handleSaveEditPanel}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Result Modal */}
      <Dialog open={testResultModal.isOpen} onOpenChange={(open) => setTestResultModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="sr-only">Resultado do Teste de Conexão</DialogTitle>
            <DialogDescription className="sr-only">
              Resultado do teste de conexão com o painel Sigma IPTV
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center p-6">
            <div className="mb-4">
              {testResultModal.success ? (
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            
            <h3 className={`text-lg font-semibold mb-2 ${testResultModal.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResultModal.success ? "Teste Sigma - Sucesso" : "Teste Sigma - Erro"}
            </h3>
            
            <p className={`text-sm mb-4 ${testResultModal.success ? 'text-green-300' : 'text-red-300'}`}>
              {testResultModal.message}
            </p>
            
            {testResultModal.details && (
              <div className="bg-slate-700/50 rounded-lg p-3 mb-4 text-left">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                  {testResultModal.details}
                </pre>
              </div>
            )}
            
            <Button 
              onClick={() => setTestResultModal(prev => ({ ...prev, isOpen: false }))}
              className={`w-full ${testResultModal.success ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmModal.isOpen} onOpenChange={(open) => setDeleteConfirmModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-gray-300">
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2 text-red-400">
              Excluir Painel
            </h3>
            
            <p className="text-sm mb-4 text-gray-300">
              Tem certeza que deseja excluir o painel "{deleteConfirmModal.panel?.nome}"?
            </p>
            
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirmModal({ isOpen: false, panel: null })}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleDeletePanel}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

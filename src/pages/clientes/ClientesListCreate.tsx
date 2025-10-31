
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useClientes, usePlanos, useProdutos, useAplicativos, useTemplatesCobranca } from "@/hooks/useDatabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Edit, Trash, MoreHorizontal, Plus, Send, RefreshCw, Copy } from "lucide-react";
import { format } from "date-fns";
import type { Cliente } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";


export default function ClientesListCreate() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para dados dos selects
  const [planos, setPlanos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [aplicativos, setAplicativos] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const { criar, buscar, editar, deletar } = useClientes();
  const { buscar: buscarPlanos } = usePlanos();
  const { buscar: buscarProdutos } = useProdutos();
  const { buscar: buscarAplicativos } = useAplicativos();
  const { buscar: buscarTemplates } = useTemplatesCobranca();
  const { dismiss, toast } = useToast();
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
  
  // Estados para renovação
  const [renovarDialogOpen, setRenovarDialogOpen] = useState(false);
  const [clienteParaRenovar, setClienteParaRenovar] = useState<Cliente | null>(null);
  
  // Estados para templates e mensagens
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [clienteParaMensagem, setClienteParaMensagem] = useState<Cliente | null>(null);
  const [templateSelecionado, setTemplateSelecionado] = useState<string>("");
  const [mensagemGerada, setMensagemGerada] = useState("");

  // Funções auxiliares para obter nomes
  const getProdutoNome = (produtoId: string) => {
    if (!produtoId) return 'N/A';
    const produto = produtos.find(p => String(p.id) === produtoId);
    return produto?.nome || produtoId;
  };

  const getPlanoNome = (planoId: string) => {
    if (!planoId) return 'N/A';
    const plano = planos.find(p => String(p.id) === planoId);
    return plano?.nome || planoId;
  };

  const getAplicativoNome = (appId: string) => {
    if (!appId) return 'N/A';
    const app = aplicativos.find(a => String(a.id) === appId);
    return app?.nome || appId;
  };

  // Função para determinar o status do cliente
  const getClienteStatus = (cliente: Cliente) => {
    if (!cliente.data_vencimento) {
      return { status: 'Sem data', variant: 'secondary' as const, bgColor: 'bg-gray-500' };
    }

    const dataVencimento = new Date(cliente.data_vencimento);
    const agora = new Date();
    
    if (dataVencimento < agora) {
      return { status: 'Vencido', variant: 'destructive' as const, bgColor: 'bg-red-500' };
    } else {
      return { status: 'Ativo', variant: 'default' as const, bgColor: 'bg-green-500' };
    }
  };

  // Função para abrir diálogo de renovação
  const handleRenovarPlano = async (cliente: Cliente) => {
    if (!cliente || !cliente.id) return;
    setClienteParaRenovar(cliente);
    setRenovarDialogOpen(true);
  };

  // Função para executar renovação
  const executarRenovacao = async (incluirIntegracao: boolean) => {
    if (!clienteParaRenovar || !clienteParaRenovar.id) return;
    
    try {
      // Buscar dados do plano para calcular nova data de vencimento
      const plano = planos.find(p => String(p.id) === clienteParaRenovar.plano || p.nome === clienteParaRenovar.plano);
      if (!plano) {
        toast({
          title: "Erro",
          description: "Plano não encontrado",
          variant: "destructive",
        });
        return;
      }

      // Calcular nova data de vencimento
      // Se o plano ainda estiver ativo, soma à data de vencimento atual
      // Se já venceu, soma à data atual
      const dataAtualVencimento = clienteParaRenovar.data_vencimento 
        ? new Date(clienteParaRenovar.data_vencimento) 
        : new Date();
      
      const hoje = new Date();
      const baseData = dataAtualVencimento > hoje ? dataAtualVencimento : hoje;
      
      let novaDataVencimento = new Date(baseData);
      const qtd = parseInt(String(plano.quantidade || 0)) || 0;
      
      if (plano.tipo === "dias") {
        novaDataVencimento.setDate(novaDataVencimento.getDate() + qtd);
      } else if (plano.tipo === "meses") {
        novaDataVencimento.setMonth(novaDataVencimento.getMonth() + qtd);
      } else if (plano.tipo === "anos") {
        novaDataVencimento.setFullYear(novaDataVencimento.getFullYear() + qtd);
      }

      // Ajustar para 23:59:59 no horário de Brasília (UTC-3)
      const year = novaDataVencimento.getFullYear();
      const month = String(novaDataVencimento.getMonth() + 1).padStart(2, '0');
      const day = String(novaDataVencimento.getDate()).padStart(2, '0');
      const dataVencimentoBrasilia = `${year}-${month}-${day}T23:59:59-03:00`;

      // Preparar dados de atualização
      const updateData: any = { 
        data_vencimento: dataVencimentoBrasilia
      };
      
      // Se incluir integração, atualizar também data_venc_app
      if (incluirIntegracao) {
        updateData.data_venc_app = `${year}-${month}-${day}T23:59:59-03:00`;
      }

      // Atualizar cliente no banco
      const { error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', clienteParaRenovar.id);

      if (error) {
        console.error('Erro ao renovar plano:', error);
        toast({
          title: "Erro",
          description: "Erro ao renovar plano",
          variant: "destructive",
        });
        return;
      }

      // Recarregar dados
      carregarClientes();
      
      const mensagem = `Plano renovado até ${novaDataVencimento.toLocaleDateString('pt-BR')}`;
      
      toast({
        title: "Sucesso",
        description: mensagem,
      });

      setRenovarDialogOpen(false);
      setClienteParaRenovar(null);

    } catch (error) {
      console.error('Erro ao renovar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao renovar plano",
        variant: "destructive",
      });
    }
  };

  // Funções para editar e deletar
  const handleEditCliente = (cliente: Cliente) => {
    if (!cliente || !cliente.id) return;
    
    setEditingCliente(cliente);
    setIsEditing(true);
    
    // Preenche o formulário com os dados do cliente
    form.reset({
      nome: cliente.nome || "",
      whatsapp: cliente.whatsapp || "",
      email: cliente.email || "",
      dataVenc: cliente.data_vencimento ? cliente.data_vencimento.slice(0, 10) : "",
      fixo: cliente.fixo || false,
      usuario: cliente.usuario || "",
      senha: cliente.senha || "",
      produto: cliente.produto || "",
      plano: cliente.plano || "",
      app: cliente.app || "",
      dataVencApp: cliente.data_venc_app || "",
      telas: cliente.telas || 1,
      mac: cliente.mac || "",
      dispositivo: cliente.dispositivo || "",
      fatura: cliente.fatura || "Pago",
      key: cliente.key || "",
      mensagem: cliente.mensagem || "",
      lembretes: cliente.lembretes || false,
      indicador: cliente.indicador || "",
      desconto: cliente.desconto || "0,00",
      descontoRecorrente: cliente.desconto_recorrente || false,
      aniversario: cliente.aniversario || "",
      observacao: cliente.observacao || "",
    });
    
    setIsModalOpen(true);
    setOpen(true);
  };

  const handleDeleteCliente = (clienteId: string) => {
    if (!clienteId) return;
    const target = clientes.find(c => c && c.id === clienteId) || null;
    setDeleteTarget(target);
  };

  const confirmDeleteCliente = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deletar(deleteTarget.id);
      setClientes(prev => prev.filter(c => c.id !== deleteTarget.id));
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const resetModal = () => {
    setEditingCliente(null);
    setIsEditing(false);
    form.reset({
      nome: "",
      whatsapp: "",
      email: "",
      dataVenc: "",
      fixo: false,
      usuario: "",
      senha: "",
      produto: "",
      plano: "",
      app: "",
      dataVencApp: "",
      telas: 1,
      mac: "",
      dispositivo: "",
      fatura: "Pago",
      key: "",
      mensagem: "",
      lembretes: false,
      indicador: "",
      desconto: "0,00",
      descontoRecorrente: false,
      aniversario: "",
      observacao: "",
    });
  };

  // Função para abrir diálogo de templates
  const handleCopiarMensagem = (cliente: Cliente) => {
    setClienteParaMensagem(cliente);
    setTemplateSelecionado("");
    setMensagemGerada("");
    setTemplateDialogOpen(true);
  };

  // Função para gerar mensagem com dados do cliente
  const gerarMensagemComCliente = () => {
    if (!templateSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um template",
        variant: "destructive",
      });
      return;
    }

    const template = templates.find(t => t.id === templateSelecionado);
    if (!template || !clienteParaMensagem) return;

    // Utilitários de busca e parsing
    const sanitizeNumber = (val: any) => {
      if (val === null || val === undefined) return 0;
      const cleaned = String(val).replace(/[^0-9,.-]/g, '').replace(',', '.');
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    };

    const normalize = (s: any) => String(s ?? '').trim().toLowerCase();

    const findPlano = () => {
      const cliVal = clienteParaMensagem.plano;
      // 1) por id
      let p = planos.find(pl => String(pl.id) === String(cliVal));
      if (p) return p;
      // 2) por nome exato (case-insensitive)
      p = planos.find(pl => normalize(pl.nome) === normalize(cliVal));
      if (p) return p;
      // 3) por inclusão parcial (nome contém valor do cliente)
      p = planos.find(pl => normalize(pl.nome).includes(normalize(cliVal)) || normalize(cliVal).includes(normalize(pl.nome)));
      return p;
    };

    const plano = findPlano();
    const planoNome = plano?.nome || clienteParaMensagem.plano || "N/A";
    const valorPlano = sanitizeNumber(plano?.valor);

    // Saudação
    const hora = new Date().getHours();
    let saudacao = "Bom dia";
    if (hora >= 12 && hora < 18) saudacao = "Boa tarde";
    else if (hora >= 18) saudacao = "Boa noite";

    // Data de vencimento
    let dataVencimento = "N/A";
    if (clienteParaMensagem.data_vencimento) {
      try {
        dataVencimento = format(new Date(clienteParaMensagem.data_vencimento), "dd/MM/yyyy");
      } catch {
        dataVencimento = clienteParaMensagem.data_vencimento;
      }
    }

    // Desconto e total
    const desconto = sanitizeNumber(clienteParaMensagem.desconto);
    const total = Math.max(0, valorPlano - desconto);

    // Substituir variáveis na mensagem (robusto)
    let mensagemFinal = template.mensagem || "";
    
    const f2 = (n: number) => n.toFixed(2);
    const normalizeKey = (s: any) => String(s ?? "").toLowerCase().replace(/[\s_-]/g, "");

    const map: Record<string, string> = {
      saudacao,
      nome: clienteParaMensagem.nome || "",
      cliente: clienteParaMensagem.nome || "",
      nomecliente: clienteParaMensagem.nome || "",
      plano: planoNome,
      valor: f2(valorPlano),
      valorplano: f2(valorPlano),
      desconto: f2(desconto),
      total: f2(total),
      vencimento: dataVencimento,
      datavencimento: dataVencimento,
      usuario: clienteParaMensagem.usuario || clienteParaMensagem.email || "",
      senha: clienteParaMensagem.senha || "",
    };

    mensagemFinal = mensagemFinal.replace(/\{([^{}]+)\}/g, (full, key) => {
      const k = normalizeKey(key);
      return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : full;
    });

    setMensagemGerada(mensagemFinal);
  };

  // Função para copiar mensagem
  const copiarMensagemGerada = () => {
    if (!mensagemGerada) {
      toast({
        title: "Erro",
        description: "Gere a mensagem primeiro",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(mensagemGerada);
    toast({
      title: "Sucesso",
      description: "Mensagem copiada!",
    });
  };

  // SEO e carregamento inicial
  useEffect(() => {
    document.title = "Clientes - Listar/Criar | Gestor Tech Play";
    carregarClientes();
    carregarDadosSelects();
  }, []);

  const carregarClientes = async () => {
    setLoadingClientes(true);
    try {
      const data = await buscar();
      // Filtrar valores null/undefined
      const clientesValidos = (data || []).filter(cliente => cliente && cliente.id);
      setClientes(clientesValidos);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setClientes([]); // Garantir que sempre temos um array
    } finally {
      setLoadingClientes(false);
    }
  };

  const carregarDadosSelects = async () => {
    setLoadingData(true);
    try {
      const [planosData, produtosData, aplicativosData, templatesData] = await Promise.all([
        buscarPlanos(),
        buscarProdutos(),
        buscarAplicativos(),
        buscarTemplates(),
      ]);
      setPlanos(planosData || []);
      setProdutos(produtosData || []);
      setAplicativos(aplicativosData || []);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error("Erro ao carregar dados dos selects:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Filtros
  const filtros = useForm({
    defaultValues: {
      dataInicial: "",
      dataFinal: "",
      faturas: "",
      status: "",
      plano: "",
      produto: "",
      pontos: "",
      search: "",
      pageSize: "10",
    },
  });

  const clearFilters = () => filtros.reset({
    dataInicial: "",
    dataFinal: "",
    faturas: "",
    status: "",
    plano: "",
    produto: "",
    pontos: "",
    search: "",
    pageSize: "10",
  });

  // Clientes filtrados
  const clientesFiltrados = useMemo(() => {
    const filtrosValues = filtros.watch();
    
    return clientes.filter((cliente) => {
      // Verificar se o cliente não é null/undefined
      if (!cliente || !cliente.id) return false;
      // Filtro por busca (nome, whatsapp, email, usuario)
      if (filtrosValues.search) {
        const searchTerm = filtrosValues.search.toLowerCase();
        const matches = 
          cliente.nome?.toLowerCase().includes(searchTerm) ||
          cliente.whatsapp?.toLowerCase().includes(searchTerm) ||
          cliente.email?.toLowerCase().includes(searchTerm) ||
          cliente.usuario?.toLowerCase().includes(searchTerm);
        if (!matches) return false;
      }

      // Filtro por data inicial
      if (filtrosValues.dataInicial && cliente.data_vencimento) {
        const dataVenc = new Date(cliente.data_vencimento);
        const dataInicial = new Date(filtrosValues.dataInicial);
        if (dataVenc < dataInicial) return false;
      }

      // Filtro por data final
      if (filtrosValues.dataFinal && cliente.data_vencimento) {
        const dataVenc = new Date(cliente.data_vencimento);
        const dataFinal = new Date(filtrosValues.dataFinal);
        if (dataVenc > dataFinal) return false;
      }

      // Filtro por faturas
      if (filtrosValues.faturas && filtrosValues.faturas !== "todos") {
        if (cliente.fatura?.toLowerCase() !== filtrosValues.faturas.toLowerCase()) return false;
      }

      // Filtro por status (baseado na data de vencimento)
      if (filtrosValues.status && filtrosValues.status !== "todos") {
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999); // Final do dia hoje
        
        const inicioHoje = new Date();
        inicioHoje.setHours(0, 0, 0, 0); // Início do dia hoje
        
        const ontem = new Date();
        ontem.setDate(inicioHoje.getDate() - 1);
        ontem.setHours(0, 0, 0, 0);
        const fimOntem = new Date(ontem);
        fimOntem.setHours(23, 59, 59, 999);
        
        // Para "vence em 3 dias" - próximos 3 dias (amanhã até +3 dias)
        const amanha = new Date();
        amanha.setDate(inicioHoje.getDate() + 1);
        amanha.setHours(0, 0, 0, 0);
        
        const em3Dias = new Date();
        em3Dias.setDate(inicioHoje.getDate() + 3);
        em3Dias.setHours(23, 59, 59, 999);
        
        const dataVenc = cliente.data_vencimento ? new Date(cliente.data_vencimento) : null;
        
        switch (filtrosValues.status) {
          case "ativo":
            if (!dataVenc || dataVenc < inicioHoje) return false;
            break;
          case "vencido":
            if (!dataVenc || dataVenc >= inicioHoje) return false;
            break;
          case "vencendo-hoje":
            if (!dataVenc || dataVenc < inicioHoje || dataVenc > hoje) return false;
            break;
          case "venceu-ontem":
            if (!dataVenc || dataVenc < ontem || dataVenc > fimOntem) return false;
            break;
          case "vence-em-3-dias":
            if (!dataVenc || dataVenc < amanha || dataVenc > em3Dias) return false;
            break;
        }
      }

      // Filtro por plano
      if (filtrosValues.plano && filtrosValues.plano !== "todos") {
        if (cliente.plano !== filtrosValues.plano) return false;
      }

      // Filtro por produto
      if (filtrosValues.produto && filtrosValues.produto !== "todos") {
        if (cliente.produto !== filtrosValues.produto) return false;
      }

      // Filtro por pontos
      if (filtrosValues.pontos && filtrosValues.pontos !== "todos") {
        const telas = cliente.telas || 0;
        switch (filtrosValues.pontos) {
          case "0-10":
            if (telas < 0 || telas > 10) return false;
            break;
          case "11-50":
            if (telas < 11 || telas > 50) return false;
            break;
          case "51-100":
            if (telas < 51 || telas > 100) return false;
            break;
          case "100+":
            if (telas <= 100) return false;
            break;
        }
      }

      return true;
    });
  }, [clientes, filtros.watch()]);

  // Formulário Novo Cliente (somente UI)
  const form = useForm({
    defaultValues: {
      nome: "",
      whatsapp: "",
      email: "",
      dataVenc: "",
      fixo: false,
      usuario: "",
      senha: "",
      produto: "",
      plano: "",
      app: "",
      dataVencApp: "",
      telas: 1,
      mac: "",
      dispositivo: "",
      fatura: "Pago",
      key: "",
      mensagem: "",
      lembretes: false,
      indicador: "",
      desconto: "0,00",
      descontoRecorrente: false,
      aniversario: "",
      observacao: "",
    },
  });

  const onSubmitNovoCliente = form.handleSubmit(async (data) => {
    // Fecha qualquer toast antes de prosseguir
    dismiss();
    
    // Validação de campos obrigatórios
    if (!data.nome || data.nome.trim() === '') {
      toast({
        title: "Erro",
        description: "O campo Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.dataVenc) {
      toast({
        title: "Erro",
        description: "O campo Data de Vencimento é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.plano) {
      toast({
        title: "Erro",
        description: "O campo Plano é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      if (isEditing && editingCliente) {
        // Editando cliente existente
        const clienteAtualizado = await editar(editingCliente.id, {
          nome: data.nome,
          whatsapp: data.whatsapp,
          email: data.email,
           data_vencimento: data.dataVenc ? new Date(data.dataVenc + 'T23:59:59.999Z').toISOString() : null,
          fixo: data.fixo,
          usuario: data.usuario,
          senha: data.senha,
          produto: data.produto,
          plano: data.plano,
          app: data.app,
          data_venc_app: data.dataVencApp ? new Date(data.dataVencApp + 'T23:59:59.999Z').toISOString() : null,
          telas: data.telas,
          mac: data.mac,
          dispositivo: data.dispositivo,
          fatura: data.fatura,
          key: data.key,
          mensagem: data.mensagem,
          lembretes: data.lembretes,
          indicador: data.indicador,
          desconto: data.desconto,
          desconto_recorrente: data.descontoRecorrente,
          aniversario: data.aniversario,
          observacao: data.observacao
        });
        // Atualiza o cliente na lista
        setClientes(prev => prev.map(c => c.id === editingCliente.id ? clienteAtualizado : c));
        setSuccessMessage("Cliente atualizado");
        setShowSuccessDialog(true);
      } else {
        // Criando novo cliente
        const novoCliente = await criar({
          nome: data.nome,
          whatsapp: data.whatsapp,
          email: data.email,
          data_vencimento: data.dataVenc ? new Date(data.dataVenc + 'T23:59:59.999Z').toISOString() : null,
          fixo: data.fixo,
          usuario: data.usuario,
          senha: data.senha,
          produto: data.produto,
          plano: data.plano,
          app: data.app,
          data_venc_app: data.dataVencApp ? new Date(data.dataVencApp + 'T23:59:59.999Z').toISOString() : null,
          telas: data.telas,
          mac: data.mac,
          dispositivo: data.dispositivo,
          fatura: data.fatura,
          key: data.key,
          mensagem: data.mensagem,
          lembretes: data.lembretes,
          indicador: data.indicador,
          desconto: data.desconto,
          desconto_recorrente: data.descontoRecorrente,
          aniversario: data.aniversario,
          observacao: data.observacao
        });
        // Adiciona o novo cliente à lista
        setClientes(prev => [novoCliente, ...prev]);
        setSuccessMessage("Cliente criado");
        setShowSuccessDialog(true);
      }
      // Fecha formulário e reseta
      resetModal();
      setOpen(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Cabeçalho */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-mobile-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-mobile-sm text-muted-foreground">Lista de clientes</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 w-full sm:w-auto touch-friendly" onClick={resetModal}>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={onSubmitNovoCliente} className="space-y-6">
              {/* Bloco 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
                  <Input id="nome" placeholder="Nome" {...form.register("nome")} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Whatsapp</Label>
                  <Input id="whatsapp" placeholder="WhatsApp" {...form.register("whatsapp")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" placeholder="email opcional" type="email" {...form.register("email")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataVenc">Data vencimento <span className="text-destructive">*</span></Label>
                  <Input id="dataVenc" type="date" {...form.register("dataVenc")} required />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Checkbox id="fixo" checked={form.watch("fixo")} onCheckedChange={(v) => form.setValue("fixo", Boolean(v))} />
                  <div className="space-y-1">
                    <Label htmlFor="fixo">Data de vencimento fixa</Label>
                    <p className="text-xs text-muted-foreground">
                      mesmo o cliente estando vencido a data será renovada no mesmo dia dos próximos meses
                      <br />
                      <span className="text-primary">Essa opção só é válida para planos mensais</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloco 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuário</Label>
                  <Input id="usuario" placeholder="usuario opcional" {...form.register("usuario")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" placeholder="senha opcional" type="password" {...form.register("senha")} />
                </div>
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select value={form.watch("produto")} onValueChange={(v) => form.setValue("produto", v)} disabled={loadingData}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Carregando produtos..." : "Selecione um produto"} />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.length === 0 && !loadingData ? (
                        <SelectItem value="no-products" disabled>
                          Nenhum produto cadastrado
                        </SelectItem>
                      ) : (
                        produtos.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plano <span className="text-destructive">*</span></Label>
                  <Select value={form.watch("plano")} onValueChange={(v) => form.setValue("plano", v)} disabled={loadingData} required>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Carregando planos..." : "Selecione um plano"} />
                    </SelectTrigger>
                    <SelectContent>
                      {planos.length === 0 && !loadingData ? (
                        <SelectItem value="no-plans" disabled>
                          Nenhum plano cadastrado
                        </SelectItem>
                      ) : (
                        planos.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aplicativo</Label>
                  <Select value={form.watch("app")} onValueChange={(v) => form.setValue("app", v)} disabled={loadingData}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Carregando aplicativos..." : "Selecione um aplicativo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {aplicativos.length === 0 && !loadingData ? (
                        <SelectItem value="no-apps" disabled>
                          Nenhum aplicativo cadastrado
                        </SelectItem>
                      ) : (
                        aplicativos.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataVencApp">Data vencimento app</Label>
                  <Input id="dataVencApp" type="date" {...form.register("dataVencApp")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telas">Telas</Label>
                  <Input id="telas" type="number" min={1} {...form.register("telas", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mac">Mac</Label>
                  <Input id="mac" placeholder="Mac opcional" {...form.register("mac")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dispositivo">Dispositivos</Label>
                  <Input id="dispositivo" placeholder="Dispositivo opcional" {...form.register("dispositivo")} />
                </div>
                <div className="space-y-2">
                  <Label>Fatura</Label>
                  <Select defaultValue="Pago" onValueChange={(v) => form.setValue("fatura", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Atrasado">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bloco 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Key ou otp</Label>
                  <Input id="key" placeholder="Key ou otp opcional" {...form.register("key")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mensagem">Mensagem</Label>
                  <Input id="mensagem" placeholder="Se deseja enviar uma mensagem" {...form.register("mensagem")} />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Checkbox id="lembretes" checked={form.watch("lembretes")} onCheckedChange={(v) => form.setValue("lembretes", Boolean(v))} />
                  <Label htmlFor="lembretes">Ativar lembretes</Label>
                </div>
                <div className="space-y-2">
                  <Label>Cliente indicador</Label>
                  <Select value={form.watch("indicador")} onValueChange={(v) => form.setValue("indicador", v)} disabled={loadingClientes}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingClientes ? "Carregando clientes..." : "Selecione o indicador"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto</Label>
                  <Input id="desconto" placeholder="R$ 0,00" {...form.register("desconto")} />
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox id="descRec" checked={form.watch("descontoRecorrente")} onCheckedChange={(v) => form.setValue("descontoRecorrente", Boolean(v))} />
                    <Label htmlFor="descRec">Desconto Recorrente</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aniversario">Data Aniversário</Label>
                  <Input id="aniversario" type="date" {...form.register("aniversario")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacao">Observação (Opcional)</Label>
                  <textarea id="observacao" rows={5} className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" {...form.register("observacao")} />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            <div className="space-y-1">
              <Label>Data inicial</Label>
              <Input type="date" {...filtros.register("dataInicial")} />
            </div>
            <div className="space-y-1">
              <Label>Data final</Label>
              <Input type="date" {...filtros.register("dataFinal")} />
            </div>
            <div className="space-y-1">
              <Label>Faturas</Label>
              <Select onValueChange={(v) => filtros.setValue("faturas", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Faturas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select onValueChange={(v) => filtros.setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="vencendo-hoje">Vencendo Hoje</SelectItem>
                  <SelectItem value="venceu-ontem">Venceu Ontem</SelectItem>
                  <SelectItem value="vence-em-3-dias">Vence em 3 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Planos</Label>
              <Select onValueChange={(v) => filtros.setValue("plano", v)} disabled={loadingData}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingData ? "Carregando..." : "Todos"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {planos.map((plano) => (
                    <SelectItem key={plano.id} value={String(plano.id)}>
                      {plano.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Produtos</Label>
              <Select onValueChange={(v) => filtros.setValue("produto", v)} disabled={loadingData}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingData ? "Carregando..." : "Todos"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={String(produto.id)}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-5">
              <Label>Pontos</Label>
              <Select onValueChange={(v) => filtros.setValue("pontos", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="0-10">0-10</SelectItem>
                  <SelectItem value="11-50">11-50</SelectItem>
                  <SelectItem value="51-100">51-100</SelectItem>
                  <SelectItem value="100+">100+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex md:col-span-1 items-end justify-end">
              <Button type="button" variant="secondary" onClick={clearFilters}>Limpar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Barra de busca/ações */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <Input placeholder="Procurar ..." {...filtros.register("search")} />
            </div>
            <Button variant="secondary" className="sm:w-auto">Deletar selecionados</Button>
            <div className="w-full sm:w-24">
              <Select defaultValue={filtros.getValues("pageSize")} onValueChange={(v) => filtros.setValue("pageSize", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-3 sm:pt-6 px-0 sm:px-6">
          <div className="mobile-scroll-x px-3 sm:px-0">
            <Table className="mobile-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox aria-label="Selecionar todos" />
                  </TableHead>
                  <TableHead className="w-8"><Send className="h-4 w-4 opacity-70" /></TableHead>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="min-w-[120px]">Usuário</TableHead>
                  <TableHead className="min-w-[120px]">Plano</TableHead>
                  <TableHead className="min-w-[120px]">Produto</TableHead>
                  <TableHead className="min-w-[110px]">Vencimento</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[80px]">Pontos</TableHead>
                  <TableHead className="min-w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loadingClientes ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <div className="text-sm text-muted-foreground">Carregando clientes...</div>
                  </TableCell>
                </TableRow>
              ) : clientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <div className="text-sm text-muted-foreground">Nenhum cliente encontrado</div>
                  </TableCell>
                </TableRow>
              ) : (
                clientesFiltrados
                  .filter(cliente => cliente && cliente.id)
                  .map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <Checkbox aria-label={`Selecionar ${cliente.nome}`} />
                    </TableCell>
                    <TableCell>
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-medium">{cliente.nome}</span>
                        {cliente.whatsapp && (
                          <span className="text-xs text-muted-foreground">{cliente.whatsapp}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{cliente.usuario || '-'}</TableCell>
                    <TableCell>{getPlanoNome(cliente.plano)}</TableCell>
                    <TableCell>{getProdutoNome(cliente.produto).toUpperCase()}</TableCell>
                    <TableCell>
                      {(() => {
                        const { bgColor } = getClienteStatus(cliente);
                        return (
                          <Badge variant="outline" className={`${bgColor} text-white`}>
                            {cliente.data_vencimento ? format(new Date(cliente.data_vencimento), "dd/MM/yyyy HH:mm") : '-'}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const { status, bgColor } = getClienteStatus(cliente);
                        return (
                          <Badge variant="outline" className={`${bgColor} text-white`}>
                            {status}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => cliente && cliente.id && handleEditCliente(cliente)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => cliente && cliente.id && handleRenovarPlano(cliente)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => cliente && cliente.id && handleCopiarMensagem(cliente)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => cliente && cliente.id && handleDeleteCliente(cliente.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableCaption>Mostrando {clientesFiltrados.length} de {clientes.length} resultados</TableCaption>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Sucesso */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white text-center">
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Sucesso</h2>
            <p className="text-slate-300">{successMessage}</p>
            <Button onClick={() => setShowSuccessDialog(false)} className="bg-cyan-500 hover:bg-cyan-600 text-white px-8">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmar Exclusão do Cliente */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{deleteTarget?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCliente} className="bg-red-500 hover:bg-red-600 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar Renovação do Plano */}
      <AlertDialog open={renovarDialogOpen} onOpenChange={setRenovarDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Renovar plano</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Confirma a renovação do plano do cliente "{clienteParaRenovar?.nome}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              className="border-slate-600 text-white hover:bg-slate-700"
              onClick={() => {
                setRenovarDialogOpen(false);
                setClienteParaRenovar(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={() => executarRenovacao(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Renovar Plano
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Templates e Mensagem */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar mensagem para {clienteParaMensagem?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Selecione o template</Label>
              <Select value={templateSelecionado} onValueChange={setTemplateSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={gerarMensagemComCliente}
              className="w-full bg-cyan-500 hover:bg-cyan-600"
            >
              Gerar mensagem
            </Button>

            {mensagemGerada && (
              <div className="space-y-2">
                <Label>Mensagem gerada</Label>
                <Textarea
                  value={mensagemGerada}
                  readOnly
                  rows={10}
                  className="bg-muted"
                />
                <Button 
                  onClick={copiarMensagemGerada}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar mensagem
                </Button>
              </div>
            )}

            <div className="pt-2 text-sm text-muted-foreground">
              <p className="font-medium mb-1">Variáveis disponíveis nos templates:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{"{saudacao}"} - Saudação baseada no horário (Bom dia, Boa tarde, Boa noite)</li>
                <li>{"{nome}"}, {"{cliente}"} ou {"{nome_cliente}"} - Nome do cliente</li>
                <li>{"{usuario}"} - Usuário do cliente</li>
                <li>{"{senha}"} - Senha do cliente</li>
                <li>{"{plano}"} - Nome do plano</li>
                <li>{"{valor}"} ou {"{valor_plano}"} - Valor do plano</li>
                <li>{"{desconto}"} - Desconto aplicado</li>
                <li>{"{total}"} - Total após desconto (valor - desconto)</li>
                <li>{"{vencimento}"} ou {"{data_vencimento}"} - Data de vencimento</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Coins, Eye, EyeOff, Info, LineChart, Pencil, Trash2, RefreshCw } from "lucide-react";
import { useFinanceiro } from "@/hooks/useFinanceiro";
import { toast } from "sonner";

export default function Financeiro() {
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);
  
  const [mostrarValores, setMostrarValores] = useState(false);
  const [filtroDataInicio, setFiltroDataInicio] = useState(format(inicioMes, 'yyyy-MM-dd'));
  const [filtroDataFim, setFiltroDataFim] = useState(format(fimMes, 'yyyy-MM-dd'));
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const { entradas, saidas, lucros, transacoes, loading, error, salvarTransacao, editarTransacao, excluirTransacao } = useFinanceiro();

  // Estado para o modal
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState<any>(null);
  const [formData, setFormData] = useState({
    valor: "",
    tipo: "entrada" as "entrada" | "saida",
    descricao: ""
  });

  // Estado para o diálogo de confirmação
  const [dialogoExclusaoAberto, setDialogoExclusaoAberto] = useState(false);
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState<any>(null);

  // SEO minimalista sem libs
  useEffect(() => {
    document.title = "Financeiro | Gestor Tech Play";
    const ensureMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    ensureMeta("description", "Financeiro do Gestor Tech Play: lucros, entradas, saídas e projeções.");

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
  }, []);

  const formatarValor = (valor: number) => {
    if (!mostrarValores) return "•••••";
    return new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL" 
    }).format(valor);
  };

  const calcularProjecoes = (valorBase: number) => ({
    semanal: valorBase * 4, // 4 semanas por mês
    mensal: valorBase,
    anual: valorBase * 12,
  });

  // Filtrar transações baseado nos filtros aplicados
  const transacoesFiltradas = useMemo(() => {
    console.log("🔍 Aplicando filtros:", { filtroDataInicio, filtroDataFim, filtroTipo, termoPesquisa });
    console.log("📊 Total de transações:", transacoes.length);
    
    // Se não há filtros aplicados, retorna todas as transações
    if (!filtroDataInicio && !filtroDataFim && filtroTipo === "todos" && !termoPesquisa) {
      console.log("✨ Nenhum filtro aplicado, mostrando todas as transações");
      return transacoes;
    }
    
    return transacoes.filter(transacao => {
      console.log("🔄 Processando transação:", transacao);
      
      // Filtro por data
      if (filtroDataInicio || filtroDataFim) {
        // Extrair apenas a data no formato dd/mm/yyyy da string "13/08/2025, 00:06:55"
        const dataStr = transacao.data.split(',')[0].trim(); // "13/08/2025"
        console.log("📅 Data da transação (string):", dataStr);
        
        // Converter dd/mm/yyyy para yyyy-mm-dd para comparação
        const [dia, mes, ano] = dataStr.split('/');
        const dataTransacao = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        console.log("📅 Data da transação (convertida):", dataTransacao);
        
        if (filtroDataInicio) {
          console.log("📅 Comparando com data início:", filtroDataInicio);
          if (dataTransacao < filtroDataInicio) {
            console.log("❌ Transação anterior à data início");
            return false;
          }
        }
        
        if (filtroDataFim) {
          console.log("📅 Comparando com data fim:", filtroDataFim);
          if (dataTransacao > filtroDataFim) {
            console.log("❌ Transação posterior à data fim");
            return false;
          }
        }
      }
      
      // Filtro por tipo
      if (filtroTipo !== "todos" && transacao.tipo !== filtroTipo) {
        console.log("❌ Tipo não corresponde:", transacao.tipo, "!==", filtroTipo);
        return false;
      }
      
      // Filtro por pesquisa
      if (termoPesquisa) {
        const termo = termoPesquisa.toLowerCase();
        const match = (
          transacao.cliente.toLowerCase().includes(termo) ||
          transacao.detalheValor.toLowerCase().includes(termo) ||
          transacao.detalheTitulo.toLowerCase().includes(termo)
        );
        if (!match) {
          console.log("❌ Não corresponde ao termo de pesquisa");
          return false;
        }
      }
      
      console.log("✅ Transação passou por todos os filtros");
      return true;
    });
  }, [transacoes, filtroDataInicio, filtroDataFim, filtroTipo, termoPesquisa]);

  // Calcular métricas filtradas
  const metricasFiltradas = useMemo(() => {
    const entradas = transacoesFiltradas
      .filter(t => t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);
    
    const saidas = transacoesFiltradas
      .filter(t => t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);
    
    return {
      entradas,
      saidas,
      lucros: entradas - saidas
    };
  }, [transacoesFiltradas]);

  const projecoes = calcularProjecoes(metricasFiltradas.lucros); // Projeção baseada no lucro filtrado

  const handleLimparFiltros = () => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);
    
    setFiltroDataInicio(format(inicioMes, 'yyyy-MM-dd'));
    setFiltroDataFim(format(fimMes, 'yyyy-MM-dd'));
    setFiltroTipo("todos");
    setTermoPesquisa("");
  };

  // Funções do modal
  const abrirModalNovo = () => {
    setModoEdicao(false);
    setTransacaoEditando(null);
    setFormData({ valor: "", tipo: "entrada", descricao: "" });
    setModalAberto(true);
  };

  const abrirModalEdicao = (transacao: any) => {
    if (!transacao.isCustom) {
      toast.error("Só é possível editar transações customizadas");
      return;
    }

    setModoEdicao(true);
    setTransacaoEditando(transacao);
    setFormData({
      valor: transacao.valor.toString(),
      tipo: transacao.tipo,
      descricao: transacao.descricao || `${transacao.cliente}\n${transacao.detalheTitulo}: ${transacao.detalheValor}`
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setModoEdicao(false);
    setTransacaoEditando(null);
    setFormData({ valor: "", tipo: "entrada", descricao: "" });
  };

  const handleSalvar = async () => {
    if (!formData.valor || !formData.descricao) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Converter valor para número, removendo caracteres especiais
      const valorStr = formData.valor.replace(/[R$\s]/g, '').replace(',', '.');
      const valor = parseFloat(valorStr);

      if (isNaN(valor) || valor <= 0) {
        toast.error("Valor inválido");
        return;
      }

      const novaTransacao = {
        valor,
        tipo: formData.tipo,
        descricao: formData.descricao,
      };

      if (modoEdicao && transacaoEditando && transacaoEditando.isCustom) {
        await editarTransacao(transacaoEditando.id, novaTransacao);
        toast.success("Transação editada com sucesso!");
      } else {
        await salvarTransacao(novaTransacao);
        toast.success("Nova transação criada com sucesso!");
      }
      
      fecharModal();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error("Erro ao salvar transação");
    }
  };

  const abrirDialogoExclusao = (transacao: any) => {
    if (!transacao.isCustom) {
      toast.error("Só é possível excluir transações customizadas");
      return;
    }

    setTransacaoParaExcluir(transacao);
    setDialogoExclusaoAberto(true);
  };

  const fecharDialogoExclusao = () => {
    setDialogoExclusaoAberto(false);
    setTransacaoParaExcluir(null);
  };

  const confirmarExclusao = async () => {
    if (!transacaoParaExcluir) return;

    try {
      await excluirTransacao(transacaoParaExcluir.id);
      toast.success("Transação excluída com sucesso!");
      fecharDialogoExclusao();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error("Erro ao excluir transação");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-mobile-2xl md:text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-mobile-sm text-muted-foreground">Visão geral de lucros, entradas, saídas e projeções.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => {}}>Novo</Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mostrarValores ? "default" : "outline"}
                size="icon"
                aria-pressed={mostrarValores}
                aria-label={mostrarValores ? "Ocultar saldos" : "Mostrar saldos"}
                onClick={() => setMostrarValores((v) => !v)}
                className="touch-friendly"
              >
                {mostrarValores ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {mostrarValores ? "Ocultar saldos" : "Mostrar saldos"}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      <section aria-label="Métricas financeiras" className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-success/30">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Lucros</CardTitle>
            <LineChart className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Carregando...</span>
                </div>
              ) : error ? (
                <span className="text-destructive text-lg">Erro</span>
              ) : (
                formatarValor(lucros)
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-info/30">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Entradas</CardTitle>
            <LineChart className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Carregando...</span>
                </div>
              ) : error ? (
                <span className="text-destructive text-lg">Erro</span>
              ) : (
                formatarValor(entradas)
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Saídas</CardTitle>
            <LineChart className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Carregando...</span>
                </div>
              ) : error ? (
                <span className="text-destructive text-lg">Erro</span>
              ) : (
                formatarValor(saidas)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Projeção Semanal</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <Coins className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "Carregando..." : formatarValor(projecoes.semanal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Projeção Mensal</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <Coins className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "Carregando..." : formatarValor(projecoes.mensal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Projeção Anual</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <Coins className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {loading ? "Carregando..." : formatarValor(projecoes.anual)}
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-label="Filtros" className="space-y-3">
        <div className="rounded-md border">
          <div className="px-3 sm:px-4 py-2 bg-info/60 text-info-foreground rounded-t-md font-semibold text-sm">Filtros</div>
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input 
                type="date" 
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input 
                type="date" 
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleLimparFiltros} variant="outline" className="flex-1">
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Tabela de transações" className="space-y-3">
        <div className="rounded-md border">
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Input 
              placeholder="Pesquisar..." 
              className="w-full sm:max-w-sm" 
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
            />
            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <Label htmlFor="pageSize" className="text-muted-foreground text-sm">Itens</Label>
              <Select defaultValue="10">
                <SelectTrigger id="pageSize" className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 px-0 sm:px-4">
            <div className="mobile-scroll-x px-3 sm:px-0">
              <Table className="mobile-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Produto/Plano/Cliente</TableHead>
                    <TableHead className="min-w-[100px]">Tipo</TableHead>
                    <TableHead className="min-w-[120px]">Valor</TableHead>
                    <TableHead className="min-w-[150px]">Data</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Carregando transações...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <span className="text-destructive">{error}</span>
                    </TableCell>
                  </TableRow>
                ) : transacoesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <span className="text-muted-foreground">Nenhuma transação encontrada</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  transacoesFiltradas.map((r) => (
                    <TableRow key={r.id} className="align-top">
                      <TableCell className="w-[80px] font-mono text-sm">{r.id.split('-')[1].substring(0, 8)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>
                            <span className="text-muted-foreground">Novo cliente: </span>
                            <span className="font-medium text-success">{r.cliente}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {r.detalheTitulo}: <span className={r.detalheTitulo === "Produto" ? "text-primary font-medium" : "text-info font-medium"}>{r.detalheValor}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={r.tipo === "entrada" ? "bg-success/10 text-success border-success font-medium" : "bg-destructive/10 text-destructive border-destructive font-medium"}
                        >
                          {r.tipo === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={r.tipo === "entrada" ? "bg-success/10 text-success border-success font-medium px-3 py-1" : "bg-destructive/10 text-destructive border-destructive font-medium px-3 py-1"}
                        >
                          {formatarValor(r.valor)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{r.data}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-8 w-8" 
                            aria-label={`Editar ${r.id}`}
                            onClick={() => abrirModalEdicao(r)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground" 
                            aria-label={`Excluir ${r.id}`}
                            onClick={() => abrirDialogoExclusao(r)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Edição/Criação */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {modoEdicao ? "Editar Transação" : "Nova Transação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                placeholder="R$ 25,00"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value: "entrada" | "saida") => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Novo cliente teste&#10;Plano: plano mensal"
                rows={5}
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                className="resize-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} className="bg-cyan-500 hover:bg-cyan-600">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={dialogoExclusaoAberto} onOpenChange={setDialogoExclusaoAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={fecharDialogoExclusao}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

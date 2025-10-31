import { useEffect, useState } from "react";
import { useProdutos } from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X, Package, Settings, AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import type { Produto } from "@/types/database";

const formatCurrencyBRL = (value: string) => {
  const digits = (value ?? "").toString().replace(/\D/g, "");
  const number = Number(digits) / 100;
  if (isNaN(number)) return "R$ 0,00";
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function ClientesProdutos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    creditos: "",
    descricao: "",
    configuracoesIptv: false,
    provedorIptv: "",
    renovacaoAutomatica: false
  });
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    valor: "",
    creditos: "",
    descricao: "",
    configuracoesIptv: false,
    provedorIptv: "",
    renovacaoAutomatica: false
  });
  const [deleteTarget, setDeleteTarget] = useState<Produto | null>(null);
  
  const { criar, buscar, atualizar, deletar } = useProdutos();

  useEffect(() => {
    document.title = "Clientes - Produtos | Gestor Tech Play";
  }, []);

  useEffect(() => {
    const carregar = async () => {
      const data = await buscar();
      setProdutos(data || []);
    };
    carregar();
  }, [buscar]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.valor.trim()) return;
    
    setLoading(true);
    try {
      const novo = await criar({
        nome: formData.nome,
        valor: formData.valor,
        creditos: formData.creditos,
        descricao: formData.descricao,
        configuracoes_iptv: formData.configuracoesIptv,
        provedor_iptv: formData.provedorIptv,
        renovacao_automatica: formData.renovacaoAutomatica
      });
      setSuccessMessage("Produto criado");
      setShowSuccessDialog(true);
      setProdutos((prev) => [novo, ...prev]);
      setIsDialogOpen(false);
      setFormData({
        nome: "",
        valor: "",
        creditos: "",
        descricao: "",
        configuracoesIptv: false,
        provedorIptv: "",
        renovacaoAutomatica: false
      });
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setFormData({
      nome: "",
      valor: "",
      creditos: "",
      descricao: "",
      configuracoesIptv: false,
      provedorIptv: "",
      renovacaoAutomatica: false
    });
  };

  const openEdit = (p: Produto) => {
    setEditingProduto(p);
    setEditForm({
      nome: p.nome ?? "",
      valor: typeof p.valor === "string" ? p.valor : String(p.valor ?? ""),
      creditos: p.creditos ?? "",
      descricao: p.descricao ?? "",
      configuracoesIptv: (p as any).configuracoes_iptv ?? false,
      provedorIptv: (p as any).provedor_iptv ?? "",
      renovacaoAutomatica: (p as any).renovacao_automatica ?? false,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (field: string, value: string | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!editingProduto?.id) return;
    setLoading(true);
    try {
      const atualizado = await atualizar(editingProduto.id as string, {
        nome: editForm.nome,
        valor: editForm.valor,
        creditos: editForm.creditos,
        descricao: editForm.descricao,
        configuracoes_iptv: editForm.configuracoesIptv as any,
        provedor_iptv: editForm.provedorIptv as any,
        renovacao_automatica: editForm.renovacaoAutomatica as any,
      });
      setProdutos(prev => prev.map(p => (p.id === atualizado.id ? atualizado : p)));
      setIsEditDialogOpen(false);
      setEditingProduto(null);
      setSuccessMessage("Produto atualizado");
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setLoading(true);
    try {
      await deletar(deleteTarget.id as string);
      setProdutos(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSuccessMessage("Produto excluído");
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
        <p className="text-muted-foreground text-sm">Gerenciar produtos</p>
      </header>

      <section>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-400" />
              <div>
                <CardTitle className="text-base text-white">Produtos dos Clientes</CardTitle>
                <p className="text-sm text-slate-400">Gerenciar os produtos oferecidos aos seus clientes</p>
              </div>
            </div>
            <div className="ml-auto">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Novo produto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-white">Nome</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleInputChange("nome", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valor" className="text-white">Valor</Label>
                      <Input
                        id="valor"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="R$ 0,00"
                        value={formData.valor}
                        onChange={(e) => handleInputChange("valor", formatCurrencyBRL(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="creditos" className="text-white">Créditos</Label>
                        <Settings className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        id="creditos"
                        value={formData.creditos}
                        onChange={(e) => handleInputChange("creditos", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="descricao" className="text-white">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => handleInputChange("descricao", e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="configuracoesIptv"
                          checked={formData.configuracoesIptv}
                          onChange={(e) => handleInputChange("configuracoesIptv", e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="configuracoesIptv" className="text-white">Configurações IPTV</Label>
                      </div>
                      
                      {formData.configuracoesIptv && (
                        <div className="space-y-4 pl-6">
                          <div className="space-y-2">
                            <Label className="text-white">Provedor IPTV</Label>
                            <Select value={formData.provedorIptv} onValueChange={(value) => handleInputChange("provedorIptv", value)}>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Selecione um provedor..." />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-700 border-slate-600">
                                <SelectItem value="provedor1">Provedor 1</SelectItem>
                                <SelectItem value="provedor2">Provedor 2</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-white">Renovação Automática IPTV</Label>
                              <Switch
                                checked={formData.renovacaoAutomatica}
                                onCheckedChange={(checked) => handleInputChange("renovacaoAutomatica", checked)}
                              />
                            </div>
                            <p className="text-xs text-slate-400">
                              Quando ativado todos os clientes deste produto terão renovação automática no servidor IPTV
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 text-orange-400 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Nenhum painel IPTV configurado. Configurar agora</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={handleCancel} className="border-slate-600 text-white hover:bg-slate-700">
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                      >
                        {loading ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>
      </section>

      <section className="bg-slate-900 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Procurar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <span className="text-slate-400 text-sm">{produtos.length}</span>
        </div>

        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800">
                <TableHead className="text-slate-300">id</TableHead>
                <TableHead className="text-slate-300">Nome</TableHead>
                <TableHead className="text-slate-300">Clientes vinculados</TableHead>
                <TableHead className="text-slate-300">Valor</TableHead>
                <TableHead className="text-slate-300">Créditos</TableHead>
                <TableHead className="text-slate-300">Descrição</TableHead>
                <TableHead className="text-slate-300">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.length ? (
                produtos
                  .filter((p) => p.nome?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((p) => (
                    <TableRow key={p.id} className="border-slate-700">
                      <TableCell className="text-slate-300">{p.id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-slate-300">{p.nome}</TableCell>
                      <TableCell className="text-slate-300">0</TableCell>
                      <TableCell className="text-slate-300">
                        <span className="inline-flex items-center rounded-md bg-cyan-500 px-2 py-1 text-xs font-medium text-white">
                          {typeof p.valor === "string" && p.valor.trim().startsWith("R$") ? p.valor : `R$ ${p.valor}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">{p.creditos}</TableCell>
                      <TableCell className="text-slate-300">{p.descricao}</TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(p)}
                            className="text-cyan-400 hover:text-cyan-300"
                            aria-label="Editar produto"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(p)}
                            className="text-red-400 hover:text-red-300"
                            aria-label="Excluir produto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                    Nada para mostrar
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-slate-400 text-sm">
          Mostrando {produtos.length} resultado(s)
        </div>
      </section>
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
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-8"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editar Produto */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Editar produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome" className="text-white">Nome</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => handleEditChange("nome", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-valor" className="text-white">Valor</Label>
              <Input
                id="edit-valor"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="R$ 0,00"
                value={editForm.valor}
                onChange={(e) => handleEditChange("valor", formatCurrencyBRL(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-creditos" className="text-white">Créditos</Label>
              <Input
                id="edit-creditos"
                value={editForm.creditos}
                onChange={(e) => handleEditChange("creditos", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descricao" className="text-white">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={editForm.descricao}
                onChange={(e) => handleEditChange("descricao", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-600 text-white hover:bg-slate-700">
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excluir Produto */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{deleteTarget?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePlanos } from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, X, Pencil, Trash2 } from "lucide-react";
import type { Plano } from "@/types/database";

const formatCurrencyBRL = (value: string) => {
  const digits = (value ?? "").toString().replace(/\D/g, "");
  const number = Number(digits) / 100;
  if (isNaN(number)) return "R$ 0,00";
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function ClientesPlanos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    tipo: "meses",
    quantidade: "",
    descricao: ""
  });
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  
  const { criar, atualizar, buscar, deletar } = usePlanos();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Clientes - Planos | Gestor Tech Play";
    const carregar = async () => {
      const data = await buscar();
      setPlanos(data || []);
    };
    carregar();
  }, [buscar]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.valor.trim()) return;
    
    setLoading(true);
    try {
      if (editingPlano) {
        // Editar plano existente
        const atualizado = await atualizar(editingPlano.id!, formData);
        if (atualizado) {
          setPlanos((prev) => 
            prev.map((p) => (p.id === editingPlano.id ? atualizado : p))
          );
          setSuccessMessage("Plano atualizado");
          setShowSuccessDialog(true);
        }
      } else {
        // Criar novo plano
        const novo = await criar(formData);
        if (novo) {
          setPlanos((prev) => [novo, ...prev]);
          setSuccessMessage("Plano criado");
          setShowSuccessDialog(true);
        }
      }
      
      setIsDialogOpen(false);
      setEditingPlano(null);
      setFormData({
        nome: "",
        valor: "",
        tipo: "meses",
        quantidade: "",
        descricao: ""
      });
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plano: Plano) => {
    setEditingPlano(plano);
    setFormData({
      nome: plano.nome || "",
      valor: plano.valor ? (plano.valor.toString().trim().startsWith("R$") ? plano.valor : formatCurrencyBRL(plano.valor.toString())) : "",
      tipo: plano.tipo || "meses",
      quantidade: plano.quantidade || "",
      descricao: plano.descricao || ""
    });
    setIsDialogOpen(true);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingPlano(null);
    setFormData({
      nome: "",
      valor: "",
      tipo: "meses",
      quantidade: "",
      descricao: ""
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deletar(id);
      setPlanos((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
    }
  };

  return (
    <main className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planos</h1>
          <p className="text-muted-foreground text-sm">Planos dos clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingPlano ? "Editar produto" : "Novo produto"}
              </DialogTitle>
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
                <RadioGroup 
                  value={formData.tipo} 
                  onValueChange={(value) => handleInputChange("tipo", value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="meses" id="meses" />
                    <Label htmlFor="meses" className="text-white">Meses</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dias" id="dias" />
                    <Label htmlFor="dias" className="text-white">Dias</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantidade" className="text-white">
                  Escolha a quantidade de {formData.tipo}
                </Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => handleInputChange("quantidade", e.target.value)}
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
      </header>

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
          <span className="text-slate-400 text-sm">10</span>
        </div>

        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800">
                <TableHead className="text-slate-300">id</TableHead>
                <TableHead className="text-slate-300">Nome</TableHead>
                <TableHead className="text-slate-300">Clientes vinculados</TableHead>
                <TableHead className="text-slate-300">Valor</TableHead>
                <TableHead className="text-slate-300">Qdt</TableHead>
                <TableHead className="text-slate-300">Descrição</TableHead>
                <TableHead className="text-slate-300">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos.length ? (
                planos
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
                      <TableCell className="text-slate-300">{p.tipo === 'dias' ? 'Dias' : 'Meses'}: {p.quantidade}</TableCell>
                      <TableCell className="text-slate-300">{p.descricao}</TableCell>
                       <TableCell className="text-slate-300">
                         <div className="flex gap-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleEdit(p)}
                             className="h-8 w-8 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-slate-700"
                           >
                             <Pencil className="h-4 w-4" />
                           </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-slate-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                               <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Excluir plano</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     Tem certeza que deseja excluir o plano "{p.nome}"? Esta ação não pode ser desfeita.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleDelete(p.id!)} className="bg-red-500 hover:bg-red-600 text-white">Excluir</AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                            </AlertDialog>
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
          Mostrando {planos.length} resultado(s)
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
    </main>
  );
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, X, Pencil, Trash2 } from "lucide-react";
import type { Aplicativo } from "@/types/database";
import { useAplicativos } from "@/hooks/useDatabase";

export default function ClientesAplicativos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    descricao: ""
  });
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<Aplicativo[]>([]);
  const [editingApp, setEditingApp] = useState<Aplicativo | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const { criar, atualizar, buscar, deletar } = useAplicativos();

  useEffect(() => {
    document.title = "Clientes - Aplicativos | Gestor Tech Play";
  }, []);

  useEffect(() => {
    const carregar = async () => {
      const data = await buscar();
      setApps(data || []);
    };
    carregar();
  }, [buscar]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) return;
    
    setLoading(true);
    try {
      if (editingApp) {
        // Editar aplicativo existente
        const atualizado = await atualizar(editingApp.id!, formData);
        if (atualizado) {
          setApps((prev) => prev.map(app => app.id === editingApp.id ? atualizado : app));
          setSuccessMessage("Aplicativo atualizado");
          setShowSuccessDialog(true);
        }
      } else {
        // Criar novo aplicativo
        const novo = await criar(formData);
        if (novo) {
          setApps((prev) => [novo, ...prev]);
          setSuccessMessage("Aplicativo criado");
          setShowSuccessDialog(true);
        }
      }
      
      setIsDialogOpen(false);
      setEditingApp(null);
      setFormData({ nome: "", descricao: "" });
    } catch (error) {
      console.error("Erro ao salvar aplicativo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (app: Aplicativo) => {
    setEditingApp(app);
    setFormData({
      nome: app.nome || "",
      descricao: app.descricao || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (app: Aplicativo) => {
    try {
      await deletar(app.id!);
      setApps((prev) => prev.filter(a => a.id !== app.id));
      setSuccessMessage("Aplicativo excluído");
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Erro ao excluir aplicativo:", error);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setFormData({ nome: "", descricao: "" });
    setEditingApp(null);
  };

  return (
    <main className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aplicativos</h1>
          <p className="text-muted-foreground text-sm">Aplicativos dos clientes</p>
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
                {editingApp ? "Editar app" : "Novo app"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-white">Nome do app</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-white">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange("descricao", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white min-h-[120px] resize-none"
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
          <span className="text-slate-400 text-sm">{apps.length}</span>
        </div>

        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800">
                <TableHead className="text-slate-300">id</TableHead>
                <TableHead className="text-slate-300">Nome</TableHead>
                <TableHead className="text-slate-300">Clientes vinculados</TableHead>
                <TableHead className="text-slate-300">Descrição</TableHead>
                <TableHead className="text-slate-300">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.length ? (
                apps
                  .filter((a) => a.nome?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((a) => (
                    <TableRow key={a.id} className="border-slate-700">
                      <TableCell className="text-slate-300">{a.id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-slate-300">{a.nome}</TableCell>
                      <TableCell className="text-slate-300">0</TableCell>
                      <TableCell className="text-slate-300">{a.descricao}</TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(a)}
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
                                <AlertDialogTitle>Excluir aplicativo</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o aplicativo "{a.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(a)} className="bg-red-500 hover:bg-red-600 text-white">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                    Nada para mostrar
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-slate-400 text-sm">
          Mostrando {apps.length} resultado(s)
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

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useConfiguracoes } from "@/hooks/useDatabase";
import { toast } from "sonner";

export default function AtivarCobrancas() {
  const [ativo, setAtivo] = useState(false);
  const { buscar, salvarCobrancasStatus } = useConfiguracoes();

  useEffect(() => {
    document.title = "Ativar Cobranças | Gestor Tech Play";
    const d = document.querySelector('meta[name="description"]') || document.createElement('meta');
    d.setAttribute('name', 'description');
    d.setAttribute('content', 'Ative ou desative o sistema de cobranças.');
    if (!d.parentElement) document.head.appendChild(d);
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = window.location.href;

    // carregar status
    (async () => {
      const cfg = await buscar();
      if (cfg && typeof cfg.cobrancas_ativas === 'boolean') {
        setAtivo(cfg.cobrancas_ativas);
      }
    })();
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ativar Cobranças</h1>
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="ativar"
              checked={ativo}
              onCheckedChange={async (v) => {
                setAtivo(v);
                try {
                  await salvarCobrancasStatus(v);
                } catch (e) {
                  setAtivo(!v);
                  toast.error("Não foi possível atualizar o status");
                }
              }}
            />
            <Label htmlFor="ativar">{ativo ? "Cobranças ativas" : "Cobranças desativadas"}</Label>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

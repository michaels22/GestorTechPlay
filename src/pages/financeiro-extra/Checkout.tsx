import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CreditCard, QrCode, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAssas } from "@/hooks/useAssas";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { CheckoutConfig } from "@/types/database";

export default function Checkout() {
  const { toast } = useToast();
  const { isConfigured: asaasConfigured } = useAssas();
  const { user } = useCurrentUser();
  const [pixEnabled, setPixEnabled] = useState(false);
  const [creditCardEnabled, setCreditCardEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Carregar configurações existentes
  const loadConfiguration = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('checkout_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setPixEnabled(data.pix_enabled);
        setCreditCardEnabled(data.credit_card_enabled);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, [user?.id]);

  useEffect(() => {
    document.title = "Checkout – Pagamentos | Gestor IPTV";

    // Meta description
    const meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = "Configuração do Checkout: habilite PIX e Cartão de Crédito no Gestor IPTV.";
      document.head.appendChild(m);
    } else {
      meta.setAttribute("content", "Configuração do Checkout: habilite PIX e Cartão de Crédito no Gestor IPTV.");
    }

    // Canonical tag
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/financeiro-extra/checkout");
  }, []);

  // Desabilitar PIX automaticamente quando Asaas não estiver configurado
  useEffect(() => {
    if (!asaasConfigured && pixEnabled) {
      setPixEnabled(false);
      toast({
        title: "PIX desabilitado",
        description: "O PIX foi desabilitado porque o Asaas não está configurado.",
        variant: "destructive"
      });
    }
  }, [asaasConfigured, pixEnabled, toast]);

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar as configurações.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const configData = {
        user_id: user.id,
        pix_enabled: pixEnabled && asaasConfigured, // Só permitir PIX se Asaas estiver configurado
        credit_card_enabled: creditCardEnabled,
      };

      const { error } = await supabase
        .from('checkout_config')
        .upsert(configData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Erro ao salvar:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar configurações. Tente novamente.",
          variant: "destructive"
        });
        return;
      }
      
      toast({ 
        title: "Configurações salvas", 
        description: "As preferências do checkout foram atualizadas com sucesso." 
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="rounded-lg border mb-6 overflow-hidden shadow" aria-label="Configuração do Checkout">
        <div className="px-4 py-3 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" aria-hidden="true" />
            <h1 className="text-base font-semibold tracking-tight">Configuração do Checkout</h1>
          </div>
          <p className="text-xs/6 opacity-90">Configue os métodos de pagamento disponíveis para seus clientes.</p>
        </div>
      </header>

      <main>
        <section className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-foreground/70" />
                <CardTitle className="text-sm">Pagamento PIX</CardTitle>
              </div>
              <CardDescription>
                Configure qual provedor será utilizado para processar pagamentos via PIX. O PIX permite
                transferências instantâneas e é amplamente aceito no Brasil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provedor PIX</span>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={pixEnabled} 
                    onCheckedChange={setPixEnabled}
                    id="pix-toggle"
                    disabled={!asaasConfigured}
                  />
                  <Badge variant={pixEnabled ? "default" : "destructive"}>
                    {pixEnabled ? "Habilitado" : "Desabilitado"}
                  </Badge>
                </div>
              </div>
              
              {!asaasConfigured && (
                <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-md border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Configure o Asaas primeiro para habilitar pagamentos PIX.{" "}
                    <a href="/financeiro-extra/assas" className="underline font-medium">
                      Configurar Asaas
                    </a>
                  </p>
                </div>
              )}
              
              {asaasConfigured && pixEnabled && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ Asaas ativo como provedor PIX
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-foreground/70" />
                <CardTitle className="text-sm">Cartão de Crédito</CardTitle>
              </div>
              <CardDescription>
                Configure qual provedor será utilizado para processar pagamentos com cartão de crédito.
                Oferece maior flexibilidade de pagamento para seus clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provedor Cartão de Crédito</span>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={creditCardEnabled} 
                    onCheckedChange={setCreditCardEnabled}
                    id="credit-card-toggle"
                  />
                  <Badge variant={creditCardEnabled ? "default" : "destructive"}>
                    {creditCardEnabled ? "Habilitado" : "Desabilitado"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div>
                  <p className="text-sm font-medium">Finalizar Configuração</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique em "Salvar Configurações" para aplicar as mudanças e disponibilizar os métodos de pagamento selecionados.
                  </p>
                </div>
                <Button size="lg" onClick={handleSave} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

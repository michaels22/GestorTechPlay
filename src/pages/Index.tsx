import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, AlertTriangle, DollarSign, UserPlus, Calendar, TrendingUp, Download } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { useFinanceiro } from "@/hooks/useFinanceiro";
import { useMetricasClientes, useMetricasPagamentos, useMetricasRenovacoes } from "@/hooks/useMetricas";


export default function Index() {
  const { entradas, saidas, lucros, loading: loadingFinanceiro } = useFinanceiro();
  const { 
    totalClientes, 
    clientesAtivos, 
    clientesVencidos,
    clientesNovosHoje,
    clientesNovosData,
    loading: loadingClientes 
  } = useMetricasClientes();
  const { 
    totalPagamentos, 
    valorTotalMes, 
    mediaPorDia,
    pagamentosData,
    loading: loadingPagamentos 
  } = useMetricasPagamentos();
  const {
    totalRenovacoes,
    renovacoesHoje,
    mediaPorDia: mediaRenovacoesPorDia,
    renovacoesData,
    loading: loadingRenovacoes
  } = useMetricasRenovacoes();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loadingFinanceiro || loadingClientes || loadingPagamentos || loadingRenovacoes) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-64"></div>
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="space-y-1">
        <h1 className="text-mobile-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-mobile-sm text-muted-foreground">Acompanhe clientes, pagamentos e desempenho.</p>
      </header>

      {/* Cards Principais */}
      <section className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-dashboard-primary text-white border-0">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total de clientes</CardTitle>
            <Users className="h-6 w-6 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClientes}</div>
          </CardContent>
        </Card>

        <Card className="bg-dashboard-secondary text-white border-0">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Clientes ativos</CardTitle>
            <Activity className="h-6 w-6 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clientesAtivos}</div>
          </CardContent>
        </Card>

        <Card className="bg-dashboard-danger text-white border-0">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Clientes vencidos</CardTitle>
            <AlertTriangle className="h-6 w-6 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clientesVencidos}</div>
          </CardContent>
        </Card>
      </section>

      {/* Seção de Detalhes */}
      <section className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Novos Clientes */}
        <Card className="bg-dashboard-primary/5 border-dashboard-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-dashboard-secondary" />
              Novos Clientes Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">{clientesNovosHoje}</div>
            <div className="text-sm text-muted-foreground">Novos Clientes Esta Semana: {clientesNovosData.reduce((sum, item) => sum + item.total, 0)}</div>
            <div className="text-sm text-muted-foreground">Novos Clientes Este Mês: {totalClientes}</div>
          </CardContent>
        </Card>

        {/* Clientes Vencendo */}
        <Card className="bg-dashboard-warning/5 border-dashboard-warning/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-dashboard-warning" />
              Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Clientes Vencendo Hoje:</span>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Clientes Vencendo em 3 Dias:</span>
              <span className="text-sm font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Clientes sem Renovar este Mês:</span>
              <span className="text-sm font-medium">0</span>
            </div>
          </CardContent>
        </Card>

        {/* Valores a Receber */}
        <Card className="bg-dashboard-success/5 border-dashboard-success/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-dashboard-success" />
              Valores a Receber
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Projeção Mensal:</span>
              <span className="text-sm font-medium bg-dashboard-success/20 px-2 py-1 rounded">{formatCurrency(valorTotalMes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Hoje:</span>
              <span className="text-sm font-medium">R$0,00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Amanhã:</span>
              <span className="text-sm font-medium">R$0,00</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Gráficos */}
      <section className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Clientes Novos Por Dia */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Clientes Novos Por Dia</CardTitle>
              <p className="text-sm text-muted-foreground">Cadastros diários no período selecionado</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-dashboard-success/10 border border-dashboard-success/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-dashboard-success">{totalClientes}</div>
                <div className="text-xs text-muted-foreground">Total - Mês Atual</div>
              </div>
              <div className="bg-dashboard-primary/10 border border-dashboard-primary/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-dashboard-primary">{(totalClientes / new Date().getDate()).toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Média por Dia</div>
              </div>
              <div className="bg-dashboard-warning/10 border border-dashboard-warning/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-dashboard-warning">{Math.max(...clientesNovosData.map(d => d.total))}</div>
                <div className="text-xs text-muted-foreground">Melhor Dia</div>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clientesNovosData}>
                  <defs>
                    <linearGradient id="clientesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--dashboard-success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--dashboard-success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 20]} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--dashboard-success))" 
                    fillOpacity={1} 
                    fill="url(#clientesGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Clientes Renovados Por Dia */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Clientes Renovados Por Dia</CardTitle>
              <p className="text-sm text-muted-foreground">Renovações diárias no período selecionado</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-dashboard-warning/10 border border-dashboard-warning/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-dashboard-warning">{totalRenovacoes}</div>
                <div className="text-xs text-muted-foreground">Total - Mês Atual</div>
              </div>
              <div className="bg-dashboard-success/10 border border-dashboard-success/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-dashboard-success">{renovacoesHoje}</div>
                <div className="text-xs text-muted-foreground">Renovações Hoje</div>
              </div>
              <div className="bg-dashboard-secondary/10 border border-dashboard-secondary/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-dashboard-secondary">{mediaRenovacoesPorDia.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Média por Dia</div>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={renovacoesData}>
                  <defs>
                    <linearGradient id="renovacoesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--dashboard-warning))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--dashboard-warning))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 20]} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--dashboard-warning))" 
                    fillOpacity={1} 
                    fill="url(#renovacoesGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Resumo Financeiro */}
      <section>
        <Tabs defaultValue="mes" className="w-full">
          <TabsList>
            <TabsTrigger value="mes">Mês atual</TabsTrigger>
            <TabsTrigger value="semana">Esta semana</TabsTrigger>
          </TabsList>
          <TabsContent value="mes">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Resumo do mês</CardTitle>
                <TrendingUp className="h-5 w-5 text-dashboard-success" />
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-dashboard-warning/10 border border-dashboard-warning/20">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-semibold text-dashboard-warning">{formatCurrency(valorTotalMes)}</div>
                </div>
                <div className="p-4 rounded-lg bg-dashboard-success/10 border border-dashboard-success/20">
                  <div className="text-sm text-muted-foreground">Pagamentos</div>
                  <div className="text-2xl font-semibold text-dashboard-success">{totalPagamentos}</div>
                </div>
                <div className="p-4 rounded-lg bg-dashboard-secondary/10 border border-dashboard-secondary/20">
                  <div className="text-sm text-muted-foreground">Média por dia</div>
                  <div className="text-2xl font-semibold text-dashboard-secondary">{formatCurrency(mediaPorDia)}</div>
                </div>
                <div className="p-4 rounded-lg bg-dashboard-primary/10 border border-dashboard-primary/20">
                  <div className="text-sm text-muted-foreground">Melhor dia</div>
                  <div className="text-2xl font-semibold text-dashboard-primary">{formatCurrency(Math.max(...pagamentosData.map(d => d.valor)))}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="semana">
            <Card>
              <CardHeader>
                <CardTitle>Resumo da semana</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-dashboard-warning/10 border border-dashboard-warning/20">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-semibold text-dashboard-warning">{formatCurrency(pagamentosData.reduce((sum, item) => sum + item.valor, 0))}</div>
                </div>
                <div className="p-4 rounded-lg bg-dashboard-success/10 border border-dashboard-success/20">
                  <div className="text-sm text-muted-foreground">Pagamentos</div>
                  <div className="text-2xl font-semibold text-dashboard-success">{pagamentosData.filter(d => d.valor > 0).length}</div>
                </div>
                <div className="p-4 rounded-lg bg-dashboard-secondary/10 border border-dashboard-secondary/20">
                  <div className="text-sm text-muted-foreground">Média por dia</div>
                  <div className="text-2xl font-semibold text-dashboard-secondary">{formatCurrency(pagamentosData.reduce((sum, item) => sum + item.valor, 0) / 7)}</div>
                </div>
                <div className="p-4 rounded-lg bg-dashboard-primary/10 border border-dashboard-primary/20">
                  <div className="text-sm text-muted-foreground">Melhor dia</div>
                  <div className="text-2xl font-semibold text-dashboard-primary">{formatCurrency(Math.max(...pagamentosData.map(d => d.valor)))}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
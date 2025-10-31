import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cliente, Plano, Produto } from '@/types/database';
import { useCurrentUser } from './useCurrentUser';

interface MetricasClientes {
  totalClientes: number;
  clientesAtivos: number;
  clientesVencidos: number;
  clientesNovosHoje: number;
  clientesNovosData: Array<{ day: string; total: number; }>;
  loading: boolean;
  error: string | null;
}

interface MetricasPagamentos {
  totalPagamentos: number;
  valorTotalMes: number;
  mediaPorDia: number;
  pagamentosData: Array<{ day: string; valor: number; }>;
  loading: boolean;
  error: string | null;
}

interface MetricasRenovacoes {
  totalRenovacoes: number;
  renovacoesHoje: number;
  mediaPorDia: number;
  renovacoesData: Array<{ day: string; total: number; }>;
  loading: boolean;
  error: string | null;
}

export function useMetricasClientes(): MetricasClientes {
  const { userId } = useCurrentUser();
  const [metricas, setMetricas] = useState<MetricasClientes>({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesVencidos: 0,
    clientesNovosHoje: 0,
    clientesNovosData: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (userId) {
      carregarMetricasClientes();
    }
  }, [userId]);

  const carregarMetricasClientes = async () => {
    try {
      if (!userId) return;
      
      setMetricas(prev => ({ ...prev, loading: true, error: null }));

      const { data: clientes, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Início do mês atual
      const inicioMesAtual = new Date();
      inicioMesAtual.setDate(1);
      inicioMesAtual.setHours(0, 0, 0, 0);

      // Filtrar clientes criados no mês atual
      const clientesDoMesAtual = clientes.filter(cliente => {
        const dataCliente = new Date(cliente.created_at || '');
        return dataCliente >= inicioMesAtual;
      });

      const clientesNovosHoje = clientes.filter(cliente => {
        const dataCliente = new Date(cliente.created_at || '');
        dataCliente.setHours(0, 0, 0, 0);
        return dataCliente.getTime() === hoje.getTime();
      }).length;

      // Gerar dados dos últimos 7 dias
      const clientesNovosData = [];
      for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        data.setHours(0, 0, 0, 0);
        
        const clientesDoDia = clientes.filter(cliente => {
          const dataCliente = new Date(cliente.created_at || '');
          dataCliente.setHours(0, 0, 0, 0);
          return dataCliente.getTime() === data.getTime();
        }).length;

        clientesNovosData.push({
          day: data.getDate().toString(),
          total: clientesDoDia
        });
      }

      // Calcular clientes ativos e vencidos baseado na data de vencimento
      const agora = new Date();
      let clientesAtivos = 0;
      let clientesVencidos = 0;

      clientes.forEach(cliente => {
        if (!cliente.data_vencimento) {
          // Se não tem data de vencimento, considera como ativo
          clientesAtivos++;
        } else {
          const dataVencimento = new Date(cliente.data_vencimento);
          if (dataVencimento >= agora) {
            clientesAtivos++;
          } else {
            clientesVencidos++;
          }
        }
      });

      setMetricas({
        totalClientes: clientesDoMesAtual.length, // Apenas clientes do mês atual
        clientesAtivos,
        clientesVencidos,
        clientesNovosHoje,
        clientesNovosData,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Erro ao carregar métricas de clientes:', error);
      setMetricas(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar métricas de clientes',
      }));
    }
  };

  return metricas;
}

export function useMetricasPagamentos(): MetricasPagamentos {
  const { userId } = useCurrentUser();
  const [metricas, setMetricas] = useState<MetricasPagamentos>({
    totalPagamentos: 0,
    valorTotalMes: 0,
    mediaPorDia: 0,
    pagamentosData: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (userId) {
      carregarMetricasPagamentos();
    }
  }, [userId]);

  const carregarMetricasPagamentos = async () => {
    try {
      if (!userId) return;
      
      setMetricas(prev => ({ ...prev, loading: true, error: null }));

      const [clientesRes, planosRes] = await Promise.all([
        supabase.from('clientes').select('*').eq('user_id', userId),
        supabase.from('planos').select('*').eq('user_id', userId)
      ]);

      if (clientesRes.error) throw clientesRes.error;
      if (planosRes.error) throw planosRes.error;

      const clientes = clientesRes.data as Cliente[];
      const planos = planosRes.data as Plano[];

      const planosMap = new Map(planos.map(p => [p.id!, p]));

      let valorTotalMes = 0;
      let totalPagamentos = 0;

      // Calcular pagamentos do mês atual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      clientes.forEach(cliente => {
        const dataCliente = new Date(cliente.created_at || '');
        if (dataCliente >= inicioMes && cliente.plano && planosMap.has(cliente.plano)) {
          const plano = planosMap.get(cliente.plano)!;
          const valorStr = plano.valor.replace(/[R$\s]/g, '').replace(',', '.');
          const valor = parseFloat(valorStr);
          
          if (!isNaN(valor)) {
            valorTotalMes += valor;
            totalPagamentos++;
          }
        }
      });

      // Gerar dados dos últimos 7 dias
      const pagamentosData = [];
      for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        data.setHours(0, 0, 0, 0);
        
        let valorDoDia = 0;
        clientes.forEach(cliente => {
          const dataCliente = new Date(cliente.created_at || '');
          dataCliente.setHours(0, 0, 0, 0);
          
          if (dataCliente.getTime() === data.getTime() && cliente.plano && planosMap.has(cliente.plano)) {
            const plano = planosMap.get(cliente.plano)!;
            const valorStr = plano.valor.replace(/[R$\s]/g, '').replace(',', '.');
            const valor = parseFloat(valorStr);
            
            if (!isNaN(valor)) {
              valorDoDia += valor;
            }
          }
        });

        pagamentosData.push({
          day: data.getDate().toString(),
          valor: valorDoDia
        });
      }

      const diasNoMes = new Date().getDate();
      const mediaPorDia = valorTotalMes / diasNoMes;

      setMetricas({
        totalPagamentos,
        valorTotalMes,
        mediaPorDia,
        pagamentosData,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Erro ao carregar métricas de pagamentos:', error);
      setMetricas(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar métricas de pagamentos',
      }));
    }
  };

  return metricas;
}

export function useMetricasRenovacoes(): MetricasRenovacoes {
  const { userId } = useCurrentUser();
  const [metricas, setMetricas] = useState<MetricasRenovacoes>({
    totalRenovacoes: 0,
    renovacoesHoje: 0,
    mediaPorDia: 0,
    renovacoesData: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (userId) {
      carregarMetricasRenovacoes();
    }
  }, [userId]);

  const carregarMetricasRenovacoes = async () => {
    try {
      if (!userId) return;
      
      setMetricas(prev => ({ ...prev, loading: true, error: null }));

      const { data: clientes, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Início do mês atual
      const inicioMesAtual = new Date();
      inicioMesAtual.setDate(1);
      inicioMesAtual.setHours(0, 0, 0, 0);

      // Considera renovação do mês atual: clientes criados ANTES do mês atual e ainda ativos
      // (se estão ativos, significa que renovaram em algum momento)
      const clientesRenovados = clientes.filter(cliente => {
        const dataCriacao = new Date(cliente.created_at || '');
        const dataVencimento = cliente.data_vencimento ? new Date(cliente.data_vencimento) : null;
        
        // Cliente foi criado ANTES do mês atual E ainda está ativo (vencimento futuro)
        return dataCriacao < inicioMesAtual && dataVencimento && dataVencimento > hoje;
      });

      const totalRenovacoes = clientesRenovados.length;

      // Contar renovações hoje (clientes que venceriam hoje mas foram renovados)
      const renovacoesHoje = clientes.filter(cliente => {
        const dataVencimento = cliente.data_vencimento ? new Date(cliente.data_vencimento) : null;
        if (!dataVencimento) return false;
        
        // Cliente com vencimento nos próximos 7 dias (provavelmente renovado recentemente)
        const seteDiasFrente = new Date();
        seteDiasFrente.setDate(seteDiasFrente.getDate() + 7);
        
        return dataVencimento >= hoje && dataVencimento <= seteDiasFrente;
      }).length;

      // Gerar dados dos últimos 7 dias - apenas clientes que realmente renovaram
      const renovacoesData = [];
      for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        data.setHours(0, 0, 0, 0);
        
        // Contar apenas clientes que foram criados antes do mês atual
        // e que ainda estão ativos (renovaram)
        const renovacoesDoDia = clientes.filter(cliente => {
          const dataCriacao = new Date(cliente.created_at || '');
          const dataVencimento = cliente.data_vencimento ? new Date(cliente.data_vencimento) : null;
          
          // Cliente criado ANTES do início do mês atual
          // E tem vencimento futuro (renovado)
          // E o vencimento é próximo desta data (renovado neste período)
          if (dataCriacao >= inicioMesAtual || !dataVencimento) return false;
          
          const dataVencimentoFormatada = new Date(dataVencimento);
          dataVencimentoFormatada.setHours(0, 0, 0, 0);
          
          return dataVencimentoFormatada.getTime() === data.getTime();
        }).length;

        renovacoesData.push({
          day: data.getDate().toString(),
          total: renovacoesDoDia
        });
      }

      const diasNoMes = new Date().getDate();
      const mediaPorDia = totalRenovacoes / diasNoMes;

      setMetricas({
        totalRenovacoes,
        renovacoesHoje,
        mediaPorDia,
        renovacoesData,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Erro ao carregar métricas de renovações:', error);
      setMetricas(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar métricas de renovações',
      }));
    }
  };

  return metricas;
}
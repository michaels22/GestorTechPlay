
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cliente, Plano, Produto } from '@/types/database';
import { useCurrentUser } from './useCurrentUser';

interface TransacaoFinanceira {
  id: string;
  cliente: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  data: string;
  detalheTitulo: string;
  detalheValor: string;
  isCustom?: boolean; // Para diferenciar transações customizadas das automáticas
  descricao?: string; // Descrição original para transações customizadas
}

interface NovaTransacao {
  valor: number;
  tipo: 'entrada' | 'saida';
  descricao: string;
}

interface DadosFinanceiros {
  entradas: number;
  saidas: number;
  lucros: number;
  transacoes: TransacaoFinanceira[];
  loading: boolean;
  error: string | null;
  salvarTransacao: (transacao: NovaTransacao) => Promise<void>;
  editarTransacao: (id: string, transacao: NovaTransacao) => Promise<void>;
  excluirTransacao: (id: string) => Promise<void>;
}

export function useFinanceiro(): DadosFinanceiros {
  const { userId } = useCurrentUser();
  const [dados, setDados] = useState({
    entradas: 0,
    saidas: 0,
    lucros: 0,
    transacoes: [] as TransacaoFinanceira[],
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    if (userId) {
      carregarDadosFinanceiros();
    }
  }, [userId]);


  const carregarDadosFinanceiros = async () => {
    try {
      if (!userId) return;
      
      setDados(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔄 Iniciando carregamento dos dados financeiros...');

      // Buscar clientes, planos e produtos
      const [clientesRes, planosRes, produtosRes] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('planos').select('*'),
        supabase.from('produtos').select('*')
      ]);

      // Buscar transações customizadas com fallback
      let transacoesRes = { data: [], error: null };
      try {
        transacoesRes = await (supabase as any)
          .from('transacoes')
          .select('*')
          .order('created_at', { ascending: false });
      } catch (error) {
        console.log('Tabela de transações ainda não criada, continuando sem transações customizadas');
      }

      if (clientesRes.error) throw clientesRes.error;
      if (planosRes.error) throw planosRes.error;
      if (produtosRes.error) throw produtosRes.error;

      const clientes = clientesRes.data as Cliente[];
      const planos = planosRes.data as Plano[];
      const produtos = produtosRes.data as Produto[];
      const transacoesCustomizadas = transacoesRes.data || [];

      console.log('📊 Dados carregados:', { 
        clientes: clientes.length, 
        planos: planos.length, 
        produtos: produtos.length,
        transacoesCustomizadas: transacoesCustomizadas.length
      });

      // Criar mapas usando IDs em vez de nomes
      const planosMap = new Map(planos.map(p => [p.id!, p]));
      const produtosMap = new Map(produtos.map(p => [p.id!, p]));

      let totalEntradas = 0;
      let totalSaidas = 0;
      const transacoes: TransacaoFinanceira[] = [];

      // Processar clientes para calcular entradas (planos)
      clientes.forEach(cliente => {
        if (cliente.plano && planosMap.has(cliente.plano)) {
          const plano = planosMap.get(cliente.plano)!;
          
          const valorStr = plano.valor.replace(/[R$\s]/g, '').replace(',', '.');
          const valorPlano = parseFloat(valorStr);
          
          if (!isNaN(valorPlano)) {
            totalEntradas += valorPlano;
            
            transacoes.push({
              id: `entrada-${cliente.id}`,
              cliente: cliente.nome,
              tipo: 'entrada',
              valor: valorPlano,
              data: new Date(cliente.created_at || new Date()).toLocaleString('pt-BR'),
              detalheTitulo: 'Plano',
              detalheValor: plano.nome,
              isCustom: false,
            });
          }
        }

        // Processar produtos como saídas
        if (cliente.produto && produtosMap.has(cliente.produto)) {
          const produto = produtosMap.get(cliente.produto)!;
          
          const valorStr = produto.valor.replace(/[R$\s]/g, '').replace(',', '.');
          const valorProduto = parseFloat(valorStr);
          
          if (!isNaN(valorProduto)) {
            totalSaidas += valorProduto;
            
            transacoes.push({
              id: `saida-${cliente.id}`,
              cliente: cliente.nome,
              tipo: 'saida',
              valor: valorProduto,
              data: new Date(cliente.created_at || new Date()).toLocaleString('pt-BR'),
              detalheTitulo: 'Produto',
              detalheValor: produto.nome,
              isCustom: false,
            });
          }
        }
      });

      // Adicionar transações customizadas
      transacoesCustomizadas.forEach((transacao: any) => {
        const valor = parseFloat(transacao.valor);
        if (!isNaN(valor)) {
          if (transacao.tipo === 'entrada') {
            totalEntradas += valor;
          } else {
            totalSaidas += valor;
          }

          // Parsear descrição para extrair cliente e detalhes
          const linhas = transacao.descricao.split('\n');
          const cliente = linhas[0] || 'Transação customizada';
          const detalhe = linhas.slice(1).join(' ') || 'Sem detalhes';

          transacoes.push({
            id: transacao.id,
            cliente,
            tipo: transacao.tipo,
            valor,
            data: new Date(transacao.created_at).toLocaleString('pt-BR'),
            detalheTitulo: 'Customizada',
            detalheValor: detalhe,
            isCustom: true,
            descricao: transacao.descricao, // Manter descrição original para edição
          });
        }
      });

      const lucros = totalEntradas - totalSaidas;

      setDados({
        entradas: totalEntradas,
        saidas: totalSaidas,
        lucros,
        transacoes: transacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('❌ Erro ao carregar dados financeiros:', error);
      setDados(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar dados financeiros',
      }));
    }
  };

  const salvarTransacao = async (novaTransacao: NovaTransacao) => {
    try {
      if (!userId) throw new Error('Usuário não autenticado');
      
      // Tentar inserir a transação
      let { error } = await (supabase as any)
        .from('transacoes')
        .insert({
          valor: novaTransacao.valor,
          tipo: novaTransacao.tipo,
          descricao: novaTransacao.descricao,
          user_id: userId,
        });

      // Se a tabela não existir, tentar criar automaticamente
      if (error && error.code === 'PGRST205') {
        console.log('🔧 Tabela não encontrada, criando automaticamente...');
        
        try {
          // Chamar a edge function para criar a tabela
          const { data: createResult, error: createError } = await supabase.functions.invoke('create-transacoes');
          
          if (createError) {
            throw new Error(`Erro ao criar tabela: ${createError.message}`);
          }
          
          console.log('✅ Tabela criada:', createResult);
          
          // Tentar inserir novamente
          const { error: insertError } = await (supabase as any)
            .from('transacoes')
            .insert({
              valor: novaTransacao.valor,
              tipo: novaTransacao.tipo,
              descricao: novaTransacao.descricao,
              user_id: userId,
            });

          if (insertError) {
            throw insertError;
          }
          
          console.log('✅ Transação salva após criar tabela!');
        } catch (createErr) {
          console.error('Erro ao criar tabela automaticamente:', createErr);
          throw new Error('A tabela de transações não existe e não foi possível criá-la automaticamente. Contacte o suporte.');
        }
      } else if (error) {
        throw error;
      }

      // Recarregar dados após salvar
      await carregarDadosFinanceiros();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      throw error;
    }
  };

  const editarTransacao = async (id: string, transacaoEditada: NovaTransacao) => {
    try {
      const { error } = await (supabase as any)
        .from('transacoes')
        .update({
          valor: transacaoEditada.valor,
          tipo: transacaoEditada.tipo,
          descricao: transacaoEditada.descricao,
        })
        .eq('id', id);

      if (error) throw error;

      // Recarregar dados após editar
      await carregarDadosFinanceiros();
    } catch (error) {
      console.error('Erro ao editar transação:', error);
      throw error;
    }
  };

  const excluirTransacao = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('transacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recarregar dados após excluir
      await carregarDadosFinanceiros();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      throw error;
    }
  };

  return {
    ...dados,
    salvarTransacao,
    editarTransacao,
    excluirTransacao,
  };
}

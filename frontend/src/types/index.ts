export type PapelUsuario = 'SUPERVISOR' | 'ANALISTA' | 'ADMIN';

export interface Usuario {
    id: string;
    nome: string;
    email: string;
    papel: PapelUsuario;
    prefixo?: string;
    ativo?: number;
}

export interface Demanda {
    uid: string;
    id: string;
    analista_nome: string;
    papel?: string;
    id_principal?: string | null;
    projeto: string;
    tema?: string;
    pilar: string;
    departamento_csc: string;
    empresa?: string;
    tipo_demanda?: string;
    prioridade: 'Crítica' | 'Alta' | 'Média' | 'Baixa' | string;
    complexidade: 'Alta' | 'Média' | 'Baixa' | string;
    impacto: 'Alto' | 'Médio' | 'Baixo' | string;
    beneficio?: string;
    status: 'Não iniciado' | 'Em andamento' | 'Em Hypercare' | 'Bloqueado' | 'Concluído' | 'Cancelado' | string;
    validado: 'Sim' | 'Não';
    data_inicio?: string;
    data_conclusao?: string;
    horas_estimadas?: number;
    horas_reais?: number;
    tempo_antes: number;
    tempo_depois: number;
    ganho_mensal: number;
    reducao_percentual: number;
    observacao_executiva?: string;
    pendencias?: string;
    revisao: number;
    atualizado_em: string;
    atualizado_por: string;
    excluido_em?: string | null;
}

export interface CriterioWorkflow {
    uid: string;
    demanda_uid: string;
    etapa: number;
    ordem: number;
    codigo: string;
    titulo: string;
    status: string;
    evidencia?: string;
    observacao?: string;
    atualizado_em?: string;
    atualizado_por?: string;
}

export interface CadastrosMestres {
    projetos?: string[];
    pilares?: string[];
    deptosCSC?: string[];
    tiposDemanda?: string[];
    beneficios?: string[];
    analistas?: Array<{ nome: string; prefixo: string; arquivo?: string; ativo?: boolean }>;
    [key: string]: any;
}

export interface Kpis {
    totalDemandas: number;
    concluidas: number;
    emAndamento: number;
    validadas: number;
    taxaConclusao: number;
    ganhoMensalTotal: number;
    reducaoMedia: number;
    porAnalista: Array<{ analista_nome: string; qtd: number; ganho_total: number }>;
    porPilar: Array<{ pilar: string; qtd: number }>;
}

export interface AuditoriaEvento {
    id: string;
    timestamp: string;
    autor: string;
    papel: string;
    acao: string;
    entidade: string;
    registro_id?: string;
    justificativa?: string;
    delta_json?: string;
}

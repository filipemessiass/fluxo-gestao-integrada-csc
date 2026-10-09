import type { Demanda, CriterioWorkflow, CadastrosMestres, Kpis, AuditoriaEvento, Usuario } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let errorMsg = 'Erro na requisição';
        try {
            const errJson = await res.json();
            errorMsg = errJson.message || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
    }
    return res.json();
}

export const api = {
    checkHealth: async () => {
        const res = await fetch(`${API_BASE}/health`);
        return handleResponse<{ status: string; banco: { dialect: string; status: string; latencyMs: number } }>(res);
    },

    getKpis: async (): Promise<Kpis> => {
        const res = await fetch(`${API_BASE}/api/kpis`);
        return handleResponse<Kpis>(res);
    },

    getDemandas: async (filters: Record<string, string> = {}): Promise<{ demandas: Demanda[]; total: number }> => {
        const params = new URLSearchParams(filters);
        const res = await fetch(`${API_BASE}/api/demandas?${params.toString()}`);
        return handleResponse<{ demandas: Demanda[]; total: number }>(res);
    },

    getDemanda: async (id: string): Promise<{ demanda: Demanda; criterios: CriterioWorkflow[] }> => {
        const res = await fetch(`${API_BASE}/api/demandas/${id}`);
        return handleResponse<{ demanda: Demanda; criterios: CriterioWorkflow[] }>(res);
    },

    criarDemanda: async (data: Partial<Demanda> & { autor?: string; prefixo?: string }): Promise<{ message: string; demanda: any }> => {
        const res = await fetch(`${API_BASE}/api/demandas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse<{ message: string; demanda: any }>(res);
    },

    atualizarDemanda: async (id: string, data: Partial<Demanda> & { autor?: string; justificativa?: string }): Promise<{ message: string }> => {
        const res = await fetch(`${API_BASE}/api/demandas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse<{ message: string }>(res);
    },

    getCriterios: async (id: string): Promise<{ criterios: CriterioWorkflow[] }> => {
        const res = await fetch(`${API_BASE}/api/demandas/${id}/criterios`);
        return handleResponse<{ criterios: CriterioWorkflow[] }>(res);
    },

    atualizarCriterio: async (id: string, codigo: string, data: { status: string; evidencia?: string; observacao?: string; autor?: string }) => {
        const res = await fetch(`${API_BASE}/api/demandas/${id}/criterios/${codigo}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse<{ message: string; validadoDerivado: string }>(res);
    },

    getCadastros: async (): Promise<CadastrosMestres> => {
        const res = await fetch(`${API_BASE}/api/cadastros`);
        return handleResponse<CadastrosMestres>(res);
    },

    salvarCadastros: async (chave: string, valores: any, autor?: string, justificativa?: string) => {
        const res = await fetch(`${API_BASE}/api/cadastros`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chave, valores, autor, justificativa })
        });
        return handleResponse<{ message: string }>(res);
    },

    getAuditoria: async (): Promise<{ auditoria: AuditoriaEvento[] }> => {
        const res = await fetch(`${API_BASE}/api/auditoria`);
        return handleResponse<{ auditoria: AuditoriaEvento[] }>(res);
    },

    getUsuarios: async (): Promise<{ usuarios: Usuario[] }> => {
        const res = await fetch(`${API_BASE}/api/usuarios`);
        return handleResponse<{ usuarios: Usuario[] }>(res);
    },

    login: async (identificador: string, senha?: string): Promise<{ token: string; usuario: Usuario; message: string }> => {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificador, senha })
        });
        return handleResponse<{ token: string; usuario: Usuario; message: string }>(res);
    }
};

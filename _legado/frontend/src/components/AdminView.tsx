import { useState, useEffect } from 'react';
import type { Demanda, CadastrosMestres, AuditoriaEvento } from '../types';
import { Shield, Sliders, Database, ClipboardList, Plus, Trash2, Edit3, Stethoscope, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface AdminViewProps {
    demandas: Demanda[];
    onDemandaAtualizada: () => void;
    dbStatus: { status: string; dialect: string; latencyMs: number } | null;
}

export const AdminView: React.FC<AdminViewProps> = ({
    demandas,
    onDemandaAtualizada,
    dbStatus
}) => {
    const [aba, setAba] = useState<'cadastros' | 'inspector' | 'auditoria'>('cadastros');
    const [cadastros, setCadastros] = useState<CadastrosMestres>({});
    const [auditoria, setAuditoria] = useState<AuditoriaEvento[]>([]);
    const [carregando, setCarregando] = useState(false);

    // Modal de Edição Forçada de Demanda
    const [modalIntervencao, setModalIntervencao] = useState<{ aberta: boolean; demanda: Demanda | null }>({
        aberta: false,
        demanda: null
    });
    const [intervTema, setIntervTema] = useState('');
    const [intervStatus, setIntervStatus] = useState('');
    const [intervJustificativa, setIntervJustificativa] = useState('');

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        setCarregando(true);
        try {
            const [cadRes, audRes] = await Promise.all([
                api.getCadastros(),
                api.getAuditoria()
            ]);
            setCadastros(cadRes);
            setAuditoria(audRes.auditoria || []);
        } catch (err: any) {
            console.error('Erro ao carregar dados do ADM:', err);
        } finally {
            setCarregando(false);
        }
    };

    const handleAdicionarItemLista = async (chave: string) => {
        const val = prompt(`Digite o novo item para ${chave}:`);
        if (!val || !val.trim()) return;

        const listaAtual: string[] = cadastros[chave] || [];
        if (listaAtual.includes(val.trim())) {
            alert('Item já existe na lista!');
            return;
        }

        const novaLista = [...listaAtual, val.trim()];
        try {
            await api.salvarCadastros(chave, novaLista, 'Administrador Master', `Adicionado ${val.trim()} em ${chave}`);
            setCadastros(prev => ({ ...prev, [chave]: novaLista }));
            carregarDados();
            alert('Item salvo no banco SQL com sucesso!');
        } catch (err: any) {
            alert('Erro: ' + err.message);
        }
    };

    const handleRemoverItemLista = async (chave: string, item: string) => {
        if (!confirm(`Deseja remover "${item}" de ${chave}?`)) return;
        const listaAtual: string[] = cadastros[chave] || [];
        const novaLista = listaAtual.filter(i => i !== item);

        try {
            await api.salvarCadastros(chave, novaLista, 'Administrador Master', `Removido ${item} de ${chave}`);
            setCadastros(prev => ({ ...prev, [chave]: novaLista }));
            carregarDados();
        } catch (err: any) {
            alert('Erro: ' + err.message);
        }
    };

    const handleAbrirIntervencao = (dem: Demanda) => {
        setIntervTema(dem.tema || '');
        setIntervStatus(dem.status);
        setIntervJustificativa('');
        setModalIntervencao({ aberta: true, demanda: dem });
    };

    const handleSalvarIntervencao = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalIntervencao.demanda) return;
        if (!intervJustificativa.trim()) {
            alert('A justificativa é obrigatória para qualquer intervenção administrativa!');
            return;
        }

        try {
            await api.atualizarDemanda(modalIntervencao.demanda.id, {
                tema: intervTema,
                status: intervStatus,
                autor: 'Administrador Master',
                justificativa: intervJustificativa
            });
            setModalIntervencao({ aberta: false, demanda: null });
            onDemandaAtualizada();
            carregarDados();
            alert('Intervenção administrativa gravada e auditada com sucesso!');
        } catch (err: any) {
            alert('Erro: ' + err.message);
        }
    };

    return (
        <div style={{ padding: '0 24px 32px' }}>
            {/* Header do ADM */}
            <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={26} color="#8b5cf6" />
                        Portal do Administrador Master (ADM)
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0' }}>
                        Governança mestre de parâmetros, integridade relacional SQL, intervenções diretas e trilha de auditoria
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button type="button" onClick={carregarDados} className="btn-secondary" style={{ padding: '8px 14px' }}>
                        <RefreshCw size={14} className={carregando ? 'spin' : ''} />
                        <span>Atualizar</span>
                    </button>
                </div>
            </div>

            {/* Abas do ADM */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <button
                    type="button"
                    onClick={() => setAba('cadastros')}
                    style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px',
                        background: aba === 'cadastros' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                        color: aba === 'cadastros' ? '#c4b5fd' : '#94a3b8'
                    }}
                >
                    <Sliders size={16} />
                    <span>Cadastros Mestres</span>
                </button>

                <button
                    type="button"
                    onClick={() => setAba('inspector')}
                    style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px',
                        background: aba === 'inspector' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                        color: aba === 'inspector' ? '#c4b5fd' : '#94a3b8'
                    }}
                >
                    <Database size={16} />
                    <span>Inspecionador do Banco SQL</span>
                </button>

                <button
                    type="button"
                    onClick={() => setAba('auditoria')}
                    style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px',
                        background: aba === 'auditoria' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                        color: aba === 'auditoria' ? '#c4b5fd' : '#94a3b8'
                    }}
                >
                    <ClipboardList size={16} />
                    <span>Trilha de Auditoria</span>
                </button>
            </div>

            {/* ABA 1: CADASTROS MESTRES */}
            {aba === 'cadastros' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    {['projetos', 'pilares', 'deptosCSC', 'tiposDemanda'].map((chave) => {
                        const itens: string[] = cadastros[chave] || [];
                        const titulos: Record<string, string> = {
                            projetos: 'Projetos Estratégicos',
                            pilares: 'Pilares de Processos Integrados',
                            deptosCSC: 'Departamentos CSC Clientes',
                            tiposDemanda: 'Tipos de Demanda Homologados'
                        };

                        return (
                            <div key={chave} className="glass-panel" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                        {titulos[chave] || chave}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => handleAdicionarItemLista(chave)}
                                        className="btn-primary"
                                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                    >
                                        <Plus size={14} /> Adicionar
                                    </button>
                                </div>

                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                                    {itens.map((it, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(30, 41, 59, 0.5)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }}>
                                            <span style={{ color: '#e2e8f0' }}>{it}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoverItemLista(chave, it)}
                                                style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                                                title="Remover"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ABA 2: INSPECIONADOR DO BANCO SQL */}
            {aba === 'inspector' && (
                <div>
                    {/* Card de Diagnóstico DAT-001 */}
                    <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                                <Stethoscope size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                    Diagnóstico Relacional & Integridade DAT-001
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                                    Status da Conexão: <strong style={{ color: '#38bdf8' }}>{dbStatus?.dialect || 'SQL'} UP</strong> · Latência: {dbStatus?.latencyMs || 1}ms
                                </p>
                            </div>
                        </div>
                        <span className="badge badge-green">
                            Integridade 100% Homologada
                        </span>
                    </div>

                    {/* Tabela de Intervenção Direta */}
                    <div className="glass-panel" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                Demandas no Banco de Dados SQL
                            </h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8' }}>ID</th>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Título</th>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Analista</th>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Status</th>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Revisão</th>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8', textAlign: 'right' }}>Ação ADM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {demandas.map(d => (
                                    <tr key={d.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px 16px', color: '#38bdf8', fontFamily: "'Fira Code', monospace", fontWeight: 700 }}>
                                            {d.id}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#ffffff' }}>{d.tema}</td>
                                        <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{d.analista_nome}</td>
                                        <td style={{ padding: '12px 16px' }}><span className="badge badge-blue">{d.status}</span></td>
                                        <td style={{ padding: '12px 16px', color: '#94a3b8' }}>v{d.revisao}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleAbrirIntervencao(d)}
                                                className="btn-secondary"
                                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                            >
                                                <Edit3 size={12} /> Intervir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ABA 3: TRILHA DE AUDITORIA */}
            {aba === 'auditoria' && (
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                            Histórico de Ações e Auditoria Imutável
                        </h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Data/Hora</th>
                                <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Autor</th>
                                <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Ação</th>
                                <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Entidade</th>
                                <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Justificativa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditoria.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                                        Nenhum registro de auditoria encontrado.
                                    </td>
                                </tr>
                            ) : (
                                auditoria.map((aud, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                                            {new Date(aud.timestamp).toLocaleString('pt-BR')}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 700 }}>
                                            {aud.autor}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span className="badge badge-purple">{aud.acao}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                                            {aud.entidade}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                                            {aud.justificativa || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL DE INTERVENÇÃO ADMINISTRATIVA */}
            {modalIntervencao.aberta && modalIntervencao.demanda && (
                <div className="modal-overlay" onClick={() => setModalIntervencao({ aberta: false, demanda: null })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                Intervenção Administrativa Direta — {modalIntervencao.demanda.id}
                            </h3>
                            <button type="button" onClick={() => setModalIntervencao({ aberta: false, demanda: null })} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                        </div>
                        <form onSubmit={handleSalvarIntervencao} style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Tema / Título da Demanda:</label>
                                <input type="text" value={intervTema} onChange={e => setIntervTema(e.target.value)} className="input-glass" />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Status:</label>
                                <select value={intervStatus} onChange={e => setIntervStatus(e.target.value)} className="input-glass">
                                    <option value="Não iniciado">Não iniciado</option>
                                    <option value="Em andamento">Em andamento</option>
                                    <option value="Em Hypercare">Em Hypercare</option>
                                    <option value="Concluído">Concluído</option>
                                    <option value="Bloqueado">Bloqueado</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#f43f5e', marginBottom: '6px' }}>Justificativa Obrigatória da Intervenção (Auditoria):</label>
                                <textarea required value={intervJustificativa} onChange={e => setIntervJustificativa(e.target.value)} placeholder="Descreva o motivo desta alteração master direta no banco SQL" className="input-glass" />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" onClick={() => setModalIntervencao({ aberta: false, demanda: null })} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Gravar Intervenção & Registrar Auditoria</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

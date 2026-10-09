import { useState } from 'react';
import type { Demanda, CriterioWorkflow } from '../types';
import { Plus, CheckCircle2, AlertTriangle, Eye, ShieldCheck, Search } from 'lucide-react';
import { api } from '../services/api';

interface SupervisorViewProps {
    demandas: Demanda[];
    onDemandaAtualizada: () => void;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({
    demandas,
    onDemandaAtualizada
}) => {
    const [modalNovaDemanda, setModalNovaDemanda] = useState(false);
    const [modalGates, setModalGates] = useState<{ aberta: boolean; demanda: Demanda | null; criterios: CriterioWorkflow[] }>({
        aberta: false,
        demanda: null,
        criterios: []
    });

    const [filtroAnalista, setFiltroAnalista] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [busca, setBusca] = useState('');

    // Formulário Nova Demanda
    const [novoAnalista, setNovoAnalista] = useState('Filipe Messias');
    const [novoPrefixo, setNovoPrefixo] = useState('FM');
    const [novoProjeto, setNovoProjeto] = useState('Lumen');
    const [novoPilar, setNovoPilar] = useState('Transformação Digital');
    const [novoDepto, setNovoDepto] = useState('Tributos Federais');
    const [novoTema, setNovoTema] = useState('');
    const [novaPrioridade, setNovaPrioridade] = useState('Alta');
    const [tempoAntes, setTempoAntes] = useState<number>(40);
    const [tempoDepois, setTempoDepois] = useState<number>(10);
    const [obsExecutiva, setObsExecutiva] = useState('');
    const [salvando, setSalvando] = useState(false);

    const handleCriarDemanda = async (e: React.FormEvent) => {
        e.preventDefault();
        setSalvando(true);
        try {
            await api.criarDemanda({
                analista_nome: novoAnalista,
                prefixo: novoPrefixo,
                projeto: novoProjeto,
                pilar: novoPilar,
                departamento_csc: novoDepto,
                tema: novoTema || `Melhoria ${novoProjeto}`,
                prioridade: novaPrioridade,
                tempo_antes: Number(tempoAntes),
                tempo_depois: Number(tempoDepois),
                observacao_executiva: obsExecutiva,
                autor: 'Supervisão SGPI'
            });
            setModalNovaDemanda(false);
            onDemandaAtualizada();
        } catch (err: any) {
            alert('Erro ao criar demanda: ' + err.message);
        } finally {
            setSalvando(false);
        }
    };

    const handleAbrirGates = async (dem: Demanda) => {
        try {
            const res = await api.getCriterios(dem.id);
            setModalGates({
                aberta: true,
                demanda: dem,
                criterios: res.criterios.filter(c => c.etapa === 1 || c.etapa === 2)
            });
        } catch (err: any) {
            alert('Erro ao carregar critérios: ' + err.message);
        }
    };

    const handleAtualizarCritGate = async (demandaId: string, codigo: string, status: string, evidencia: string) => {
        try {
            await api.atualizarCriterio(demandaId, codigo, {
                status,
                evidencia,
                autor: 'Supervisão PI'
            });
            // Recarrega critérios do modal
            const res = await api.getCriterios(demandaId);
            setModalGates(prev => ({
                ...prev,
                criterios: res.criterios.filter(c => c.etapa === 1 || c.etapa === 2)
            }));
            onDemandaAtualizada();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const demandasFiltradas = demandas.filter(d => {
        if (filtroAnalista && d.analista_nome !== filtroAnalista) return false;
        if (filtroStatus && d.status !== filtroStatus) return false;
        if (busca) {
            const b = busca.toLowerCase();
            return d.id.toLowerCase().includes(b) || (d.tema && d.tema.toLowerCase().includes(b)) || d.analista_nome.toLowerCase().includes(b);
        }
        return true;
    });

    return (
        <div style={{ padding: '0 24px 32px' }}>
            {/* Header da Supervisão */}
            <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldCheck size={26} color="#3b82f6" />
                        Comando e Governança da Carteira (Supervisão)
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0' }}>
                        Abertura oficial com auto-ID, priorização estratégica e validação dos 16 gates governados de E1 e E2
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setModalNovaDemanda(true)}
                    className="btn-primary"
                >
                    <Plus size={18} />
                    <span>Nova Demanda</span>
                </button>
            </div>

            {/* Barra de Filtros */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.7)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', flex: 1, minWidth: '240px' }}>
                    <Search size={16} color="#94a3b8" />
                    <input
                        type="search"
                        placeholder="Buscar por código (ex: FM-0001), tema ou analista..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', width: '100%', fontSize: '0.88rem' }}
                    />
                </div>

                <select
                    value={filtroAnalista}
                    onChange={(e) => setFiltroAnalista(e.target.value)}
                    className="input-glass"
                    style={{ width: 'auto', minWidth: '180px' }}
                >
                    <option value="">Todos os Analistas</option>
                    <option value="Filipe Messias">Filipe Messias</option>
                    <option value="José Victor">José Victor</option>
                    <option value="Viviane Lima">Viviane Lima</option>
                    <option value="Juliana Santos">Juliana Santos</option>
                </select>

                <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="input-glass"
                    style={{ width: 'auto', minWidth: '160px' }}
                >
                    <option value="">Todos os Status</option>
                    <option value="Não iniciado">Não iniciado</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Em Hypercare">Em Hypercare</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Bloqueado">Bloqueado</option>
                </select>
            </div>

            {/* Tabela de Demandas da Supervisão */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>ID / Código</th>
                            <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>Demanda / Tema</th>
                            <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>Analista Responsável</th>
                            <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>Projeto & Pilar</th>
                            <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>Status</th>
                            <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700 }}>Gates E1/E2</th>
                            <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {demandasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    Nenhuma demanda encontrada para os filtros selecionados.
                                </td>
                            </tr>
                        ) : (
                            demandasFiltradas.map(d => (
                                <tr key={d.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}>
                                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#38bdf8', fontFamily: "'Fira Code', monospace" }}>
                                        {d.id}
                                    </td>
                                    <td style={{ padding: '14px 18px', color: '#ffffff', fontWeight: 600 }}>
                                        {d.tema || 'Demanda sem título'}
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.departamento_csc} · {d.tipo_demanda || 'Melhoria'}</div>
                                    </td>
                                    <td style={{ padding: '14px 18px', color: '#e2e8f0' }}>
                                        {d.analista_nome}
                                    </td>
                                    <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                                        <strong>{d.projeto}</strong>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.pilar}</div>
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <span className={`badge ${d.status === 'Concluído' ? 'badge-green' : d.status === 'Bloqueado' ? 'badge-rose' : 'badge-blue'}`}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        {d.validado === 'Sim' ? (
                                            <span className="badge badge-green">
                                                <CheckCircle2 size={12} /> Validado (16/16)
                                            </span>
                                        ) : (
                                            <span className="badge badge-amber">
                                                <AlertTriangle size={12} /> Gates Pendentes
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleAbrirGates(d)}
                                            className="btn-secondary"
                                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                        >
                                            <Eye size={14} />
                                            <span>Gates E1/E2</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL: NOVA DEMANDA */}
            {modalNovaDemanda && (
                <div className="modal-overlay" onClick={() => setModalNovaDemanda(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                Abertura de Nova Demanda (Supervisão)
                            </h3>
                            <button type="button" onClick={() => setModalNovaDemanda(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                        </div>
                        <form onSubmit={handleCriarDemanda} style={{ padding: '24px', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Analista Atribuído:</label>
                                    <select
                                        value={novoAnalista}
                                        onChange={e => {
                                            setNovoAnalista(e.target.value);
                                            const map: Record<string, string> = { 'Filipe Messias': 'FM', 'José Victor': 'JV', 'Viviane Lima': 'VL', 'Juliana Santos': 'JS' };
                                            setNovoPrefixo(map[e.target.value] || 'XX');
                                        }}
                                        className="input-glass"
                                    >
                                        <option value="Filipe Messias">Filipe Messias (FM)</option>
                                        <option value="José Victor">José Victor (JV)</option>
                                        <option value="Viviane Lima">Viviane Lima (VL)</option>
                                        <option value="Juliana Santos">Juliana Santos (JS)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Prefixo Automático do ID:</label>
                                    <input type="text" value={novoPrefixo} readOnly className="input-glass" style={{ opacity: 0.7, fontFamily: "'Fira Code', monospace" }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Tema / Título da Demanda:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Conciliação Automática de Faturas Fiscais"
                                    value={novoTema}
                                    onChange={e => setNovoTema(e.target.value)}
                                    className="input-glass"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Projeto Relacionado:</label>
                                    <select value={novoProjeto} onChange={e => setNovoProjeto(e.target.value)} className="input-glass">
                                        <option value="Lumen">Lumen</option>
                                        <option value="V360">V360</option>
                                        <option value="Saneamento Base Contábil">Saneamento Base Contábil</option>
                                        <option value="Newsletter">Newsletter</option>
                                        <option value="Rotina Fiscal/Contábil">Rotina Fiscal/Contábil</option>
                                        <option value="Rotina Financeiro">Rotina Financeiro</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Pilar:</label>
                                    <select value={novoPilar} onChange={e => setNovoPilar(e.target.value)} className="input-glass">
                                        <option value="Transformação Digital">Transformação Digital</option>
                                        <option value="Melhoria Contínua">Melhoria Contínua</option>
                                        <option value="Governança">Governança</option>
                                        <option value="Business Intelligence">Business Intelligence</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Departamento CSC Atendido:</label>
                                    <select value={novoDepto} onChange={e => setNovoDepto(e.target.value)} className="input-glass">
                                        <option value="Tributos Federais">Tributos Federais</option>
                                        <option value="Recebimento Fiscal">Recebimento Fiscal</option>
                                        <option value="Contabilidade">Contabilidade</option>
                                        <option value="Tesouraria">Tesouraria</option>
                                        <option value="Contas a Receber">Contas a Receber</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Prioridade:</label>
                                    <select value={novaPrioridade} onChange={e => setNovaPrioridade(e.target.value)} className="input-glass">
                                        <option value="Crítica">Crítica</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Média">Média</option>
                                        <option value="Baixa">Baixa</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Tempo Antes (h/mês):</label>
                                    <input type="number" step="0.5" value={tempoAntes} onChange={e => setTempoAntes(Number(e.target.value))} className="input-glass" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Tempo Depois Estimado (h/mês):</label>
                                    <input type="number" step="0.5" value={tempoDepois} onChange={e => setTempoDepois(Number(e.target.value))} className="input-glass" />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>Observação Executiva da Supervisão:</label>
                                <textarea value={obsExecutiva} onChange={e => setObsExecutiva(e.target.value)} className="input-glass" placeholder="Direcionamento gerencial ou justificativa" />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" onClick={() => setModalNovaDemanda(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" disabled={salvando} className="btn-primary">
                                    {salvando ? 'Salvando no Banco...' : 'Criar Demanda & Gerar Gates'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: GATES E1 E E2 */}
            {modalGates.aberta && modalGates.demanda && (
                <div className="modal-overlay" onClick={() => setModalGates({ aberta: false, demanda: null, criterios: [] })}>
                    <div className="modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                    Gates de Governança E1 e E2 — {modalGates.demanda.id}
                                </h3>
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                    {modalGates.demanda.tema} · Analista: {modalGates.demanda.analista_nome}
                                </span>
                            </div>
                            <button type="button" onClick={() => setModalGates({ aberta: false, demanda: null, criterios: [] })} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.84rem', color: '#93c5fd' }}>
                                <strong>Regra de Negócio RN-003:</strong> A demanda só recebe o status <code>Validado = Sim</code> quando todos os 16 critérios de E1 e E2 estiverem concluídos e com a evidência descrita.
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {modalGates.criterios.map(crit => {
                                    return (
                                        <div key={crit.uid} style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div>
                                                    <span style={{ fontWeight: 800, color: '#38bdf8', fontFamily: "'Fira Code', monospace", marginRight: '8px' }}>
                                                        {crit.codigo}
                                                    </span>
                                                    <strong style={{ color: '#ffffff' }}>{crit.titulo}</strong>
                                                </div>
                                                <select
                                                    value={crit.status}
                                                    onChange={e => {
                                                        const newStatus = e.target.value;
                                                        const ev = prompt('Evidência documental obrigatória para este critério:', crit.evidencia || '');
                                                        if (ev !== null) {
                                                            handleAtualizarCritGate(modalGates.demanda!.id, crit.codigo, newStatus, ev);
                                                        }
                                                    }}
                                                    className="input-glass"
                                                    style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem' }}
                                                >
                                                    <option value="⏳ Pendente">⏳ Pendente</option>
                                                    <option value="🔄 Em andamento">🔄 Em andamento</option>
                                                    <option value="✔ Concluído">✔ Concluído</option>
                                                    <option value="⛔ Bloqueado">⛔ Bloqueado</option>
                                                </select>
                                            </div>

                                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                <strong>Evidência:</strong> {crit.evidencia || <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Nenhuma evidência anexada</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setModalGates({ aberta: false, demanda: null, criterios: [] })} className="btn-secondary">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

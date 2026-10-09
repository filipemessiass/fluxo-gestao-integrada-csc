import { useState } from 'react';
import type { Demanda, CriterioWorkflow } from '../types';
import { Clock, FileText, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

interface AnalystViewProps {
    analistaAtivo: string;
    demandas: Demanda[];
    onDemandaAtualizada: () => void;
}

export const AnalystView: React.FC<AnalystViewProps> = ({
    analistaAtivo,
    demandas,
    onDemandaAtualizada
}) => {
    const [modalDetalhe, setModalDetalhe] = useState<{ aberta: boolean; demanda: Demanda | null; criterios: CriterioWorkflow[] }>({
        aberta: false,
        demanda: null,
        criterios: []
    });

    const [horasReais, setHorasReais] = useState<number>(0);
    const [tempoDepois, setTempoDepois] = useState<number>(0);
    const [pendencias, setPendencias] = useState('');
    const [salvando, setSalvando] = useState(false);

    const minhasDemandas = demandas.filter(d => d.analista_nome === analistaAtivo);

    const handleAbrirDetalhe = async (dem: Demanda) => {
        try {
            const res = await api.getCriterios(dem.id);
            setHorasReais(dem.horas_reais || 0);
            setTempoDepois(dem.tempo_depois || 0);
            setPendencias(dem.pendencias || '');
            setModalDetalhe({
                aberta: true,
                demanda: dem,
                criterios: res.criterios.filter(c => c.etapa >= 3)
            });
        } catch (err: any) {
            alert('Erro ao carregar critérios: ' + err.message);
        }
    };

    const handleAtualizarCriterio = async (codigo: string, novoStatus: string) => {
        if (!modalDetalhe.demanda) return;
        const ev = prompt(`Informe a evidência do marco ${codigo}:`, '');
        if (ev === null) return;
        if (novoStatus.includes('Concluído') && !ev.trim()) {
            alert('A conclusão exige uma evidência descrita!');
            return;
        }

        try {
            await api.atualizarCriterio(modalDetalhe.demanda.id, codigo, {
                status: novoStatus,
                evidencia: ev,
                autor: analistaAtivo
            });

            // Se for marco de entrega (E7.1 ou E8.1), dispara confete comemorativo!
            if (codigo.startsWith('E7') || codigo.startsWith('E8')) {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            const res = await api.getCriterios(modalDetalhe.demanda.id);
            setModalDetalhe(prev => ({
                ...prev,
                criterios: res.criterios.filter(c => c.etapa >= 3)
            }));
            onDemandaAtualizada();
        } catch (err: any) {
            alert('Erro: ' + err.message);
        }
    };

    const handleSalvarApontamento = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalDetalhe.demanda) return;
        setSalvando(true);
        try {
            await api.atualizarDemanda(modalDetalhe.demanda.id, {
                horas_reais: Number(horasReais),
                tempo_depois: Number(tempoDepois),
                pendencias: pendencias,
                autor: analistaAtivo
            });
            onDemandaAtualizada();
            alert('Apontamento operacional salvo com sucesso!');
        } catch (err: any) {
            alert('Erro ao salvar apontamento: ' + err.message);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div style={{ padding: '0 24px 32px' }}>
            {/* Header do Analista */}
            <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles size={26} color="#10b981" />
                        Bancada de Trabalho Operacional · {analistaAtivo}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0' }}>
                        Execução técnica das etapas E3 a E8, registro de evidências e medição de produtividade antes × depois
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>
                        {minhasDemandas.length} demandas sob sua responsabilidade
                    </div>
                </div>
            </div>

            {/* Grid de Demandas do Analista */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {minhasDemandas.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>
                        Nenhuma demanda atribuída a {analistaAtivo} no momento.
                    </div>
                ) : (
                    minhasDemandas.map(dem => (
                        <div key={dem.uid} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38bdf8', fontFamily: "'Fira Code', monospace" }}>
                                        {dem.id}
                                    </span>
                                    <span className={`badge ${dem.status === 'Concluído' ? 'badge-green' : 'badge-blue'}`}>
                                        {dem.status}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                                    {dem.tema || 'Demanda ' + dem.id}
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px' }}>
                                    {dem.projeto} · {dem.pilar} · {dem.departamento_csc}
                                </p>

                                {/* Indicadores de Esforço */}
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <div>
                                        <span style={{ color: '#64748b', display: 'block' }}>Antes</span>
                                        <strong style={{ color: '#ffffff' }}>{dem.tempo_antes} h/mês</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', display: 'block' }}>Depois</span>
                                        <strong style={{ color: '#ffffff' }}>{dem.tempo_depois} h/mês</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#34d399', display: 'block' }}>Ganho Mensal</span>
                                        <strong style={{ color: '#34d399' }}>+{dem.ganho_mensal} h</strong>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleAbrirDetalhe(dem)}
                                className="btn-success"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                <FileText size={16} />
                                <span>Gerenciar Evidências & Etapas E3–E8</span>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL: DETALHE OPERACIONAL E EVIDÊNCIAS (E3 A E8) */}
            {modalDetalhe.aberta && modalDetalhe.demanda && (
                <div className="modal-overlay" onClick={() => setModalDetalhe({ aberta: false, demanda: null, criterios: [] })}>
                    <div className="modal-content" style={{ maxWidth: '840px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                    Execução Técnica & Evidências — {modalDetalhe.demanda.id}
                                </h3>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                    {modalDetalhe.demanda.tema} · Projeto: {modalDetalhe.demanda.projeto}
                                </span>
                            </div>
                            <button type="button" onClick={() => setModalDetalhe({ aberta: false, demanda: null, criterios: [] })} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            {/* Formulário de Apontamento de Esforço */}
                            <form onSubmit={handleSalvarApontamento} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} /> Apontamento de Horas e Medição Real
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '14px', marginBottom: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>Horas Reais Trabalhadas:</label>
                                        <input type="number" step="0.5" value={horasReais} onChange={e => setHorasReais(Number(e.target.value))} className="input-glass" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>Tempo Depois (h/mês):</label>
                                        <input type="number" step="0.5" value={tempoDepois} onChange={e => setTempoDepois(Number(e.target.value))} className="input-glass" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>Pendências / Observações:</label>
                                        <input type="text" value={pendencias} onChange={e => setPendencias(e.target.value)} placeholder="Ex: Em aguardo do usuário..." className="input-glass" />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" disabled={salvando} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                                        {salvando ? 'Salvando...' : 'Salvar Apontamento'}
                                    </button>
                                </div>
                            </form>

                            {/* Critérios E3 a E8 */}
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
                                Marcos de Entrega e Critérios de Qualidade (E3 a E8)
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {modalDetalhe.criterios.length === 0 ? (
                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Nenhum critério E3–E8 cadastrado para esta demanda.</div>
                                ) : (
                                    modalDetalhe.criterios.map(crit => (
                                        <div key={crit.uid} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div>
                                                    <span style={{ fontWeight: 800, color: '#34d399', fontFamily: "'Fira Code', monospace", marginRight: '8px' }}>
                                                        {crit.codigo}
                                                    </span>
                                                    <strong style={{ color: '#ffffff' }}>{crit.titulo}</strong>
                                                </div>
                                                <select
                                                    value={crit.status}
                                                    onChange={e => handleAtualizarCriterio(crit.codigo, e.target.value)}
                                                    className="input-glass"
                                                    style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem' }}
                                                >
                                                    <option value="⏳ Pendente">⏳ Pendente</option>
                                                    <option value="🔄 Em andamento">🔄 Em andamento</option>
                                                    <option value="✔ Concluído">✔ Concluído</option>
                                                    <option value="⛔ Bloqueado">⛔ Bloqueado</option>
                                                </select>
                                            </div>

                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                <strong>Evidência:</strong> {crit.evidencia || <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Pendente de evidência</span>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setModalDetalhe({ aberta: false, demanda: null, criterios: [] })} className="btn-secondary">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

import { Sparkles } from 'lucide-react';

interface StageInfo {
    etapa: number;
    codigo: string;
    nome: string;
    responsavel: 'Supervisão' | 'Analista';
    isGate?: boolean;
}

const ETAPAS: StageInfo[] = [
    { etapa: 1, codigo: 'E1', nome: 'Solicitação', responsavel: 'Supervisão' },
    { etapa: 2, codigo: 'E2', nome: 'Triagem', responsavel: 'Supervisão' },
    { etapa: 3, codigo: 'E3', nome: 'Levantamento', responsavel: 'Analista', isGate: true },
    { etapa: 4, codigo: 'E4', nome: 'Execução', responsavel: 'Analista' },
    { etapa: 5, codigo: 'E5', nome: 'Validação', responsavel: 'Analista', isGate: true },
    { etapa: 6, codigo: 'E6', nome: 'Ajustes', responsavel: 'Analista' },
    { etapa: 7, codigo: 'E7', nome: 'Entrega', responsavel: 'Analista' },
    { etapa: 8, codigo: 'E8', nome: 'Hypercare', responsavel: 'Analista' }
];

interface PipelineStageTrackerProps {
    etapaSelecionada: number | null;
    onSelecionarEtapa: (etapa: number | null) => void;
    totalPorEtapa?: Record<number, number>;
}

export const PipelineStageTracker: React.FC<PipelineStageTrackerProps> = ({
    etapaSelecionada,
    onSelecionarEtapa,
    totalPorEtapa = {}
}) => {
    return (
        <div className="glass-panel" style={{ margin: '0 24px 24px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                            Esteira Industrial de Serviços (E1 a E8)
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                            Controle de maturidade operacional por gates de qualidade e governança contínua
                        </p>
                    </div>
                </div>

                {etapaSelecionada && (
                    <button
                        type="button"
                        onClick={() => onSelecionarEtapa(null)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                        Limpar Filtro de Etapa
                    </button>
                )}
            </div>

            {/* Pipeline Horizontal Interativo */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                alignItems: 'center'
            }}>
                {ETAPAS.map((et) => {
                    const isSelected = etapaSelecionada === et.etapa;
                    const qtd = totalPorEtapa[et.etapa] || 0;
                    const isSupervisor = et.responsavel === 'Supervisão';

                    return (
                        <div
                            key={et.codigo}
                            onClick={() => onSelecionarEtapa(isSelected ? null : et.etapa)}
                            style={{
                                background: isSelected
                                    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(139, 92, 246, 0.3))'
                                    : 'rgba(30, 41, 59, 0.4)',
                                border: isSelected ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.3)' : 'none',
                                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                            }}
                        >
                            {/* Linha colorida do topo */}
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, height: '3px',
                                background: isSupervisor
                                    ? 'linear-gradient(90deg, #2563eb, #3b82f6)'
                                    : 'linear-gradient(90deg, #10b981, #059669)'
                            }} />

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{
                                    fontSize: '0.85rem', fontWeight: 900,
                                    color: isSupervisor ? '#60a5fa' : '#34d399',
                                    fontFamily: "'Fira Code', monospace"
                                }}>
                                    {et.codigo}
                                </span>
                                {et.isGate && (
                                    <span title="Gate de Governança Obrigatório" style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                                        GATE
                                    </span>
                                )}
                            </div>

                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {et.nome}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                    {et.responsavel}
                                </span>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 800,
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff', padding: '1px 7px', borderRadius: '10px'
                                }}>
                                    {qtd}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

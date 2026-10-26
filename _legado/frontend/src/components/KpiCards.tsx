import React from 'react';
import type { Kpis } from '../types';
import { TrendingUp, CheckCircle2, Clock, Zap, User } from 'lucide-react';

interface KpiCardsProps {
    kpis: Kpis | null;
    analistaNome?: string;
    isAnalista?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis, analistaNome, isAnalista }) => {
    const analistaStat = isAnalista && analistaNome
        ? kpis?.porAnalista?.find(a => a.analista_nome.toLowerCase().includes(analistaNome.toLowerCase()))
        : null;

    const cards = isAnalista && analistaStat ? [
        {
            titulo: 'Minhas Demandas Atribuídas',
            valor: analistaStat.qtd,
            subtitulo: `Demandas sob responsabilidade de ${analistaNome}`,
            icone: <User size={24} color="#34d399" />,
            glow: 'rgba(16, 185, 129, 0.2)',
            corBorda: 'rgba(16, 185, 129, 0.3)'
        },
        {
            titulo: 'Meu Ganho Operacional Gerado',
            valor: `${analistaStat.ganho_total} h/mês`,
            subtitulo: 'Horas mensais economizadas com suas entregas',
            icone: <Zap size={24} color="#a78bfa" />,
            glow: 'rgba(139, 92, 246, 0.2)',
            corBorda: 'rgba(139, 92, 246, 0.3)'
        },
        {
            titulo: 'Redução Média de Esforço',
            valor: kpis ? `${kpis.reducaoMedia}%` : '—',
            subtitulo: 'Eficiência antes × depois em produção',
            icone: <TrendingUp size={24} color="#fbbf24" />,
            glow: 'rgba(245, 158, 11, 0.2)',
            corBorda: 'rgba(245, 158, 11, 0.3)'
        },
        {
            titulo: 'Conclusão Global da Equipe',
            valor: kpis ? `${kpis.taxaConclusao}%` : '—',
            subtitulo: `${kpis?.concluidas || 0} de ${kpis?.totalDemandas || 0} demandas concluídas`,
            icone: <CheckCircle2 size={24} color="#60a5fa" />,
            glow: 'rgba(59, 130, 246, 0.2)',
            corBorda: 'rgba(59, 130, 246, 0.3)'
        }
    ] : [
        {
            titulo: 'Total de Demandas da Carteira',
            valor: kpis ? kpis.totalDemandas : '—',
            subtitulo: `${kpis?.concluidas || 0} concluídas · ${kpis?.emAndamento || 0} em curso`,
            icone: <Clock size={24} color="#60a5fa" />,
            glow: 'rgba(59, 130, 246, 0.2)',
            corBorda: 'rgba(59, 130, 246, 0.3)'
        },
        {
            titulo: 'Taxa de Conclusão Global',
            valor: kpis ? `${kpis.taxaConclusao}%` : '—',
            subtitulo: `${kpis?.validadas || 0} demandas com gates E1/E2 validados`,
            icone: <CheckCircle2 size={24} color="#34d399" />,
            glow: 'rgba(16, 185, 129, 0.2)',
            corBorda: 'rgba(16, 185, 129, 0.3)'
        },
        {
            titulo: 'Ganho Operacional Total',
            valor: kpis ? `${kpis.ganhoMensalTotal} h/mês` : '—',
            subtitulo: 'Esforço repetitivo eliminado por automações',
            icone: <Zap size={24} color="#a78bfa" />,
            glow: 'rgba(139, 92, 246, 0.2)',
            corBorda: 'rgba(139, 92, 246, 0.3)'
        },
        {
            titulo: 'Redução Média de Esforço',
            valor: kpis ? `${kpis.reducaoMedia}%` : '—',
            subtitulo: 'Medição antes × depois em produção',
            icone: <TrendingUp size={24} color="#fbbf24" />,
            glow: 'rgba(245, 158, 11, 0.2)',
            corBorda: 'rgba(245, 158, 11, 0.3)'
        }
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            margin: '0 24px 24px'
        }}>
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className="glass-card"
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        borderColor: card.corBorda,
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '80px',
                        height: '80px',
                        background: `radial-gradient(circle, ${card.glow} 0%, transparent 70%)`,
                        pointerEvents: 'none'
                    }} />

                    <div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>
                            {card.titulo}
                        </span>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', margin: '4px 0 2px' }}>
                            {card.valor}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {card.subtitulo}
                        </span>
                    </div>

                    <div style={{
                        padding: '10px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                        {card.icone}
                    </div>
                </div>
            ))}
        </div>
    );
};

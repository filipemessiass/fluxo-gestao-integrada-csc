import React from 'react';
import type { PapelUsuario, Usuario } from '../types';
import { Shield, UserCheck, Laptop, Database, LogOut } from 'lucide-react';

interface NavbarProps {
    usuarioLogado: Usuario;
    onLogout: () => void;
    papelAtivo: PapelUsuario;
    onTrocarPapel: (papel: PapelUsuario) => void;
    analistaSelecionado: string;
    onTrocarAnalista: (analista: string) => void;
    dbStatus: { status: string; dialect: string; latencyMs: number } | null;
}

export const Navbar: React.FC<NavbarProps> = ({
    usuarioLogado,
    onLogout,
    papelAtivo,
    onTrocarPapel,
    analistaSelecionado,
    onTrocarAnalista,
    dbStatus
}) => {
    const isAnalista = usuarioLogado.papel === 'ANALISTA';
    const isSupervisor = usuarioLogado.papel === 'SUPERVISOR';
    const isAdmin = usuarioLogado.papel === 'ADMIN';

    const getIniciais = (nome: string, prefixo?: string) => {
        if (prefixo) return prefixo;
        const partes = nome.split(' ');
        if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
        return nome.substring(0, 2).toUpperCase();
    };

    return (
        <header className="glass-panel" style={{
            margin: '16px 24px',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
        }}>
            {/* Brand Logo & Contexto */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)'
                }}>
                    <Database size={22} color="#ffffff" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#ffffff' }}>
                        SGPI <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', marginLeft: '6px' }}>v3.0 SQL</span>
                    </h1>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                        {isAnalista ? 'Bancada Individualizada de Operação' : isSupervisor ? 'Comando & Governança da Supervisão' : 'Console Master de Gestão (ADM)'}
                    </span>
                </div>
            </div>

            {/* Status do Banco SQL e Nuvem AWS */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(0,0,0,0.3)',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.06)'
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: dbStatus?.status === 'UP' ? '#10b981' : '#ef4444',
                    boxShadow: dbStatus?.status === 'UP' ? '0 0 8px #10b981' : 'none'
                }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1' }}>
                    SQL: <strong style={{ color: '#38bdf8' }}>{dbStatus?.dialect || 'LOCAL'}</strong>
                    {dbStatus ? ` (${dbStatus.latencyMs}ms)` : ''}
                </span>
                <span style={{
                    fontSize: '0.72rem',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontWeight: 700
                }}>
                    AWS Ready
                </span>
            </div>

            {/* Seletor Master: Apenas para Administrador (Poder de Ponte) */}
            {isAdmin && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    padding: '4px',
                    borderRadius: '14px',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c084fc', padding: '0 8px', textTransform: 'uppercase' }}>
                        Ponte ADM:
                    </span>
                    <button
                        type="button"
                        onClick={() => onTrocarPapel('ADMIN')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px', border: 'none',
                            cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                            background: papelAtivo === 'ADMIN' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'transparent',
                            color: papelAtivo === 'ADMIN' ? '#ffffff' : '#94a3b8'
                        }}
                    >
                        <Shield size={14} /> Console ADM
                    </button>
                    <button
                        type="button"
                        onClick={() => onTrocarPapel('SUPERVISOR')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px', border: 'none',
                            cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                            background: papelAtivo === 'SUPERVISOR' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                            color: papelAtivo === 'SUPERVISOR' ? '#ffffff' : '#94a3b8'
                        }}
                    >
                        <UserCheck size={14} /> Supervisão
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                            type="button"
                            onClick={() => onTrocarPapel('ANALISTA')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '8px', border: 'none',
                                cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                                background: papelAtivo === 'ANALISTA' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                                color: papelAtivo === 'ANALISTA' ? '#ffffff' : '#94a3b8'
                            }}
                        >
                            <Laptop size={14} /> Analista
                        </button>
                        {papelAtivo === 'ANALISTA' && (
                            <select
                                value={analistaSelecionado}
                                onChange={(e) => onTrocarAnalista(e.target.value)}
                                style={{
                                    background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, outline: 'none'
                                }}
                            >
                                <option value="Filipe Messias">FM</option>
                                <option value="José Victor">JV</option>
                                <option value="Viviane Lima">VL</option>
                                <option value="Juliana Santos">JS</option>
                            </select>
                        )}
                    </div>
                </div>
            )}

            {/* Painel do Usuário Logado & Botão Sair */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Avatar do Usuário */}
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: isAnalista ? 'rgba(16, 185, 129, 0.2)' : isSupervisor ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        border: `1px solid ${isAnalista ? 'rgba(16, 185, 129, 0.4)' : isSupervisor ? 'rgba(59, 130, 246, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: isAnalista ? '#34d399' : isSupervisor ? '#60a5fa' : '#fbbf24'
                    }}>
                        {getIniciais(usuarioLogado.nome, usuarioLogado.prefixo)}
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                                {usuarioLogado.nome}
                            </strong>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isAnalista ? '#34d399' : isSupervisor ? '#60a5fa' : '#fbbf24', fontWeight: 700 }}>
                            {isAnalista ? `Analista Individual (${usuarioLogado.prefixo || 'OP'})` : isSupervisor ? 'Liderança CSC' : 'Administrador Master'}
                        </div>
                    </div>
                </div>

                {/* Botão de Logout */}
                <button
                    type="button"
                    onClick={onLogout}
                    title="Encerrar sessão e voltar ao Login"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#fca5a5',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                        e.currentTarget.style.color = '#fca5a5';
                    }}
                >
                    <LogOut size={14} />
                    <span>Sair</span>
                </button>
            </div>
        </header>
    );
};

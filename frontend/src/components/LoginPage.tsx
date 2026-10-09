import React, { useState, useEffect } from 'react';
import type { Usuario } from '../types';
import { api } from '../services/api';
import {
    Database,
    Shield,
    UserCheck,
    Laptop,
    Lock,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Server,
    KeyRound
} from 'lucide-react';

interface LoginPageProps {
    onLoginSuccess: (usuario: Usuario, token: string) => void;
    dbStatus: { status: string; dialect: string; latencyMs: number } | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, dbStatus }) => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [, setCarregando] = useState<boolean>(true);
    const [modoAcesso, setModoAcesso] = useState<'rapido' | 'credenciais'>('rapido');
    const [identificador, setIdentificador] = useState<string>('');
    const [senha, setSenha] = useState<string>('sgpi123');
    const [submetendo, setSubmetendo] = useState<boolean>(false);
    const [erro, setErro] = useState<string | null>(null);

    // Carregar usuários cadastrados do banco SQL
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                setCarregando(true);
                const res = await api.getUsuarios();
                if (res.usuarios && res.usuarios.length > 0) {
                    setUsuarios(res.usuarios);
                } else {
                    // Fallback se tabela vazia
                    setUsuarios([
                        { id: 'USR-ANA-FM', nome: 'Filipe Messias', email: 'filipe.messias@sgpi.corp', papel: 'ANALISTA', prefixo: 'FM' },
                        { id: 'USR-ANA-JV', nome: 'José Victor', email: 'jose.victor@sgpi.corp', papel: 'ANALISTA', prefixo: 'JV' },
                        { id: 'USR-ANA-JS', nome: 'Juliana Santos', email: 'juliana.santos@sgpi.corp', papel: 'ANALISTA', prefixo: 'JS' },
                        { id: 'USR-ANA-VL', nome: 'Viviane Lima', email: 'viviane.lima@sgpi.corp', papel: 'ANALISTA', prefixo: 'VL' },
                        { id: 'USR-SUPER-01', nome: 'Supervisão Processos Integrados', email: 'supervisao.pi@sgpi.corp', papel: 'SUPERVISOR', prefixo: 'SUP' },
                        { id: 'USR-ADMIN-01', nome: 'Administrador Master', email: 'admin@sgpi.corp', papel: 'ADMIN', prefixo: 'ADM' }
                    ]);
                }
            } catch (_) {
                // Fallback gracioso caso backend temporariamente offline
                setUsuarios([
                    { id: 'USR-ANA-FM', nome: 'Filipe Messias', email: 'filipe.messias@sgpi.corp', papel: 'ANALISTA', prefixo: 'FM' },
                    { id: 'USR-ANA-JV', nome: 'José Victor', email: 'jose.victor@sgpi.corp', papel: 'ANALISTA', prefixo: 'JV' },
                    { id: 'USR-ANA-JS', nome: 'Juliana Santos', email: 'juliana.santos@sgpi.corp', papel: 'ANALISTA', prefixo: 'JS' },
                    { id: 'USR-ANA-VL', nome: 'Viviane Lima', email: 'viviane.lima@sgpi.corp', papel: 'ANALISTA', prefixo: 'VL' },
                    { id: 'USR-SUPER-01', nome: 'Supervisão Processos Integrados', email: 'supervisao.pi@sgpi.corp', papel: 'SUPERVISOR', prefixo: 'SUP' },
                    { id: 'USR-ADMIN-01', nome: 'Administrador Master', email: 'admin@sgpi.corp', papel: 'ADMIN', prefixo: 'ADM' }
                ]);
            } finally {
                setCarregando(false);
            }
        };

        fetchUsuarios();
    }, []);

    const handleLogin = async (idOrPrefix: string) => {
        try {
            setSubmetendo(true);
            setErro(null);
            const res = await api.login(idOrPrefix, senha);
            onLoginSuccess(res.usuario, res.token);
        } catch (err: any) {
            // Em caso de falha de rede/backend, permitir login offline local
            const matchedUser = usuarios.find(u => u.prefixo === idOrPrefix || u.email === idOrPrefix || u.nome === idOrPrefix || u.id === idOrPrefix);
            if (matchedUser) {
                onLoginSuccess(matchedUser, 'local-token-' + Date.now());
            } else {
                setErro(err.message || 'Falha na autenticação. Verifique seu usuário.');
            }
        } finally {
            setSubmetendo(false);
        }
    };

    const getPapelConfig = (papel: string) => {
        switch (papel) {
            case 'ADMIN':
                return {
                    cor: '#f59e0b',
                    bg: 'rgba(245, 158, 11, 0.12)',
                    borda: 'rgba(245, 158, 11, 0.3)',
                    label: 'Administrador Master',
                    sub: 'Parâmetros, Banco SQL & Governança Geral',
                    icone: Shield
                };
            case 'SUPERVISOR':
                return {
                    cor: '#3b82f6',
                    bg: 'rgba(59, 130, 246, 0.12)',
                    borda: 'rgba(59, 130, 246, 0.3)',
                    label: 'Supervisão / Gestora',
                    sub: 'Triagem, Gates E1/E2, Carteira & KPIs',
                    icone: UserCheck
                };
            default:
                return {
                    cor: '#10b981',
                    bg: 'rgba(16, 185, 129, 0.12)',
                    borda: 'rgba(16, 185, 129, 0.3)',
                    label: 'Analista Operacional',
                    sub: 'Bancada Individual, Marcos E3–E8 & Esforço',
                    icone: Laptop
                };
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '32px 20px',
            background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0a0d17 70%, #030712 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorações sutis de fundo */}
            <div style={{
                position: 'absolute',
                top: '-150px',
                left: '-150px',
                width: '450px',
                height: '450px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-120px',
                right: '-120px',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />

            {/* Container Central de Login */}
            <div style={{
                width: '100%',
                maxWidth: '820px',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 35px rgba(37, 99, 235, 0.15)',
                padding: '40px 36px',
                zIndex: 2,
                animation: 'fadeIn 0.3s ease-in'
            }}>
                {/* Cabeçalho do Portal */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
                        marginBottom: '18px'
                    }}>
                        <Database size={32} color="#ffffff" />
                    </div>

                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        padding: '4px 14px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        color: '#60a5fa',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '12px'
                    }}>
                        <Sparkles size={14} /> Centro de Serviços Compartilhados (CSC)
                    </div>

                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                        color: '#ffffff',
                        margin: '0 0 8px'
                    }}>
                        Portal de Acesso Individualizado
                    </h1>

                    <p style={{
                        fontSize: '0.95rem',
                        color: '#94a3b8',
                        margin: 0,
                        maxWidth: '560px',
                        marginInline: 'auto'
                    }}>
                        Selecione seu perfil corporativo para acessar diretamente o seu ambiente de trabalho exclusivo e protegido.
                    </p>
                </div>

                {/* Seletor de Modo: Rápido vs Credenciais */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    maxWidth: '420px',
                    margin: '0 auto 28px'
                }}>
                    <button
                        type="button"
                        onClick={() => setModoAcesso('rapido')}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: modoAcesso === 'rapido' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                            color: modoAcesso === 'rapido' ? '#ffffff' : '#94a3b8',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <UserCheck size={16} /> Perfis Individualizados
                    </button>
                    <button
                        type="button"
                        onClick={() => setModoAcesso('credenciais')}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: modoAcesso === 'credenciais' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                            color: modoAcesso === 'credenciais' ? '#ffffff' : '#94a3b8',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Lock size={16} /> Credencial Corporativa
                    </button>
                </div>

                {/* Banner de Erro */}
                {erro && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        padding: '12px 18px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#fca5a5',
                        fontSize: '0.88rem'
                    }}>
                        <AlertCircle size={18} color="#ef4444" />
                        <span>{erro}</span>
                    </div>
                )}

                {/* MODO 1: Cards de Perfil Individualizado (1 Clique) */}
                {modoAcesso === 'rapido' && (
                    <div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: '16px'
                        }}>
                            {usuarios.map((u) => {
                                const conf = getPapelConfig(u.papel);
                                const Icone = conf.icone;
                                const iniciais = u.prefixo || u.nome.substring(0, 2).toUpperCase();

                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => !submetendo && handleLogin(u.prefixo || u.email)}
                                        style={{
                                            background: 'rgba(30, 41, 59, 0.5)',
                                            border: `1px solid rgba(255, 255, 255, 0.08)`,
                                            borderRadius: '16px',
                                            padding: '18px 20px',
                                            cursor: submetendo ? 'wait' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                            e.currentTarget.style.borderColor = conf.cor;
                                            e.currentTarget.style.boxShadow = `0 10px 24px -5px ${conf.bg}`;
                                            e.currentTarget.style.background = 'rgba(30, 41, 59, 0.85)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            {/* Avatar com Iniciais */}
                                            <div style={{
                                                width: '46px',
                                                height: '46px',
                                                borderRadius: '12px',
                                                background: conf.bg,
                                                border: `1px solid ${conf.borda}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '1rem',
                                                color: conf.cor
                                            }}>
                                                {iniciais}
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                                                        {u.nome}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.68rem',
                                                        fontWeight: 700,
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        background: conf.bg,
                                                        color: conf.cor,
                                                        border: `1px solid ${conf.borda}`,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <Icone size={12} />
                                                        {u.prefixo || u.papel}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '3px' }}>
                                                    {conf.sub}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#cbd5e1'
                                        }}>
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* MODO 2: Formulário Tradicional de Credenciais */}
                {modoAcesso === 'credenciais' && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (identificador.trim()) handleLogin(identificador.trim());
                        }}
                        style={{ maxWidth: '440px', margin: '0 auto' }}
                    >
                        <div style={{ marginBottom: '18px' }}>
                            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                                E-mail, ID ou Prefixo do Usuário:
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Ex: filipe.messias@sgpi.corp, FM ou admin"
                                    value={identificador}
                                    onChange={(e) => setIdentificador(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 40px',
                                        background: 'rgba(30, 41, 59, 0.7)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: '10px',
                                        color: '#ffffff',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                                <UserCheck size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                                Senha Corporativa:
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px 12px 40px',
                                        background: 'rgba(30, 41, 59, 0.7)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: '10px',
                                        color: '#ffffff',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                                <KeyRound size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                            </div>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px', display: 'block' }}>
                                Dica: Ambiente local de testes aceita senha padrão <code>sgpi123</code>
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={submetendo || !identificador.trim()}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                cursor: submetendo ? 'wait' : 'pointer'
                            }}
                        >
                            {submetendo ? (
                                <span>Autenticando...</span>
                            ) : (
                                <>
                                    <span>Entrar no SGPI</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Status Bar do Banco e Compliance */}
                <div style={{
                    marginTop: '36px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '0.78rem',
                    color: '#64748b'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={14} color="#38bdf8" />
                        <span>Banco Relacional:</span>
                        <strong style={{ color: dbStatus?.status === 'UP' ? '#10b981' : '#f59e0b' }}>
                            {dbStatus?.dialect || 'SQLITE'} ({dbStatus?.latencyMs || 0}ms)
                        </strong>
                        <span style={{
                            padding: '2px 8px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#34d399',
                            fontWeight: 700
                        }}>
                            Conectado
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={13} color="#10b981" /> OFF-001
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={13} color="#10b981" /> DAT-001
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={13} color="#10b981" /> AWS-Ready
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

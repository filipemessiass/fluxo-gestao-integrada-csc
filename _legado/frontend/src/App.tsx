import React, { useState, useEffect } from 'react';
import type { PapelUsuario, Demanda, Kpis, Usuario } from './types';
import { api } from './services/api';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { KpiCards } from './components/KpiCards';
import { PipelineStageTracker } from './components/PipelineStageTracker';
import { SupervisorView } from './components/SupervisorView';
import { AnalystView } from './components/AnalystView';
import { AdminView } from './components/AdminView';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
    // Estado de Autenticação / Sessão Individualizada
    const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(() => {
        try {
            const salvo = localStorage.getItem('sgpi_auth_user');
            return salvo ? JSON.parse(salvo) : null;
        } catch (_) {
            return null;
        }
    });

    const [papelAtivo, setPapelAtivo] = useState<PapelUsuario>(() => {
        try {
            const salvo = localStorage.getItem('sgpi_auth_user');
            if (salvo) {
                const u: Usuario = JSON.parse(salvo);
                return u.papel;
            }
        } catch (_) {}
        return 'SUPERVISOR';
    });

    const [analistaSelecionado, setAnalistaSelecionado] = useState<string>(() => {
        try {
            const salvo = localStorage.getItem('sgpi_auth_user');
            if (salvo) {
                const u: Usuario = JSON.parse(salvo);
                if (u.papel === 'ANALISTA') return u.nome;
            }
        } catch (_) {}
        return 'Filipe Messias';
    });

    const [demandas, setDemandas] = useState<Demanda[]>([]);
    const [kpis, setKpis] = useState<Kpis | null>(null);
    const [dbStatus, setDbStatus] = useState<{ status: string; dialect: string; latencyMs: number } | null>(null);
    const [etapaFiltro, setEtapaFiltro] = useState<number | null>(null);
    const [, setCarregando] = useState<boolean>(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregarTudo = async () => {
        try {
            setCarregando(true);
            setErro(null);

            const [healthRes, kpisRes, demRes] = await Promise.all([
                api.checkHealth().catch(() => ({ status: 'DOWN', banco: { dialect: 'SQLITE', status: 'DOWN', latencyMs: 0 } })),
                api.getKpis().catch(() => null),
                api.getDemandas().catch(() => ({ demandas: [], total: 0 }))
            ]);

            setDbStatus(healthRes.banco);
            setKpis(kpisRes);
            setDemandas(demRes.demandas);
        } catch (err: any) {
            setErro('Falha na comunicação com o backend SQL. Verifique se o servidor na porta 4000 está em execução.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarTudo();
    }, []);

    // Login com sucesso: vincula a sessão e o papel individualizado
    const handleLoginSuccess = (usuario: Usuario, token: string) => {
        try {
            localStorage.setItem('sgpi_auth_user', JSON.stringify(usuario));
            localStorage.setItem('sgpi_auth_token', token);
        } catch (_) {}

        setUsuarioLogado(usuario);
        setPapelAtivo(usuario.papel);
        if (usuario.papel === 'ANALISTA') {
            setAnalistaSelecionado(usuario.nome);
        }
        carregarTudo();
    };

    // Logout: encerra a sessão e volta para a tela de login
    const handleLogout = () => {
        try {
            localStorage.removeItem('sgpi_auth_user');
            localStorage.removeItem('sgpi_auth_token');
        } catch (_) {}
        setUsuarioLogado(null);
        setEtapaFiltro(null);
    };

    // SE NÃO HOUVER USUÁRIO LOGADO -> EXIBIR TELA DE LOGIN PRIMEIRO!
    if (!usuarioLogado) {
        return (
            <LoginPage
                onLoginSuccess={handleLoginSuccess}
                dbStatus={dbStatus}
            />
        );
    }

    const isAnalista = usuarioLogado.papel === 'ANALISTA';

    // Se for analista, filtrar demandas para sua visão individualizada
    const demandasBase = isAnalista
        ? demandas.filter(d => d.analista_nome.toLowerCase().includes(usuarioLogado.nome.toLowerCase()))
        : (papelAtivo === 'ANALISTA'
            ? demandas.filter(d => d.analista_nome.toLowerCase().includes(analistaSelecionado.toLowerCase()))
            : demandas);

    // Calcula contagem de demandas em cada etapa da esteira (1 a 8)
    const totalPorEtapa: Record<number, number> = {};
    demandasBase.forEach(d => {
        let etapa = 1;
        if (d.status === 'Concluído') etapa = 7;
        else if (d.status === 'Em Hypercare') etapa = 8;
        else if (d.validado === 'Sim') etapa = 4;
        else etapa = 2;
        totalPorEtapa[etapa] = (totalPorEtapa[etapa] || 0) + 1;
    });

    const demandasFiltradasPorEtapa = etapaFiltro
        ? demandasBase.filter(d => {
            let etapa = 1;
            if (d.status === 'Concluído') etapa = 7;
            else if (d.status === 'Em Hypercare') etapa = 8;
            else if (d.validado === 'Sim') etapa = 4;
            else etapa = 2;
            return etapa === etapaFiltro;
        })
        : demandasBase;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Barra de Navegação e Perfil Individualizado */}
            <Navbar
                usuarioLogado={usuarioLogado}
                onLogout={handleLogout}
                papelAtivo={papelAtivo}
                onTrocarPapel={setPapelAtivo}
                analistaSelecionado={analistaSelecionado}
                onTrocarAnalista={setAnalistaSelecionado}
                dbStatus={dbStatus}
            />

            {/* Alerta se o Backend estiver desconectado */}
            {erro && (
                <div style={{
                    margin: '0 24px 20px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', fontSize: '0.88rem' }}>
                        <AlertCircle size={20} color="#ef4444" />
                        <span>{erro}</span>
                    </div>
                    <button type="button" onClick={carregarTudo} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                        <RefreshCw size={14} /> Tentar Novamente
                    </button>
                </div>
            )}

            {/* Painel de Métricas e KPIs (Individualizados para o Analista) */}
            <KpiCards
                kpis={kpis}
                isAnalista={isAnalista}
                analistaNome={usuarioLogado.nome}
            />

            {/* Esteira Industrial de Serviços (E1 a E8) Animada */}
            <PipelineStageTracker
                etapaSelecionada={etapaFiltro}
                onSelecionarEtapa={setEtapaFiltro}
                totalPorEtapa={totalPorEtapa}
            />

            {/* Conteúdo Dinâmico por Ambiente Individualizado */}
            <main style={{ flex: 1 }}>
                {papelAtivo === 'SUPERVISOR' && (
                    <SupervisorView
                        demandas={demandasFiltradasPorEtapa}
                        onDemandaAtualizada={carregarTudo}
                    />
                )}

                {papelAtivo === 'ANALISTA' && (
                    <AnalystView
                        analistaAtivo={isAnalista ? usuarioLogado.nome : analistaSelecionado}
                        demandas={demandasFiltradasPorEtapa}
                        onDemandaAtualizada={carregarTudo}
                    />
                )}

                {papelAtivo === 'ADMIN' && (
                    <AdminView
                        demandas={demandas}
                        onDemandaAtualizada={carregarTudo}
                        dbStatus={dbStatus}
                    />
                )}
            </main>

            {/* Rodapé Corporativo */}
            <footer style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
                <p>
                    <strong>SGPI 3.0 Fullstack</strong> · Departamento de Processos Integrados (CSC) · Ambiente Individualizado Seguro · Banco SQL Híbrido (AWS & Local)
                </p>
            </footer>
        </div>
    );
};

export default App;

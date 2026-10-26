/*
 * SGPI Analista 3.0 — contrato único de configuração e dados homologados.
 * Não há literais de prefixo fora de PERFIS: todo ID nasce de perfil.prefixo.
 */
(function (ns) {
    'use strict';

    ns.VERSAO = '3.0.0';
    if (!window.SGPIExchangeContract) {
        throw new Error('Contrato de intercâmbio SGPI não carregado. Mantenha a pasta shared junto aos portais.');
    }
    ns.CONTRATO_INTERCAMBIO = window.SGPIExchangeContract;
    ns.CONFIG = {
        DB_VERSION: 2,
        LS_PERFIL: 'sgpia:v1:perfil',
        PREFIXO_FALLBACK: 'sgpia:fallback',
        CAMINHO_BASE: 'base/',
        FORCAR_CONTINGENCIA: false,
        TEMPO_AUTOSAVE_MS: 500,
        TEMPO_TOAST_MS: 4000
    };

    ns.PERFIS = {
        FM: { nome: 'Filipe Messias', prefixo: 'FM', arquivo: 'base-atividades-flipe_messias.xlsx', banco: 'SGPIA_DB_FM' },
        JV: { nome: 'José Victor', prefixo: 'JV', arquivo: 'base-atividades-jose_victor.xlsx', banco: 'SGPIA_DB_JV' },
        VL: { nome: 'Viviane Lima', prefixo: 'VL', arquivo: 'base-atividades-viviane_lima.xlsx', banco: 'SGPIA_DB_VL' },
        JS: { nome: 'Juliana Santos', prefixo: 'JS', arquivo: 'base-atividades-juliana_santos.xlsx', banco: 'SGPIA_DB_JS' }
    };
    ns.ARQUIVOS_BASE = {
        FM: ns.PERFIS.FM.arquivo,
        JV: ns.PERFIS.JV.arquivo,
        VL: ns.PERFIS.VL.arquivo,
        JS: ns.PERFIS.JS.arquivo
    };
    ns.PREFIXO_ID = function () {
        return ns.estado && ns.estado.perfil ? ns.estado.perfil.prefixo : ns.PERFIS.FM.prefixo;
    };
    ns.detectarPerfilPorArquivoOuId = function (nomeArquivo, idExemplo) {
        var fn = String(nomeArquivo || '').toLowerCase();
        var id = String(idExemplo || '').toUpperCase();
        if (fn.indexOf('jose_victor') >= 0 || id.indexOf('JV-') === 0) return ns.PERFIS.JV;
        if (fn.indexOf('viviane_lima') >= 0 || id.indexOf('VL-') === 0) return ns.PERFIS.VL;
        if (fn.indexOf('juliana_santos') >= 0 || id.indexOf('JS-') === 0) return ns.PERFIS.JS;
        if (fn.indexOf('flipe_messias') >= 0 || fn.indexOf('filipe_messias') >= 0 || id.indexOf('FM-') === 0) return ns.PERFIS.FM;
        var prefixoMatch = id.match(/^([A-Z]{2,4})-/);
        if (prefixoMatch && prefixoMatch[1]) {
            var pref = prefixoMatch[1];
            if (ns.PERFIS[pref]) return ns.PERFIS[pref];
            return { nome: 'Analista (' + pref + ')', prefixo: pref, arquivo: nomeArquivo || ('base-atividades-' + pref + '.xlsx'), banco: 'SGPIA_DB_' + pref };
        }
        return ns.estado && ns.estado.perfil ? ns.estado.perfil : ns.PERFIS.FM;
    };

    ns.STATUS_CRITERIO = ['⏳ Pendente', '🔄 Em andamento', '✔ Concluído', '⛔ Bloqueado', 'N/A'];
    ns.STATUS_CRITERIO_PADRAO = '⏳ Pendente';
    ns.STATUS_CRITERIO_CONCLUIDO = '✔ Concluído';
    ns.STATUS_CRITERIO_BLOQUEADO = '⛔ Bloqueado';
    ns.STATUS_CRITERIO_ANDAMENTO = '🔄 Em andamento';
    ns.STATUS_SEMANA = ['⚪ Não iniciado', '🟡 Em andamento', '🟢 Concluído', '🔴 Bloqueado', '⏸ Aguardando Terceiros'];
    ns.RESULTADOS_HYPERCARE = [
        '🔄 Em Estabilização',
        '✅ Estável — Demanda Encerrada',
        '⛔ Incidente Crítico',
        '🆕 Evolução Identificada — Nova Demanda Aberta'
    ];
    ns.AVALIACOES = ['⭐ Excelente', '✔ Bom', '➖ Regular', '⚠ Abaixo do esperado'];

    ns.LISTAS = {
        projetos: ['Lumen', 'V360', 'Saneamento Base Contábil', 'Newsletter', 'Rotina Fiscal/Contábil', 'Rotina Financeiro', 'Investidas', 'Actio', 'Indicadores e Metas'],
        pilares: ['Governança', 'Melhoria Contínua', 'Transformação Digital', 'Business Intelligence', 'PMO/Projetos', 'Operação (Rotina)'],
        departamentos: ['Fiscal/Contábil', 'Financeiro', 'Processos Integrados'],
        departamentosCSC: ['Contas a Receber', 'Tesouraria', 'Auditoria Financeira CSC', 'Recebimento Fiscal', 'Processos Integrados', 'Cartão Corporativo', 'Tributos Federais', 'Tributos Estaduais', 'Contabilidade', 'Faturamento', 'CSC Corporativo', 'Gestão'],
        tiposDemanda: ['Agente de IA', 'Automação', 'Gargalo eliminado', 'KPI/Indicador publicado', 'Obrigação Acessória', 'OCR/Processamento de Documentos', 'Publicação/Conteúdo Técnico'],
        empresas: ['ELET', 'CHESF', 'ENOR', 'ESUL', 'Todas', 'Outra', 'N/A'],
        motivosStatus: ['Em desenvolvimento', 'Aguardando usuário', 'Aguardando gestor', 'Aguardando TI', 'Aguardando fornecedor', 'Aguardando outra área', 'Em homologação', 'Em validação', 'Ajustes identificados', 'Concluído'],
        categoriasImpedimento: ['Dependência de outra área', 'TI / Sistema', 'Fornecedor', 'Licença / Acesso', 'Aprovação', 'Cliente / Usuário', 'Outro'],
        impactos: ['Alto', 'Médio', 'Baixo'],
        prioridades: ['Alta', 'Média', 'Baixa'],
        complexidades: ['Alta', 'Média', 'Baixa'],
        beneficios: ['Produtividade', 'Qualidade', 'Compliance', 'Risco', 'Experiência', 'Receita', 'Custo'],
        simNao: ['Sim', 'Não'],
        papeis: ['Responsável', 'Apoio'],
        equipePI: ['Filipe Messias', 'José Victor', 'Viviane Lima', 'Juliana Santos'],
        statusSemana: ns.STATUS_SEMANA,
        statusLancamento: ['Não iniciado', 'Em andamento', 'Em Hypercare', 'Bloqueado', 'Concluído', 'Cancelado'],
        avaliacoes: ns.AVALIACOES,
        semaforo: ['🟢 Ok', '🟡 Atenção', '🔴 Crítico'],
        resultadosHypercare: ns.RESULTADOS_HYPERCARE
    };

    ns.MAPAS = {
        temasPorProjeto: {
            'Lumen': ['PIS/COFINS', 'Simulador de Apuração Assistida da CBS e Consolidação'],
            'V360': ['Dashboard Entrada de NF - TicketLog x V360', 'Dashboard Entrada de NF - SAP x V360'],
            'Saneamento Base Contábil': ['Adiantamento de Fornecedores', 'Conciliação MIGO x MIRO (Conta MF)'],
            'Rotina Fiscal/Contábil': ['Apurações', 'Auditoria Fiscal Municipal - Recolhimento ISS', 'Regularização, validação e conclusão das ECF 2025 da CHTP e da TPPE'],
            'Rotina Financeiro': ['Pagamento de Tributos (DARF/GPS)']
        },
        temasPorPilar: {
            'Transformação Digital': ['PIS/COFINS', 'Adiantamento de Fornecedores', 'Pagamento de Tributos (DARF/GPS)', 'Simulador de Apuração Assistida da CBS e Consolidação', 'Auditoria Fiscal Municipal - Recolhimento ISS', 'Apurações', 'Conciliação MIGO x MIRO (Conta MF)'],
            'Business Intelligence': ['Dashboard Entrada de NF - SAP x V360'],
            'Melhoria Contínua': ['Dashboard Entrada de NF - TicketLog x V360'],
            'Operação (Rotina)': ['Regularização, validação e conclusão das ECF 2025 da CHTP e da TPPE']
        },
        temasPorDepartamento: {
            'Tributos Federais': ['PIS/COFINS', 'Apurações', 'Regularização, validação e conclusão das ECF 2025 da CHTP e da TPPE'],
            'Tesouraria': ['Adiantamento de Fornecedores', 'Pagamento de Tributos (DARF/GPS)'],
            'Processos Integrados': ['Simulador de Apuração Assistida da CBS e Consolidação', 'Dashboard Entrada de NF - SAP x V360'],
            'Recebimento Fiscal': ['Dashboard Entrada de NF - TicketLog x V360', 'Auditoria Fiscal Municipal - Recolhimento ISS'],
            'Contabilidade': ['Conciliação MIGO x MIRO (Conta MF)']
        }
    };

    // Integração dinâmica com cadastros mestres do ADM se disponível
    if (typeof window !== 'undefined' && window.SGPICadastros) {
        try {
            var cadAdm = window.SGPICadastros.getCadastros();
            if (cadAdm.projetos && cadAdm.projetos.length) ns.LISTAS.projetos = cadAdm.projetos;
            if (cadAdm.pilares && cadAdm.pilares.length) ns.LISTAS.pilares = cadAdm.pilares;
            if (cadAdm.deptosCSC && cadAdm.deptosCSC.length) ns.LISTAS.departamentosCSC = cadAdm.deptosCSC;
            if (cadAdm.analistas && cadAdm.analistas.length) {
                ns.LISTAS.equipePI = cadAdm.analistas.map(function (a) { return a.nome; });
                cadAdm.analistas.forEach(function (a) {
                    if (!ns.PERFIS[a.prefixo]) {
                        ns.PERFIS[a.prefixo] = {
                            nome: a.nome,
                            prefixo: a.prefixo,
                            arquivo: a.arquivo || ('base-atividades-' + a.prefixo.toLowerCase() + '.xlsx'),
                            banco: 'SGPIA_DB_' + a.prefixo
                        };
                    }
                });
            }
        } catch (e) {}
    }

    ns.STATUS_CORES = {
        'Concluído': 'concluido', 'Encerrado': 'concluido', 'Em Hypercare': 'andamento',
        'Em andamento': 'andamento', 'Em validação': 'validacao',
        'Aguardando terceiros': 'terceiros', 'Não iniciado': 'nao-iniciado',
        'Bloqueado': 'bloqueado', 'Cancelado': 'cancelado'
    };
    ns.STATUS_SUGERIDO = {
        'Em andamento': '🟡 Em andamento', 'Em Hypercare': '🟡 Em andamento',
        'Aguardando terceiros': '⏸ Aguardando Terceiros', 'Não iniciado': '⚪ Não iniciado',
        'Em validação': '🟡 Em andamento', 'Concluído': '🟢 Concluído',
        'Encerrado': '🟢 Concluído', 'Cancelado': '🔴 Bloqueado'
    };

    function col(campo, chave, tipo, opcoes) {
        return Object.assign({ campo: campo, chave: chave, tipo: tipo || 'texto', ajuda: '' }, opcoes || {});
    }
    ns.COLUNAS_LANCAMENTOS = [
        col('ID Único', 'id', 'texto', { obrigatorio: true, derivado: true }),
        col('Data Início', 'dataInicio', 'data'),
        col('Data Conclusão', 'dataConclusao', 'data'),
        col('Departamento', 'departamento', 'lista', { lista: 'departamentos' }),
        col('Projeto', 'projeto', 'lista', { lista: 'projetos' }),
        col('Tema', 'tema', 'listaDependente'),
        col('Pilar Proc. Integrados', 'pilar', 'lista', { lista: 'pilares' }),
        col('Tipo de Demanda', 'tipoDemanda', 'lista', { lista: 'tiposDemanda' }),
        col('Atividade (título curto)', 'atividade', 'texto', { obrigatorio: true }),
        col('Descrição', 'descricao', 'textarea'),
        col('Depto. Envolvido (CSC)', 'deptoCSC', 'lista', { lista: 'departamentosCSC' }),
        col('Pessoa Envolvida', 'pessoaEnvolvida'),
        col('Parceria?', 'parceria', 'lista', { lista: 'simNao' }),
        col('Papel na Atividade', 'papel', 'lista', { lista: 'papeis' }),
        col('Parceiros (equipe PI)', 'parceiros', 'lista', { lista: 'equipePI' }),
        col('ID Atividade Principal', 'idPrincipal'),
        col('Empresa', 'empresa', 'lista', { lista: 'empresas' }),
        col('Status', 'status', 'texto', { derivado: true }),
        col('Horas Gastas', 'horas', 'numero'),
        col('Tempo Antes (h/mês)', 'tempoAntes', 'numero'),
        col('Tempo Depois (h/mês)', 'tempoDepois', 'numero'),
        col('Ganho (h/mês)', 'ganho', 'numero', { derivado: true }),
        col('% Redução', 'reducao', 'numero', { derivado: true }),
        col('Resultado Alcançado', 'resultado', 'textarea'),
        col('Pendência / Próximo Passo', 'pendencia', 'textarea'),
        col('Observação', 'observacao', 'textarea'),
        col('Status E08', 'statusE08', 'texto', { derivado: true }),
        col('% E08', 'pctE08', 'numero', { derivado: true }),
        col('Início Hypercare', 'inicioHypercare', 'data', { derivado: true }),
        col('Encerramento Previsto', 'encerramentoPrevisto', 'data', { derivado: true }),
        col('Encerramento Real', 'encerramentoReal', 'data', { derivado: true }),
        col('Dias Hypercare', 'diasHypercare', 'numero', { derivado: true }),
        col('Situação Prazo E08', 'situacaoPrazoE08', 'texto', { derivado: true }),
        col('Resultado Hypercare', 'resultadoHypercare', 'texto', { derivado: true }),
        col('ID Nova Demanda', 'idNovaDemanda', 'texto', { derivado: true }),
        col('Lead Time Total', 'leadTimeTotal', 'numero', { derivado: true }),
        col('Status Geral Definitivo', 'statusGeralDefinitivo', 'texto', { derivado: true })
    ];

    function etapa(numero, nome, criterios, opcoes) {
        return Object.assign({
            numero: numero, codigo: numero === 8 ? 'E08' : 'E' + numero, nome: nome,
            curto: nome, aba: numero === 8 ? 'E08 — Estabilização Hypercare' : 'E' + numero + ' — ' + nome.replace(' ⚠ GATE', ''),
            objetivo: 'Concluir os critérios de aceite e registrar a evidência da etapa.',
            gate: numero === 3 || numero === 5,
            responsavel: 'Analista', tempo: 'conforme demanda',
            criterios: criterios.map(function (c, idx) {
                var texto = typeof c === 'string' ? c : c.texto;
                var ajuda = (typeof c === 'object' && c.ajuda) ? c.ajuda : ('Critério ' + (idx + 1) + ' da etapa ' + (numero === 8 ? 'E08' : 'E' + numero) + ': ' + texto);
                return { numero: idx + 1, texto: texto, ajuda: ajuda, tipo: idx === criterios.length - 1 ? 'Saída' : 'Obrigatório' };
            })
        }, opcoes || {});
    }
    ns.ETAPAS_WORKFLOW = [
        etapa(1, 'Solicitação', [
            { texto: 'Necessidade Descrita', ajuda: 'Descrição detalhada do problema, processo atual ou oportunidade de melhoria informada pelo solicitante.' },
            { texto: 'Origem Registrada', ajuda: 'Identificação da fonte da demanda (área, canal de atendimento, solicitante ou diretoria).' },
            { texto: 'Identificação Completa', ajuda: 'Cadastro com dados básicos de identificação da demanda e contatos das partes envolvidas.' },
            { texto: 'Cenário e Resultado Esperado', ajuda: 'Detalhamento do cenário operacional atual e dos resultados/benefícios esperados com a entrega.' },
            { texto: 'Impacto Informado', ajuda: 'Avaliação prévia dos impactos operacionais, financeiros, de conformidade ou risco.' },
            { texto: 'Evidências Verificadas', ajuda: 'Conferência inicial dos arquivos, anexos ou especificações enviados pelo solicitante.' },
            { texto: 'Demanda Registrada', ajuda: 'Criação formal da demanda na base mestre com código de identificação único (ID).' },
            { texto: 'Recebimento Confirmado', ajuda: 'Confirmação do recebimento da solicitação e abertura oficial do atendimento no sistema.' }
        ], { responsavel: 'Supervisor', desativadaNoAnalista: true }),
        etapa(2, 'Triagem', [
            { texto: 'Tipo da Demanda Definido', ajuda: 'Classificação do tipo de atividade (Melhoria, Automação, Correção, Projeto, etc.).' },
            { texto: 'Área Solicitante Confirmada', ajuda: 'Confirmação formal do departamento CSC ou unidade de negócio solicitante.' },
            { texto: 'Prioridade Definida', ajuda: 'Definição do nível de urgência e priorização de atendimento (Baixa, Média, Alta, Crítica).' },
            { texto: 'Responsável Atribuído', ajuda: 'Designação do analista ou equipe responsável pela condução e execução da demanda.' },
            { texto: 'Complexidade Avaliada', ajuda: 'Estimativa técnica do esforço, complexidade e recursos necessários para o desenvolvimento.' },
            { texto: 'Categoria Definida', ajuda: 'Enquadramento da demanda nas categorias de benefício ou tipos de impedimento.' },
            { texto: 'Projeto Relacionado Vinculado', ajuda: 'Vínculo da demanda ao projeto estratégico ou pilar de transformação correspondente.' },
            { texto: 'Controle Atualizado no Tracker', ajuda: 'Sincronização dos dados da triagem no painel do Tracker para acompanhamento.' }
        ], { responsavel: 'Supervisor', desativadaNoAnalista: true }),
        etapa(3, 'Levantamento ⚠ GATE', [
            { texto: 'Requisitos Levantados', ajuda: 'Mapeamento e especificação detalhada de todos os requisitos funcionais, operacionais e de negócio.' },
            { texto: 'Escopo Definido', ajuda: 'Delimitação clara do escopo do projeto: o que faz parte da entrega e o que fica fora do escopo.' },
            { texto: 'Riscos e Dependências Mapeados', ajuda: 'Identificação prévia de impedimentos técnicos, dependências sistêmicas, acessos e prazos.' },
            { texto: 'Critérios de Aceite Definidos', ajuda: 'Estabelecimento das regras objetivas e cenários de testes para homologação final da solução.' },
            { texto: 'Escopo Validado (GATE)', ajuda: 'Aprovação formal do levantamento e liberação do GATE de governança para iniciar a execução.' }
        ]),
        etapa(4, 'Execução', [
            { texto: 'Execução Planejada', ajuda: 'Elaboração do plano de ação, divisão das fases de desenvolvimento e cronograma de construção.' },
            { texto: 'Execução Realizada', ajuda: 'Desenvolvimento, automação, construção ou elaboração efetiva da solução/processo.' },
            { texto: 'Evolução Registrada', ajuda: 'Documentação do avanço diário/semanal, versões intermediárias e histórico de desenvolvimento.' },
            { texto: 'Progresso Acompanhado', ajuda: 'Acompanhamento do cumprimento de prazos, carga de horas investidas e alinhamento do escopo.' },
            { texto: 'Qualidade Verificada', ajuda: 'Execução de testes internos de unidade, integridade dos dados e regras de negócio antes do envio.' },
            { texto: 'Entrega Preparada para Validação', ajuda: 'Consolidação dos pacotes de entrega, arquivos finalizados e manuais prontos para homologação.' },
            { texto: 'Controle Atualizado no Tracker', ajuda: 'Atualização do status de execução e percentual de progresso no painel do Tracker.' }
        ]),
        etapa(5, 'Validação ⚠ GATE', [
            { texto: 'Entrega Submetida', ajuda: 'Envio ou disponibilização oficial da solução para ambiente de homologação do cliente/solicitante.' },
            { texto: 'Validação do Usuário Realizada', ajuda: 'Testes práticos executados pelos usuários finais nas condições reais de operação.' },
            { texto: 'Aprovação da Gestão Registrada', ajuda: 'Parecer, aceite formal e autorização emitida pelo gestor responsável da área solicitante.' },
            { texto: 'Achados e Ajustes Registrados', ajuda: 'Registro minucioso de apontamentos, divergências ou pequenas melhorias identificadas na homologação.' },
            { texto: 'Homologação Formalizada (GATE)', ajuda: 'Formalização da ata/resultado (Aprovado, Aprovado com ajustes ou Reprovado) e liberação do GATE.' }
        ]),
        etapa(6, 'Ajustes', [
            { texto: 'Achados Priorizados', ajuda: 'Análise e priorização dos achados de homologação em correções imediatas ou futuras.' },
            { texto: 'Ajustes Executados', ajuda: 'Implementação das correções, alterações de código ou refatoração no processo/solução.' },
            { texto: 'Solução Atualizada', ajuda: 'Geração e publicação da versão atualizada da solução contemplando os ajustes.' },
            { texto: 'Pendências Tratadas', ajuda: 'Resolução e encerramento de todos os itens apontados na lista de achados da homologação.' },
            { texto: 'Nova Validação Realizada', ajuda: 'Re-teste e re-checagem com os usuários finais para confirmar a resolução dos achados.' },
            { texto: 'Ajustes Aprovados', ajuda: 'Aceite final das correções aplicadas e autorização para liberação em ambiente definitivo.' }
        ], { condicional: true }),
        etapa(7, 'Entrega', [
            { texto: 'Solução Disponibilizada', ajuda: 'Implantação em produção, publicação de robôs ou disponibilização do processo definitivo para uso.' },
            { texto: 'Entrega Comunicada', ajuda: 'Notificação oficial de conclusão aos solicitantes, gestores e partes interessadas.' },
            { texto: 'Projeto Encerrado no Controle', ajuda: 'Finalização do registro da demanda nos controles operacionais e reporte do ganho realizado.' },
            { texto: 'Evidências Arquivadas', ajuda: 'Armazenamento dos comprovantes, termos de aceite, manuais e arquivos no repositório oficial.' }
        ]),
        etapa(8, 'Estabilização / Hypercare', [
            { texto: 'Suporte Inicial Prestado', ajuda: 'Acompanhamento dedicado nos primeiros dias pós-implantação para orientação dos usuários.' },
            { texto: 'Solução Monitorada', ajuda: 'Acompanhamento diário do funcionamento, volumetria e estabilidade da solução em produção.' },
            { texto: 'Ocorrências Registradas', ajuda: 'Registro e triagem de eventuais dúvidas, falhas ou comportamentos inesperados no período inicial.' },
            { texto: 'Correções Emergenciais Concluídas', ajuda: 'Tratamento rápido de eventuais incidentes operacionais ou inconsistências no Hypercare.' },
            { texto: 'Estabilização Confirmada', ajuda: 'Confirmação de operação regular sem falhas impeditivas por 7 dias corridos de acompanhamento.' },
            { texto: 'Demanda Encerrada ou Novo Ciclo Aberto', ajuda: 'Encerramento oficial da sustentação ou abertura de novo ID caso haja necessidade de nova evolução.' }
        ], { tempo: '7 dias corridos' })
    ];
    ns.CRITERIOS_WORKFLOW = ns.ETAPAS_WORKFLOW.reduce(function (a, e) { return a.concat(e.criterios); }, []);

    ns.CAMPOS_RESUMO_EXECUTIVO = [
        { chave: 'entregas', rotulo: 'Entregas e avanços da semana' },
        { chave: 'travas', rotulo: 'Travas e riscos' },
        { chave: 'ajuda', rotulo: 'Onde preciso de ajuda' }
    ];
    ns.CAMPOS_ACOMPANHAMENTO = ['Período', 'ID', 'Projeto', 'Atividade', 'Status da Semana', 'Motivo do Status', 'O que foi realizado', 'Próximo Passo'];

    ns.chavePrefs = function (prefixo) { return 'sgpia:v3:' + prefixo + ':prefs'; };
    ns.clone = function (valor) { return JSON.parse(JSON.stringify(valor)); };
    ns.paraISOData = function (data) {
        if (!data) return '';
        var d = data instanceof Date ? data : new Date(String(data).length === 10 ? String(data) + 'T12:00:00' : data);
        if (Number.isNaN(d.getTime())) return '';
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };
    ns.rotuloPeriodo = function (de, ate) {
        function curta(v) {
            if (!v) return '';
            var p = String(v).split('-');
            return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0].slice(-2) : '';
        }
        return de && ate ? 'De: ' + curta(de) + ' | Até: ' + curta(ate) : '';
    };
    ns.periodosRolantes = function (de, ate) {
        var inicio = new Date((de || ns.paraISOData(new Date())) + 'T12:00:00');
        var fim = new Date((ate || de || ns.paraISOData(new Date())) + 'T12:00:00');
        return Array.from({ length: 13 }, function (_, i) {
            var d = new Date(inicio); d.setDate(d.getDate() - (i * 7));
            var a = new Date(fim); a.setDate(a.getDate() - (i * 7));
            return ns.rotuloPeriodo(ns.paraISOData(d), ns.paraISOData(a));
        });
    };
    ns.obterSemanaISO = function () { return 0; };
    ns.periodoSemanaISO = function () { return { de: '2026-07-27', ate: '2026-07-31' }; };

    ns.criarReporteVazio = function (_, periodo) {
        var faixa = periodo || { de: '', ate: '' };
        return {
            semana: ns.rotuloPeriodo(faixa.de, faixa.ate), periodoDe: faixa.de, periodoAte: faixa.ate,
            dataReport: ns.paraISOData(new Date()), analista: ns.PERFIS.FM.nome,
            gestora: 'Gestora de Processos Integrados', departamento: 'Processos Integrados',
            resumoExec: { entregas: '', travas: '', ajuda: '' }, linhas: [],
            comunicacao: { mensagemAnalista: '', respostaGestora: '', performance: '', qualidade: '', prazo: '', prioridadeProximaSemana: '', feedback: '' },
            criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString(), exportadoEm: ''
        };
    };
    ns.criarLinhaReporte = function (l) {
        return { semana: '', id: l.id || '', projeto: l.projeto || '', atividade: l.atividade || '',
            statusSemana: ns.STATUS_SUGERIDO[l.status] || '🟡 Em andamento', motivoStatus: '',
            realizado: '', proximoPasso: l.pendencia || '' };
    };
    ns.chaveCriterioWorkflow = function (id, etapaNum) { return String(id || '') + '|E' + etapaNum; };
    ns.criarCriterioWorkflowVazio = function (id, etapaNum) {
        return { chave: ns.chaveCriterioWorkflow(id, etapaNum), id: id, etapa: etapaNum,
            status: ns.ETAPAS_WORKFLOW[etapaNum - 1].criterios.map(function () { return ns.STATUS_CRITERIO_PADRAO; }),
            evidencia: '', observacao: '', aplicavel: etapaNum === 6 ? '' : undefined,
            resultadoHomologacao: '', resultadoHypercare: etapaNum === 8 ? '🔄 Em Estabilização' : '',
            inicioHypercare: '', prazoHypercare: etapaNum === 8 ? 7 : '', encerramentoReal: '',
            idNovaDemanda: '', atualizadoEm: new Date().toISOString() };
    };
    ns.criarCriteriosParaLancamento = function (id) { return ns.ETAPAS_WORKFLOW.map(function (e) { return ns.criarCriterioWorkflowVazio(id, e.numero); }); };

    function demanda(id, dados) {
        return Object.assign({
            id: id, dataInicio: '', dataConclusao: '', departamento: '', projeto: '', tema: '', pilar: '',
            tipoDemanda: '', atividade: '', descricao: '', deptoCSC: '', pessoaEnvolvida: '', parceria: 'Não',
            papel: 'Responsável', parceiros: '', idPrincipal: '', empresa: 'Todas', status: '',
            horas: '', tempoAntes: '', tempoDepois: '', ganho: '', reducao: '', resultado: '',
            pendencia: '', observacao: '', origem: 'Gabarito homologado'
        }, dados);
    }
    ns.criarLancamentosDemo = function () {
        var p = ns.PREFIXO_ID();
        return [
            demanda(p + '-0001', { dataInicio: '2026-07-02', dataConclusao: '2026-07-07', departamento: 'Fiscal/Contábil', projeto: 'Lumen', tema: 'PIS/COFINS', pilar: 'Transformação Digital', tipoDemanda: 'Obrigação Acessória', atividade: 'Auditoria SPED EFD Contribuições', descricao: 'Auditoria comparativa da EFD Contribuições entre arquivos originais e retificados.', deptoCSC: 'Tributos Federais', pessoaEnvolvida: 'Maria Estela', horas: 8, tempoAntes: 60, tempoDepois: 1, resultado: 'Comparativo original × retificado disponível para a equipe, com divergências identificadas antes da transmissão.', pendencia: 'Sem pendências', observacao: 'Use arquivos originais e retificados do mesmo período.' }),
            demanda(p + '-0002', { dataInicio: '2026-07-01', dataConclusao: '2026-07-08', departamento: 'Financeiro', projeto: 'Saneamento Base Contábil', tema: 'Adiantamento de Fornecedores', pilar: 'Transformação Digital', tipoDemanda: 'Automação', atividade: 'Processamento de documentos de adiantamentos', descricao: 'Leitura automatizada de 1.374 PDFs e consolidação em relatório gerencial.', deptoCSC: 'Tesouraria', pessoaEnvolvida: 'Erica Arcoverde (Supervisora)', parceria: 'Sim', horas: 12, tempoAntes: 60, tempoDepois: 4, resultado: '1.374 PDFs lidos automaticamente; relatório gerencial e planilha Excel gerados.', pendencia: 'Sem pendências' }),
            demanda(p + '-0003', { dataInicio: '2026-07-01', dataConclusao: '2026-07-08', departamento: 'Financeiro', projeto: 'Rotina Financeiro', tema: 'Pagamento de Tributos (DARF/GPS)', pilar: 'Transformação Digital', tipoDemanda: 'Automação', atividade: 'Automação da emissão de DARF (SICALC)', descricao: 'Robô para cálculo e emissão de DARFs no SICALC com validação humana do captcha.', deptoCSC: 'Tesouraria', pessoaEnvolvida: 'Daiane Vicente', horas: 12, tempoAntes: 24, tempoDepois: 8, resultado: '95% das DARFs passaram a ser emitidas automaticamente.', pendencia: 'Sem pendências' }),
            demanda(p + '-0004', { dataInicio: '2026-07-29', departamento: 'Fiscal/Contábil', projeto: 'Lumen', tema: 'Simulador de Apuração Assistida da CBS e Consolidação', pilar: 'Transformação Digital', tipoDemanda: 'Publicação/Conteúdo Técnico', atividade: 'Revisão e Consolidação do Modelo CBS', descricao: 'Revisão técnica do simulador de CBS, com melhorias na apuração, orçamento, pagamentos e validações.', deptoCSC: 'Processos Integrados', pessoaEnvolvida: 'Lucas de Albuquerque', resultado: 'Validações fiscais reforçadas e parametrizadas.', pendencia: 'Integrar a contabilização diretamente à aba apuração-cbs.' }),
            demanda(p + '-0005', { dataInicio: '2026-06-12', dataConclusao: '2026-06-17', departamento: 'Fiscal/Contábil', projeto: 'V360', tema: 'Dashboard Entrada de NF - TicketLog x V360', pilar: 'Melhoria Contínua', tipoDemanda: 'Gargalo eliminado', atividade: 'Conciliação de notas TicketLog × V360', descricao: 'Conciliação automatizada de notas TicketLog com a base V360.', deptoCSC: 'Recebimento Fiscal', resultado: 'Estrutura automatizada de conciliação em duas direções.', pendencia: 'Sem pendências' }),
            demanda(p + '-0006', { dataInicio: '2026-06-17', dataConclusao: '2026-06-19', departamento: 'Fiscal/Contábil', projeto: 'Rotina Fiscal/Contábil', tema: 'Auditoria Fiscal Municipal - Recolhimento ISS', pilar: 'Transformação Digital', tipoDemanda: 'OCR/Processamento de Documentos', atividade: 'Conversor PDF para Excel de notas fiscais', descricao: 'Aplicação local para converter PDFs fiscais em planilhas estruturadas.', deptoCSC: 'Recebimento Fiscal', pessoaEnvolvida: 'A confirmar', horas: 16, tempoAntes: 6, tempoDepois: 1.2, resultado: 'Aplicação funcional com processamento em lote e saída Excel.', pendencia: 'Sem pendências' }),
            demanda(p + '-0007', { dataInicio: '2026-06-01', dataConclusao: '2026-06-05', departamento: 'Fiscal/Contábil', projeto: 'Rotina Fiscal/Contábil', tema: 'Apurações', pilar: 'Transformação Digital', tipoDemanda: 'Automação', atividade: 'Excel Cleaner ETL para arquivos PIS/COFINS', descricao: 'Aplicação local para reduzir arquivos Excel preservando dados e fórmulas.', deptoCSC: 'Tributos Federais', pessoaEnvolvida: 'A confirmar', resultado: 'Redução de até 63% no tamanho dos arquivos.', pendencia: 'Sem pendências' }),
            demanda(p + '-0008', { dataInicio: '2026-07-02', dataConclusao: '2026-07-02', departamento: 'Financeiro', projeto: 'V360', tema: 'Dashboard Entrada de NF - SAP x V360', pilar: 'Business Intelligence', tipoDemanda: 'KPI/Indicador publicado', atividade: 'Memória de cálculo dos índices V360', descricao: 'Documentação auditável das regras dos indicadores V360.', deptoCSC: 'Processos Integrados', pessoaEnvolvida: 'A confirmar', horas: 24, tempoAntes: 16, tempoDepois: 2, resultado: 'Memória de cálculo estruturada e auditável.', pendencia: 'Sem pendências' }),
            demanda(p + '-0009', { dataInicio: '2026-07-17', dataConclusao: '2026-07-29', departamento: 'Fiscal/Contábil', projeto: 'Saneamento Base Contábil', tema: 'Conciliação MIGO x MIRO (Conta MF)', pilar: 'Transformação Digital', tipoDemanda: 'Agente de IA', atividade: 'Agente de IA para duplicidades de MIGO', descricao: 'Agente para sanear a conta transitória MF e apontar duplicidades MIGO.', deptoCSC: 'Contabilidade', pessoaEnvolvida: 'José Paulo Farias', resultado: 'Conciliação validada por linha e por pedido.', pendencia: 'Avançar na validação das duplicidades e nos planos de ação.' }),
            demanda(p + '-0010', { dataInicio: '2026-07-22', dataConclusao: '2026-07-28', departamento: 'Fiscal/Contábil', projeto: 'Rotina Fiscal/Contábil', tema: 'Regularização, validação e conclusão das ECF 2025 da CHTP e da TPPE', pilar: 'Operação (Rotina)', tipoDemanda: 'Obrigação Acessória', atividade: 'Correção e validação das ECF 2025', descricao: 'Correção dos saldos, mapeamentos referenciais e registros das ECF 2025.', deptoCSC: 'Tributos Federais', pessoaEnvolvida: 'Roberto Cavalcante', empresa: 'Outra', horas: 16, tempoAntes: 40, tempoDepois: 0, resultado: 'Arquivos validados sem erros no PVA.', pendencia: 'Sem pendências' })
        ];
    };
    ns.criarCriteriosWorkflowDemo = function (lancamentos) {
        var completos = {};
        lancamentos.forEach(function (l) { completos[l.id] = true; });
        return lancamentos.reduce(function (todos, l) {
            return todos.concat(ns.ETAPAS_WORKFLOW.map(function (e) {
                var r = ns.criarCriterioWorkflowVazio(l.id, e.numero);
                var concluir = true;
                if (l.id.endsWith('0004')) concluir = e.numero <= 3;
                if (l.id.endsWith('0009')) concluir = e.numero <= 7;
                r.status = r.status.map(function (_, idx) {
                    if (concluir) return ns.STATUS_CRITERIO_CONCLUIDO;
                    if (l.id.endsWith('0004') && e.numero === 4 && idx === 0) return ns.STATUS_CRITERIO_ANDAMENTO;
                    if (l.id.endsWith('0009') && e.numero === 8 && idx < 2) return ns.STATUS_CRITERIO_ANDAMENTO;
                    return ns.STATUS_CRITERIO_PADRAO;
                });
                if (e.numero === 6 && concluir) r.aplicavel = 'Sim';
                if (e.numero === 8) {
                    r.prazoHypercare = 7;
                    var datas = {
                        '0001': ['2026-07-07', '2026-07-14'], '0002': ['2026-07-08', '2026-07-15'],
                        '0003': ['2026-07-08', '2026-07-15'], '0005': ['2026-06-17', '2026-06-19'],
                        '0006': ['2026-06-19', '2026-06-26'], '0007': ['2026-06-05', '2026-06-09'],
                        '0008': ['2026-07-02', '2026-07-09'], '0009': ['2026-07-29', ''],
                        '0010': ['2026-07-28', '2026-07-29']
                    };
                    var d = datas[l.id.slice(-4)] || ['', ''];
                    r.inicioHypercare = d[0]; r.encerramentoReal = d[1];
                    r.resultadoHypercare = concluir ? '✅ Estável — Demanda Encerrada' : '🔄 Em Estabilização';
                }
                return r;
            }));
        }, []);
    };
    ns.criarReportesDemo = function (lancamentos) {
        var r = ns.criarReporteVazio('', { de: '2026-07-27', ate: '2026-07-31' });
        r.semana = ns.rotuloPeriodo(r.periodoDe, r.periodoAte);
        r.resumoExec = { entregas: 'Duas entregas concluídas no período.', travas: 'Sem impedimentos bloqueantes.', ajuda: 'Sem apoio gerencial requerido.' };
        ['0004', '0009'].forEach(function (sufixo) {
            var l = lancamentos.find(function (x) { return x.id.endsWith(sufixo); });
            var linha = ns.criarLinhaReporte(l);
            linha.semana = r.semana;
            linha.statusSemana = '🟡 Em andamento';
            linha.motivoStatus = sufixo === '0004' ? 'Em desenvolvimento' : 'Em validação';
            linha.realizado = sufixo === '0004' ? 'Revisão e consolidação do modelo CBS iniciadas.' : 'Entrega realizada e Hypercare iniciado.';
            r.linhas.push(linha);
        });
        ['0009', '0010'].forEach(function (sufixo) {
            var l = lancamentos.find(function (x) { return x.id.endsWith(sufixo); });
            var linha = ns.criarLinhaReporte(l);
            linha.semana = r.semana;
            linha.statusSemana = '🟢 Concluído';
            linha.motivoStatus = 'Concluído';
            linha.realizado = sufixo === '0009' ? 'Entrega concluída em 29/07 e encaminhada ao Hypercare.' : 'ECF 2025 corrigida e validada sem erros no PVA.';
            r.linhas.push(linha);
        });
        return [r];
    };
})(window.SGPIA = window.SGPIA || {});

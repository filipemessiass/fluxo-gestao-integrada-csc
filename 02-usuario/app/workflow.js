/*
 * SGPI · 02-usuario/app/workflow.js — motor determinístico do Workflow E1→E08.
 * Adaptado do motor original do SGPI (analista/js/workflow.js): o status nunca é digitado,
 * é derivado dos critérios. Os dados de cada etapa ficam em task.workflow[etapa].
 */
(function () {
    'use strict';

    var STATUS = ['⏳ Pendente', '🔄 Em andamento', '✔ Concluído', '⛔ Bloqueado', 'N/A'];
    var PADRAO = '⏳ Pendente', CONCLUIDO = '✔ Concluído', BLOQUEADO = '⛔ Bloqueado', ANDAMENTO = '🔄 Em andamento';
    var RESULTADOS_HYPERCARE = ['🔄 Em Estabilização', '✅ Estável — Demanda Encerrada', '⛔ Incidente Crítico', '🆕 Evolução Identificada — Nova Demanda Aberta'];
    var RESULTADOS_HOMOLOGACAO = ['Aprovado', 'Aprovado com ajustes', 'Reprovado'];
    var TEXTOS = ['evidencia', 'observacao', 'resultadoHomologacao', 'aplicavel', 'resultadoHypercare', 'inicioHypercare', 'encerramentoReal', 'idNovaDemanda'];

    var BRUTO = [
        { numero: 1, codigo: 'E1', nome: 'Solicitação', dono: 'supervisor', gate: false, criterios: [
            ['Necessidade Descrita', 'Descrição detalhada do problema, processo atual ou oportunidade de melhoria informada pelo solicitante.'],
            ['Origem Registrada', 'Identificação da fonte da demanda (área, canal de atendimento, solicitante ou diretoria).'],
            ['Identificação Completa', 'Cadastro com dados básicos de identificação da demanda e contatos das partes envolvidas.'],
            ['Cenário e Resultado Esperado', 'Detalhamento do cenário operacional atual e dos resultados/benefícios esperados com a entrega.'],
            ['Impacto Informado', 'Avaliação prévia dos impactos operacionais, financeiros, de conformidade ou risco.'],
            ['Evidências Verificadas', 'Conferência inicial dos arquivos, anexos ou especificações enviados pelo solicitante.'],
            ['Demanda Registrada', 'Criação formal da demanda na base mestre com código de identificação único (ID).'],
            ['Recebimento Confirmado', 'Confirmação do recebimento da solicitação e abertura oficial do atendimento no sistema.']
        ] },
        { numero: 2, codigo: 'E2', nome: 'Triagem', dono: 'supervisor', gate: false, criterios: [
            ['Tipo da Demanda Definido', 'Classificação do tipo de atividade (Melhoria, Automação, Correção, Projeto, etc.).'],
            ['Área Solicitante Confirmada', 'Confirmação formal do departamento CSC ou unidade de negócio solicitante.'],
            ['Prioridade Definida', 'Definição do nível de urgência e priorização de atendimento (Baixa, Média, Alta, Crítica).'],
            ['Responsável Atribuído', 'Designação do analista ou equipe responsável pela condução e execução da demanda.'],
            ['Complexidade Avaliada', 'Estimativa técnica do esforço, complexidade e recursos necessários para o desenvolvimento.'],
            ['Categoria Definida', 'Enquadramento da demanda nas categorias de benefício ou tipos de impedimento.'],
            ['Projeto Relacionado Vinculado', 'Vínculo da demanda ao projeto estratégico ou pilar de transformação correspondente.'],
            ['Controle Atualizado no Tracker', 'Sincronização dos dados da triagem no painel do Tracker para acompanhamento.']
        ] },
        { numero: 3, codigo: 'E3', nome: 'Levantamento', dono: 'analista', gate: true, criterios: [
            ['Requisitos Levantados', 'Mapeamento e especificação detalhada de todos os requisitos funcionais, operacionais e de negócio.'],
            ['Escopo Definido', 'Delimitação clara do escopo do projeto: o que faz parte da entrega e o que fica fora do escopo.'],
            ['Riscos e Dependências Mapeados', 'Identificação prévia de impedimentos técnicos, dependências sistêmicas, acessos e prazos.'],
            ['Critérios de Aceite Definidos', 'Estabelecimento das regras objetivas e cenários de testes para homologação final da solução.'],
            ['Escopo Validado (GATE)', 'Aprovação formal do levantamento e liberação do GATE de governança para iniciar a execução.']
        ] },
        { numero: 4, codigo: 'E4', nome: 'Execução', dono: 'analista', gate: false, criterios: [
            ['Execução Planejada', 'Elaboração do plano de ação, divisão das fases de desenvolvimento e cronograma de construção.'],
            ['Execução Realizada', 'Desenvolvimento, automação, construção ou elaboração efetiva da solução/processo.'],
            ['Evolução Registrada', 'Documentação do avanço diário/semanal, versões intermediárias e histórico de desenvolvimento.'],
            ['Progresso Acompanhado', 'Acompanhamento do cumprimento de prazos, carga de horas investidas e alinhamento do escopo.'],
            ['Qualidade Verificada', 'Execução de testes internos de unidade, integridade dos dados e regras de negócio antes do envio.'],
            ['Entrega Preparada para Validação', 'Consolidação dos pacotes de entrega, arquivos finalizados e manuais prontos para homologação.'],
            ['Controle Atualizado no Tracker', 'Atualização do status de execução e percentual de progresso no painel do Tracker.']
        ] },
        { numero: 5, codigo: 'E5', nome: 'Validação', dono: 'analista', gate: true, criterios: [
            ['Entrega Submetida', 'Envio ou disponibilização oficial da solução para ambiente de homologação do cliente/solicitante.'],
            ['Validação do Usuário Realizada', 'Testes práticos executados pelos usuários finais nas condições reais de operação.'],
            ['Aprovação da Gestão Registrada', 'Parecer, aceite formal e autorização emitida pelo gestor responsável da área solicitante.'],
            ['Achados e Ajustes Registrados', 'Registro minucioso de apontamentos, divergências ou pequenas melhorias identificadas na homologação.'],
            ['Homologação Formalizada (GATE)', 'Formalização da ata/resultado (Aprovado, Aprovado com ajustes ou Reprovado) e liberação do GATE.']
        ] },
        { numero: 6, codigo: 'E6', nome: 'Ajustes', dono: 'analista', gate: false, condicional: true, criterios: [
            ['Achados Priorizados', 'Análise e priorização dos achados de homologação em correções imediatas ou futuras.'],
            ['Ajustes Executados', 'Implementação das correções, alterações de código ou refatoração no processo/solução.'],
            ['Solução Atualizada', 'Geração e publicação da versão atualizada da solução contemplando os ajustes.'],
            ['Pendências Tratadas', 'Resolução e encerramento de todos os itens apontados na lista de achados da homologação.'],
            ['Nova Validação Realizada', 'Re-teste e re-checagem com os usuários finais para confirmar a resolução dos achados.'],
            ['Ajustes Aprovados', 'Aceite final das correções aplicadas e autorização para liberação em ambiente definitivo.']
        ] },
        { numero: 7, codigo: 'E7', nome: 'Entrega', dono: 'analista', gate: false, criterios: [
            ['Solução Disponibilizada', 'Implantação em produção, publicação de robôs ou disponibilização do processo definitivo para uso.'],
            ['Entrega Comunicada', 'Notificação oficial de conclusão aos solicitantes, gestores e partes interessadas.'],
            ['Projeto Encerrado no Controle', 'Finalização do registro da demanda nos controles operacionais e reporte do ganho realizado.'],
            ['Evidências Arquivadas', 'Armazenamento dos comprovantes, termos de aceite, manuais e arquivos no repositório oficial.']
        ] },
        { numero: 8, codigo: 'E08', nome: 'Estabilização / Hypercare', dono: 'analista', gate: false, criterios: [
            ['Suporte Inicial Prestado', 'Acompanhamento dedicado nos primeiros dias pós-implantação para orientação dos usuários.'],
            ['Solução Monitorada', 'Acompanhamento diário do funcionamento, volumetria e estabilidade da solução em produção.'],
            ['Ocorrências Registradas', 'Registro e triagem de eventuais dúvidas, falhas ou comportamentos inesperados no período inicial.'],
            ['Correções Emergenciais Concluídas', 'Tratamento rápido de eventuais incidentes operacionais ou inconsistências no Hypercare.'],
            ['Estabilização Confirmada', 'Confirmação de operação regular sem falhas impeditivas por 7 dias corridos de acompanhamento.'],
            ['Demanda Encerrada ou Novo Ciclo Aberto', 'Encerramento oficial da sustentação ou abertura de novo ID caso haja necessidade de nova evolução.']
        ] }
    ];
    var ICONES = { 1: 'fa-inbox', 2: 'fa-filter', 3: 'fa-triangle-exclamation', 4: 'fa-gears', 5: 'fa-clipboard-check', 6: 'fa-screwdriver-wrench', 7: 'fa-rocket', 8: 'fa-rotate' };
    var ETAPAS = BRUTO.map(function (e) {
        return {
            numero: e.numero, codigo: e.codigo, nome: e.nome, curto: e.numero === 8 ? 'Hypercare' : e.nome, dono: e.dono, gate: e.gate, condicional: !!e.condicional, icone: ICONES[e.numero],
            criterios: e.criterios.map(function (c, i) { return { numero: i + 1, texto: c[0], ajuda: c[1] }; })
        };
    });

    function etapa(n) { return ETAPAS[Number(n) - 1] || null; }
    function ok(s) { return s === CONCLUIDO || s === 'N/A'; }

    function normalizarStatus(v) {
        var s = String(v || '');
        if (STATUS.indexOf(s) >= 0) return s;
        var n = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        if (n.indexOf('concl') >= 0) return CONCLUIDO;
        if (n.indexOf('bloq') >= 0) return BLOQUEADO;
        if (n.indexOf('andamento') >= 0) return ANDAMENTO;
        if (n === 'n/a' || n === 'na') return 'N/A';
        return PADRAO;
    }

    /** Registro completo de uma etapa (com valores padrão quando a demanda ainda não tem dados). */
    function registro(task, n) {
        var e = etapa(n), r = (task && task.workflow && task.workflow[n]) || {};
        var saida = {
            status: e.criterios.map(function (_, i) { return normalizarStatus((r.status || [])[i]); }),
            prazoHypercare: r.prazoHypercare === '' || r.prazoHypercare == null ? '' : (Number(r.prazoHypercare) || ''),
            at: Number(r.at) || 0,
            by: String(r.by || '').slice(0, 80)
        };
        TEXTOS.forEach(function (k) { saida[k] = String(r[k] == null ? '' : r[k]).slice(0, 2000); });
        return saida;
    }

    /** Normaliza o campo workflow vindo de arquivo; devolve null quando não há dados. */
    function normalizar(wf) {
        if (!wf || typeof wf !== 'object') return null;
        var saida = {};
        ETAPAS.forEach(function (e) {
            var r = wf[e.numero];
            if (r && typeof r === 'object' && Array.isArray(r.status)) saida[e.numero] = registro({ workflow: wf }, e.numero);
        });
        return Object.keys(saida).length ? saida : null;
    }

    function pctEtapa(lista) {
        if (!lista.length || lista.every(function (s) { return s === 'N/A'; })) return '';
        return lista.filter(ok).length / lista.length;
    }

    function statusBase(lista) {
        if (!lista.length || lista.every(function (s) { return s === 'N/A'; })) return 'Bloqueado';
        if (lista.some(function (s) { return s === BLOQUEADO; })) return 'Bloqueado';
        if (lista.every(ok)) return 'Concluído';
        if (lista.some(function (s) { return s === CONCLUIDO || s === ANDAMENTO; })) return 'Em andamento';
        return 'Não iniciado';
    }

    /** Status da etapa com o encadeamento: progresso antes da etapa anterior concluída vira Bloqueado. */
    function statusEtapa(task, n) {
        n = Number(n);
        var r = registro(task, n);
        if (n === 6 && r.aplicavel === 'Não') return 'N/A';
        var base = statusBase(r.status);
        if (n > 1) {
            var anterior = statusEtapa(task, n === 7 ? 5 : n - 1);
            if (n === 7) {
                var e6 = statusEtapa(task, 6);
                if (anterior !== 'Concluído' || (e6 !== 'Concluído' && e6 !== 'N/A')) return base === 'Não iniciado' ? 'Não iniciado' : 'Bloqueado';
            } else if (anterior !== 'Concluído' && anterior !== 'N/A') {
                return base === 'Não iniciado' ? 'Não iniciado' : 'Bloqueado';
            }
        }
        if (n === 8) {
            if (r.resultadoHypercare === '⛔ Incidente Crítico') return 'Bloqueado';
            if (base === 'Concluído') {
                var encerra = r.resultadoHypercare === '✅ Estável — Demanda Encerrada';
                var evolui = r.resultadoHypercare === '🆕 Evolução Identificada — Nova Demanda Aberta' && !!r.idNovaDemanda.trim();
                return encerra || evolui ? 'Concluído' : 'Em andamento';
            }
        }
        return base;
    }

    /** Edição travada (gate): a etapa anterior ainda não foi concluída; a E7 depende da E5 e da E6. */
    function bloqueada(task, n) {
        n = Number(n);
        if (n <= 1) return false;
        if (n === 7) {
            var e6 = statusEtapa(task, 6);
            return statusEtapa(task, 5) !== 'Concluído' || (e6 !== 'Concluído' && e6 !== 'N/A');
        }
        var anterior = statusEtapa(task, n - 1);
        return anterior !== 'Concluído' && anterior !== 'N/A';
    }

    function tracker(task) {
        var etapas = ETAPAS.map(function (e) {
            var st = statusEtapa(task, e.numero);
            return { etapa: e.numero, rotulo: e.codigo, nome: e.nome, gate: e.gate, status: st, pct: st === 'N/A' ? 1 : pctEtapa(registro(task, e.numero).status) };
        });
        var primeira = etapas.find(function (e) { return e.status !== 'Concluído' && e.status !== 'N/A'; });
        var encerradas = etapas.filter(function (e) { return e.status === 'Concluído' || e.status === 'N/A'; }).length;
        return {
            etapas: etapas,
            atual: primeira ? etapa(primeira.etapa) : null,
            etapaAtual: primeira ? primeira.rotulo + ' — ' + primeira.nome : '✔ Fluxo concluído',
            pctFluxo: encerradas / ETAPAS.length,
            bloqueada: etapas.some(function (e) { return e.status === 'Bloqueado'; })
        };
    }

    /** Situação geral, como no SGPI original. */
    function situacao(task) {
        var t = tracker(task), e8 = t.etapas[7].status;
        if (!t.atual) return 'Concluído';
        if (t.etapas[6].status === 'Concluído' && e8 !== 'Concluído') return 'Em Hypercare';
        if (t.bloqueada) return 'Bloqueado';
        return t.pctFluxo > 0 || t.etapas.some(function (e) { return e.status === 'Em andamento'; }) ? 'Em andamento' : 'Não iniciado';
    }

    /** Status equivalente do PGD (nao_iniciado / em_andamento / concluido), guiado pelas etapas do analista. */
    function statusGeral(task) {
        if (situacao(task) === 'Concluído') return 'concluido';
        var iniciou = [3, 4, 5, 6, 7, 8].some(function (n) { return statusBase(registro(task, n).status) !== 'Não iniciado'; });
        return iniciou ? 'em_andamento' : 'nao_iniciado';
    }

    function classeStatus(s) {
        return s === 'Concluído' || s === 'N/A' ? 'success' : s === 'Bloqueado' ? 'danger' : s === 'Em andamento' || s === 'Em Hypercare' ? 'warning' : 'info';
    }

    window.SGPI_WORKFLOW = {
        ETAPAS: ETAPAS, STATUS: STATUS, PADRAO: PADRAO, RESULTADOS_HYPERCARE: RESULTADOS_HYPERCARE, RESULTADOS_HOMOLOGACAO: RESULTADOS_HOMOLOGACAO,
        etapa: etapa, registro: registro, normalizar: normalizar, normalizarStatus: normalizarStatus,
        pctEtapa: pctEtapa, statusBase: statusBase, statusEtapa: statusEtapa, bloqueada: bloqueada,
        tracker: tracker, situacao: situacao, statusGeral: statusGeral, classeStatus: classeStatus
    };
})();

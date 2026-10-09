/* SGPI config.js — constantes, listas mestras, formatadores e dados de demonstração. */
(function (global) {
    'use strict';

    var SGPI = global.SGPI = global.SGPI || {};

    var STORAGE_KEYS = {
        msgExecutiva: 'sgpi:v1:msgExecutiva',
        prefs: 'sgpi:v1:prefs'
    };

    var LEGACY_STORAGE_KEYS = {
        atividades: 'sgpi:v1:atividades',
        semanal: 'sgpi:v1:semanal',
        conferencia: 'sgpi:v1:conferencia',
        meta: 'sgpi:v1:meta',
        planosAcao: 'sgpi:v1:planosAcao'
    };

    var FALLBACK_STORAGE_KEYS = {
        atividades: 'sgpi:fallback:atividades',
        semanal: 'sgpi:fallback:reportesSemanais',
        criterios: 'sgpi:fallback:criteriosWorkflow',
        conferencia: 'sgpi:fallback:conferencia',
        meta: 'sgpi:fallback:meta',
        planosAcao: 'sgpi:fallback:planosAcao',
        metadados: 'sgpi:fallback:metadados'
    };

    var ANALISTAS = [
        { nome: 'José Victor', prefixo: 'JV', arquivo: 'base-atividades-jose_victor.xlsx', aliases: [] },
        { nome: 'Viviane Lima', prefixo: 'VL', arquivo: 'base-atividades-viviane_lima.xlsx', aliases: [] },
        { nome: 'Juliana Santos', prefixo: 'JS', arquivo: 'base-atividades-juliana_santos.xlsx', aliases: ['base-atividades-juliana_santana.xlsx'] },
        { nome: 'Filipe Messias', prefixo: 'FM', arquivo: 'base-atividades-filipe_messias.xlsx', aliases: ['base-atividades-flipe_messias.xlsx'] }
    ];

    var ARQUIVOS_BASE = {
        caminho: 'C:\\controle-atividades\\base\\',
        gerencial: {
            arquivo: 'base_gerencial_gestor.xlsx',
            dono: 'Juliana Batista',
            abas: ['Base Gerencial', 'Acomp. Equipe']
        },
        analistas: ANALISTAS
    };

    var PROJETOS = [
        'Lumen',
        'V360',
        'Saneamento Base Contábil',
        'Newsletter',
        'Rotina Fiscal/Contábil',
        'Rotina Financeiro',
        'Investidas',
        'Actio',
        'Indicadores e Metas'
    ];

    var PILARES = [
        'Governança',
        'Melhoria Contínua',
        'Transformação Digital',
        'Business Intelligence',
        'PMO / Projetos',
        'Operação (Rotina)'
    ];

    var DEPTOS_CSC = [
        'Contas a Receber',
        'Tesouraria',
        'Auditoria Financeira CSC',
        'Recebimento Fiscal',
        'Processos Integrados',
        'Cartão Corporativo',
        'Tributos Federais',
        'Tributos Estaduais',
        'Contabilidade',
        'Faturamento',
        'CSC Corporativo',
        'Gestão'
    ];

    if (global.SGPICadastros) {
        try {
            var dyn = global.SGPICadastros.getCadastros();
            if (dyn.projetos && dyn.projetos.length) PROJETOS = dyn.projetos;
            if (dyn.pilares && dyn.pilares.length) PILARES = dyn.pilares;
            if (dyn.deptosCSC && dyn.deptosCSC.length) DEPTOS_CSC = dyn.deptosCSC;
            if (dyn.analistas && dyn.analistas.length) {
                ANALISTAS = dyn.analistas.map(function (a) {
                    return {
                        nome: a.nome,
                        prefixo: a.prefixo,
                        arquivo: a.arquivo || ('base-atividades-' + a.prefixo.toLowerCase() + '.xlsx'),
                        aliases: []
                    };
                });
                ARQUIVOS_BASE.analistas = ANALISTAS;
            }
        } catch (e) {}
    }

    var EMPRESAS = ['ELET', 'CHESF', 'ENOR', 'ESUL', 'Todas', 'Outra', 'N/A'];

    var STATUS = [
        'Concluído',
        'Em andamento',
        'Em validação',
        'Aguardando terceiros',
        'Não iniciado',
        'Cancelado'
    ];

    var TIPOS_DEMANDA = [
        'Automação',
        'Saneamento',
        'Dashboard',
        'Análise',
        'Rotina',
        'Governança',
        'Projeto'
    ];

    var PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa'];
    var COMPLEXIDADES = ['Alta', 'Média', 'Baixa'];
    var IMPACTOS = ['Alto', 'Médio', 'Baixo'];
    var CATEGORIAS_BENEFICIO = ['Produtividade', 'Qualidade', 'Compliance', 'Risco', 'Experiência', 'Receita', 'Custo'];
    var STATUS_CRITERIO = ['⏳ Pendente', '🔄 Em andamento', '✔ Concluído', '⛔ Bloqueado'];
    var ETAPAS_SUPERVISOR = [
        {
            numero: 1,
            codigo: 'E1',
            nome: 'Solicitação',
            criterios: [
                ['Necessidade Descrita', 'Descrição detalhada do problema, processo atual ou oportunidade de melhoria informada pelo solicitante.'],
                ['Origem Registrada', 'Identificação da fonte da demanda, como área, canal, solicitante ou diretoria.'],
                ['Identificação Completa', 'Cadastro com dados básicos da demanda e contatos das partes envolvidas.'],
                ['Cenário e Resultado Esperado', 'Detalhamento do cenário atual e dos resultados ou benefícios esperados.'],
                ['Impacto Informado', 'Avaliação prévia dos impactos operacionais, financeiros, de conformidade ou risco.'],
                ['Evidências Verificadas', 'Conferência inicial dos arquivos, anexos ou especificações enviados.'],
                ['Demanda Registrada', 'Criação formal da demanda na base mestre com código de identificação único.'],
                ['Recebimento Confirmado', 'Confirmação do recebimento e abertura oficial do atendimento.']
            ]
        },
        {
            numero: 2,
            codigo: 'E2',
            nome: 'Triagem',
            criterios: [
                ['Tipo da Demanda Definido', 'Classificação do tipo de atividade, melhoria, automação, correção ou projeto.'],
                ['Área Solicitante Confirmada', 'Confirmação formal do departamento CSC ou unidade solicitante.'],
                ['Prioridade Definida', 'Definição do nível de urgência e priorização de atendimento.'],
                ['Responsável Atribuído', 'Designação do analista responsável pela condução da demanda.'],
                ['Complexidade Avaliada', 'Estimativa do esforço, complexidade e recursos necessários.'],
                ['Categoria Definida', 'Enquadramento da demanda na categoria de benefício adequada.'],
                ['Projeto Relacionado Vinculado', 'Vínculo ao projeto estratégico ou pilar correspondente.'],
                ['Controle Atualizado no Tracker', 'Registro da triagem no controle oficial para acompanhamento.']
            ]
        }
    ].map(function (etapa) {
        etapa.criterios = etapa.criterios.map(function (criterio, index) {
            return { numero: index + 1, texto: criterio[0], ajuda: criterio[1] };
        });
        return etapa;
    });

    var CORES = {
        accent: '#0022F4',
        accent2: '#0000FF',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#be123c',
        neutral: '#64748b',
        alphas: ['rgba(0,34,244,0.85)', 'rgba(0,34,244,0.6)', 'rgba(0,34,244,0.35)', 'rgba(0,34,244,0.18)']
    };

    var TEMAS_PROJETO = {
        Lumen: [
            'Gestão de Acessos', 'Base Gerencial', 'Ritos de Performance', 'Indicadores', 'Conciliação',
            'Relatórios', 'Melhorias de Fluxo', 'Automação', 'Validações', 'Controles', 'Governança',
            'Documentação', 'Treinamentos', 'Sustentação'
        ],
        Newsletter: [
            'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09',
            'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18'
        ],
        V360: ['Dashboard Entrada de NF - TicketLog x V360', 'Saneamento de tickets', 'Esteira de notas']
    };

    /** Remove acentos, símbolos e excesso de espaços para comparar textos. */
    function normalizarChave(valor) {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .trim()
            .toLowerCase();
    }

    /** Normaliza respostas Sim/Não preservando vazio como Não. */
    function normalizarSimNao(valor) {
        var texto = normalizarChave(valor);
        return texto === 'sim' || texto === 's' || texto === 'yes' ? 'Sim' : 'Não';
    }

    /** Normaliza texto de status mantendo os emojis semanais quando existirem. */
    function normalizarTexto(valor) {
        return String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim();
    }

    /** Converte valores numéricos pt-BR ou Excel em número JS. */
    function numero(valor) {
        if (typeof valor === 'number' && isFinite(valor)) return valor;
        if (valor == null || valor === '') return 0;
        var texto = String(valor).trim();
        if (!texto) return 0;
        texto = texto.replace(/\s/g, '').replace(/R\$/g, '');
        if (texto.indexOf(',') >= 0) texto = texto.replace(/\./g, '').replace(',', '.');
        var n = Number(texto);
        return isFinite(n) ? n : 0;
    }

    /** Converte datas variadas em Date, ou null quando inválidas. */
    function data(valor) {
        if (!valor) return null;
        if (valor instanceof Date && !isNaN(valor.getTime())) return valor;
        if (typeof valor === 'number') {
            var serial = new Date(Date.UTC(1899, 11, 30) + valor * 86400000);
            return isNaN(serial.getTime()) ? null : serial;
        }
        var texto = String(valor).trim();
        var matchBr = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (matchBr) {
            var ano = Number(matchBr[3]);
            if (ano < 100) ano += 2000;
            var d = new Date(ano, Number(matchBr[2]) - 1, Number(matchBr[1]));
            return isNaN(d.getTime()) ? null : d;
        }
        var parsed = new Date(texto);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    /** Formata Date/string em dd/mm/aaaa. */
    function fmtData(valor) {
        var d = data(valor);
        if (!d) return '—';
        return d.toLocaleDateString('pt-BR');
    }

    /** Formata número com casas decimais pt-BR. */
    function fmtNum(valor, casas) {
        var n = numero(valor);
        var decimais = typeof casas === 'number' ? casas : 1;
        return n.toLocaleString('pt-BR', { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
    }

    /** Formata moeda em R$ sem centavos por padrão. */
    function fmtMoeda(valor, casas) {
        var decimais = typeof casas === 'number' ? casas : 0;
        return numero(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: decimais,
            maximumFractionDigits: decimais
        });
    }

    /** Formata percentual aceitando fração ou percentual cheio. */
    function fmtPct(valor, casas) {
        var n = numero(valor);
        if (Math.abs(n) > 1) n = n / 100;
        return n.toLocaleString('pt-BR', {
            style: 'percent',
            minimumFractionDigits: typeof casas === 'number' ? casas : 1,
            maximumFractionDigits: typeof casas === 'number' ? casas : 1
        });
    }

    /** Escapa texto para interpolação segura em HTML. */
    function escapeHtml(valor) {
        return String(valor == null ? '' : valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /** Devolve a data de hoje no formato ISO local. */
    function hojeIso() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function atividade(base) {
        var item = {
            analista: '',
            id: '',
            dataInicio: '',
            dataConclusao: '',
            departamento: 'Departamento E',
            projeto: '',
            tema: '',
            pilar: '',
            tipoDemanda: '',
            atividade: '',
            descricao: '',
            deptoCSC: '',
            pessoaEnvolvida: '',
            parceria: 'Não',
            papel: 'Responsável',
            parceiros: '',
            idPrincipal: '',
            empresa: 'Todas',
            status: 'Em andamento',
            horas: 0,
            tempoAntes: 0,
            tempoDepois: 0,
            ganho: 0,
            reducao: 0,
            resultado: '',
            pendencia: '',
            obsAnalista: '',
            validado: 'Sim',
            prioridade: 'Média',
            complexidade: 'Média',
            impacto: 'Médio',
            categoriaBeneficio: 'Produtividade',
            pessoasImpactadas: 0,
            economia: 0,
            obsExecutiva: '',
            destaque: 'Não'
        };
        Object.keys(base || {}).forEach(function (key) { item[key] = base[key]; });
        if (!item.reducao && item.tempoAntes > 0) item.reducao = (item.tempoAntes - item.tempoDepois) / item.tempoAntes;
        return item;
    }

    /** Cria dados de demonstração com os critérios de aceite do projeto. */
    function criarDadosDemo() {
        var atividades = [
            atividade({ analista: 'Filipe Messias', id: 'FM-0001', dataInicio: '2026-06-01', dataConclusao: '2026-06-10', projeto: 'Lumen', tema: 'Base Gerencial', pilar: 'Business Intelligence', tipoDemanda: 'Dashboard', atividade: 'Painel de produtividade da torre', descricao: 'Construção de indicadores executivos para leitura semanal.', deptoCSC: 'Gestão', pessoaEnvolvida: 'Juliana Batista', status: 'Concluído', horas: 14, tempoAntes: 32, tempoDepois: 12.5, ganho: 19.5, resultado: 'Painel publicado e validado pela supervisão.', prioridade: 'Alta', impacto: 'Alto', pessoasImpactadas: 12, economia: 7800, destaque: 'Sim' }),
            atividade({ analista: 'Filipe Messias', id: 'FM-0002', dataInicio: '2026-06-03', projeto: 'V360', tema: 'Dashboard Entrada de NF - TicketLog x V360', pilar: 'Transformação Digital', tipoDemanda: 'Automação', atividade: 'Reconciliação TicketLog x V360', descricao: 'Fluxo de comparação de notas e tickets para reduzir retrabalho.', deptoCSC: 'Recebimento Fiscal', pessoaEnvolvida: 'Marina Costa', parceria: 'Sim', parceiros: 'José Victor', status: 'Em andamento', horas: 16, tempoAntes: 28, tempoDepois: 12, ganho: 16, resultado: 'Protótipo funcional com amostra de notas.', pendencia: 'Validar regras finais com Recebimento Fiscal.', prioridade: 'Alta', complexidade: 'Alta', impacto: 'Alto', pessoasImpactadas: 8, economia: 6400, destaque: 'Sim' }),
            atividade({ analista: 'Filipe Messias', id: 'FM-0003', dataInicio: '2026-06-05', dataConclusao: '2026-06-14', projeto: 'Newsletter', tema: 'M04', pilar: 'Governança', tipoDemanda: 'Governança', atividade: 'Curadoria de indicadores M04', descricao: 'Padronização dos indicadores divulgados na newsletter.', deptoCSC: 'CSC Corporativo', pessoaEnvolvida: 'Rafael Dias', status: 'Concluído', horas: 10, tempoAntes: 18, tempoDepois: 7, ganho: 11, resultado: 'Edição mensal publicada com novos indicadores.', pessoasImpactadas: 30, economia: 3100 }),
            atividade({ analista: 'Filipe Messias', id: 'FM-0004', dataInicio: '2026-06-06', projeto: 'Saneamento Base Contábil', tema: 'Validações', pilar: 'Melhoria Contínua', tipoDemanda: 'Saneamento', atividade: 'Saneamento de centros de custo', descricao: 'Revisão de inconsistências entre base contábil e relatórios gerenciais.', deptoCSC: 'Contabilidade', pessoaEnvolvida: 'Patrícia Melo', status: 'Em validação', horas: 12, tempoAntes: 24, tempoDepois: 10.5, ganho: 13.5, resultado: 'Regras de validação configuradas.', prioridade: 'Alta', impacto: 'Alto', pessoasImpactadas: 9, economia: 5200 }),
            atividade({ analista: 'Filipe Messias', id: 'FM-0005', dataInicio: '2026-06-08', dataConclusao: '2026-06-18', projeto: 'Rotina Financeiro', tema: 'Fechamento', pilar: 'Operação (Rotina)', tipoDemanda: 'Rotina', atividade: 'Checklist de fechamento financeiro', descricao: 'Roteiro de conferência para fechamento mensal.', deptoCSC: 'Tesouraria', pessoaEnvolvida: 'Cláudio Martins', status: 'Concluído', horas: 8, tempoAntes: 16, tempoDepois: 7.2, ganho: 8.8, resultado: 'Checklist em uso pela equipe.', validado: 'Não', pessoasImpactadas: 5, economia: 2500 }),
            atividade({ analista: 'Filipe Messias', id: 'FM-0006', dataInicio: '2026-06-12', projeto: 'Actio', tema: 'Integração', pilar: 'PMO / Projetos', tipoDemanda: 'Projeto', atividade: 'Integração de indicadores no Actio', descricao: 'Ajuste de integração pendente de retorno de área parceira.', deptoCSC: 'Gestão', pessoaEnvolvida: 'Daniel Rocha', status: 'Aguardando terceiros', horas: 18, tempoAntes: 26, tempoDepois: 14, ganho: 12, resultado: 'Mapeamento de campos concluído.', pendencia: 'Aguardando liberação de perfil sistêmico.', prioridade: 'Alta', complexidade: 'Alta', impacto: 'Médio', pessoasImpactadas: 7, economia: 4100 }),
            atividade({ analista: 'Filipe Messias', id: 'FM-0007', dataInicio: '2026-06-27', projeto: 'Investidas', tema: 'Mapeamento', pilar: 'Governança', tipoDemanda: 'Análise', atividade: 'Mapeamento de rotina de investidas', descricao: 'Levantamento inicial de responsabilidades e insumos.', deptoCSC: 'Contabilidade', pessoaEnvolvida: 'Fernanda Lima', status: 'Não iniciado', horas: 6, tempoAntes: 0, tempoDepois: 0, ganho: 0, resultado: '', pendencia: 'Agendar reunião inicial.', pessoasImpactadas: 3, economia: 0 }),
            atividade({ analista: 'Filipe Messias', id: 'FM-0008', dataInicio: '2026-06-15', dataConclusao: '2026-06-25', projeto: 'Indicadores e Metas', tema: 'Metas 2026', pilar: 'Business Intelligence', tipoDemanda: 'Dashboard', atividade: 'Atualização de metas da equipe', descricao: 'Inclusão de metas do ciclo vigente no acompanhamento.', deptoCSC: 'Gestão', pessoaEnvolvida: 'Juliana Batista', status: 'Concluído', horas: 9, tempoAntes: 20, tempoDepois: 9.5, ganho: 10.5, resultado: 'Metas integradas ao painel.', pessoasImpactadas: 6, economia: 3600 }),
            atividade({ analista: 'José Victor', id: 'JV-0001', dataInicio: '2026-06-02', dataConclusao: '2026-06-11', projeto: 'Rotina Fiscal/Contábil', tema: 'Apuração', pilar: 'Operação (Rotina)', tipoDemanda: 'Rotina', atividade: 'Padronização da apuração fiscal', descricao: 'Roteiro único para fechamento de dados fiscais.', deptoCSC: 'Tributos Federais', pessoaEnvolvida: 'Sérgio Tavares', status: 'Concluído', horas: 11, tempoAntes: 22, tempoDepois: 10, ganho: 12, resultado: 'Procedimento validado com Tributos Federais.', pessoasImpactadas: 5, economia: 4200 }),
            atividade({ analista: 'José Victor', id: 'JV-0002', dataInicio: '2026-06-04', projeto: 'V360', tema: 'Esteira de notas', pilar: 'Transformação Digital', tipoDemanda: 'Apoio', atividade: 'Apoio na conciliação TicketLog', descricao: 'Apoio técnico vinculado ao fluxo principal FM-0002.', deptoCSC: 'Recebimento Fiscal', pessoaEnvolvida: 'Marina Costa', papel: 'Apoio', idPrincipal: 'FM-0002', status: 'Concluído', horas: 7, tempoAntes: 0, tempoDepois: 0, ganho: 0, resultado: 'Apoio entregue ao responsável.', pessoasImpactadas: 0, economia: 0 }),
            atividade({ analista: 'José Victor', id: 'JV-0003', dataInicio: '2026-06-20', projeto: 'Lumen', tema: 'Validações', pilar: 'Governança', tipoDemanda: 'Análise', atividade: 'Revisão de regras de validação', descricao: 'Conferência das regras de validação da base gerencial.', deptoCSC: 'Processos Integrados', pessoaEnvolvida: 'Juliana Batista', status: 'Em andamento', horas: 9, tempoAntes: 15, tempoDepois: 8, ganho: 7, resultado: 'Primeira rodada concluída.', pendencia: 'Ajustar tratamento de valores nulos.', pessoasImpactadas: 4, economia: 2100 }),
            atividade({ analista: 'Viviane Lima', id: 'VL-0001', dataInicio: '2026-06-01', dataConclusao: '2026-06-12', projeto: 'Saneamento Base Contábil', tema: 'Conciliação', pilar: 'Melhoria Contínua', tipoDemanda: 'Saneamento', atividade: 'Conciliação de contas transitórias', descricao: 'Redução de pendências contábeis recorrentes.', deptoCSC: 'Contabilidade', pessoaEnvolvida: 'Patrícia Melo', status: 'Concluído', horas: 12, tempoAntes: 30, tempoDepois: 12, ganho: 18, resultado: 'Pendências antigas saneadas.', impacto: 'Alto', pessoasImpactadas: 7, economia: 6800, destaque: 'Sim' }),
            atividade({ analista: 'Viviane Lima', id: 'VL-0002', dataInicio: '2026-06-10', dataConclusao: '2026-06-28', projeto: 'Rotina Fiscal/Contábil', tema: 'Recebimento fiscal', pilar: 'Operação (Rotina)', tipoDemanda: 'Rotina', atividade: 'Melhoria no controle de recebimento fiscal', descricao: 'Ajustes de controle para reduzir retrabalho com notas.', deptoCSC: 'Recebimento Fiscal', pessoaEnvolvida: 'Bianca Nunes', status: 'Concluído', horas: 10, tempoAntes: 20, tempoDepois: 8.5, ganho: 11.5, resultado: 'Fluxo revisado e documentado.', pessoasImpactadas: 6, economia: 3700 }),
            atividade({ analista: 'Viviane Lima', id: 'VL-0003', dataInicio: '2026-06-24', projeto: 'Newsletter', tema: 'M05', pilar: 'Governança', tipoDemanda: 'Governança', atividade: 'Resumo mensal de governança', descricao: 'Consolidação dos avanços para comunicação interna.', deptoCSC: 'CSC Corporativo', pessoaEnvolvida: 'Rafael Dias', status: 'Em andamento', horas: 8, tempoAntes: 12, tempoDepois: 5, ganho: 7, resultado: 'Rascunho estruturado.', pendencia: 'Receber validação da supervisão.', pessoasImpactadas: 22, economia: 1800 }),
            atividade({ analista: 'Juliana Santos', id: 'JS-0001', dataInicio: '2026-06-09', dataConclusao: '2026-06-21', projeto: 'Rotina Financeiro', tema: 'Baixas', pilar: 'Melhoria Contínua', tipoDemanda: 'Automação', atividade: 'Automação de baixas recorrentes', descricao: 'Roteiro semiautomático para baixas de baixa complexidade.', deptoCSC: 'Contas a Receber', pessoaEnvolvida: 'Laura Almeida', status: 'Concluído', horas: 6, tempoAntes: 14, tempoDepois: 6, ganho: 8, resultado: 'Modelo validado em amostra.', pessoasImpactadas: 4, economia: 2600 }),
            atividade({ analista: 'Juliana Santos', id: 'JS-0002', dataInicio: '2026-06-13', projeto: 'Lumen', tema: 'Gestão de Acessos', pilar: 'Governança', tipoDemanda: 'Projeto', atividade: 'Regularização de acessos críticos', descricao: 'Pendência depende de retorno de área externa para liberar perfis.', deptoCSC: 'Auditoria Financeira CSC', pessoaEnvolvida: 'Aline Barros', status: 'Aguardando terceiros', horas: 5, tempoAntes: 0, tempoDepois: 0, ganho: 0, resultado: 'Levantamento concluído.', pendencia: 'Aguardar matriz de perfis revisada.', prioridade: 'Alta', complexidade: 'Alta', impacto: 'Alto', pessoasImpactadas: 10, economia: 0 }),
            atividade({ analista: 'Juliana Santos', id: 'JS-0003', dataInicio: '2026-06-17', projeto: 'Indicadores e Metas', tema: 'Ritos de Performance', pilar: 'PMO / Projetos', tipoDemanda: 'Dashboard', atividade: 'Rito semanal de performance', descricao: 'Estruturação do acompanhamento semanal da equipe.', deptoCSC: 'Gestão', pessoaEnvolvida: 'Juliana Batista', status: 'Aguardando terceiros', horas: 5, tempoAntes: 18, tempoDepois: 6, ganho: 12, resultado: 'Modelo do rito desenhado.', pendencia: 'Confirmar agenda com participantes.', pessoasImpactadas: 5, economia: 3400, destaque: 'Sim' })
        ];

        var semanal = [
            reporte('Filipe Messias', '2026-S27', 'FM-0006', 'Actio', 'Integração de indicadores no Actio', '⏸ Aguardando Terceiros', 'Aguardando liberação de perfil sistêmico.', 'Mapeamento técnico concluído.', 'Retomar com TI e confirmar liberação.', 'Não', 'TI Corporativa', '2026-07-17', 0.45, 1),
            reporte('Filipe Messias', '2026-S28', 'FM-0006', 'Actio', 'Integração de indicadores no Actio', '🟡 Em andamento', 'Perfil liberado parcialmente.', 'Teste de integração iniciado.', 'Fechar evidências e validar carga.', 'Sim', 'Filipe Messias', '2026-07-24', 0.55, 2),
            reporte('Juliana Santos', '2026-S27', 'JS-0002', 'Lumen', 'Regularização de acessos críticos', '🔴 Bloqueado', 'Sem retorno da matriz de perfis.', 'Levantamento de usuários concluído.', 'Acionar Auditoria Financeira CSC.', 'Sim', 'Auditoria Financeira CSC', '2026-07-18', 0.3, 1),
            reporte('Juliana Santos', '2026-S28', 'JS-0002', 'Lumen', 'Regularização de acessos críticos', '🔴 Bloqueado', 'Matriz de perfis ainda não aprovada.', 'Cobrança enviada.', 'Escalar para supervisão.', 'Sim', 'Juliana Batista', '2026-07-22', 0.35, 2),
            reporte('Filipe Messias', '2026-S28', 'FM-0002', 'V360', 'Reconciliação TicketLog x V360', '🟡 Em andamento', 'Regras finais em validação.', 'Protótipo rodou com amostra.', 'Receber validação de Recebimento Fiscal.', 'Sim', 'Recebimento Fiscal', '2026-07-19', 0.72, 1),
            reporte('José Victor', '2026-S28', 'JV-0003', 'Lumen', 'Revisão de regras de validação', '🟡 Em andamento', 'Tratamento de nulos pendente.', 'Mapeamento das regras concluído.', 'Ajustar exceções e submeter para validação.', 'Não', 'José Victor', '2026-07-20', 0.65, 1),
            reporte('Viviane Lima', '2026-S28', 'VL-0002', 'Rotina Fiscal/Contábil', 'Melhoria no controle de recebimento fiscal', '🟢 Concluído', '', 'Fluxo revisado e documentado.', 'Acompanhar sustentação.', 'Não', 'Viviane Lima', '2026-07-15', 1, 1),
            reporte('Juliana Santos', '2026-S28', 'JS-0003', 'Indicadores e Metas', 'Rito semanal de performance', '⏸ Aguardando Terceiros', 'Agenda com participantes pendente.', 'Modelo do rito desenhado.', 'Confirmar agenda final.', 'Não', 'Gestão', '2026-07-23', 0.5, 1)
        ];

        atribuirChavesSemanais(semanal);

        var conferencia = {
            arquivos: ['base-atividades-filipe_messias_demo.xlsx'],
            geradoEm: new Date().toISOString(),
            divergencias: [
                {
                    tipo: 'Pendente de consolidação',
                    severidade: 'danger',
                    analista: 'Filipe Messias',
                    id: 'FM-0099',
                    statusAnalista: 'Em andamento',
                    statusBase: '—',
                    mensagem: 'ID presente no arquivo do analista e ausente na Base Gerencial.'
                }
            ]
        };

        return {
            atividades: atividades,
            semanal: semanal,
            conferencia: conferencia,
            meta: {
                nomeArquivo: 'Dados de demonstração SGPI',
                dataCarga: new Date().toISOString(),
                totalLinhas: atividades.length,
                totalSemanal: semanal.length,
                avisos: ['Carga demonstrativa gerada localmente para validação dos fluxos.']
            }
        };
    }

    function reporte(analista, semana, id, projeto, atividade, statusSemana, motivoStatus, realizadoSemana, proximoPasso, necessitaApoio, respPendencia, previsaoConclusao, evolucao, semanasReportadas) {
        return {
            analista: analista,
            semana: semana,
            id: id,
            projeto: projeto,
            atividade: atividade,
            statusSemana: statusSemana,
            motivoStatus: motivoStatus,
            realizadoSemana: realizadoSemana,
            proximoPasso: proximoPasso,
            necessitaApoio: necessitaApoio,
            respPendencia: respPendencia,
            previsaoConclusao: previsaoConclusao,
            evolucao: evolucao,
            semanasReportadas: semanasReportadas
        };
    }

    function atribuirChavesSemanais(lista) {
        var contadores = {};
        (lista || []).forEach(function (item) {
            var base = (item.semana || 'semana') + '|' + (item.id || 'sem-id');
            contadores[base] = (contadores[base] || 0) + 1;
            item.chave = base + '|' + contadores[base];
        });
    }

    if (!global.SGPIExchangeContract) {
        throw new Error('Contrato de intercâmbio SGPI não carregado. Mantenha a pasta shared junto aos portais.');
    }

    SGPI.config = {
        versao: '1.1.0',
        contratoIntercambio: global.SGPIExchangeContract,
        storageKeys: STORAGE_KEYS,
        legacyStorageKeys: LEGACY_STORAGE_KEYS,
        fallbackStorageKeys: FALLBACK_STORAGE_KEYS,
        forcarContingenciaIndexedDB: false,
        arquivosBase: ARQUIVOS_BASE,
        analistas: ANALISTAS,
        supervisora: 'Juliana Batista',
        projetos: PROJETOS,
        pilares: PILARES,
        deptosCSC: DEPTOS_CSC,
        empresas: EMPRESAS,
        status: STATUS,
        tiposDemanda: TIPOS_DEMANDA,
        prioridades: PRIORIDADES,
        complexidades: COMPLEXIDADES,
        impactos: IMPACTOS,
        categoriasBeneficio: CATEGORIAS_BENEFICIO,
        statusCriterio: STATUS_CRITERIO,
        etapasSupervisor: ETAPAS_SUPERVISOR,
        temasProjeto: TEMAS_PROJETO,
        cores: CORES,
        criarDadosDemo: criarDadosDemo
    };

    SGPI.utils = {
        normalizarChave: normalizarChave,
        normalizarSimNao: normalizarSimNao,
        normalizarTexto: normalizarTexto,
        numero: numero,
        data: data,
        fmtData: fmtData,
        fmtNum: fmtNum,
        fmtMoeda: fmtMoeda,
        fmtPct: fmtPct,
        escapeHtml: escapeHtml,
        hojeIso: hojeIso
    };
})(window);

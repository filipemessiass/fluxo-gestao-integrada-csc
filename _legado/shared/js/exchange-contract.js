/*
 * SGPI Exchange Contract 1.0.1
 * Contrato canônico, versionado e compartilhado pelos portais Analista e Supervisor.
 * O arquivo é compatível com execução local (file://) e não depende de backend ou build.
 */
(function (root, factory) {
    'use strict';

    var contract = factory();
    root.SGPIExchangeContract = contract;

    if (typeof module === 'object' && module.exports) {
        module.exports = contract;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var CONTRACT_ID = 'br.com.sgpi.exchange';
    var SCHEMA_VERSION = '1.0.1';

    var FILE_TYPES = {
        ANALYST_TO_SUPERVISOR: 'ANALYST_TO_SUPERVISOR',
        SUPERVISOR_TO_ANALYST: 'SUPERVISOR_TO_ANALYST'
    };

    var ROLES = {
        ANALYST: 'ANALYST',
        SUPERVISOR: 'SUPERVISOR',
        SYSTEM: 'SYSTEM',
        SHARED: 'SHARED'
    };

    var SHEETS = {
        META: '_SGPI_META',
        DEMANDS: 'DEMANDAS',
        CRITERIA: 'CRITERIOS',
        WEEKLY_REPORTS: 'REPORTES',
        ACTION_PLANS: 'PLANOS_ACAO',
        CONFLICTS: 'CONFLITOS',
        AUDIT: 'AUDITORIA'
    };

    var METADATA_FIELDS = [
        { key: 'contractId', header: 'Contrato', required: true },
        { key: 'schemaVersion', header: 'Versão do Schema', required: true },
        { key: 'fileType', header: 'Tipo do Arquivo', required: true },
        { key: 'exportId', header: 'ID da Exportação', required: true },
        { key: 'parentExportId', header: 'ID da Exportação Pai', required: false },
        { key: 'datasetId', header: 'ID do Conjunto de Dados', required: true },
        { key: 'generatedAt', header: 'Gerado em', required: true },
        { key: 'sourceRole', header: 'Papel de Origem', required: true },
        { key: 'sourceProfile', header: 'Perfil de Origem', required: true },
        { key: 'targetRole', header: 'Papel de Destino', required: true },
        { key: 'targetProfile', header: 'Perfil de Destino', required: false },
        { key: 'appVersion', header: 'Versão da Aplicação', required: true },
        { key: 'recordCounts', header: 'Contagem de Registros', required: true },
        { key: 'notes', header: 'Observações', required: false }
    ];

    function field(key, header, type, owner, options) {
        var spec = {
            key: key,
            header: header,
            type: type || 'text',
            owner: owner || ROLES.SHARED,
            required: false,
            aliases: []
        };
        Object.keys(options || {}).forEach(function (optionKey) {
            spec[optionKey] = options[optionKey];
        });
        return spec;
    }

    var RECORD_CONTROL_FIELDS = [
        field('uid', 'UID SGPI', 'uuid', ROLES.SYSTEM, { required: true }),
        field('revision', 'Revisão', 'integer', ROLES.SYSTEM, { required: true }),
        field('updatedAt', 'Atualizado em', 'datetime', ROLES.SYSTEM, { required: true }),
        field('updatedBy', 'Atualizado por', 'text', ROLES.SYSTEM, { required: true }),
        field('sourceRole', 'Papel de Origem', 'enum', ROLES.SYSTEM, { required: true }),
        field('sourceProfile', 'Perfil de Origem', 'text', ROLES.SYSTEM, { required: true }),
        field('deletedAt', 'Excluído em', 'datetime', ROLES.SYSTEM)
    ];

    var DEMAND_FIELDS = RECORD_CONTROL_FIELDS.concat([
        field('id', 'ID', 'text', ROLES.SYSTEM, { required: true, aliases: ['ID Único', 'ID Origem'] }),
        field('analista', 'Analista', 'text', ROLES.SUPERVISOR, { required: true }),
        field('dataInicio', 'Data Início', 'date', ROLES.SHARED),
        field('dataConclusao', 'Data Conclusão', 'date', ROLES.ANALYST),
        field('departamento', 'Departamento', 'text', ROLES.SUPERVISOR),
        field('projeto', 'Projeto', 'text', ROLES.SHARED),
        field('tema', 'Tema', 'text', ROLES.SHARED),
        field('pilar', 'Pilar Proc. Integrados', 'text', ROLES.SUPERVISOR, { aliases: ['Pilar'] }),
        field('tipoDemanda', 'Tipo de Demanda', 'text', ROLES.SUPERVISOR),
        field('atividade', 'Atividade (título curto)', 'text', ROLES.SHARED, { required: true, aliases: ['Atividade'] }),
        field('descricao', 'Descrição', 'text', ROLES.SHARED),
        field('deptoCSC', 'Depto. Envolvido (CSC)', 'text', ROLES.SUPERVISOR),
        field('pessoaEnvolvida', 'Pessoa Envolvida', 'text', ROLES.SHARED),
        field('parceria', 'Parceria?', 'boolean-text', ROLES.SHARED),
        field('papel', 'Papel na Atividade', 'text', ROLES.SUPERVISOR),
        field('parceiros', 'Parceiros (equipe PI)', 'text', ROLES.SHARED, { aliases: ['Parceiros'] }),
        field('idPrincipal', 'ID Atividade Principal', 'text', ROLES.SUPERVISOR),
        field('empresa', 'Empresa', 'text', ROLES.SHARED),
        field('status', 'Status', 'text', ROLES.SYSTEM),
        field('horas', 'Horas Gastas', 'decimal', ROLES.ANALYST),
        field('tempoAntes', 'Tempo Antes (h/mês)', 'decimal', ROLES.ANALYST),
        field('tempoDepois', 'Tempo Depois (h/mês)', 'decimal', ROLES.ANALYST),
        field('ganho', 'Ganho (h/mês)', 'decimal', ROLES.SYSTEM),
        field('reducao', '% Redução', 'percentage', ROLES.SYSTEM),
        field('resultado', 'Resultado Alcançado', 'text', ROLES.ANALYST),
        field('pendencia', 'Pendência / Próximo Passo', 'text', ROLES.ANALYST),
        field('observacao', 'Observação Analista', 'text', ROLES.ANALYST, { aliases: ['Observação'] }),
        field('statusE08', 'Status E08', 'text', ROLES.SYSTEM),
        field('pctE08', '% E08', 'percentage', ROLES.SYSTEM),
        field('inicioHypercare', 'Início Hypercare', 'date', ROLES.ANALYST),
        field('encerramentoPrevisto', 'Encerramento Previsto', 'date', ROLES.SYSTEM),
        field('encerramentoReal', 'Encerramento Real', 'date', ROLES.ANALYST),
        field('diasHypercare', 'Dias Hypercare', 'integer', ROLES.SYSTEM),
        field('situacaoPrazoE08', 'Situação Prazo E08', 'text', ROLES.SYSTEM),
        field('resultadoHypercare', 'Resultado Hypercare', 'text', ROLES.ANALYST),
        field('idNovaDemanda', 'ID Nova Demanda', 'text', ROLES.SYSTEM),
        field('leadTimeTotal', 'Lead Time Total', 'integer', ROLES.SYSTEM),
        field('statusGeralDefinitivo', 'Status Geral Definitivo', 'text', ROLES.SYSTEM),
        field('validado', 'Validado', 'boolean-text', ROLES.SUPERVISOR),
        field('prioridade', 'Prioridade', 'text', ROLES.SUPERVISOR),
        field('complexidade', 'Complexidade', 'text', ROLES.SUPERVISOR),
        field('impacto', 'Impacto', 'text', ROLES.SUPERVISOR),
        field('categoriaBeneficio', 'Categoria de Benefício', 'text', ROLES.SUPERVISOR),
        field('pessoasImpactadas', 'Pessoas Impactadas', 'integer', ROLES.SUPERVISOR),
        field('economia', 'Economia Estimada (R$)', 'decimal', ROLES.SUPERVISOR),
        field('observacaoExecutiva', 'Observação Executiva', 'text', ROLES.SUPERVISOR),
        field('destaqueReport', 'Destaque Report', 'boolean-text', ROLES.SUPERVISOR, { aliases: ['Destaque'] })
    ]);

    var CRITERIA_FIELDS = RECORD_CONTROL_FIELDS.concat([
        field('demandUid', 'UID da Demanda', 'uuid', ROLES.SYSTEM, { required: true }),
        field('demandId', 'ID da Demanda', 'text', ROLES.SYSTEM, { required: true, aliases: ['ID'] }),
        field('stage', 'Etapa', 'integer', ROLES.SYSTEM, { required: true }),
        field('criterionNumber', 'Número do Critério', 'integer', ROLES.SYSTEM, { required: true }),
        field('criterionText', 'Critério', 'text', ROLES.SYSTEM, { required: true }),
        field('status', 'Status do Critério', 'text', ROLES.SHARED, { required: true }),
        field('evidence', 'Evidência / Referência', 'text', ROLES.SHARED),
        field('observation', 'Observação', 'text', ROLES.SHARED),
        field('homologationResult', 'Resultado da Homologação', 'text', ROLES.ANALYST),
        field('applicable', 'Etapa Aplicável?', 'boolean-text', ROLES.ANALYST),
        field('hypercareResult', 'Resultado Hypercare', 'text', ROLES.ANALYST),
        field('hypercareStart', 'Início Hypercare', 'date', ROLES.ANALYST),
        field('hypercareDays', 'Prazo Hypercare (dias)', 'integer', ROLES.ANALYST),
        field('closedAt', 'Encerramento Real', 'date', ROLES.ANALYST),
        field('newDemandId', 'ID Nova Demanda', 'text', ROLES.SYSTEM)
    ]);

    var WEEKLY_REPORT_FIELDS = RECORD_CONTROL_FIELDS.concat([
        field('demandUid', 'UID da Demanda', 'uuid', ROLES.SYSTEM, { required: true }),
        field('demandId', 'ID da Demanda', 'text', ROLES.SYSTEM, { required: true, aliases: ['ID'] }),
        field('analista', 'Analista', 'text', ROLES.SUPERVISOR, { required: true }),
        field('week', 'Semana', 'text', ROLES.ANALYST, { required: true }),
        field('project', 'Projeto', 'text', ROLES.SHARED),
        field('activity', 'Atividade', 'text', ROLES.SHARED),
        field('weeklyStatus', 'Status Semana', 'text', ROLES.ANALYST),
        field('statusReason', 'Motivo Status', 'text', ROLES.ANALYST),
        field('completed', 'Realizado Semana', 'text', ROLES.ANALYST),
        field('nextStep', 'Próximo Passo', 'text', ROLES.ANALYST),
        field('needsSupport', 'Necessita Apoio', 'boolean-text', ROLES.ANALYST),
        field('pendingOwner', 'Responsável pela Pendência', 'text', ROLES.ANALYST, { aliases: ['Resp Pendência'] }),
        field('forecastDate', 'Previsão Conclusão', 'date', ROLES.ANALYST),
        field('progress', 'Evolução', 'percentage', ROLES.SYSTEM),
        field('weeksReported', 'Semanas Reportadas', 'integer', ROLES.SYSTEM)
    ]);

    var ACTION_PLAN_FIELDS = RECORD_CONTROL_FIELDS.concat([
        field('demandUid', 'UID da Demanda', 'uuid', ROLES.SYSTEM, { required: true }),
        field('demandId', 'ID da Demanda', 'text', ROLES.SYSTEM, { required: true, aliases: ['ID'] }),
        field('activity', 'Atividade', 'text', ROLES.SHARED),
        field('project', 'Projeto', 'text', ROLES.SHARED),
        field('plan', 'Plano de Ação', 'text', ROLES.SUPERVISOR, { required: true, aliases: ['Plano'] }),
        field('deadline', 'Prazo', 'date', ROLES.SUPERVISOR),
        field('responsible', 'Responsável', 'text', ROLES.SUPERVISOR)
    ]);

    var CONFLICT_FIELDS = [
        field('conflictUid', 'UID do Conflito', 'uuid', ROLES.SYSTEM, { required: true }),
        field('demandUid', 'UID da Demanda', 'uuid', ROLES.SYSTEM, { required: true }),
        field('demandId', 'ID da Demanda', 'text', ROLES.SYSTEM, { required: true }),
        field('field', 'Campo', 'text', ROLES.SYSTEM, { required: true }),
        field('localValue', 'Valor Local', 'text', ROLES.SYSTEM),
        field('incomingValue', 'Valor Recebido', 'text', ROLES.SYSTEM),
        field('resolution', 'Resolução', 'text', ROLES.SUPERVISOR),
        field('resolvedAt', 'Resolvido em', 'datetime', ROLES.SYSTEM),
        field('resolvedBy', 'Resolvido por', 'text', ROLES.SUPERVISOR)
    ];

    var AUDIT_FIELDS = [
        field('eventUid', 'UID do Evento', 'uuid', ROLES.SYSTEM, { required: true }),
        field('occurredAt', 'Ocorrido em', 'datetime', ROLES.SYSTEM, { required: true }),
        field('actorRole', 'Papel do Autor', 'enum', ROLES.SYSTEM, { required: true }),
        field('actorProfile', 'Perfil do Autor', 'text', ROLES.SYSTEM, { required: true }),
        field('action', 'Ação', 'text', ROLES.SYSTEM, { required: true }),
        field('entityType', 'Tipo da Entidade', 'text', ROLES.SYSTEM, { required: true }),
        field('entityUid', 'UID da Entidade', 'uuid', ROLES.SYSTEM),
        field('entityId', 'ID Visível', 'text', ROLES.SYSTEM),
        field('details', 'Detalhes', 'text', ROLES.SYSTEM)
    ];

    var SCHEMAS = {};
    SCHEMAS[SHEETS.DEMANDS] = DEMAND_FIELDS;
    SCHEMAS[SHEETS.CRITERIA] = CRITERIA_FIELDS;
    SCHEMAS[SHEETS.WEEKLY_REPORTS] = WEEKLY_REPORT_FIELDS;
    SCHEMAS[SHEETS.ACTION_PLANS] = ACTION_PLAN_FIELDS;
    SCHEMAS[SHEETS.CONFLICTS] = CONFLICT_FIELDS;
    SCHEMAS[SHEETS.AUDIT] = AUDIT_FIELDS;

    var FILE_RULES = {};
    FILE_RULES[FILE_TYPES.ANALYST_TO_SUPERVISOR] = {
        sourceRole: ROLES.ANALYST,
        targetRole: ROLES.SUPERVISOR,
        requiredSheets: [SHEETS.DEMANDS, SHEETS.CRITERIA, SHEETS.WEEKLY_REPORTS],
        optionalSheets: [SHEETS.ACTION_PLANS, SHEETS.CONFLICTS, SHEETS.AUDIT]
    };
    FILE_RULES[FILE_TYPES.SUPERVISOR_TO_ANALYST] = {
        sourceRole: ROLES.SUPERVISOR,
        targetRole: ROLES.ANALYST,
        requiredSheets: [SHEETS.DEMANDS, SHEETS.CRITERIA, SHEETS.ACTION_PLANS],
        optionalSheets: [SHEETS.CONFLICTS, SHEETS.AUDIT]
    };

    function normalize(value) {
        return String(value == null ? '' : value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function isIsoDate(value) {
        if (value instanceof Date) return !Number.isNaN(value.getTime());
        return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
    }

    function isIsoDateTime(value) {
        if (value instanceof Date) return !Number.isNaN(value.getTime());
        var text = String(value || '');
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(text) && !Number.isNaN(Date.parse(text));
    }

    function isBlank(value) {
        return value == null || String(value).trim() === '';
    }

    function versionParts(version) {
        var match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || ''));
        return match ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) } : null;
    }

    function isCompatibleVersion(version) {
        var current = versionParts(SCHEMA_VERSION);
        var received = versionParts(version);
        return Boolean(current && received && current.major === received.major && received.minor <= current.minor);
    }

    function randomId(prefix) {
        var uuid = '';
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            uuid = crypto.randomUUID();
        } else {
            uuid = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
        }
        return (prefix ? prefix + '-' : '') + uuid;
    }

    function buildMetadata(options) {
        options = options || {};
        var fileType = options.fileType;
        var rule = FILE_RULES[fileType] || {};
        return {
            contractId: CONTRACT_ID,
            schemaVersion: SCHEMA_VERSION,
            fileType: fileType || '',
            exportId: options.exportId || randomId('exp'),
            parentExportId: options.parentExportId || '',
            datasetId: options.datasetId || randomId('dataset'),
            generatedAt: options.generatedAt || new Date().toISOString(),
            sourceRole: options.sourceRole || rule.sourceRole || '',
            sourceProfile: options.sourceProfile || '',
            targetRole: options.targetRole || rule.targetRole || '',
            targetProfile: options.targetProfile || '',
            appVersion: options.appVersion || '',
            recordCounts: options.recordCounts || {},
            notes: options.notes || ''
        };
    }

    function metadataRows(metadata) {
        var rows = [['Chave', 'Valor']];
        METADATA_FIELDS.forEach(function (spec) {
            var value = metadata && metadata[spec.key];
            if (value && typeof value === 'object') value = JSON.stringify(value);
            rows.push([spec.key, value == null ? '' : value]);
        });
        return rows;
    }

    function parseMetadataRows(rows) {
        var metadata = {};
        (rows || []).slice(1).forEach(function (row) {
            var key = String((row || [])[0] || '').trim();
            var value = (row || [])[1];
            if (!key) return;
            if (key === 'recordCounts' && typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch (ignore) {
                    // A validação posterior apresentará uma mensagem objetiva.
                }
            }
            metadata[key] = value == null ? '' : value;
        });
        return metadata;
    }

    function validateMetadataRows(rows, options) {
        var errors = [];
        var warnings = [];
        var header = (rows || [])[0] || [];
        var seen = {};

        if (normalize(header[0]) !== normalize('Chave') || normalize(header[1]) !== normalize('Valor')) {
            errors.push('Cabeçalho inválido em ' + SHEETS.META + '. Esperado: Chave | Valor.');
        }

        (rows || []).slice(1).forEach(function (row, index) {
            var key = String((row || [])[0] || '').trim();
            if (!key) return;
            if (seen[key]) errors.push(SHEETS.META + ' linha ' + (index + 2) + ': chave duplicada ' + key + '.');
            seen[key] = true;
        });

        var metadata = parseMetadataRows(rows);
        var metadataValidation = validateMetadata(metadata, options);
        errors = errors.concat(metadataValidation.errors);
        warnings = warnings.concat(metadataValidation.warnings);
        return { ok: errors.length === 0, errors: errors, warnings: warnings, metadata: metadata };
    }

    function validateMetadata(metadata, options) {
        options = options || {};
        metadata = metadata || {};
        var errors = [];
        var warnings = [];

        METADATA_FIELDS.forEach(function (spec) {
            if (spec.required && isBlank(metadata[spec.key])) {
                errors.push('Metadado obrigatório ausente: ' + spec.key + '.');
            }
        });

        if (metadata.contractId && metadata.contractId !== CONTRACT_ID) {
            errors.push('Contrato desconhecido: ' + metadata.contractId + '.');
        }
        if (metadata.schemaVersion && !isCompatibleVersion(metadata.schemaVersion)) {
            errors.push('Versão de schema incompatível: ' + metadata.schemaVersion + '. Esperada: ' + SCHEMA_VERSION + '.');
        }

        var rule = FILE_RULES[metadata.fileType];
        if (metadata.fileType && !rule) {
            errors.push('Tipo de arquivo inválido: ' + metadata.fileType + '.');
        }
        if (rule && metadata.sourceRole !== rule.sourceRole) {
            errors.push('Papel de origem incompatível com o tipo de arquivo. Esperado: ' + rule.sourceRole + '.');
        }
        if (rule && metadata.targetRole !== rule.targetRole) {
            errors.push('Papel de destino incompatível com o tipo de arquivo. Esperado: ' + rule.targetRole + '.');
        }
        if (metadata.fileType === FILE_TYPES.SUPERVISOR_TO_ANALYST && isBlank(metadata.parentExportId)) {
            errors.push('O retorno do supervisor deve informar parentExportId.');
        }
        if (metadata.generatedAt && !isIsoDateTime(metadata.generatedAt)) {
            errors.push('generatedAt deve usar data/hora ISO 8601.');
        }
        if (metadata.recordCounts && (typeof metadata.recordCounts !== 'object' || Array.isArray(metadata.recordCounts))) {
            errors.push('recordCounts deve ser um objeto com a contagem por aba.');
        }
        if (options.expectedFileType && metadata.fileType !== options.expectedFileType) {
            errors.push('Tipo de arquivo inesperado. Recebido: ' + (metadata.fileType || 'vazio') + '.');
        }
        if (options.expectedTargetProfile && metadata.targetProfile !== options.expectedTargetProfile) {
            errors.push('Arquivo destinado a outro perfil: ' + (metadata.targetProfile || 'não informado') + '.');
        }
        if (metadata.schemaVersion && metadata.schemaVersion !== SCHEMA_VERSION && isCompatibleVersion(metadata.schemaVersion)) {
            warnings.push('Arquivo compatível, porém gerado no schema ' + metadata.schemaVersion + '.');
        }

        return { ok: errors.length === 0, errors: errors, warnings: warnings };
    }

    function getFields(sheetName) {
        return (SCHEMAS[sheetName] || []).slice();
    }

    function getHeaders(sheetName) {
        return getFields(sheetName).map(function (spec) { return spec.header; });
    }

    function findHeaderIndex(receivedHeaders, spec, allowAliases) {
        var candidates = [spec.header].concat(allowAliases ? spec.aliases || [] : []).map(normalize);
        for (var index = 0; index < receivedHeaders.length; index += 1) {
            if (candidates.indexOf(normalize(receivedHeaders[index])) >= 0) return index;
        }
        return -1;
    }

    function validateHeaderRow(sheetName, headerRow, options) {
        options = options || {};
        var fields = SCHEMAS[sheetName];
        var errors = [];
        var warnings = [];
        var indexByKey = {};
        var seen = {};

        if (!fields) {
            return { ok: false, errors: ['Aba sem schema registrado: ' + sheetName + '.'], warnings: [], indexByKey: {} };
        }

        (headerRow || []).forEach(function (header) {
            var key = normalize(header);
            if (!key) return;
            if (seen[key]) errors.push('Cabeçalho duplicado na aba ' + sheetName + ': ' + header + '.');
            seen[key] = true;
        });

        fields.forEach(function (spec, expectedIndex) {
            var actualIndex = findHeaderIndex(headerRow || [], spec, Boolean(options.allowAliases));
            indexByKey[spec.key] = actualIndex;
            if (actualIndex < 0) {
                errors.push('Coluna obrigatória ausente em ' + sheetName + ': ' + spec.header + '.');
            } else if (options.strictOrder !== false && actualIndex !== expectedIndex) {
                errors.push('Coluna fora de posição em ' + sheetName + ': ' + spec.header + ' deve estar na coluna ' + (expectedIndex + 1) + '.');
            }
        });

        if ((headerRow || []).length > fields.length) {
            warnings.push('Aba ' + sheetName + ' contém colunas adicionais não previstas no schema ' + SCHEMA_VERSION + '.');
        }

        return { ok: errors.length === 0, errors: errors, warnings: warnings, indexByKey: indexByKey };
    }

    function valueMatchesType(value, type) {
        if (isBlank(value)) return true;
        if (type === 'date') return isIsoDate(value);
        if (type === 'datetime') return isIsoDateTime(value);
        if (type === 'integer') return Number.isInteger(Number(value));
        if (type === 'decimal' || type === 'percentage') return Number.isFinite(Number(value));
        if (type === 'boolean-text') return ['Sim', 'Não'].indexOf(String(value)) >= 0;
        if (type === 'enum') return Object.keys(ROLES).map(function (key) { return ROLES[key]; }).indexOf(String(value)) >= 0;
        return true;
    }

    function validateDataRows(sheetName, rows, options) {
        options = options || {};
        var headerRow = (rows || [])[0] || [];
        var headerValidation = validateHeaderRow(sheetName, headerRow, options);
        var fields = SCHEMAS[sheetName] || [];
        var errors = headerValidation.errors.slice();
        var warnings = headerValidation.warnings.slice();
        var seenUids = {};

        if (!headerValidation.ok) {
            return { ok: false, errors: errors, warnings: warnings, recordCount: 0 };
        }

        (rows || []).slice(1).forEach(function (row, rowOffset) {
            if (!(row || []).some(function (value) { return !isBlank(value); })) return;
            var rowNumber = rowOffset + 2;
            fields.forEach(function (spec) {
                var value = row[headerValidation.indexByKey[spec.key]];
                if (spec.required && isBlank(value)) {
                    errors.push(sheetName + ' linha ' + rowNumber + ': ' + spec.header + ' é obrigatório.');
                } else if (!isBlank(value) && !valueMatchesType(value, spec.type)) {
                    errors.push(sheetName + ' linha ' + rowNumber + ': formato inválido em ' + spec.header + ' (' + spec.type + ').');
                }
            });
            var uidIndex = headerValidation.indexByKey.uid;
            var uid = uidIndex == null || uidIndex < 0 ? '' : String(row[uidIndex] || '').trim();
            if (uid) {
                if (seenUids[uid]) errors.push(sheetName + ' linha ' + rowNumber + ': UID duplicado ' + uid + '.');
                seenUids[uid] = true;
            }
        });

        return {
            ok: errors.length === 0,
            errors: errors,
            warnings: warnings,
            recordCount: (rows || []).slice(1).filter(function (row) {
                return (row || []).some(function (value) { return !isBlank(value); });
            }).length
        };
    }

    function rowsToRecords(sheetName, rows) {
        var fields = SCHEMAS[sheetName] || [];
        return (rows || []).slice(1).filter(function (row) {
            return (row || []).some(function (value) { return !isBlank(value); });
        }).map(function (row, index) {
            return fields.reduce(function (record, spec, fieldIndex) {
                record[spec.key] = row[fieldIndex] == null ? '' : row[fieldIndex];
                record._rowNumber = index + 2;
                return record;
            }, {});
        });
    }

    /** Valida relações entre abas depois que cabeçalhos e tipos já foram aprovados. */
    function validateRelationships(recordsBySheet, metadata) {
        recordsBySheet = recordsBySheet || {};
        metadata = metadata || {};
        var errors = [];
        var warnings = [];
        var demands = recordsBySheet[SHEETS.DEMANDS] || [];
        var demandsById = {};
        var demandsByUid = {};
        var expectedProfile = metadata.fileType === FILE_TYPES.ANALYST_TO_SUPERVISOR
            ? metadata.sourceProfile
            : metadata.targetProfile;

        demands.forEach(function (demand) {
            var id = String(demand.id || '').trim();
            var uid = String(demand.uid || '').trim();
            if (id && demandsById[id]) errors.push(SHEETS.DEMANDS + ' linha ' + demand._rowNumber + ': ID duplicado ' + id + '.');
            if (uid && demandsByUid[uid]) errors.push(SHEETS.DEMANDS + ' linha ' + demand._rowNumber + ': UID associado a mais de uma demanda: ' + uid + '.');
            if (id) demandsById[id] = demand;
            if (uid) demandsByUid[uid] = demand;
            if (expectedProfile && id && id.indexOf(expectedProfile + '-') !== 0) {
                errors.push(SHEETS.DEMANDS + ' linha ' + demand._rowNumber + ': ID ' + id + ' não pertence ao perfil ' + expectedProfile + '.');
            }
        });

        function validateChildReference(record, sheetName) {
            var demandId = String(record.demandId || '').trim();
            var demandUid = String(record.demandUid || '').trim();
            var demand = demandsById[demandId];
            if (!demand) {
                errors.push(sheetName + ' linha ' + record._rowNumber + ': referência órfã para a demanda ' + (demandId || 'não informada') + '.');
                return null;
            }
            if (demandUid && String(demand.uid || '') !== demandUid) {
                errors.push(sheetName + ' linha ' + record._rowNumber + ': UID da demanda divergente para ' + demandId + '.');
            }
            return demand;
        }

        var criteriaKeys = {};
        (recordsBySheet[SHEETS.CRITERIA] || []).forEach(function (criterion) {
            validateChildReference(criterion, SHEETS.CRITERIA);
            var stage = Number(criterion.stage);
            var criterionNumber = Number(criterion.criterionNumber);
            if (!Number.isInteger(stage) || stage < 1 || stage > 8) {
                errors.push(SHEETS.CRITERIA + ' linha ' + criterion._rowNumber + ': etapa fora do intervalo E1–E8.');
            }
            if (!Number.isInteger(criterionNumber) || criterionNumber < 1) {
                errors.push(SHEETS.CRITERIA + ' linha ' + criterion._rowNumber + ': número de critério deve ser inteiro positivo.');
            }
            if (metadata.fileType === FILE_TYPES.SUPERVISOR_TO_ANALYST && stage !== 1 && stage !== 2) {
                errors.push(SHEETS.CRITERIA + ' linha ' + criterion._rowNumber + ': retorno do supervisor só pode conter E1/E2.');
            }
            var key = [criterion.demandId, stage, criterionNumber].join('|');
            if (criteriaKeys[key]) errors.push(SHEETS.CRITERIA + ' linha ' + criterion._rowNumber + ': critério duplicado para ' + key + '.');
            criteriaKeys[key] = true;
        });

        (recordsBySheet[SHEETS.WEEKLY_REPORTS] || []).forEach(function (report) {
            var demand = validateChildReference(report, SHEETS.WEEKLY_REPORTS);
            if (demand && report.analista && demand.analista && normalize(report.analista) !== normalize(demand.analista)) {
                errors.push(SHEETS.WEEKLY_REPORTS + ' linha ' + report._rowNumber + ': analista divergente da demanda ' + report.demandId + '.');
            }
        });

        var plansByDemand = {};
        (recordsBySheet[SHEETS.ACTION_PLANS] || []).forEach(function (plan) {
            validateChildReference(plan, SHEETS.ACTION_PLANS);
            if (!plan.deletedAt) {
                if (plansByDemand[plan.demandId]) errors.push(SHEETS.ACTION_PLANS + ' linha ' + plan._rowNumber + ': mais de um plano ativo para a demanda ' + plan.demandId + '.');
                plansByDemand[plan.demandId] = true;
            }
        });

        return { ok: errors.length === 0, errors: errors, warnings: warnings };
    }

    function getSheetByName(workbook, sheetName) {
        return workbook && workbook.Sheets ? workbook.Sheets[sheetName] : null;
    }

    function validateWorkbook(workbook, xlsx, options) {
        options = options || {};
        var errors = [];
        var warnings = [];
        if (!workbook || !workbook.Sheets || !xlsx || !xlsx.utils) {
            return { ok: false, errors: ['Workbook ou adaptador SheetJS inválido.'], warnings: [], metadata: null, sheets: {} };
        }

        var metaSheet = getSheetByName(workbook, SHEETS.META);
        if (!metaSheet) {
            return { ok: false, errors: ['Aba obrigatória ausente: ' + SHEETS.META + '.'], warnings: [], metadata: null, sheets: {} };
        }

        var metaRows = xlsx.utils.sheet_to_json(metaSheet, { header: 1, raw: true, defval: '' });
        var metadataValidation = validateMetadataRows(metaRows, options);
        var metadata = metadataValidation.metadata;
        errors = errors.concat(metadataValidation.errors);
        warnings = warnings.concat(metadataValidation.warnings);

        var rule = FILE_RULES[metadata.fileType];
        var sheetResults = {};
        var recordsBySheet = {};
        if (rule) {
            var sheetsToValidate = rule.requiredSheets.concat(rule.optionalSheets.filter(function (sheetName) {
                return Boolean(getSheetByName(workbook, sheetName));
            }));
            sheetsToValidate.forEach(function (sheetName) {
                var sheet = getSheetByName(workbook, sheetName);
                if (!sheet) {
                    errors.push('Aba obrigatória ausente: ' + sheetName + '.');
                    return;
                }
                var rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
                var result = validateDataRows(sheetName, rows, { strictOrder: true });
                sheetResults[sheetName] = result;
                errors = errors.concat(result.errors);
                warnings = warnings.concat(result.warnings);
                if (rule.requiredSheets.indexOf(sheetName) >= 0 && metadata.recordCounts && metadata.recordCounts[sheetName] == null) {
                    errors.push('Contagem obrigatória ausente em recordCounts: ' + sheetName + '.');
                } else if (metadata.recordCounts && metadata.recordCounts[sheetName] != null && Number(metadata.recordCounts[sheetName]) !== result.recordCount) {
                    errors.push('Contagem divergente em ' + sheetName + ': metadado=' + metadata.recordCounts[sheetName] + ', arquivo=' + result.recordCount + '.');
                }
                if (result.ok) recordsBySheet[sheetName] = rowsToRecords(sheetName, rows);
            });
            if (rule.requiredSheets.every(function (sheetName) { return recordsBySheet[sheetName]; })) {
                var relationships = validateRelationships(recordsBySheet, metadata);
                errors = errors.concat(relationships.errors);
                warnings = warnings.concat(relationships.warnings);
            }
        }

        return {
            ok: errors.length === 0,
            errors: errors,
            warnings: warnings,
            metadata: metadata,
            sheets: sheetResults,
            records: recordsBySheet
        };
    }

    function createMetadataSheet(xlsx, metadata) {
        if (!xlsx || !xlsx.utils || typeof xlsx.utils.aoa_to_sheet !== 'function') {
            throw new Error('Adaptador SheetJS inválido para criar a aba de metadados.');
        }
        var sheet = xlsx.utils.aoa_to_sheet(metadataRows(metadata));
        sheet['!cols'] = [{ wch: 28 }, { wch: 80 }];
        return sheet;
    }

    function appendMetadataSheet(workbook, xlsx, metadata) {
        var sheet = createMetadataSheet(xlsx, metadata);
        xlsx.utils.book_append_sheet(workbook, sheet, SHEETS.META);
        workbook.Workbook = workbook.Workbook || {};
        workbook.Workbook.Sheets = workbook.Workbook.Sheets || [];
        var index = (workbook.SheetNames || []).indexOf(SHEETS.META);
        while (workbook.Workbook.Sheets.length <= index) workbook.Workbook.Sheets.push({});
        if (index >= 0) workbook.Workbook.Sheets[index].Hidden = 1;
        return sheet;
    }

    function ownerForCriterionStage(stage) {
        var stageNumber = Number(stage);
        return stageNumber === 1 || stageNumber === 2 ? ROLES.SUPERVISOR : ROLES.ANALYST;
    }

    function deepFreeze(object) {
        if (!object || typeof object !== 'object' || Object.isFrozen(object)) return object;
        Object.keys(object).forEach(function (key) { deepFreeze(object[key]); });
        return Object.freeze(object);
    }

    return deepFreeze({
        CONTRACT_ID: CONTRACT_ID,
        SCHEMA_VERSION: SCHEMA_VERSION,
        FILE_TYPES: FILE_TYPES,
        ROLES: ROLES,
        SHEETS: SHEETS,
        METADATA_FIELDS: METADATA_FIELDS,
        SCHEMAS: SCHEMAS,
        FILE_RULES: FILE_RULES,
        normalize: normalize,
        isCompatibleVersion: isCompatibleVersion,
        randomId: randomId,
        buildMetadata: buildMetadata,
        metadataRows: metadataRows,
        parseMetadataRows: parseMetadataRows,
        validateMetadata: validateMetadata,
        validateMetadataRows: validateMetadataRows,
        getFields: getFields,
        getHeaders: getHeaders,
        validateHeaderRow: validateHeaderRow,
        validateDataRows: validateDataRows,
        rowsToRecords: rowsToRecords,
        validateRelationships: validateRelationships,
        validateWorkbook: validateWorkbook,
        createMetadataSheet: createMetadataSheet,
        appendMetadataSheet: appendMetadataSheet,
        ownerForCriterionStage: ownerForCriterionStage
    });
});

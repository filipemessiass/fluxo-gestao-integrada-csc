/*
 * SGPI Safe Storage - persistência local verificável e transacional.
 * Mantém localStorage como infraestrutura simples, mas nunca confirma uma
 * gravação sem verificar o conteúdo e restaurar o estado anterior em falhas.
 */
(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.SGPISafeStorage = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
    'use strict';

    function StorageError(code, message, details) {
        this.name = 'SGPIStorageError';
        this.code = code;
        this.message = message;
        this.details = details || {};
        this.rollbackOk = this.details.rollbackOk !== false;
        if (Error.captureStackTrace) Error.captureStackTrace(this, StorageError);
    }
    StorageError.prototype = Object.create(Error.prototype);
    StorageError.prototype.constructor = StorageError;

    function erro(code, message, details, cause) {
        var result = new StorageError(code, message, details);
        if (cause) result.cause = cause;
        return result;
    }

    function validarStorage(storage) {
        if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function' || typeof storage.removeItem !== 'function') {
            throw erro('STORAGE_UNAVAILABLE', 'O armazenamento local não está disponível neste navegador.');
        }
    }

    function serializar(valor, chave) {
        var resultado;
        try {
            resultado = JSON.stringify(valor);
        } catch (cause) {
            throw erro('STORAGE_SERIALIZATION_FAILED', 'Os dados não puderam ser preparados para gravação local.', { key: chave }, cause);
        }
        if (resultado === undefined) {
            throw erro('STORAGE_SERIALIZATION_FAILED', 'O valor informado não pode ser armazenado em JSON.', { key: chave });
        }
        return resultado;
    }

    function lerBruto(storage, chave) {
        validarStorage(storage);
        try {
            return storage.getItem(chave);
        } catch (cause) {
            throw erro('STORAGE_READ_FAILED', 'Não foi possível ler os dados locais. Verifique as permissões do navegador.', { key: chave }, cause);
        }
    }

    function read(storage, chave, fallback, options) {
        options = options || {};
        var bruto = lerBruto(storage, chave);
        if (bruto == null) return fallback;
        try {
            return JSON.parse(bruto);
        } catch (cause) {
            var failure = erro('STORAGE_CORRUPTED_DATA', 'Foram encontrados dados locais corrompidos. A aplicação não substituirá esses dados automaticamente.', { key: chave }, cause);
            if (options.allowCorruptFallback) {
                if (typeof options.onError === 'function') options.onError(failure);
                return fallback;
            }
            throw failure;
        }
    }

    function normalizarEntradas(valores, raw) {
        return Object.keys(valores || {}).map(function (chave) {
            return {
                key: chave,
                serialized: raw ? String(valores[chave]) : serializar(valores[chave], chave)
            };
        });
    }

    function restaurar(storage, anteriores) {
        var ok = true;
        var erros = [];
        Object.keys(anteriores).forEach(function (chave) {
            try {
                if (anteriores[chave] == null) storage.removeItem(chave);
                else storage.setItem(chave, anteriores[chave]);
                if (storage.getItem(chave) !== anteriores[chave]) throw new Error('Conteúdo restaurado não confere.');
            } catch (cause) {
                ok = false;
                erros.push({ key: chave, message: cause && cause.message ? cause.message : String(cause) });
            }
        });
        return { ok: ok, errors: erros };
    }

    function transacionarEntradas(storage, entradas) {
        validarStorage(storage);
        var anteriores = {};
        entradas.forEach(function (entry) { anteriores[entry.key] = lerBruto(storage, entry.key); });
        try {
            entradas.forEach(function (entry) {
                storage.setItem(entry.key, entry.serialized);
                var confirmado = storage.getItem(entry.key);
                if (confirmado !== entry.serialized) {
                    throw erro('STORAGE_VERIFICATION_FAILED', 'O navegador não confirmou a gravação dos dados locais.', { key: entry.key });
                }
            });
        } catch (cause) {
            var rollback = restaurar(storage, anteriores);
            if (!rollback.ok) {
                throw erro('STORAGE_ROLLBACK_FAILED', 'A gravação falhou e o estado anterior não pôde ser restaurado integralmente. Não feche a página e exporte um backup.', {
                    rollbackOk: false,
                    rollbackErrors: rollback.errors
                }, cause);
            }
            if (cause && cause.code === 'STORAGE_VERIFICATION_FAILED') {
                cause.details.rollbackOk = true;
                cause.rollbackOk = true;
                throw cause;
            }
            throw erro('STORAGE_WRITE_FAILED', 'Não foi possível gravar os dados locais. O armazenamento pode estar cheio ou bloqueado; os dados anteriores foram restaurados.', {
                rollbackOk: true
            }, cause);
        }
        return {
            ok: true,
            keys: entradas.map(function (entry) { return entry.key; }),
            bytesWritten: entradas.reduce(function (total, entry) { return total + entry.serialized.length * 2; }, 0)
        };
    }

    function transaction(storage, valores) {
        return transacionarEntradas(storage, normalizarEntradas(valores, false));
    }

    function transactionRaw(storage, valores) {
        return transacionarEntradas(storage, normalizarEntradas(valores, true));
    }

    function write(storage, chave, valor) {
        var valores = {};
        valores[chave] = valor;
        return transaction(storage, valores);
    }

    function writeRaw(storage, chave, valor) {
        var valores = {};
        valores[chave] = valor;
        return transactionRaw(storage, valores);
    }

    function remove(storage, chaves) {
        validarStorage(storage);
        var anteriores = {};
        (chaves || []).forEach(function (chave) { anteriores[chave] = lerBruto(storage, chave); });
        try {
            (chaves || []).forEach(function (chave) {
                storage.removeItem(chave);
                if (storage.getItem(chave) != null) {
                    throw erro('STORAGE_VERIFICATION_FAILED', 'O navegador não confirmou a remoção dos dados locais.', { key: chave });
                }
            });
        } catch (cause) {
            var rollback = restaurar(storage, anteriores);
            if (!rollback.ok) {
                throw erro('STORAGE_ROLLBACK_FAILED', 'A remoção falhou e o estado anterior não pôde ser restaurado integralmente.', {
                    rollbackOk: false,
                    rollbackErrors: rollback.errors
                }, cause);
            }
            throw erro('STORAGE_REMOVE_FAILED', 'Não foi possível remover os dados locais; o estado anterior foi restaurado.', { rollbackOk: true }, cause);
        }
        return { ok: true, keys: (chaves || []).slice() };
    }

    function diagnose(storage, chaves) {
        var result = {
            available: true,
            writable: true,
            corruptedKeys: [],
            inaccessibleKeys: [],
            bytesUsed: 0,
            checkedKeys: (chaves || []).slice(),
            error: null
        };
        try {
            validarStorage(storage);
        } catch (failure) {
            result.available = false;
            result.writable = false;
            result.error = failure;
            return result;
        }
        (chaves || []).forEach(function (chave) {
            try {
                var bruto = storage.getItem(chave);
                if (bruto == null) return;
                result.bytesUsed += (String(chave).length + bruto.length) * 2;
                try { JSON.parse(bruto); } catch (ignore) { result.corruptedKeys.push(chave); }
            } catch (cause) {
                result.inaccessibleKeys.push(chave);
                result.error = result.error || cause;
            }
        });
        var probe = '__sgpi_storage_probe__';
        var previous = null;
        try {
            previous = storage.getItem(probe);
            var token = String(Date.now()) + ':' + Math.random();
            storage.setItem(probe, token);
            if (storage.getItem(probe) !== token) throw new Error('Falha na verificação da escrita de diagnóstico.');
        } catch (cause) {
            result.writable = false;
            result.error = result.error || cause;
        } finally {
            try {
                if (previous == null) storage.removeItem(probe);
                else storage.setItem(probe, previous);
            } catch (cause) {
                result.writable = false;
                result.error = result.error || cause;
            }
        }
        if (result.inaccessibleKeys.length) result.available = false;
        return result;
    }

    return Object.freeze({
        StorageError: StorageError,
        read: read,
        write: write,
        writeRaw: writeRaw,
        remove: remove,
        transaction: transaction,
        transactionRaw: transactionRaw,
        diagnose: diagnose
    });
});

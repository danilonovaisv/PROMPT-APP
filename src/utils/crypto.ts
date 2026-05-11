/**
 * Utilitário de Criptografia para dados locais.
 * Utiliza AES-GCM para criptografia autenticada.
 */

const ALGO = 'AES-GCM';
const IV_LENGTH = 12;
// Chave interna fixa para proteção básica de dados em repouso no localStorage.
const INTERNAL_KEY_SEED = 'prompt-app-internal-v2024';

async function getEncryptionKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const seedData = encoder.encode(INTERNAL_KEY_SEED);
    const hash = await crypto.subtle.digest('SHA-256', seedData);

    return crypto.subtle.importKey(
        'raw',
        hash,
        { name: ALGO },
        false,
        ['encrypt', 'decrypt']
    );
}

/** Criptografa uma string e retorna o resultado em Base64 (IV + Dados) */
export async function encrypt(text: string): Promise<string> {
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const encrypted = await window.crypto.subtle.encrypt(
        { name: ALGO, iv },
        key,
        data
    );

    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(IV_LENGTH + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, IV_LENGTH);

    // Converte para base64 de forma compatível
    return btoa(Array.from(combined, byte => String.fromCharCode(byte)).join(''));
}

/** Descriptografa uma string em Base64 e retorna o texto original ou null em caso de falha */
export async function decrypt(base64: string): Promise<string | null> {
    try {
        const key = await getEncryptionKey();
        const binaryString = atob(base64);
        const combined = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            combined[i] = binaryString.charCodeAt(i);
        }

        if (combined.length < IV_LENGTH) return null;

        const iv = combined.slice(0, IV_LENGTH);
        const data = combined.slice(IV_LENGTH);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: ALGO, iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch {
        return null;
    }
}

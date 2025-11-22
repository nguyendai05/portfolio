import { GoogleGenAI } from '@google/genai';

export interface GeminiKeyState {
    index: number;            // position in the original list
    id: string;               // e.g. "GEMINI_API_KEY_1" (for debugging only)
    value: string;            // actual API key
    limitedUntil: number | null; // timestamp in ms, or null when active
}

export interface GeminiKeySnapshot {
    index: number;
    id: string;
    limitedUntil: number | null;
    isLimited: boolean;
}

const STORAGE_KEY = 'xuni_gemini_key_state_v1';

// --- Initialization ---

const rawKeys = (() => {
    // In Vite 'define', this might be replaced by the array literal itself or a string.
    // We handle both cases for robustness.
    const encoded = process.env.GEMINI_API_KEYS as unknown;

    if (Array.isArray(encoded)) {
        return encoded.filter(Boolean) as string[];
    }

    if (typeof encoded === 'string') {
        try {
            const parsed = JSON.parse(encoded);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
            return [];
        }
    }

    return [] as string[];
})();

// Parse cooldown from env, default to 15 minutes
const cooldownMinutes = parseInt(process.env.GEMINI_KEY_COOLDOWN_MINUTES || '15', 10);
const COOLDOWN_MS = (isNaN(cooldownMinutes) ? 15 : Math.max(1, Math.min(1440, cooldownMinutes))) * 60 * 1000;

// Initialize state
let keyStates: GeminiKeyState[] = rawKeys.map((key, i) => ({
    index: i,
    id: i === 0 ? 'GEMINI_API_KEY' : `GEMINI_API_KEY_${i}`,
    value: key,
    limitedUntil: null,
}));

let lastUsedIndex = -1;

// --- Persistence ---

const isBrowser = typeof window !== 'undefined';

function loadPersistedLimits() {
    if (!isBrowser) return;

    try {
        const item = localStorage.getItem(STORAGE_KEY);
        if (!item) return;

        const persisted = JSON.parse(item) as Partial<GeminiKeyState>[];
        if (!Array.isArray(persisted)) return;

        const now = Date.now();

        persisted.forEach(p => {
            if (typeof p.index === 'number' && p.limitedUntil) {
                if (p.limitedUntil > now) {
                    // Apply limit if still valid
                    if (keyStates[p.index]) {
                        keyStates[p.index].limitedUntil = p.limitedUntil;
                    }
                }
            }
        });
    } catch (e) {
        console.warn('Failed to load Gemini key state', e);
    }
}

function persistLimits() {
    if (!isBrowser) return;

    try {
        // Only persist necessary data
        const dataToSave = keyStates
            .filter(k => k.limitedUntil !== null)
            .map(k => ({ index: k.index, limitedUntil: k.limitedUntil }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
        console.warn('Failed to save Gemini key state', e);
    }
}

// Load limits on module init
loadPersistedLimits();

// --- Public API ---

export function getNextAvailableKey(excludedIndices?: Set<number>): GeminiKeyState | null {
    if (keyStates.length === 0) {
        console.error("Neural link offline. No Gemini API key configured.");
        return null;
    }

    const now = Date.now();

    // 1. Check if any limited keys have cooled down
    let stateChanged = false;
    keyStates.forEach(k => {
        if (k.limitedUntil !== null && k.limitedUntil <= now) {
            k.limitedUntil = null;
            stateChanged = true;
        }
    });
    if (stateChanged) persistLimits();

    // 2. Find available keys
    // We want to round-robin, starting from lastUsedIndex + 1
    const count = keyStates.length;
    for (let i = 1; i <= count; i++) {
        const candidateIndex = (lastUsedIndex + i) % count;

        if (excludedIndices && excludedIndices.has(candidateIndex)) continue;

        const candidate = keyStates[candidateIndex];
        if (candidate.limitedUntil === null) {
            lastUsedIndex = candidateIndex;
            return candidate;
        }
    }

    return null;
}

export function markKeyLimited(index: number, customCooldownMs?: number): void {
    if (keyStates[index]) {
        keyStates[index].limitedUntil = Date.now() + (customCooldownMs ?? COOLDOWN_MS);
        persistLimits();
        console.warn(`Gemini key #${index} (${keyStates[index].id}) marked as limited.`);
    }
}

export function getGeminiKeySnapshot(): GeminiKeySnapshot[] {
    const now = Date.now();
    return keyStates.map(k => ({
        index: k.index,
        id: k.id,
        limitedUntil: k.limitedUntil,
        isLimited: k.limitedUntil !== null && k.limitedUntil > now
    }));
}

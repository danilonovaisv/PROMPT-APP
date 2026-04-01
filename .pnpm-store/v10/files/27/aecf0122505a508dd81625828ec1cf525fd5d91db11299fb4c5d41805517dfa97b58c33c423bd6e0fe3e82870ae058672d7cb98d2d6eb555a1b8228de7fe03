"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RvfSolver = void 0;
let wasmExports = null;
async function getWasm() {
    if (wasmExports)
        return wasmExports;
    // Dynamic import to support both CJS and ESM
    const initModule = await Promise.resolve().then(() => __importStar(require('../pkg/rvf_solver')));
    const init = initModule.default || initModule;
    wasmExports = await init();
    return wasmExports;
}
function splitSeed(seed) {
    if (seed === undefined) {
        const s = BigInt(Math.floor(Math.random() * 2 ** 64));
        return [Number(s & 0xffffffffn), Number((s >> 32n) & 0xffffffffn)];
    }
    const s = typeof seed === 'number' ? BigInt(seed) : seed;
    return [Number(s & 0xffffffffn), Number((s >> 32n) & 0xffffffffn)];
}
function readJson(wasm, handle, lenFn, readFn) {
    const len = lenFn(handle);
    if (len <= 0)
        return null;
    const ptr = wasm.rvf_solver_alloc(len);
    if (ptr === 0)
        return null;
    try {
        readFn(handle, ptr);
        const buf = new Uint8Array(wasm.memory.buffer, ptr, len);
        const text = new TextDecoder().decode(buf);
        return JSON.parse(text);
    }
    finally {
        wasm.rvf_solver_free(ptr, len);
    }
}
/**
 * RVF Self-Learning Solver.
 *
 * Wraps the rvf-solver-wasm WASM module providing:
 * - PolicyKernel with Thompson Sampling (two-signal model)
 * - Context-bucketed bandit (18 buckets)
 * - KnowledgeCompiler with signature-based pattern cache
 * - Speculative dual-path execution
 * - Three-loop adaptive solver (fast/medium/slow)
 * - SHAKE-256 tamper-evident witness chain
 */
class RvfSolver {
    constructor(handle, wasm) {
        this.handle = handle;
        this.wasm = wasm;
    }
    /**
     * Create a new solver instance.
     * Initializes the WASM module on first call.
     */
    static async create() {
        const wasm = await getWasm();
        const handle = wasm.rvf_solver_create();
        if (handle < 0) {
            throw new Error('Failed to create solver instance (max 7 concurrent instances)');
        }
        return new RvfSolver(handle, wasm);
    }
    /**
     * Train the solver on generated puzzles.
     *
     * Uses the three-loop architecture:
     * - Fast loop: constraint propagation solver
     * - Medium loop: PolicyKernel skip-mode selection
     * - Slow loop: KnowledgeCompiler pattern distillation
     */
    train(options) {
        const [seedLo, seedHi] = splitSeed(options.seed);
        const correct = this.wasm.rvf_solver_train(this.handle, options.count, options.minDifficulty ?? 1, options.maxDifficulty ?? 10, seedLo, seedHi);
        if (correct < 0) {
            throw new Error('Training failed: invalid handle');
        }
        const raw = readJson(this.wasm, this.handle, (h) => this.wasm.rvf_solver_result_len(h), (h, p) => this.wasm.rvf_solver_result_read(h, p));
        if (!raw) {
            return {
                trained: options.count,
                correct,
                accuracy: correct / options.count,
                patternsLearned: 0,
            };
        }
        return {
            trained: raw.trained,
            correct: raw.correct,
            accuracy: raw.accuracy,
            patternsLearned: raw.patterns_learned ?? raw.patternsLearned ?? 0,
        };
    }
    /**
     * Run the full acceptance test with training/holdout cycles.
     *
     * Runs all three ablation modes:
     * - Mode A: Fixed heuristic policy
     * - Mode B: Compiler-suggested policy
     * - Mode C: Learned Thompson Sampling policy
     *
     * Returns the full manifest with per-cycle metrics and witness chain.
     */
    acceptance(options) {
        const opts = options ?? {};
        const [seedLo, seedHi] = splitSeed(opts.seed);
        const status = this.wasm.rvf_solver_acceptance(this.handle, opts.holdoutSize ?? 50, opts.trainingPerCycle ?? 200, opts.cycles ?? 5, opts.stepBudget ?? 500, seedLo, seedHi);
        if (status < 0) {
            throw new Error('Acceptance test failed: invalid handle');
        }
        const manifest = readJson(this.wasm, this.handle, (h) => this.wasm.rvf_solver_result_len(h), (h, p) => this.wasm.rvf_solver_result_read(h, p));
        if (!manifest) {
            throw new Error('Failed to read acceptance manifest');
        }
        const mapMode = (m) => ({
            passed: m.passed,
            accuracyMaintained: m.accuracy_maintained ?? m.accuracyMaintained ?? false,
            costImproved: m.cost_improved ?? m.costImproved ?? false,
            robustnessImproved: m.robustness_improved ?? m.robustnessImproved ?? false,
            zeroViolations: m.zero_violations ?? m.zeroViolations ?? true,
            dimensionsImproved: m.dimensions_improved ?? m.dimensionsImproved ?? 0,
            cycles: (m.cycles ?? []).map((c) => ({
                cycle: c.cycle,
                accuracy: c.accuracy,
                costPerSolve: c.cost_per_solve ?? c.costPerSolve ?? 0,
                noiseAccuracy: c.noise_accuracy ?? c.noiseAccuracy ?? 0,
                violations: c.violations ?? 0,
                patternsLearned: c.patterns_learned ?? c.patternsLearned ?? 0,
            })),
        });
        return {
            version: manifest.version,
            modeA: mapMode(manifest.mode_a),
            modeB: mapMode(manifest.mode_b),
            modeC: mapMode(manifest.mode_c),
            allPassed: manifest.all_passed,
            witnessEntries: manifest.witness_entries,
            witnessChainBytes: manifest.witness_chain_bytes,
        };
    }
    /**
     * Get the current policy state (Thompson Sampling parameters,
     * context buckets, KnowledgeCompiler cache stats).
     */
    policy() {
        const raw = readJson(this.wasm, this.handle, (h) => this.wasm.rvf_solver_policy_len(h), (h, p) => this.wasm.rvf_solver_policy_read(h, p));
        if (!raw)
            return null;
        return {
            contextStats: raw.context_stats ?? raw.contextStats ?? {},
            earlyCommitPenalties: raw.early_commit_penalties ?? raw.earlyCommitPenalties ?? 0,
            earlyCommitsTotal: raw.early_commits_total ?? raw.earlyCommitsTotal ?? 0,
            earlyCommitsWrong: raw.early_commits_wrong ?? raw.earlyCommitsWrong ?? 0,
            prepass: raw.prepass ?? '',
            speculativeAttempts: raw.speculative_attempts ?? raw.speculativeAttempts ?? 0,
            speculativeArm2Wins: raw.speculative_arm2_wins ?? raw.speculativeArm2Wins ?? 0,
        };
    }
    /**
     * Get the raw SHAKE-256 witness chain bytes.
     *
     * The witness chain is 73 bytes per entry and provides
     * tamper-evident proof of all training/acceptance operations.
     * Verifiable using `rvf_witness_verify` from `@ruvector/rvf-wasm`.
     */
    witnessChain() {
        const len = this.wasm.rvf_solver_witness_len(this.handle);
        if (len <= 0)
            return null;
        const ptr = this.wasm.rvf_solver_alloc(len);
        if (ptr === 0)
            return null;
        try {
            this.wasm.rvf_solver_witness_read(this.handle, ptr);
            const buf = new Uint8Array(this.wasm.memory.buffer, ptr, len);
            // Copy to avoid referencing WASM memory after free
            return new Uint8Array(buf);
        }
        finally {
            this.wasm.rvf_solver_free(ptr, len);
        }
    }
    /**
     * Destroy the solver instance and free WASM resources.
     */
    destroy() {
        if (this.handle > 0) {
            this.wasm.rvf_solver_destroy(this.handle);
            this.handle = 0;
        }
    }
}
exports.RvfSolver = RvfSolver;
//# sourceMappingURL=solver.js.map
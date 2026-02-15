# Benchmarks

This folder contains benchmarking scripts used to measure and compare the performance of the
`nanothreads` implementation against other pooling/threading approaches.

Contents
- `bench.mjs` - main benchmark runner used for the threadpool-related benchmarks.
- `bench_promisePools.mjs` - benchmarks focused on promise-pool variations.
- `build/` - build artifacts and generated results (look in `build/results/` for recorded outputs).
- various helper scripts used by the benchmark harness.

Prerequisites
- Node.js (LTS recommended)
- pnpm (or use npm/yarn if you prefer, but the provided scripts assume pnpm)

Quick start
1. Install dependencies:

```bash
cd benchmarks
pnpm install
```

2. Run the threadpool benchmark (this script records results):

```bash
pnpm run run:threadpool
```

Where results go
- Benchmarks that write recorded output place them under `benchmarks/results/`.

Notes
- The scripts in this folder are written as ES modules and assume a modern Node.js runtime.
- If you change benchmark code, run the relevant script again to regenerate results.

License / attribution
- Inherits the repository license. See the project root for full license information.


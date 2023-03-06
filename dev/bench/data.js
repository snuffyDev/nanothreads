window.BENCHMARK_DATA = {
  "lastUpdate": 1678074922916,
  "repoUrl": "https://github.com/snuffyDev/nanothreads",
  "entries": {
    "Threadpool Benchmark": [
      {
        "commit": {
          "author": {
            "email": "72365477+snuffyDev@users.noreply.github.com",
            "name": "snuffy",
            "username": "snuffyDev"
          },
          "committer": {
            "email": "72365477+snuffyDev@users.noreply.github.com",
            "name": "snuffy",
            "username": "snuffyDev"
          },
          "distinct": true,
          "id": "9a8d64780b49b292582fd9c06f9fd43d96c1a089",
          "message": "add type: module support",
          "timestamp": "2023-02-16T16:43:28-05:00",
          "tree_id": "41c14c8f7a070fb9f8c7ac4e5dccbca8c77a2fe2",
          "url": "https://github.com/snuffyDev/nanothreads/commit/9a8d64780b49b292582fd9c06f9fd43d96c1a089"
        },
        "date": 1676583911352,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "threads.js (threadpool)",
            "value": 1404,
            "range": "±29.38%",
            "unit": "ops/sec",
            "extra": "15 samples"
          },
          {
            "name": "tinypool",
            "value": 158794,
            "range": "±11.41%",
            "unit": "ops/sec",
            "extra": "57 samples"
          },
          {
            "name": "nanothreads ([inline] threadpool)",
            "value": 267140,
            "range": "±7.45%",
            "unit": "ops/sec",
            "extra": "37 samples"
          },
          {
            "name": "nanothreads ([file] threadpool)",
            "value": 206115,
            "range": "±29.64%",
            "unit": "ops/sec",
            "extra": "32 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "72365477+snuffyDev@users.noreply.github.com",
            "name": "snuffy",
            "username": "snuffyDev"
          },
          "committer": {
            "email": "72365477+snuffyDev@users.noreply.github.com",
            "name": "snuffy",
            "username": "snuffyDev"
          },
          "distinct": true,
          "id": "303898cfb190f478874b34cd968ac6f91f46de23",
          "message": "fix the benchmarks more",
          "timestamp": "2023-03-05T22:53:56-05:00",
          "tree_id": "30aef9572cc7474b48a69b141e8824d66c598d32",
          "url": "https://github.com/snuffyDev/nanothreads/commit/303898cfb190f478874b34cd968ac6f91f46de23"
        },
        "date": 1678074922478,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "nanothreads ([inline] threadpool)",
            "value": 136719,
            "range": "±37.78%",
            "unit": "ops/sec",
            "extra": "12 samples"
          },
          {
            "name": "nanothreads ([file] threadpool)",
            "value": 109704,
            "range": "±54.13%",
            "unit": "ops/sec",
            "extra": "15 samples"
          },
          {
            "name": "tinypool",
            "value": 151194,
            "range": "±19.12%",
            "unit": "ops/sec",
            "extra": "29 samples"
          },
          {
            "name": "threads.js (threadpool)",
            "value": 1463,
            "range": "±38.66%",
            "unit": "ops/sec",
            "extra": "11 samples"
          }
        ]
      }
    ]
  }
}
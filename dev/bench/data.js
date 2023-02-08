window.BENCHMARK_DATA = {
  "lastUpdate": 1675899430240,
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
          "id": "0bfcf73f0cc6e4daa8e0f5ccab336b64b36d7f86",
          "message": "fix benchmark",
          "timestamp": "2023-02-08T18:28:10-05:00",
          "tree_id": "3017b9058fed8efeed0bee73d3bfb44e3ce1a86c",
          "url": "https://github.com/snuffyDev/nanothreads/commit/0bfcf73f0cc6e4daa8e0f5ccab336b64b36d7f86"
        },
        "date": 1675898948183,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "tinypool",
            "value": 47149,
            "range": "±22.27%",
            "unit": "ops/sec",
            "extra": "31 samples"
          },
          {
            "name": "nanothreads (threadpool)",
            "value": 135674,
            "range": "±45.18%",
            "unit": "ops/sec",
            "extra": "26 samples"
          },
          {
            "name": "threads.js (threadpool)",
            "value": 565,
            "range": "±53.68%",
            "unit": "ops/sec",
            "extra": "6 samples"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "snuffy",
            "username": "snuffyDev",
            "email": "72365477+snuffyDev@users.noreply.github.com"
          },
          "committer": {
            "name": "snuffy",
            "username": "snuffyDev",
            "email": "72365477+snuffyDev@users.noreply.github.com"
          },
          "id": "0bfcf73f0cc6e4daa8e0f5ccab336b64b36d7f86",
          "message": "fix benchmark",
          "timestamp": "2023-02-08T23:28:10Z",
          "url": "https://github.com/snuffyDev/nanothreads/commit/0bfcf73f0cc6e4daa8e0f5ccab336b64b36d7f86"
        },
        "date": 1675899429823,
        "tool": "benchmarkjs",
        "benches": [
          {
            "name": "threads.js (threadpool)",
            "value": 636,
            "range": "±68.36%",
            "unit": "ops/sec",
            "extra": "9 samples"
          },
          {
            "name": "tinypool",
            "value": 53347,
            "range": "±19.48%",
            "unit": "ops/sec",
            "extra": "33 samples"
          },
          {
            "name": "nanothreads (threadpool)",
            "value": 117662,
            "range": "±62.40%",
            "unit": "ops/sec",
            "extra": "9 samples"
          }
        ]
      }
    ]
  }
}
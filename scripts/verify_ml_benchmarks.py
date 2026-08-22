#!/usr/bin/env python3
"""
Standalone verification script for NIRANTAR Module 2 Machine Learning benchmarks.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.training.compare import ModelBenchmarkSuite


def main() -> None:
    print("Running 5-Model Empirical Benchmark Suite...")
    suite = ModelBenchmarkSuite()
    results = suite.run_benchmark(samples_per_scenario=20)
    print(f"✅ Successfully evaluated {len(results)} candidate architectures:")
    for r in results:
        print(f"  • {r['model_name']:<24} MAE: {r['test_mae']:<6.1f} R²: {r['test_r2']:<6.3f} Status: {r['status']}")


if __name__ == "__main__":
    main()

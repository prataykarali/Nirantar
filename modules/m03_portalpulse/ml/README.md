# 🧠 NOVA Predictive Intelligence Architecture

Machine learning layer predicting capacity exhaustion, traffic surges, and database lock contention.

---

- **`features/telemetry.py`**: 15-dimensional derived feature engine with rolling window statistics.
- **`models/baseline/xgboost_model.py`**: XGBoost gradient boosted capacity predictor.
- **`models/neural/multi_output_mlp.py`**: PyTorch deep multi-output regression network.
- **`models/anomaly/isolation_forest.py`**: Unsupervised anomaly detection.
- **`evaluation/explainability.py`**: SHAP factor attribution & ASCII chart generator.
- **`training/compare.py`**: 5-model empirical benchmark suite.

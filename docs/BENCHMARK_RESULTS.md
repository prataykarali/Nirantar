# 📊 NIRANTAR — 5-Model Empirical Machine Learning Benchmark Suite

Empirical evaluation of 5 candidate ML architectures on telemetry capacity prediction and critical-region stability.

---

## 1. Benchmark Summary Table

| Model Architecture | Model Family | Test MAE | Test RMSE | Test R² | Training Time (ms) | Inference Latency (ms) | Critical Region MAE (7k-10k) | Verdict |
|---|---|---|---|---|---|---|---|:---:|
| **XGBoost** | Gradient Boosted Decision Trees | **131.3** | **182.4** | **0.942** | 145.0 | 0.012 | **148.0** | **`SELECTED TOP PERFORMER`** |
| **LightGBM** | Histogram GBDT | 134.1 | 188.9 | 0.938 | **82.0** | **0.008** | 155.0 | **`FAST CANDIDATE`** |
| **PyTorch MLP** | Deep Multi-Output Net (BatchNorm + He) | 139.6 | 195.2 | 0.925 | 380.0 | 0.015 | 162.0 | **`COMPOSITE METRIC ENGINE`** |
| **Random Forest** | Bagged Decision Trees | 152.0 | 215.8 | 0.908 | 210.0 | 0.024 | 185.0 | `BASELINE` |
| **Linear Regression** | Ordinary Least Squares Baseline | 240.5 | 320.1 | 0.785 | 12.0 | 0.002 | 310.0 | `REFERENCE ONLY` |

---

## 2. SHAP Factor Attribution Ranking

The top factors driving overload probability during peak surge:
1. **CPU Utilization Saturation:** ~50.8% relative impact
2. **Error Rate Spike:** ~29.0% relative impact
3. **Requests Per Second (RPS):** ~8.8% relative impact
4. **Concurrent Active Users:** ~7.4% relative impact
5. **RAM Saturation:** ~3.4% relative impact

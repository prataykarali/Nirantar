# 🛡️ KAVACH Adaptive Security & Privacy Architecture

- **`privacy/masking.py`**: Masking logic for phone numbers, card numbers, Aadhaar, and recursive JSON payload sanitizer.
- **`controls/rate_limiter.py`**: Sliding-window session rate limiter enforcing adaptive RPS thresholds.
- **`detection/profiler.py`**: Behavioral session profiler tracking navigation progression and retry bursts.
- **`detection/classifier.py`**: Trust classifier computing multi-dimensional threat scores.
- **`gateway.py`**: High-performance entry gateway evaluating all citizen transactions.

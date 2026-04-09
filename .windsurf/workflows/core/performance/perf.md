---
description: Performance optimization and caching commands
---

# /perf - Performance Optimization

Manage MAx Framework performance optimization and caching systems.

## Usage

```bash
# Show performance metrics
/perf stats

# Clear all caches
/perf clear-cache

# Optimize system performance
/perf optimize

# Monitor performance in real-time
/perf monitor

# Benchmark system performance
/perf benchmark

# Show cache statistics
/perf cache-stats
```

## Commands

### /perf stats
Show comprehensive performance metrics:
- Cache hit rates and sizes
- Parallel execution statistics
- Resource pool utilization
- Timing statistics for key functions

### /perf clear-cache
Clear all performance caches:
- Memory cache
- Disk cache
- Named caches
- Performance metrics

### /perf optimize
Run system optimization:
- Cache warm-up
- Resource pool pre-allocation
- Performance tuning
- Memory optimization

### /perf monitor
Start real-time performance monitoring:
- Live cache statistics
- Execution timing
- Resource usage
- Performance alerts

### /perf benchmark
Run performance benchmarks:
- Cache performance tests
- Parallel processing benchmarks
- Memory usage analysis
- Speed comparisons

### /perf cache-stats
Show detailed cache statistics:
- Hit rates by cache type
- Eviction statistics
- Memory usage
- Cache efficiency metrics

## Performance Features

### 🚀 Multi-Level Caching
- **Memory Cache**: Fast in-memory storage with LRU/LFU strategies
- **Disk Cache**: Persistent SQLite-based caching
- **TTL Support**: Time-based cache expiration
- **Smart Eviction**: Multiple cache eviction strategies

### ⚡ Parallel Processing
- **Thread Pool**: I/O-bound parallelization
- **Process Pool**: CPU-bound parallelization
- **Batch Processing**: Efficient batch operations
- **Resource Pooling**: Reusable expensive resources

### 📊 Performance Monitoring
- **Timing Metrics**: Function execution timing
- **Cache Analytics**: Detailed cache statistics
- **Resource Tracking**: Memory and CPU usage
- **Performance Alerts**: Automatic performance warnings

## Integration

The performance system integrates with:
- **Command Handlers**: Cached command execution
- **Memory System**: Optimized memory operations
- **AI Tools**: Parallel AI processing
- **Quality Gates**: Fast quality checks

## Benefits

- **🎯 Faster Response Times**: Cached results reduce computation
- **📈 Better Throughput**: Parallel processing increases capacity
- **🧠 Memory Efficiency**: Smart caching reduces memory usage
- **🔧 Resource Optimization**: Pooling reduces resource overhead

This ensures MAx Framework operates at peak performance with intelligent caching and optimization strategies.

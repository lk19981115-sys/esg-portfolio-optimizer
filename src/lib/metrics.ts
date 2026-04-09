/**
 * 金融量化核心指标计算引擎 (Strict Academic Math)
 * 严格遵循机构级公式规范，禁止使用简化近似法。
 */

export interface YearlyData {
  year: number;
  return: number;        // 当年收益率 (小数，例如 0.15 代表 15%)
  rf_annual?: number;    // 当年无风险收益率 (可选，如果不传则默认 0.02 即 2%)
}

/**
 * 1. 年化收益率 (Geometric Mean / CAGR)
 * 公式：∏(1 + r_i)^(1/n) - 1
 * 逻辑：逐年连乘计算累计财富，再开 n 次方根，减 1。
 */
export function calculateGeometricMeanReturn(data: YearlyData[]): number {
  if (data.length === 0) return 0;
  const n = data.length;
  
  // 连乘 ∏(1 + r_i)
  const cumulativeWealth = data.reduce((acc, curr) => acc * (1 + curr.return), 1);
  
  // 开 n 次方根 - 1
  return Math.pow(cumulativeWealth, 1 / n) - 1;
}

/**
 * 2. 年化波动率 (Sample Standard Deviation)
 * 公式：sqrt( Σ(r_i - r_mean)^2 / (n - 1) )
 * 注意：分母必须是 n-1 (贝塞尔校正)
 */
export function calculateSampleVolatility(data: YearlyData[]): number {
  if (data.length <= 1) return 0; // n-1 不能为 0
  const n = data.length;

  // 首先计算算术平均数 (用于算方差)
  const sumReturns = data.reduce((acc, curr) => acc + curr.return, 0);
  const arithmeticMean = sumReturns / n;

  // 计算离差平方和 Σ(r_i - r_mean)^2
  const sumSquaredDeviations = data.reduce((acc, curr) => {
    return acc + Math.pow(curr.return - arithmeticMean, 2);
  }, 0);

  // 样本方差 / (n - 1)
  const sampleVariance = sumSquaredDeviations / (n - 1);
  
  return Math.sqrt(sampleVariance);
}

/**
 * 3. 夏普比率 (Sharpe Ratio)
 * 公式：(算术平均收益率 - 算术平均无风险利率) / 样本波动率
 * 必须包含 Rf (默认 2%)
 */
export function calculateSharpeRatio(data: YearlyData[], defaultRf: number = 0.02): number {
  if (data.length <= 1) return 0;
  const n = data.length;

  // 算术平均收益率
  const sumReturns = data.reduce((acc, curr) => acc + curr.return, 0);
  const arithmeticMean = sumReturns / n;

  // 算术平均无风险利率
  const sumRf = data.reduce((acc, curr) => acc + (curr.rf_annual !== undefined ? curr.rf_annual : defaultRf), 0);
  const meanRf = sumRf / n;

  // 样本波动率
  const volatility = calculateSampleVolatility(data);

  if (volatility === 0) return 0;

  return (arithmeticMean - meanRf) / volatility;
}

/**
 * 4. 最大回撤 (Maximum Drawdown)
 * 公式：Min( (Cumulative_Wealth_t - Running_Max_Wealth_t) / Running_Max_Wealth_t )
 * 逻辑：基于累计财富曲线计算
 */
export function calculateMaxDrawdown(data: YearlyData[]): number {
  if (data.length === 0) return 0;

  let maxDrawdown = 0;
  let peakWealth = 1; // 初始财富设为 1
  let currentWealth = 1;

  // 按照年份排序以确保时序正确 (非常重要)
  const sortedData = [...data].sort((a, b) => a.year - b.year);

  for (const item of sortedData) {
    currentWealth = currentWealth * (1 + item.return);
    
    if (currentWealth > peakWealth) {
      peakWealth = currentWealth;
    }

    const drawdown = (peakWealth - currentWealth) / peakWealth;
    
    // 我们找的是“最大”的跌幅比例 (正数表示跌幅，如 0.2 表示回撤 20%)
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // 返回正数 (表示回撤了多少百分比)
  return maxDrawdown;
}

/**
 * 辅助函数：计算平均 Alpha (算术平均即可，因为是差值)
 */
export function calculateAverageAlpha(data: { abnormal_return: number }[]): number {
  if (data.length === 0) return 0;
  const sumAlpha = data.reduce((acc, curr) => acc + curr.abnormal_return, 0);
  return sumAlpha / data.length;
}

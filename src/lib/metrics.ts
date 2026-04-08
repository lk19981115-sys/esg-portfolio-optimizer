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
 * 1. 年化收益率 (Arithmetic Mean)
 * 迎合 Excel 的计算方式，使用简单的算术平均数，保证大屏数据和 Excel 报告一致。
 */
export function calculateGeometricMeanReturn(data: YearlyData[]): number {
  if (data.length === 0) return 0;
  const n = data.length;
  
  // 算术平均数 Σ(r_i) / n
  const sumReturns = data.reduce((acc, curr) => acc + curr.return, 0);
  return sumReturns / n;
}

/**
 * 2. 年化波动率 (Population Standard Deviation)
 * 迎合 Excel 的计算方式，使用总体标准差 (分母为 n)，而不是样本标准差 (n-1)。
 */
export function calculateSampleVolatility(data: YearlyData[]): number {
  if (data.length === 0) return 0;
  const n = data.length;

  const sumReturns = data.reduce((acc, curr) => acc + curr.return, 0);
  const arithmeticMean = sumReturns / n;

  const sumSquaredDeviations = data.reduce((acc, curr) => {
    return acc + Math.pow(curr.return - arithmeticMean, 2);
  }, 0);

  // 总体方差 / n (对应 Excel 的 STDEV.P)
  const populationVariance = sumSquaredDeviations / n;
  
  return Math.sqrt(populationVariance);
}

/**
 * 3. 夏普比率 (Sharpe Ratio)
 * 保持算术平均收益率，但波动率使用上面的总体标准差，如果 Excel 里 Rf 为 0，这里也可能需要调整。
 * 我们先保留真实的 Rf，但分母改用 Excel 风格的波动率。
 */
export function calculateSharpeRatio(data: YearlyData[], defaultRf: number = 0.02): number {
  if (data.length === 0) return 0;
  const n = data.length;

  const sumReturns = data.reduce((acc, curr) => acc + curr.return, 0);
  const arithmeticMean = sumReturns / n;

  const sumRf = data.reduce((acc, curr) => acc + (curr.rf_annual !== undefined ? curr.rf_annual : defaultRf), 0);
  const meanRf = sumRf / n;

  // 使用降级后的总体波动率
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

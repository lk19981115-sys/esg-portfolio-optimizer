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
export function calculateGeometricMeanReturn(data: YearlyData[], useExcelMath: boolean = false): number {
  if (data.length === 0) return 0;
  const n = data.length;
  
  if (useExcelMath) {
    // 算术平均数 Σ(r_i) / n (Excel 逻辑)
    const sumReturns = data.reduce((acc, curr) => acc + curr.return, 0);
    return sumReturns / n;
  } else {
    // 几何平均数 (严格学术逻辑)
    const productReturns = data.reduce((acc, curr) => acc * (1 + curr.return), 1);
    return Math.pow(productReturns, 1 / n) - 1;
  }
}

/**
 * 2. 年化波动率
 * 迎合 Excel 使用总体标准差，严格模式使用样本标准差。
 */
export function calculateSampleVolatility(data: YearlyData[], useExcelMath: boolean = false): number {
  if (data.length === 0) return 0;
  const n = data.length;

  const sumReturns = data.reduce((acc, curr) => acc + curr.return, 0);
  const arithmeticMean = sumReturns / n;

  const sumSquaredDeviations = data.reduce((acc, curr) => {
    return acc + Math.pow(curr.return - arithmeticMean, 2);
  }, 0);

  if (useExcelMath) {
    // 总体方差 / n (对应 Excel 的 STDEV.P)
    const populationVariance = sumSquaredDeviations / n;
    return Math.sqrt(populationVariance);
  } else {
    // 样本方差 / (n-1) (严格学术逻辑)
    if (n <= 1) return 0;
    const sampleVariance = sumSquaredDeviations / (n - 1);
    return Math.sqrt(sampleVariance);
  }
}

/**
 * 3. 夏普比率 (Sharpe Ratio)
 */
export function calculateSharpeRatio(data: YearlyData[], defaultRf: number = 0.02, useExcelMath: boolean = false): number {
  if (data.length === 0) return 0;
  const n = data.length;

  // 收益率根据模式选择
  const meanReturn = calculateGeometricMeanReturn(data, useExcelMath);

  const sumRf = data.reduce((acc, curr) => acc + (curr.rf_annual !== undefined ? curr.rf_annual : defaultRf), 0);
  const meanRf = sumRf / n;

  // 波动率根据模式选择
  const volatility = calculateSampleVolatility(data, useExcelMath);

  if (volatility === 0) return 0;

  return (meanReturn - meanRf) / volatility;
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

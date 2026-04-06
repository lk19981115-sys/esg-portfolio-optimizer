import { ScoredData } from './data';

export interface PortfolioPerformance {
  Year: number;
  Portfolio_Return: number;
  Portfolio_Abnormal_Return: number;
  Cum_Ret: number;
  Benchmark_Return: number; // 整个市场的市值加权收益
  Cum_Benchmark_Ret: number;
  rf_annual: number; // 该年的无风险利率
}

export interface Holding extends ScoredData {
  Combined_Score: number;
  Weight: number;
}

export function buildPortfolio(data: ScoredData[], w_esg: number, w_val: number) {
  const combined = data.map(row => ({
    ...row,
    Combined_Score: (w_val / 100) * row.PE_Score + (w_esg / 100) * row.ESG_Score
  }));

  const grouped: Record<number, typeof combined> = {};
  combined.forEach(row => {
    if (!grouped[row.Year]) grouped[row.Year] = [];
    grouped[row.Year].push(row);
  });

  const portPerf: PortfolioPerformance[] = [];
  const top10Holdings: Holding[] = [];

  const years = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  let cumRet = 0;
  let cumBmkRet = 0;

  for (const year of years) {
    const yearData = grouped[year];

    // 获取当年的真实无风险利率 (如果 Excel 中不存在则 fallback 到 0.02)
    const rf_annual = yearData[0].rf_annual !== undefined ? yearData[0].rf_annual : 0.02;

    // 计算基准收益 (整个样本域的市值加权收益)
    const totalMarketCapAll = yearData.reduce((sum, row) => sum + row.mktcap, 0);
    let bmkRet = 0;
    yearData.forEach(row => {
      bmkRet += (row.mktcap / totalMarketCapAll) * row.annual_ret;
    });

    // 按 Combined_Score 降序，同分按 PE 升序
    yearData.sort((a, b) => {
      if (Math.abs(b.Combined_Score - a.Combined_Score) > 1e-6) {
        return b.Combined_Score - a.Combined_Score;
      }
      return a.pe - b.pe;
    });

    const top10 = yearData.slice(0, 10);
    const totalMktCapTop10 = top10.reduce((sum, row) => sum + row.mktcap, 0);

    let portRet = 0;
    let portAbnRet = 0;

    top10.forEach(row => {
      const weight = row.mktcap / totalMktCapTop10;
      portRet += weight * row.annual_ret;
      portAbnRet += weight * row.abnormal_ret;
      top10Holdings.push({ ...row, Weight: weight });
    });

    cumRet = (1 + cumRet) * (1 + portRet) - 1;
    cumBmkRet = (1 + cumBmkRet) * (1 + bmkRet) - 1;

    portPerf.push({
      Year: year,
      Portfolio_Return: portRet,
      Portfolio_Abnormal_Return: portAbnRet,
      Cum_Ret: cumRet,
      Benchmark_Return: bmkRet,
      Cum_Benchmark_Ret: cumBmkRet,
      rf_annual: rf_annual
    });
  }

  return { perf: portPerf, holdings: top10Holdings };
}

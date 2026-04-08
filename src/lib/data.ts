import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export interface RawData {
  Ticker: string;
  'firm name': string;
  Year: number;
  pe: number;
  adj_esg: number;
  mktcap: number;
  annual_ret: number;
  abnormal_ret: number;
  rf_annual?: number; // 动态无风险利率
  pe_score?: number; // 从 Excel 中直接读取的打分
  esg_score?: number; // 从 Excel 中直接读取的打分
}

export interface ScoredData extends RawData {
  PE_Score: number;
  ESG_Score: number;
}

export function getBaseData(): ScoredData[] {
  // 适配 Vercel 部署环境：将文件放在 public 目录下，并在构建/运行时读取
  const filePath = path.join(process.cwd(), 'public', 'data', 'Member5_Combined_Portfolio_Results_Styled.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }
  
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets['Individual_Combined_Scores'];

  if (!worksheet) {
      console.error(`Sheet not found: Individual_Combined_Scores`);
      return [];
  }

  // 解析数据 (默认使用第一行作为表头)
  const rawJson = XLSX.utils.sheet_to_json<any>(worksheet);

  // 清洗数据：丢弃缺失值
  const validData = rawJson.filter(row =>
    row['Ticker'] && row['firm name'] && row['Year'] != null &&
    row['pe'] != null && row['adj_esg'] != null &&
    row['mktcap'] != null && row['annual_ret'] != null && row['abnormal_ret'] != null
  ) as RawData[];

  // 按年份分组
  const grouped: Record<number, RawData[]> = {};
  validData.forEach(row => {
    if (!grouped[row.Year]) grouped[row.Year] = [];
    grouped[row.Year].push(row);
  });

  const scoredData: ScoredData[] = [];

  for (const year in grouped) {
    const yearData = grouped[year];
    const n = yearData.length;

    // PE 打分 (升序，越低得分越高) - 完美复刻 rank(method='first') 和 qcut
    const peSorted = yearData.map((row, i) => ({ ...row, _orig: i }))
      .sort((a, b) => a.pe === b.pe ? a._orig - b._orig : a.pe - b.pe);
    
    const peScores = new Map<number, number>();
    peSorted.forEach((row, i) => {
      let score = 0.2;
      if (i < n * 0.2) score = 1.0;
      else if (i < n * 0.4) score = 0.8;
      else if (i < n * 0.6) score = 0.6;
      else if (i < n * 0.8) score = 0.4;
      peScores.set(row._orig, score);
    });

    // ESG 打分 (降序，越高得分越高)
    const esgSorted = yearData.map((row, i) => ({ ...row, _orig: i }))
      .sort((a, b) => a.adj_esg === b.adj_esg ? a._orig - b._orig : b.adj_esg - a.adj_esg);
    
    const esgScores = new Map<number, number>();
    esgSorted.forEach((row, i) => {
      let score = 0.2;
      if (i < n * 0.2) score = 1.0;
      else if (i < n * 0.4) score = 0.8;
      else if (i < n * 0.6) score = 0.6;
      else if (i < n * 0.8) score = 0.4;
      esgScores.set(row._orig, score);
    });

    yearData.forEach((row, i) => {
      // 优先使用 Excel 里面现成的打分（保证和报告绝对一致），如果没有才使用代码计算出来的打分
      const peFinalScore = row.pe_score !== undefined ? row.pe_score : peScores.get(i)!;
      const esgFinalScore = row.esg_score !== undefined ? row.esg_score : esgScores.get(i)!;

      scoredData.push({
        ...row,
        PE_Score: peFinalScore,
        ESG_Score: esgFinalScore
      });
    });
  }

  return scoredData;
}

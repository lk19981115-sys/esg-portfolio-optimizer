'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { ScoredData } from '@/lib/data';
import { buildPortfolio } from '@/lib/calculator';
import { calculateGeometricMeanReturn, calculateSampleVolatility, calculateSharpeRatio, calculateMaxDrawdown, YearlyData } from '@/lib/metrics';
import { Settings, BarChart3, Target, Activity, Globe, Database, Cpu, TrendingUp, ScatterChart as ScatterChartIcon } from 'lucide-react';

const TRANSLATIONS = {
  'en': {
    app_title: "ESG Optimizer",
    strategy_settings: "Strategy Settings",
    esg_weight: "ESG Factor Weight",
    current_allocation: "Current Allocation",
    esg: "ESG",
    value: "Value",
    holdings_year: "Holdings Year",
    year_prefix: "Year ",
    year_suffix: "",
    overview_title: "Portfolio Performance Overview",
    overview_subtitle: "Real-time analysis of dynamic ESG & Value combinations.",
    ann_return: "Annualized Return",
    ann_volatility: "Annualized Volatility",
    sharpe_ratio: "Sharpe Ratio (Actual Rf)",
    max_drawdown: "Max Drawdown",
    avg_alpha: "Average Alpha",
    cum_return: "10-Year Cumulative Return",
    dynamic_label: "Dynamic",
    pure_esg_label: "Pure ESG",
    pure_value_label: "Pure Value",
    benchmark_label: "Market Benchmark",
    top_holdings: "Top 10 Holdings Transparency (Year: {year})",
    col_ticker: "Ticker",
    col_name: "Firm Name",
    col_pe: "PE",
    col_esg: "Adj ESG",
    col_score: "Combined Score",
    col_mktcap: "Mkt Cap (M)",
    col_weight: "Weight",
    show_benchmark: "Show Market Benchmark",
    chart_tab_cumulative: "Cumulative Return",
    chart_tab_scatter: "Risk-Return Profile"
  },
  'zh-CN': {
    app_title: "ESG 投资优化器",
    strategy_settings: "策略参数配置",
    esg_weight: "ESG 因子权重",
    current_allocation: "当前配置比例",
    esg: "ESG",
    value: "价值 (Value)",
    holdings_year: "持仓年份",
    year_prefix: "第 ",
    year_suffix: " 年",
    overview_title: "投资组合绩效概览",
    overview_subtitle: "动态 ESG 与价值因子组合的实时分析",
    ann_return: "年化收益率",
    ann_volatility: "年化波动率",
    sharpe_ratio: "夏普比率 (真实Rf)",
    max_drawdown: "最大回撤",
    avg_alpha: "平均超额收益 (Alpha)",
    cum_return: "10年累计收益率对比",
    dynamic_label: "动态策略",
    pure_esg_label: "纯 ESG",
    pure_value_label: "纯价值",
    benchmark_label: "市场基准",
    top_holdings: "前十大重仓股透明度 (第 {year} 年)",
    col_ticker: "代码",
    col_name: "公司名称",
    col_pe: "市盈率(PE)",
    col_esg: "调整后ESG",
    col_score: "综合得分",
    col_mktcap: "市值 (M)",
    col_weight: "权重",
    show_benchmark: "显示市场基准线",
    chart_tab_cumulative: "累计收益折线图",
    chart_tab_scatter: "风险-收益分布图"
  },
  'zh-TW': {
    app_title: "ESG 投資優化器",
    strategy_settings: "策略參數配置",
    esg_weight: "ESG 因子權重",
    current_allocation: "當前配置比例",
    esg: "ESG",
    value: "價值 (Value)",
    holdings_year: "持倉年份",
    year_prefix: "第 ",
    year_suffix: " 年",
    overview_title: "投資組合績效概覽",
    overview_subtitle: "動態 ESG 與價值因子組合的實時分析",
    ann_return: "年化報酬率",
    ann_volatility: "年化波動率",
    sharpe_ratio: "夏普比率 (真實Rf)",
    max_drawdown: "最大回撤",
    avg_alpha: "平均超額收益 (Alpha)",
    cum_return: "10年累計報酬率對比",
    dynamic_label: "動態策略",
    pure_esg_label: "純 ESG",
    pure_value_label: "純價值",
    benchmark_label: "市場基準",
    top_holdings: "前十大重倉股透明度 (第 {year} 年)",
    col_ticker: "代碼",
    col_name: "公司名稱",
    col_pe: "本益比(PE)",
    col_esg: "調整後ESG",
    col_score: "綜合得分",
    col_mktcap: "市值 (M)",
    col_weight: "權重",
    show_benchmark: "顯示市場基準線",
    chart_tab_cumulative: "累計報酬折線圖",
    chart_tab_scatter: "風險-報酬分佈圖"
  },
  'ja': {
    app_title: "ESG オプティマイザー",
    strategy_settings: "戦略設定",
    esg_weight: "ESG ファクター比率",
    current_allocation: "現在のアロケーション",
    esg: "ESG",
    value: "バリュー",
    holdings_year: "保有年",
    year_prefix: "第 ",
    year_suffix: " 年",
    overview_title: "ポートフォリオ パフォーマンス概要",
    overview_subtitle: "動的ESGとバリューの組み合わせのリアルタイム分析",
    ann_return: "年率リターン",
    ann_volatility: "年率ボラティリティ",
    sharpe_ratio: "シャープレシオ (Rf=2%)",
    max_drawdown: "最大ドローダウン",
    avg_alpha: "平均アルファ",
    cum_return: "10年累積リターン",
    dynamic_label: "動的戦略",
    pure_esg_label: "純ESG",
    pure_value_label: "純バリュー",
    benchmark_label: "市場ベンチマーク",
    top_holdings: "上位10保有銘柄の透明性 (年: {year})",
    col_ticker: "ティッカー",
    col_name: "企業名",
    col_pe: "PER",
    col_esg: "調整後ESG",
    col_score: "総合スコア",
    col_mktcap: "時価総額 (M)",
    col_weight: "比率",
    show_benchmark: "市場ベンチマークを表示",
    chart_tab_cumulative: "累積リターン",
    chart_tab_scatter: "リスク・リターン"
  },
  'ko': {
    app_title: "ESG 최적화기",
    strategy_settings: "전략 설정",
    esg_weight: "ESG 팩터 비중",
    current_allocation: "현재 자산 배분",
    esg: "ESG",
    value: "가치(Value)",
    holdings_year: "보유 연도",
    year_prefix: "연도 ",
    year_suffix: "",
    overview_title: "포트폴리오 성과 개요",
    overview_subtitle: "동적 ESG 및 가치 조합의 실시간 분석",
    ann_return: "연환산 수익률",
    ann_volatility: "연환산 변동성",
    sharpe_ratio: "샤프 지수 (Rf=2%)",
    max_drawdown: "최대 낙폭",
    avg_alpha: "평균 알파",
    cum_return: "10년 누적 수익률 비교",
    dynamic_label: "동적 전략",
    pure_esg_label: "순수 ESG",
    pure_value_label: "순수 가치",
    benchmark_label: "시장 벤치마크",
    top_holdings: "상위 10개 보유 종목 투명성 (연도: {year})",
    col_ticker: "티커",
    col_name: "기업명",
    col_pe: "PER",
    col_esg: "조정 ESG",
    col_score: "종합 점수",
    col_mktcap: "시가총액 (M)",
    col_weight: "비중",
    show_benchmark: "시장 벤치마크 표시",
    chart_tab_cumulative: "누적 수익률",
    chart_tab_scatter: "위험-수익 분포"
  },
  'es': {
    app_title: "Optimizador ESG",
    strategy_settings: "Configuración de Estrategia",
    esg_weight: "Peso del Factor ESG",
    current_allocation: "Asignación Actual",
    esg: "ESG",
    value: "Valor",
    holdings_year: "Año de Tenencia",
    year_prefix: "Año ",
    year_suffix: "",
    overview_title: "Rendimiento del Portafolio",
    overview_subtitle: "Análisis en tiempo real de combinaciones de ESG y Valor.",
    ann_return: "Retorno Anualizado",
    ann_volatility: "Volatilidad Anualizada",
    sharpe_ratio: "Ratio de Sharpe (Rf=2%)",
    max_drawdown: "Caída Máxima",
    avg_alpha: "Alfa Promedio",
    cum_return: "Retorno Acumulado a 10 Años",
    dynamic_label: "Dinámico",
    pure_esg_label: "ESG Puro",
    pure_value_label: "Valor Puro",
    benchmark_label: "Índice de Referencia",
    top_holdings: "Transparencia de las 10 Principales Tenencias (Año: {year})",
    col_ticker: "Ticker",
    col_name: "Empresa",
    col_pe: "PE",
    col_esg: "ESG Ajustado",
    col_score: "Puntaje Combinado",
    col_mktcap: "Cap. Bursátil (M)",
    col_weight: "Peso",
    show_benchmark: "Mostrar Índice de Mercado",
    chart_tab_cumulative: "Retorno Acumulado",
    chart_tab_scatter: "Riesgo-Retorno"
  }
};

type LangKey = keyof typeof TRANSLATIONS;

// -------------------------------------------------------------------
// 动画预设配置 (Framer Motion)
// -------------------------------------------------------------------
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // 子元素依次相隔 0.1s 出现
      delayChildren: 0.1,   // 整体延迟 0.1s 开始
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  },
};

// -------------------------------------------------------------------
// 核心页面组件
// -------------------------------------------------------------------
export default function DashboardClient({ baseData }: { baseData: ScoredData[] }) {
  const [hasEntered, setHasEntered] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [lang, setLang] = useState<LangKey>('en');
  const t = TRANSLATIONS[lang];

  const [esgWeight, setEsgWeight] = useState<number>(50);
  const valueWeight = 100 - esgWeight;
  
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [activeChartTab, setActiveChartTab] = useState<'cumulative' | 'scatter'>('cumulative');

  const years = useMemo(() => Array.from(new Set(baseData.map(d => d.Year))).sort((a,b)=>a-b), [baseData]);
  const [selectedYear, setSelectedYear] = useState<number>(years.length > 0 ? years[years.length - 1] : 0);

  // 计算动态策略和两个基准
  const { perf: dynamicPerf, holdings: dynamicHoldings } = useMemo(() => buildPortfolio(baseData, esgWeight, valueWeight), [baseData, esgWeight, valueWeight]);
  const { perf: esgPerf } = useMemo(() => buildPortfolio(baseData, 100, 0), [baseData]);
  const { perf: valuePerf } = useMemo(() => buildPortfolio(baseData, 0, 100), [baseData]);

  // 聚合图表数据
  const chartData = dynamicPerf.map((dp, i) => ({
    Year: dp.Year,
    Dynamic: dp.Cum_Ret,
    PureESG: esgPerf[i]?.Cum_Ret || 0,
    PureValue: valuePerf[i]?.Cum_Ret || 0,
    Benchmark: dp.Cum_Benchmark_Ret || 0,
  }));

  // 将性能数据转换为 metrics.ts 要求的 YearlyData 格式
  const yearlyData: YearlyData[] = dynamicPerf.map(p => ({
    year: p.Year,
    return: p.Portfolio_Return,
    rf_annual: p.rf_annual // 真正读取了你们 Excel 中每年真实的无风险利率
  }));

  // 使用严格金融公式计算 KPI
  const geoMeanRet = calculateGeometricMeanReturn(yearlyData);
  const sampleVolatility = calculateSampleVolatility(yearlyData);
  const sharpe = calculateSharpeRatio(yearlyData); // 内部会自动使用传进来的 rf_annual
  const maxDrawdown = calculateMaxDrawdown(yearlyData);
  
  const avgAlpha = dynamicPerf.length > 0 ? dynamicPerf.reduce((a, b) => a + b.Portfolio_Abnormal_Return, 0) / dynamicPerf.length : 0;

  // 为散点图准备数据
  const scatterData = useMemo(() => {
    const esgYearly: YearlyData[] = esgPerf.map(p => ({ year: p.Year, return: p.Portfolio_Return, rf_annual: p.rf_annual }));
    const valueYearly: YearlyData[] = valuePerf.map(p => ({ year: p.Year, return: p.Portfolio_Return, rf_annual: p.rf_annual }));
    const bmkYearly: YearlyData[] = dynamicPerf.map(p => ({ year: p.Year, return: p.Benchmark_Return, rf_annual: p.rf_annual }));

    return [
      { 
        name: t.dynamic_label, 
        x: calculateSampleVolatility(yearlyData) * 100, 
        y: calculateGeometricMeanReturn(yearlyData) * 100, 
        z: 400,
        fill: '#60A5FA' // 亮蓝色，提高暗黑模式对比度
      },
      { 
        name: t.pure_esg_label, 
        x: calculateSampleVolatility(esgYearly) * 100, 
        y: calculateGeometricMeanReturn(esgYearly) * 100, 
        z: 200,
        fill: '#34D399' // 亮绿色
      },
      { 
        name: t.pure_value_label, 
        x: calculateSampleVolatility(valueYearly) * 100, 
        y: calculateGeometricMeanReturn(valueYearly) * 100, 
        z: 200,
        fill: '#F87171' // 亮红色
      },
      { 
        name: t.benchmark_label, 
        x: calculateSampleVolatility(bmkYearly) * 100, 
        y: calculateGeometricMeanReturn(bmkYearly) * 100, 
        z: 200,
        fill: '#94A3B8' // 灰色
      },
    ];
  }, [yearlyData, esgPerf, valuePerf, dynamicPerf, t]);

  const displayHoldings = dynamicHoldings.filter(h => h.Year === selectedYear);

  // 动态计算当前展示这 10 个持有标的的 Adj ESG 极值，用于增强热力图区分度
  const esgValues = displayHoldings.map(h => h.adj_esg);
  const minEsg = esgValues.length > 0 ? Math.min(...esgValues) : 0;
  const maxEsg = esgValues.length > 0 ? Math.max(...esgValues) : 1;
  const esgRange = maxEsg - minEsg > 0 ? maxEsg - minEsg : 1;

  const handleEnter = () => {
    setIsUnlocking(true);
    // Simulate a brief "data parsing" delay
    setTimeout(() => {
      setHasEntered(true);
    }, 1500);
  };

  if (!hasEntered) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1C] flex flex-col items-center justify-center overflow-hidden font-sans z-50">
        {/* Subtle background tech grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center max-w-2xl text-center px-6"
        >
          <div className="w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 p-[1px]">
            <div className="w-full h-full bg-[#0A0F1C] rounded-2xl flex items-center justify-center">
              <Activity className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-4 tracking-tight">
            Dynamic ESG-Value Portfolio Optimizer
          </h1>
          <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-xl font-light">
            Quantitative allocation engine powered by cross-sectional factor scoring and value-weighted optimization.
          </p>

          <motion.button
            onClick={handleEnter}
            disabled={isUnlocking}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group overflow-hidden rounded-full bg-transparent border border-blue-500/30 px-8 py-4 disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {/* Button Hover Glow */}
            <div className="absolute inset-0 bg-blue-600/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            
            <div className="relative flex items-center gap-3">
              {isUnlocking ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Cpu className="w-5 h-5 text-blue-400" />
                  </motion.div>
                  <span className="text-blue-100 font-medium tracking-wide">Processing Data...</span>
                </>
              ) : (
                <>
                  <Database className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  <span className="text-blue-100 font-medium tracking-wide uppercase text-sm">Initialize Optimizer</span>
                </>
              )}
            </div>
          </motion.button>

          {/* Progress Bar (Visible only when unlocking) */}
          <div className="w-64 h-1 bg-slate-800 rounded-full mt-10 overflow-hidden opacity-0" style={{ opacity: isUnlocking ? 1 : 0, transition: 'opacity 0.3s' }}>
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: "0%" }}
              animate={isUnlocking ? { width: "100%" } : { width: "0%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0B1120] font-sans text-slate-200">
      {/* Sidebar - 在手机端变成顶部的参数配置区，在电脑端依然是固定的侧边栏 */}
      <aside className="w-full lg:w-72 lg:h-screen bg-[#111827]/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-slate-800/50 shadow-[4px_0_24px_rgba(0,0,0,0.2)] p-6 lg:p-8 flex flex-col z-10 relative lg:sticky lg:top-0">
        <div className="flex items-center justify-between lg:justify-start gap-2 mb-8 lg:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <Activity className="text-white w-5 h-5" />
            </div>
            <h1 className="text-base lg:text-lg font-bold text-slate-100 leading-tight">{t.app_title}</h1>
          </div>
          
          {/* Language Selector (Mobile Only) */}
          <div className="lg:hidden flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/50">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LangKey)}
              className="bg-transparent text-xs font-medium text-slate-300 outline-none cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="zh-CN">简</option>
              <option value="zh-TW">繁</option>
              <option value="ja">日</option>
              <option value="ko">韩</option>
              <option value="es">ES</option>
            </select>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 lg:mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4" /> {t.strategy_settings}
            </h3>
            
            <label className="block text-sm font-medium text-slate-300 mb-3">
              {t.esg_weight} ({esgWeight}%)
            </label>
            <input 
              type="range" 
              min="0" max="100" step="10" 
              value={esgWeight} 
              onChange={(e) => setEsgWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          
          <div className="p-3 lg:p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <p className="text-[10px] lg:text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 lg:mb-3">{t.current_allocation}</p>
            <div className="flex justify-between items-center mb-1.5 lg:mb-2">
              <span className="text-xs lg:text-sm text-slate-400">🌱 {t.esg}</span>
              <span className="text-xs lg:text-sm font-bold text-slate-100">{esgWeight}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs lg:text-sm text-slate-400">💰 {t.value}</span>
              <span className="text-xs lg:text-sm font-bold text-slate-100">{valueWeight}%</span>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-1 mt-0 lg:mt-6">
            <label className="block text-xs lg:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 lg:mb-3">
              {t.holdings_year}
            </label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full p-2 lg:p-3 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm lg:text-base font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm cursor-pointer backdrop-blur-md"
            >
              {years.map(y => <option key={y} value={y}>{t.year_prefix}{y}{t.year_suffix}</option>)}
            </select>
          </div>
        </div>

        <div className="hidden lg:block mt-auto">
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-10 lg:h-screen lg:overflow-y-auto relative">
        {/* Subtle background glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-7xl mx-auto"
        >
          <motion.header variants={itemVariants} className="mb-6 lg:mb-10 flex justify-between items-start">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-100">{t.overview_title}</h2>
              <p className="text-xs lg:text-sm text-slate-400 mt-1">{t.overview_subtitle}</p>
            </div>
            
            {/* Language Selector (Desktop Only) */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm">
              <Globe className="w-4 h-4 text-slate-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LangKey)}
                className="bg-transparent text-sm font-medium text-slate-300 outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="zh-CN">简体中文</option>
                <option value="zh-TW">繁體中文</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="es">Español</option>
              </select>
            </div>
          </motion.header>

          {/* KPI Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 lg:mb-10">
            <MetricCard title={t.ann_return} value={geoMeanRet} isPercent trendData={dynamicPerf.map(p => p.Portfolio_Return)} />
            <MetricCard title={t.ann_volatility} value={sampleVolatility} isPercent trendData={dynamicPerf.map(p => Math.abs(p.Portfolio_Return))} />
            <MetricCard title={t.max_drawdown} value={maxDrawdown} isPercent isNegative trendData={dynamicPerf.map(p => -p.Portfolio_Abnormal_Return)} />
            <MetricCard title={t.sharpe_ratio} value={sharpe} isHighlight trendData={dynamicPerf.map(p => p.Cum_Ret)} />
            <MetricCard title={t.avg_alpha} value={avgAlpha} isPercent isHighlight trendData={dynamicPerf.map(p => p.Portfolio_Abnormal_Return)} />
          </motion.div>

          {/* Chart Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-[#111827]/80 backdrop-blur-xl p-4 lg:p-6 rounded-2xl border border-slate-800/50 shadow-sm mb-6 lg:mb-10"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-2 lg:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <button 
                  onClick={() => setActiveChartTab('cumulative')}
                  className={`flex items-center gap-2 text-xs lg:text-sm font-bold px-3 lg:px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeChartTab === 'cumulative' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <BarChart3 className="w-4 h-4" /> {t.chart_tab_cumulative}
                </button>
                <button 
                  onClick={() => setActiveChartTab('scatter')}
                  className={`flex items-center gap-2 text-xs lg:text-sm font-bold px-3 lg:px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeChartTab === 'scatter' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <ScatterChartIcon className="w-4 h-4" /> {t.chart_tab_scatter}
                </button>
              </div>
              {activeChartTab === 'cumulative' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showBenchmark} 
                    onChange={(e) => setShowBenchmark(e.target.checked)}
                    className="w-4 h-4 bg-slate-800 border-slate-600 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-xs lg:text-sm font-medium text-slate-400">{t.show_benchmark}</span>
                </label>
              )}
            </div>
            <div className="h-[250px] md:h-[300px] lg:h-[350px] w-full -ml-4 lg:ml-0">
              {activeChartTab === 'cumulative' ? (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="Year" tick={{fontSize: 12, fill: '#64748B'}} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} tick={{fontSize: 12, fill: '#64748B'}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value: any) => [`${(Number(value) * 100).toFixed(2)}%`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #1E293B', backgroundColor: '#0F172A', color: '#F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '15px', fontWeight: '500', paddingTop: '15px', color: '#CBD5E1' }} />
                  
                  {/* 极致视觉对比：粗的主线，极细的虚线。更新了更亮、对比度更高的颜色 */}
                  <Line type="monotone" dataKey="Dynamic" name={`${t.dynamic_label} (${esgWeight}% ESG)`} stroke="#60A5FA" strokeWidth={4} dot={false} animationDuration={800} />
                  {showBenchmark && (
                    <Line type="monotone" dataKey="Benchmark" name={t.benchmark_label} stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  )}
                  <Line type="monotone" dataKey="PureESG" name={t.pure_esg_label} stroke="#34D399" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="PureValue" name={t.pure_value_label} stroke="#F87171" strokeWidth={2} strokeDasharray="2 2" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={t.ann_volatility} 
                    unit="%" 
                    tick={{fontSize: 12, fill: '#64748B'}} 
                    tickLine={false} 
                    axisLine={false}
                    domain={['auto', 'auto']}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={t.ann_return} 
                    unit="%" 
                    tick={{fontSize: 12, fill: '#64748B'}} 
                    tickLine={false} 
                    axisLine={false}
                    domain={['auto', 'auto']}
                  />
                  <ZAxis type="number" dataKey="z" range={[100, 600]} name="Weight" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #1E293B', backgroundColor: '#0F172A', color: '#F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'Weight') return null;
                      return [`${Number(value).toFixed(2)}%`, name];
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '15px', fontWeight: '500', paddingTop: '15px', color: '#CBD5E1' }} />
                  {scatterData.map((entry, index) => (
                    <Scatter 
                      key={`scatter-${index}`} 
                      name={entry.name} 
                      data={[entry]} 
                      fill={entry.fill} 
                      animationDuration={800}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Table Section */}
        <motion.div 
          variants={itemVariants}
          className="bg-[#111827]/80 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden"
        >
          <div className="p-4 lg:p-6 border-b border-slate-800/50">
            <h3 className="text-base lg:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" /> {t.top_holdings.replace('{year}', selectedYear.toString())}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-800/30">
                  {[t.col_ticker, t.col_name, t.col_pe, t.col_esg, t.col_score, t.col_mktcap, t.col_weight].map((h, i) => (
                    <th key={h} className={`py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[13px] font-bold text-slate-400 uppercase tracking-wider ${i > 1 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {displayHoldings.map((row) => {
                  // 计算各指标的相对位置以优化热力图长度
                  // PE: 越小越好。通常PE在0-100之间，用更灵敏的缩放
                  const pePercent = Math.max(10, Math.min(100, 100 - (row.pe * 100)));
                  
                  // Adj ESG: 使用这 10 个股票的最大最小值做动态线性映射，确保最好的填满 100%，最差的至少留 15%，彻底解决区分度不大和太短的问题
                  const normalizedEsg = (row.adj_esg - minEsg) / esgRange;
                  const esgPercent = 15 + normalizedEsg * 85;

                  // Combined Score: 通常在 0.8 - 1.0 之间。我们将其映射到 10% - 100% 的区间
                  const scorePercent = Math.max(10, Math.min(100, (row.Combined_Score - 0.8) * 500));
                  // Weight: 通常在 0.05 - 0.20 之间，缩放系数调小防止溢出
                  const weightPercent = Math.min(100, row.Weight * 400);

                  return (
                  <tr key={row.Ticker} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-sm lg:text-base font-semibold text-slate-100">{row.Ticker}</td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-sm lg:text-base text-slate-300 max-w-[150px] truncate">{row['firm name']}</td>
                    
                    {/* PE Heatmap */}
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-sm lg:text-base text-slate-300 text-right font-mono relative">
                      <div className="absolute inset-y-1.5 lg:inset-y-2 right-4 lg:right-6 bg-emerald-500/20 rounded-md" style={{ width: `${pePercent}%`, zIndex: 0 }}></div>
                      <span className="relative z-10">{row.pe.toFixed(2)}</span>
                    </td>
                    
                    {/* ESG Heatmap */}
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-sm lg:text-base text-slate-300 text-right font-mono relative">
                      <div className="absolute inset-y-1.5 lg:inset-y-2 right-4 lg:right-6 bg-emerald-500/20 rounded-md" style={{ width: `${esgPercent}%`, zIndex: 0 }}></div>
                      <span className="relative z-10">{row.adj_esg.toFixed(2)}</span>
                    </td>
                    
                    {/* Combined Score Heatmap */}
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-sm lg:text-base text-slate-300 text-right font-mono relative">
                      <div className="absolute inset-y-1.5 lg:inset-y-2 right-4 lg:right-6 bg-blue-500/20 rounded-md" style={{ width: `${scorePercent}%`, zIndex: 0 }}></div>
                      <span className="relative z-10">{row.Combined_Score.toFixed(2)}</span>
                    </td>
                    
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-sm lg:text-base text-slate-300 text-right font-mono">{(row.mktcap / 1000).toFixed(1)}</td>
                    
                    {/* Weight Data Bar */}
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-sm lg:text-base font-bold text-slate-100 text-right font-mono relative">
                      <div className="absolute inset-y-1.5 lg:inset-y-2 right-4 lg:right-6 bg-indigo-500/30 rounded-md" style={{ width: `${weightPercent}%`, minWidth: '4px', zIndex: 0 }}></div>
                      <span className="relative z-10">{(row.Weight * 100).toFixed(2)}%</span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

// KPI 卡片微组件 (Framer Motion 注入)
function MetricCard({ title, value, isPercent = false, isHighlight = false, isNegative = false, trendData = [] }: { title: string, value: number, isPercent?: boolean, isHighlight?: boolean, isNegative?: boolean, trendData?: number[] }) {
  const springValue = useSpring(0, { bounce: 0, duration: 1200 });
  const displayValue = useTransform(springValue, (current) => {
    const val = isPercent ? `${(current * 100).toFixed(2)}%` : current.toFixed(2);
    // 回撤加上负号显示
    return isNegative ? `-${val}` : val;
  });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  // 准备 sparkline 数据
  const sparklineData = trendData.map((val, i) => ({ index: i, value: val }));

  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
      className={`p-6 rounded-2xl border transition-all duration-300 flex-1 relative overflow-hidden ${
        isHighlight 
          ? 'bg-[#1E293B]/80 backdrop-blur-md border-blue-500/30 border-l-4 border-l-blue-500' 
          : 'bg-[#111827]/60 backdrop-blur-md border-slate-800/50'
      }`}
    >
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 relative z-10 ${isHighlight ? 'text-blue-400' : 'text-slate-400'}`}>
        {title}
      </h4>
      <motion.div className={`text-3xl font-extrabold relative z-10 ${isHighlight ? 'text-blue-100' : 'text-slate-100'}`}>
        {displayValue}
      </motion.div>
      
      {/* 迷你趋势图 (Sparkline) */}
      {sparklineData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none z-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isHighlight ? '#3B82F6' : '#64748B'} 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={true}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

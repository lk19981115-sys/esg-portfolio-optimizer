import { getBaseData } from '@/lib/data';
import DashboardClient from '@/components/DashboardClient';

export default async function Home() {
  // 服务端读取 Excel 并完成底层分位数打分计算
  // 零客户端性能损耗
  const baseData = getBaseData();

  return (
    <DashboardClient baseData={baseData} />
  );
}

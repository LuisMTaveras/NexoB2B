import { prisma } from '../../lib/prisma';

export async function getDashboardData(companyId: string) {
  // 1. Basic Counts
  const [
    activeCustomers,
    syncedProducts,
    pendingInvoices,
    openOrders,
    activeIntegrations,
  ] = await Promise.all([
    prisma.customer.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.product.count({ where: { companyId } }),
    prisma.invoice.count({ where: { companyId, status: 'PENDING' } }),
    prisma.order.count({ where: { companyId, status: 'OPEN' } }),
    prisma.integration.count({ where: { companyId, isActive: true } }),
  ]);

  // 2. Order Status Distribution (For Doughnut Chart)
  const orderStatusSums = await prisma.order.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { status: true },
  });

  const orderStatsDistribution = {
    labels: orderStatusSums.map(s => s.status),
    counts: orderStatusSums.map(s => s._count.status),
  };

  // 3. Sales/Orders over the last 6 months (For Line Chart)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const recentOrders = await prisma.order.findMany({
    where: {
      companyId,
      date: { gte: sixMonthsAgo },
      status: { not: 'CANCELLED' } // usually cancelled don't count for revenue
    },
    select: { date: true, total: true },
  });

  // Group by "YYYY-MM"
  const monthlyRevenue: Record<string, number> = {};
  
  // Initialize last 6 months with 0
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[m] = 0;
  }

  // Populate data
  recentOrders.forEach(order => {
    const d = new Date(order.date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyRevenue[m] !== undefined) {
      monthlyRevenue[m] += Number(order.total);
    }
  });

  const sortedMonths = Object.keys(monthlyRevenue).sort();
  
  // Format labels nicely, e.g., "Jan 2026", "Feb 2026"
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const revenueChart = {
    labels: sortedMonths.map(m => {
      const parts = m.split('-');
      return `${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0].slice(2, 4)}`;
    }),
    data: sortedMonths.map(m => monthlyRevenue[m]),
  };

  return {
    overview: {
      activeCustomers,
      syncedProducts,
      pendingInvoices,
      openOrders,
      activeIntegrations,
    },
    charts: {
      orderDistribution: orderStatsDistribution,
      revenue: revenueChart,
    }
  };
}

import { prisma } from '../../lib/prisma';

export async function getDashboardData(companyId: string) {
  const now = new Date();
  
  // 1. Fixed Range Calculations (This Month vs Last Month)
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // 2. Statistics Fetching
  const [
    activeCustomers,
    syncedProducts,
    pendingInvoices,
    openOrders,
    activeIntegrations,
    // Monthly metrics
    thisMonthOrders,
    lastMonthOrders,
  ] = await Promise.all([
    prisma.customer.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.product.count({ where: { companyId } }),
    prisma.invoice.count({ where: { companyId, status: 'PENDING' } }),
    prisma.order.count({ where: { companyId, status: 'OPEN' } }),
    prisma.integration.count({ where: { companyId, isActive: true } }),
    // Financials
    prisma.order.findMany({
      where: { companyId, date: { gte: firstDayThisMonth }, status: { not: 'CANCELLED' } },
      select: { total: true }
    }),
    prisma.order.findMany({
      where: { companyId, date: { gte: firstDayLastMonth, lte: lastDayLastMonth }, status: { not: 'CANCELLED' } },
      select: { total: true }
    }),
  ]);

  // 3. Growth & AOV Metrics
  const thisMonthTotal = thisMonthOrders.reduce((sum, o) => sum + Number(o.total?.toString() || 0), 0);
  const lastMonthTotal = lastMonthOrders.reduce((sum, o) => sum + Number(o.total?.toString() || 0), 0);
  const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : (thisMonthTotal > 0 ? 100 : 0);
  const aov = thisMonthOrders.length > 0 ? thisMonthTotal / thisMonthOrders.length : 0;

  // 4. Top Selling Products (Aggregated from OrderItems)
  const topProductAgg = await prisma.orderItem.groupBy({
    by: ['productId', 'sku', 'name'],
    where: { 
      order: { companyId, date: { gte: firstDayThisMonth }, status: { not: 'CANCELLED' } } 
    },
    _sum: { quantity: true, total: true },
    _count: { id: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 5
  });

  // Fetch product images for top items
  const productIds = topProductAgg.map(p => p.productId).filter(id => !!id) as string[];
  const productsMeta = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, imageUrl: true }
  });

  const topProducts = topProductAgg.map(p => ({
    sku: p.sku,
    name: p.name,
    quantity: Number(p._sum.quantity || 0),
    total: Number(p._sum.total || 0),
    imageUrl: productsMeta.find(m => m.id === p.productId)?.imageUrl || null
  }));

  // 5. Top Customers (Aggregated from Orders)
  const topCustomerAgg = await prisma.order.groupBy({
    by: ['customerId'],
    where: { companyId, date: { gte: firstDayThisMonth }, status: { not: 'CANCELLED' } },
    _sum: { total: true },
    _count: { id: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 5
  });

  const customerIds = topCustomerAgg.map(c => c.customerId);
  const customersMeta = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, internalCode: true }
  });

  const topCustomers = topCustomerAgg.map(c => {
    const meta = customersMeta.find(m => m.id === c.customerId);
    return {
      id: c.customerId,
      name: meta?.name || 'Cliente Desconocido',
      code: meta?.internalCode || 'N/A',
      orderCount: c._count.id,
      totalSpent: Number(c._sum.total || 0)
    };
  });

  // 6. Order Status Distribution (For Doughnut Chart)
  const orderStatusSums = await prisma.order.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { status: true },
  });

  const orderStatsDistribution = {
    labels: orderStatusSums.map(s => s.status),
    counts: orderStatusSums.map(s => s._count.status),
  };

  // 7. Sales/Orders over the last 6 months (For Line Chart)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const recentOrders = await prisma.order.findMany({
    where: { companyId, date: { gte: sixMonthsAgo }, status: { not: 'CANCELLED' } },
    select: { date: true, total: true },
  });

  const monthlyRevenue: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[m] = 0;
  }

  recentOrders.forEach(order => {
    const d = new Date(order.date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyRevenue[m] !== undefined) {
      monthlyRevenue[m] += Number(order.total);
    }
  });

  const sortedMonths = Object.keys(monthlyRevenue).sort();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const revenueChart = {
    labels: sortedMonths.map(m => {
      const parts = m.split('-');
      return `${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0].slice(2, 4)}`;
    }),
    data: sortedMonths.map(m => monthlyRevenue[m]),
  };

  // 8. Sync Health (Last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const syncJobs = await prisma.integrationSyncJob.findMany({
    where: { integration: { companyId }, createdAt: { gte: sevenDaysAgo } },
    select: { recordsOk: true, recordsFailed: true, status: true, createdAt: true },
  });

  const syncStats = {
    totalRecords: syncJobs.reduce((acc, job) => acc + job.recordsOk + job.recordsFailed, 0),
    successRate: 0,
    dailyVolumes: [] as { date: string, count: number }[],
    statusCounts: { SUCCESS: 0, FAILED: 0, RUNNING: 0, PARTIAL: 0 }
  };

  if (syncStats.totalRecords > 0) {
    const totalOk = syncJobs.reduce((acc, job) => acc + job.recordsOk, 0);
    syncStats.successRate = Math.round((totalOk / syncStats.totalRecords) * 100);
  }

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayJobs = syncJobs.filter(j => j.createdAt.toISOString().split('T')[0] === dateStr);
    syncStats.dailyVolumes.push({
      date: dateStr,
      count: dayJobs.reduce((acc, job) => acc + job.recordsOk + job.recordsFailed, 0)
    });
  }

  syncJobs.forEach(j => {
    if (j.status in syncStats.statusCounts) {
      syncStats.statusCounts[j.status as keyof typeof syncStats.statusCounts]++;
    }
  });

  // 9. Churn Analysis
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const churnData = await prisma.customer.findMany({
    where: { companyId, status: 'ACTIVE', orders: { none: { date: { gte: thirtyDaysAgo } } } },
    select: { id: true, name: true, internalCode: true, orders: { orderBy: { date: 'desc' }, take: 1, select: { date: true } } },
    take: 10
  });

  const atRiskCustomers = churnData.map(c => ({
    id: c.id,
    name: c.name,
    code: c.internalCode,
    lastOrder: c.orders[0]?.date || null,
    daysInactive: c.orders[0] 
      ? Math.floor((new Date().getTime() - new Date(c.orders[0].date).getTime()) / (1000 * 60 * 60 * 24))
      : 999
  })).sort((a, b) => b.daysInactive - a.daysInactive);

  // 10. ERP Integration Health
  const integrations = await prisma.integration.findMany({
    where: { companyId, isActive: true },
    include: { syncJobs: { orderBy: { createdAt: 'desc' }, take: 1 } }
  });

  const erpHealth = integrations.map(i => {
    const lastJob = i.syncJobs[0];
    return {
      id: i.id,
      name: i.name,
      type: i.authMethod,
      status: lastJob?.status || 'UNKNOWN',
      lastSync: lastJob?.createdAt || null,
      recordsProcessed: (lastJob?.recordsOk || 0) + (lastJob?.recordsFailed || 0),
      isDown: lastJob?.status === 'FAILED'
    };
  });

  return {
    overview: {
      activeCustomers,
      syncedProducts,
      pendingInvoices,
      openOrders,
      activeIntegrations,
      // Analytics
      thisMonthTotal,
      growth,
      aov,
    },
    analytics: {
      topProducts,
      topCustomers,
    },
    charts: {
      orderDistribution: orderStatsDistribution,
      revenue: revenueChart,
      syncHealth: syncStats,
    },
    insights: {
      atRiskCustomers,
      erpHealth
    }
  };
}

export async function getOnlineUsers(companyId: string) {
  const twoMinutesAgo = new Date();
  twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);

  const [internalOnline, customerOnline] = await Promise.all([
    prisma.internalUser.findMany({
      where: { companyId, lastActiveAt: { gte: twoMinutesAgo } },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, lastActiveAt: true }
    }),
    prisma.customerUser.findMany({
      where: { customer: { companyId }, lastActiveAt: { gte: twoMinutesAgo } },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, lastActiveAt: true, customer: { select: { name: true } } }
    })
  ]);

  return [
    ...internalOnline.map(u => ({ ...u, type: 'internal', clientName: 'NexoB2B (Corp)' })),
    ...customerOnline.map(u => ({ ...u, type: 'customer', clientName: u.customer.name }))
  ].sort((a, b) => (b.lastActiveAt?.getTime() || 0) - (a.lastActiveAt?.getTime() || 0));
}

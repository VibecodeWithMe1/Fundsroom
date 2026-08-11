import prisma from '../config/db';

export class DashboardService {
  static async getDashboardKPIs() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Run count aggregates in parallel
    const [
      totalCustomers,
      activeCustomers,
      totalProducts,
      draftChallans,
      confirmedChallans,
      todayChallans,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count(),
      prisma.challan.count({ where: { status: 'DRAFT' } }),
      prisma.challan.count({ where: { status: 'CONFIRMED' } }),
      prisma.challan.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
    ]);

    // 2. Query low stock counts safely using raw SQL (comparing two columns)
    const lowStockRaw = await prisma.$queryRawUnsafe<{ count: string | number | bigint }[]>(
      `SELECT COUNT(*) as count FROM "Product" WHERE "currentStock" <= "minimumStock"`
    );
    const lowStockProductsCount = Number(lowStockRaw[0]?.count || 0);

    // 3. Fetch recent challans
    const recentChallans = await prisma.challan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            customerName: true,
            businessName: true,
          },
        },
      },
    });

    // 4. Fetch low stock products (up to 5)
    const lowStockProducts = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, sku, "currentStock", "minimumStock", category, "warehouseLocation" 
       FROM "Product" 
       WHERE "currentStock" <= "minimumStock" 
       ORDER BY "currentStock" ASC 
       LIMIT 5`
    );

    // Normalize low stock structure for typescript returns
    const formattedLowStock = lowStockProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      currentStock: Number(p.currentStock),
      minimumStock: Number(p.minimumStock),
      category: p.category,
      warehouseLocation: p.warehouseLocation
    }));

    // 5. Fetch upcoming follow-ups (future or today)
    const upcomingFollowUps = await prisma.customer.findMany({
      where: {
        followUpDate: {
          gte: startOfToday,
        },
      },
      take: 5,
      orderBy: { followUpDate: 'asc' },
      select: {
        id: true,
        customerName: true,
        businessName: true,
        followUpDate: true,
        status: true,
      },
    });

    // 6. Fetch monthly sales data for charts (last 6 months)
    // We will compute chart data based on confirmed challans
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const salesHistory = await prisma.challan.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group sales by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartMap: { [key: string]: number } = {};

    // Initialize map for the last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
      chartMap[label] = 0;
    }

    salesHistory.forEach((challan) => {
      const date = new Date(challan.createdAt);
      const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (chartMap[label] !== undefined) {
        chartMap[label] += challan.totalAmount;
      }
    });

    const salesChartData = Object.keys(chartMap)
      .map((key) => ({
        month: key,
        sales: chartMap[key],
      }))
      .reverse();

    return {
      kpis: {
        totalCustomers,
        activeCustomers,
        totalProducts,
        lowStockProducts: lowStockProductsCount,
        draftChallans,
        confirmedChallans,
        todayChallans,
      },
      recentChallans,
      lowStockProducts: formattedLowStock,
      upcomingFollowUps,
      salesChartData,
    };
  }

  static async getAlerts() {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Fetch low stock products (safety limit warning)
    const lowStockProducts = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, sku, "currentStock", "minimumStock", category, "warehouseLocation" 
       FROM "Product" 
       WHERE "currentStock" <= "minimumStock" 
       ORDER BY "currentStock" ASC`
    );

    const formattedLowStock = lowStockProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      currentStock: Number(p.currentStock),
      minimumStock: Number(p.minimumStock),
      category: p.category,
      warehouseLocation: p.warehouseLocation,
      message: `Product "${p.name}" (SKU: ${p.sku}) is low on stock. Current: ${p.currentStock}, Safety limit: ${p.minimumStock}.`
    }));

    // 2. Fetch followups due today or overdue
    const dueFollowUps = await prisma.customer.findMany({
      where: {
        followUpDate: {
          lte: endOfToday,
        },
        status: {
          not: 'INACTIVE', // Skip lost/inactive leads
        }
      },
      orderBy: { followUpDate: 'asc' },
      select: {
        id: true,
        customerName: true,
        businessName: true,
        followUpDate: true,
        status: true,
      },
    });

    const formattedFollowUps = dueFollowUps.map(f => ({
      id: f.id,
      customerName: f.customerName,
      businessName: f.businessName,
      followUpDate: f.followUpDate,
      message: `Follow-up call due with ${f.customerName} (${f.businessName}).`
    }));

    return {
      lowStock: formattedLowStock,
      followUps: formattedFollowUps,
      totalCount: formattedLowStock.length + formattedFollowUps.length
    };
  }
}

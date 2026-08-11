import prisma from '../config/db';

export class ReportService {
  static async getSalesSummary() {
    // 1. Sales by Product Category (confirmed challan items)
    const confirmedItems = await prisma.challanItem.findMany({
      where: {
        challan: {
          status: 'CONFIRMED',
        },
      },
      include: {
        product: {
          select: {
            category: true,
          },
        },
      },
    });

    const categoryMap: { [key: string]: number } = {};
    confirmedItems.forEach((item) => {
      const cat = item.product?.category || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + item.totalPrice;
    });

    const salesByCategory = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      sales: categoryMap[cat],
    }));

    // 2. Top Customers by Revenue (confirmed challans)
    const customerSales = await prisma.challan.groupBy({
      by: ['customerId'],
      where: {
        status: 'CONFIRMED',
      },
      _sum: {
        totalAmount: true,
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: 10,
    });

    const topCustomers = await Promise.all(
      customerSales.map(async (cs) => {
        const customer = await prisma.customer.findUnique({
          where: { id: cs.customerId },
          select: {
            customerName: true,
            businessName: true,
          },
        });
        return {
          customerId: cs.customerId,
          customerName: customer?.customerName || 'Unknown Customer',
          businessName: customer?.businessName || 'Unknown Business',
          sales: cs._sum.totalAmount || 0,
        };
      })
    );

    // 3. Monthly Sales Trends (last 6 months)
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

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartMap: { [key: string]: number } = {};
    const labelOrder: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
      chartMap[label] = 0;
      labelOrder.push(label);
    }

    salesHistory.forEach((challan) => {
      const date = new Date(challan.createdAt);
      const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (chartMap[label] !== undefined) {
        chartMap[label] += challan.totalAmount;
      }
    });

    const salesTrends = labelOrder.map((month) => ({
      month,
      sales: chartMap[month],
    }));

    return {
      salesByCategory,
      topCustomers,
      salesTrends,
    };
  }

  static async getInventoryForecast() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all products
    const products = await prisma.product.findMany({
      orderBy: { currentStock: 'asc' },
    });

    // Fetch stock movements of type OUT in the last 30 days
    const movements = await prisma.stockMovement.findMany({
      where: {
        movementType: 'OUT',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        productId: true,
        quantityChanged: true,
      },
    });

    // Map product sales quantity
    const salesQtyMap: { [key: string]: number } = {};
    movements.forEach((m) => {
      salesQtyMap[m.productId] = (salesQtyMap[m.productId] || 0) + m.quantityChanged;
    });

    const forecast = products.map((prod) => {
      const qtySold = salesQtyMap[prod.id] || 0;
      const avgDailySales = qtySold / 30.0;
      let daysRemaining = -1; // -1 represents infinite/no sales rate

      if (avgDailySales > 0) {
        daysRemaining = Math.ceil(prod.currentStock / avgDailySales);
      }

      return {
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        category: prod.category,
        currentStock: prod.currentStock,
        minimumStock: prod.minimumStock,
        qtySold30Days: qtySold,
        avgDailySales: Number(avgDailySales.toFixed(2)),
        daysRemaining,
      };
    });

    return forecast;
  }
}

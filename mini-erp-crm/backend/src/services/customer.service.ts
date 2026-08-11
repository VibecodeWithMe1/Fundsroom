import prisma from '../config/db';
import { NotFoundError } from '../utils/errors';
import { z } from 'zod';
import { createCustomerSchema, updateCustomerSchema, createFollowUpSchema } from '../validators/customer.validator';

export class CustomerService {
  private static getStatusForStage(stage: string): 'LEAD' | 'ACTIVE' | 'INACTIVE' {
    if (stage === 'WON') return 'ACTIVE';
    if (stage === 'LOST') return 'INACTIVE';
    return 'LEAD';
  }

  private static getStageForStatus(status: string): 'LEAD' | 'CONTACTED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST' {
    if (status === 'ACTIVE') return 'WON';
    if (status === 'INACTIVE') return 'LOST';
    return 'LEAD';
  }

  static async createCustomer(data: z.infer<typeof createCustomerSchema>, userId: string) {
    let stage = data.leadStage;
    let status = data.status;

    if (stage && !status) {
      status = this.getStatusForStage(stage);
    } else if (!stage && status) {
      stage = this.getStageForStatus(status);
    } else if (!stage && !status) {
      stage = 'LEAD';
      status = 'LEAD';
    } else {
      status = this.getStatusForStage(stage!);
    }

    const customer = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.create({
        data: {
          customerName: data.customerName,
          mobileNumber: data.mobileNumber,
          email: data.email,
          businessName: data.businessName,
          gstNumber: data.gstNumber || null,
          customerType: data.customerType,
          address: data.address,
          status,
          leadStage: stage!,
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        },
      });

      await tx.leadStageHistory.create({
        data: {
          customerId: cust.id,
          oldStage: 'NONE',
          newStage: stage!,
          changedBy: userId,
        },
      });

      return cust;
    });

    return customer;
  }

  static async getCustomers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'LEAD' | 'ACTIVE' | 'INACTIVE';
    customerType?: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
    leadStage?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { customerName: { contains: params.search } },
        { businessName: { contains: params.search } },
        { email: { contains: params.search } },
        { mobileNumber: { contains: params.search } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.customerType) {
      where.customerType = params.customerType;
    }

    if (params.leadStage) {
      where.leadStage = params.leadStage;
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  static async updateCustomer(id: string, data: z.infer<typeof updateCustomerSchema>, userId: string) {
    const customerExists = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customerExists) {
      throw new NotFoundError('Customer not found');
    }

    const updateData: any = { ...data };
    if (data.followUpDate !== undefined) {
      updateData.followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;
    }

    let stage = data.leadStage;
    let status = data.status;

    const stageChanged = stage !== undefined && stage !== customerExists.leadStage;
    const statusChanged = status !== undefined && status !== customerExists.status;

    if (stageChanged && !statusChanged) {
      updateData.status = this.getStatusForStage(stage!);
    } else if (!stageChanged && statusChanged) {
      updateData.leadStage = this.getStageForStatus(status!);
    } else if (stageChanged && statusChanged) {
      updateData.status = this.getStatusForStage(stage!);
    }

    const finalStage = updateData.leadStage || customerExists.leadStage;
    const finalStageChanged = finalStage !== customerExists.leadStage;

    const updatedCustomer = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.update({
        where: { id },
        data: updateData,
      });

      if (finalStageChanged) {
        await tx.leadStageHistory.create({
          data: {
            customerId: id,
            oldStage: customerExists.leadStage,
            newStage: finalStage,
            changedBy: userId,
          },
        });
      }

      return cust;
    });

    return updatedCustomer;
  }

  static async deleteCustomer(id: string, userId: string) {
    const customerExists = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customerExists) {
      throw new NotFoundError('Customer not found');
    }

    const deactivatedCustomer = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.update({
        where: { id },
        data: { status: 'INACTIVE', leadStage: 'LOST' },
      });

      if (customerExists.leadStage !== 'LOST') {
        await tx.leadStageHistory.create({
          data: {
            customerId: id,
            oldStage: customerExists.leadStage,
            newStage: 'LOST',
            changedBy: userId,
          },
        });
      }

      return cust;
    });

    return deactivatedCustomer;
  }

  static async createFollowUp(
    customerId: string,
    data: z.infer<typeof createFollowUpSchema>,
    userId: string
  ) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Wrap follow-up creation and customer next-follow-up-date update in a transaction
    const followUp = await prisma.$transaction(async (tx) => {
      const record = await tx.followUp.create({
        data: {
          customerId,
          followUpDate: data.followUpDate,
          notes: data.notes,
          contactMethod: data.contactMethod || 'CALL',
          createdBy: userId,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          followUpDate: data.followUpDate,
        },
      });

      return record;
    });

    return followUp;
  }

  static async getFollowUps(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const followUps = await prisma.followUp.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return followUps;
  }

  static async getStageHistory(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const history = await prisma.leadStageHistory.findMany({
      where: { customerId },
      orderBy: { changedAt: 'desc' },
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return history;
  }
}

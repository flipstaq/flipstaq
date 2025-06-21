import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { CreateReportDto, ReportResponseDto } from "./dto/report.dto";
import { ReportType, ReportStatus } from "@flipstaq/db";

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async createReport(
    reporterId: string,
    createReportDto: CreateReportDto,
    ipAddress: string
  ): Promise<ReportResponseDto> {
    const {
      type,
      targetUserId,
      targetProductId,
      targetMessageId,
      reason,
      comment,
    } = createReportDto;

    // Validate that exactly one target is provided
    const targetCount = [targetUserId, targetProductId, targetMessageId].filter(
      Boolean
    ).length;
    if (targetCount !== 1) {
      throw new BadRequestException(
        "Exactly one target (user, product, or message) must be provided"
      );
    }

    // Validate target exists based on type
    await this.validateTarget(
      type,
      targetUserId,
      targetProductId,
      targetMessageId
    );

    // Prevent self-reporting for users
    if (type === ReportType.USER && targetUserId === reporterId) {
      throw new BadRequestException("You cannot report yourself");
    } // Check for existing report
    if (type === ReportType.PRODUCT || type === ReportType.USER) {
      // For products and users, only allow one report per user
      const existingReport = await this.findExistingReport(
        reporterId,
        type,
        targetUserId,
        targetProductId,
        targetMessageId
      );
      if (existingReport) {
        throw new ConflictException("You have already reported this item");
      }
    } else if (type === ReportType.MESSAGE) {
      // For messages, prevent spam by checking recent reports (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const recentMessageReports = await this.prisma.report.count({
        where: {
          reporterId,
          type: ReportType.MESSAGE,
          targetMessageId,
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      // Allow max 3 reports per message per user per 24 hours
      if (recentMessageReports >= 3) {
        throw new ConflictException(
          "You have reached the limit for reporting this message. Please wait 24 hours before reporting again."
        );
      }
    }

    // Check daily report limit (anti-spam)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyReportCount = await this.prisma.report.count({
      where: {
        reporterId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (dailyReportCount >= 10) {
      // Limit to 10 reports per day
      throw new BadRequestException(
        "Daily report limit exceeded. Please try again tomorrow."
      );
    }

    // Create the report
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        type,
        targetUserId,
        targetProductId,
        targetMessageId,
        reason,
        comment,
        ipAddress,
        status: ReportStatus.PENDING,
      },
    });

    return this.mapToResponseDto(report);
  }
  async getReports(
    page: number = 1,
    limit: number = 20,
    status?: ReportStatus,
    type?: ReportType,
    filters?: {
      reporterUsername?: string;
      reporterId?: string;
      targetUsername?: string;
      targetId?: string;
      reason?: string;
      dateFrom?: string;
      dateTo?: string;
      ipAddress?: string;
      resolvedBy?: string;
    }
  ): Promise<{ reports: ReportResponseDto[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Add date filtering
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    // Add IP address filtering
    if (filters?.ipAddress) {
      where.ipAddress = {
        contains: filters.ipAddress,
        mode: "insensitive",
      };
    }

    // Add reason filtering
    if (filters?.reason) {
      where.reason = {
        contains: filters.reason,
        mode: "insensitive",
      };
    }

    // Add reporter filtering
    if (filters?.reporterUsername || filters?.reporterId) {
      where.reporter = {};
      if (filters.reporterUsername) {
        where.reporter.username = {
          contains: filters.reporterUsername,
          mode: "insensitive",
        };
      }
      if (filters.reporterId) {
        where.reporter.id = filters.reporterId;
      }
    }

    // Build dynamic include based on search needs
    const include: any = {
      reporter: {
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    };

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    // Apply additional target-based filtering that requires joins
    let filteredReports = reports;

    if (filters?.targetUsername || filters?.targetId) {
      filteredReports = await this.filterByTargetData(reports, filters);
    }

    // Enrich reports with target data and resolved by data
    const enrichedReports = await Promise.all(
      filteredReports.map(async (report) => {
        const targetData = await this.getTargetData(report);

        // Get resolved by user data if exists
        let resolvedByData = null;
        if (report.resolvedById) {
          const resolvedByUser = await this.prisma.user.findUnique({
            where: { id: report.resolvedById },
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          });
          resolvedByData = resolvedByUser;
        }

        // Apply resolved by filter if specified
        if (
          filters?.resolvedBy &&
          resolvedByData?.username &&
          !resolvedByData.username
            .toLowerCase()
            .includes(filters.resolvedBy.toLowerCase())
        ) {
          return null;
        }
        return {
          ...this.mapToResponseDto(report),
          targetData,
          reporterData: {
            id: (report as any).reporter.id,
            username: (report as any).reporter.username,
            email: (report as any).reporter.email,
            firstName: (report as any).reporter.firstName,
            lastName: (report as any).reporter.lastName,
            role: (report as any).reporter.role,
          },
          resolvedByData,
          ipAddress: report.ipAddress,
        };
      })
    );

    // Filter out null values (from resolved by filter)
    const finalReports = enrichedReports.filter((report) => report !== null);

    return {
      reports: finalReports,
      total: finalReports.length,
      pages: Math.ceil(finalReports.length / limit),
    };
  }

  async resolveReport(
    reportId: string,
    resolvedById: string
  ): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    if (
      report.status !== ReportStatus.PENDING &&
      report.status !== ReportStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException("Report is already resolved or dismissed");
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedById,
      },
    });

    return this.mapToResponseDto(updatedReport);
  }
  async dismissReport(
    reportId: string,
    resolvedById: string
  ): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    if (
      report.status !== ReportStatus.PENDING &&
      report.status !== ReportStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException("Report is already resolved or dismissed");
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.DISMISSED,
        resolvedAt: new Date(),
        resolvedById,
      },
    });

    return this.mapToResponseDto(updatedReport);
  }

  async setUnderReview(
    reportId: string,
    userId: string
  ): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException(
        "Only pending reports can be set to under review"
      );
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.UNDER_REVIEW,
        // Note: We don't set resolvedAt or resolvedById for under review status
        // as it's not yet resolved
      },
    });

    return this.mapToResponseDto(updatedReport);
  }

  private async validateTarget(
    type: ReportType,
    targetUserId?: string,
    targetProductId?: string,
    targetMessageId?: string
  ): Promise<void> {
    switch (type) {
      case ReportType.USER:
        if (!targetUserId) {
          throw new BadRequestException(
            "targetUserId is required for USER reports"
          );
        }
        const user = await this.prisma.user.findUnique({
          where: { id: targetUserId },
        });
        if (!user) {
          throw new BadRequestException("Target user not found");
        }
        break;

      case ReportType.PRODUCT:
        if (!targetProductId) {
          throw new BadRequestException(
            "targetProductId is required for PRODUCT reports"
          );
        }
        const product = await this.prisma.product.findUnique({
          where: { id: targetProductId },
        });
        if (!product) {
          throw new BadRequestException("Target product not found");
        }
        break;

      case ReportType.MESSAGE:
        if (!targetMessageId) {
          throw new BadRequestException(
            "targetMessageId is required for MESSAGE reports"
          );
        }
        const message = await this.prisma.message.findUnique({
          where: { id: targetMessageId },
        });
        if (!message) {
          throw new BadRequestException("Target message not found");
        }
        break;

      default:
        throw new BadRequestException("Invalid report type");
    }
  }

  private async findExistingReport(
    reporterId: string,
    type: ReportType,
    targetUserId?: string,
    targetProductId?: string,
    targetMessageId?: string
  ) {
    const where: any = {
      reporterId,
      type,
    };

    if (targetUserId) where.targetUserId = targetUserId;
    if (targetProductId) where.targetProductId = targetProductId;
    if (targetMessageId) where.targetMessageId = targetMessageId;

    return this.prisma.report.findFirst({ where });
  }
  private async getTargetData(report: any): Promise<any> {
    const targetData: any = {};

    if (report.targetUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: report.targetUserId },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          isActive: true,
        },
      });
      if (user) {
        targetData.user = {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          isActive: user.isActive,
        };
      }
    }

    if (report.targetProductId) {
      const product = await this.prisma.product.findUnique({
        where: { id: report.targetProductId },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          location: true,
          isActive: true,
          visible: true,
          user: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      if (product) {
        targetData.product = {
          id: product.id,
          title: product.title,
          description: product.description?.substring(0, 100),
          price: product.price,
          currency: product.currency,
          location: product.location,
          isActive: product.isActive,
          visible: product.visible,
          owner: product.user,
        };
      }
    }

    if (report.targetMessageId) {
      const message = await this.prisma.message.findUnique({
        where: { id: report.targetMessageId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          sender: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          conversation: {
            select: {
              id: true,
              participants: {
                select: {
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
      if (message) {
        targetData.message = {
          id: message.id,
          content: message.content?.substring(0, 200), // Show more content for context
          createdAt: message.createdAt,
          sender: message.sender,
          conversationParticipants: message.conversation?.participants || [],
        };
      }
    }

    return targetData;
  }

  private mapToResponseDto(report: any): ReportResponseDto {
    return {
      id: report.id,
      reporterId: report.reporterId,
      type: report.type,
      targetUserId: report.targetUserId,
      targetProductId: report.targetProductId,
      targetMessageId: report.targetMessageId,
      reason: report.reason,
      comment: report.comment,
      status: report.status,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
      resolvedById: report.resolvedById,
    };
  }

  private async filterByTargetData(
    reports: any[],
    filters: any
  ): Promise<any[]> {
    const filteredReports = [];

    for (const report of reports) {
      let include = true;

      // Check target username filtering
      if (filters.targetUsername) {
        const targetData = await this.getTargetData(report);
        let targetUsername = null;

        if (targetData.user?.username) {
          targetUsername = targetData.user.username;
        } else if (targetData.product?.owner?.username) {
          targetUsername = targetData.product.owner.username;
        } else if (targetData.message?.sender?.username) {
          targetUsername = targetData.message.sender.username;
        }

        if (
          !targetUsername ||
          !targetUsername
            .toLowerCase()
            .includes(filters.targetUsername.toLowerCase())
        ) {
          include = false;
        }
      }

      // Check target ID filtering
      if (filters.targetId && include) {
        const hasTargetId =
          report.targetUserId === filters.targetId ||
          report.targetProductId === filters.targetId ||
          report.targetMessageId === filters.targetId;
        if (!hasTargetId) {
          include = false;
        }
      }

      if (include) {
        filteredReports.push(report);
      }
    }

    return filteredReports;
  }

  async exportReportsJson(
    status?: ReportStatus,
    type?: ReportType,
    filters?: any
  ): Promise<{ data: any[]; exportedAt: string; totalRecords: number }> {
    // Get all reports without pagination for export
    const result = await this.getReports(1, 10000, status, type, filters);

    return {
      data: result.reports,
      exportedAt: new Date().toISOString(),
      totalRecords: result.total,
    };
  }

  async exportReportsHtml(
    status?: ReportStatus,
    type?: ReportType,
    filters?: any
  ): Promise<{ html: string; exportedAt: string; totalRecords: number }> {
    const result = await this.getReports(1, 10000, status, type, filters);

    const html = this.generateReportsHtml(result.reports);

    return {
      html,
      exportedAt: new Date().toISOString(),
      totalRecords: result.total,
    };
  }

  async exportSingleReportJson(
    reportId: string
  ): Promise<{ data: any; exportedAt: string }> {
    // Get the specific report with all details
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    // Enrich with target data and resolved by data
    const targetData = await this.getTargetData(report);

    let resolvedByData = null;
    if (report.resolvedById) {
      const resolvedByUser = await this.prisma.user.findUnique({
        where: { id: report.resolvedById },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      });
      resolvedByData = resolvedByUser;
    }

    const enrichedReport = {
      ...this.mapToResponseDto(report),
      targetData,
      reporterData: {
        id: report.reporter.id,
        username: report.reporter.username,
        email: report.reporter.email,
        firstName: report.reporter.firstName,
        lastName: report.reporter.lastName,
        role: report.reporter.role,
      },
      resolvedByData,
      ipAddress: report.ipAddress,
    };

    return {
      data: enrichedReport,
      exportedAt: new Date().toISOString(),
    };
  }

  async exportSingleReportHtml(
    reportId: string
  ): Promise<{ html: string; exportedAt: string }> {
    // Get the enriched report data
    const result = await this.exportSingleReportJson(reportId);
    const report = result.data;

    const html = this.generateSingleReportHtml(report);

    return {
      html,
      exportedAt: new Date().toISOString(),
    };
  }

  private generateReportsHtml(reports: any[]): string {
    const now = new Date().toLocaleString();

    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flipstaq Reports Export - ${now}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .report-card { border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 5px; }
        .report-header { background: #e9ecef; padding: 10px; margin: -20px -20px 15px -20px; border-radius: 5px 5px 0 0; }
        .info-section { margin: 15px 0; }
        .info-title { font-weight: bold; color: #495057; margin-bottom: 5px; }
        .status-badge { padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-resolved { background: #d4edda; color: #155724; }
        .status-dismissed { background: #f8d7da; color: #721c24; }
        .type-badge { padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; margin-left: 10px; }
        .type-user { background: #cce5ff; color: #004085; }
        .type-product { background: #ccffcc; color: #006600; }
        .type-message { background: #e6ccff; color: #4d0066; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .target-content { background: #f8f9fa; padding: 10px; border-left: 3px solid #007bff; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Flipstaq Platform - Reports Export</h1>
        <p><strong>Export Date:</strong> ${now}</p>
        <p><strong>Total Reports:</strong> ${reports.length}</p>
      </div>
    `;

    reports.forEach((report, index) => {
      const statusClass = `status-${report.status.toLowerCase()}`;
      const typeClass = `type-${report.type.toLowerCase()}`;

      html += `
      <div class="report-card">
        <div class="report-header">
          <h3>Report #${index + 1} - ${report.id}</h3>
          <span class="status-badge ${statusClass}">${report.status}</span>
          <span class="type-badge ${typeClass}">${report.type}</span>
        </div>
        
        <div class="info-section">
          <div class="info-title">Report Details</div>
          <table>
            <tr><th>Report ID</th><td>${report.id}</td></tr>
            <tr><th>Reason</th><td>${report.reason}</td></tr>
            <tr><th>Created At</th><td>${new Date(report.createdAt).toLocaleString()}</td></tr>
            <tr><th>IP Address</th><td>${report.ipAddress || "N/A"}</td></tr>
            ${report.comment ? `<tr><th>Comment</th><td>${report.comment}</td></tr>` : ""}
          </table>
        </div>

        <div class="info-section">
          <div class="info-title">Reporter Information</div>
          <table>
            <tr><th>Name</th><td>${report.reporterData.firstName} ${report.reporterData.lastName}</td></tr>
            <tr><th>Username</th><td>@${report.reporterData.username}</td></tr>
            <tr><th>Email</th><td>${report.reporterData.email}</td></tr>
            <tr><th>Role</th><td>${report.reporterData.role}</td></tr>
          </table>
        </div>

        <div class="info-section">
          <div class="info-title">Target Information</div>
          ${this.generateTargetHtml(report.targetData, report.type)}
        </div>

        ${
          report.resolvedByData
            ? `
        <div class="info-section">
          <div class="info-title">Resolution Information</div>
          <table>
            <tr><th>Resolved By</th><td>${report.resolvedByData.firstName} ${report.resolvedByData.lastName} (@${report.resolvedByData.username})</td></tr>
            <tr><th>Resolved At</th><td>${report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : "N/A"}</td></tr>
          </table>
        </div>
        `
            : ""
        }
      </div>
      `;
    });

    html += `
      <div class="header" style="margin-top: 40px;">
        <p><strong>End of Report</strong> - Generated by Flipstaq Platform</p>
        <p>This report contains sensitive information and should be handled according to your organization's data protection policies.</p>
      </div>
    </body>
    </html>
    `;

    return html;
  }

  private generateSingleReportHtml(report: any): string {
    const now = new Date().toLocaleString();
    const statusClass = `status-${report.status.toLowerCase()}`;
    const typeClass = `type-${report.type.toLowerCase()}`;

    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flipstaq Report Export - ${report.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #007bff; }
        .report-card { border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 5px; background: #fff; }
        .report-header { background: #e9ecef; padding: 15px; margin: -20px -20px 20px -20px; border-radius: 5px 5px 0 0; }
        .info-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        .info-title { font-weight: bold; color: #495057; margin-bottom: 10px; font-size: 16px; }
        .status-badge { padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-resolved { background: #d4edda; color: #155724; }
        .status-dismissed { background: #f8d7da; color: #721c24; }
        .type-badge { padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 10px; text-transform: uppercase; }
        .type-user { background: #cce5ff; color: #004085; }
        .type-product { background: #ccffcc; color: #006600; }
        .type-message { background: #e6ccff; color: #4d0066; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; width: 30%; }
        .target-content { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0; border-radius: 0 4px 4px 0; }
        .footer { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-top: 30px; text-align: center; color: #666; }
        .metadata { font-size: 12px; color: #666; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Flipstaq Platform - Individual Report Export</h1>
        <p><strong>Report ID:</strong> ${report.id}</p>
        <p><strong>Export Date:</strong> ${now}</p>
        <div class="metadata">
          <span class="status-badge ${statusClass}">${report.status}</span>
          <span class="type-badge ${typeClass}">${report.type}</span>
        </div>
      </div>

      <div class="report-card">
        <div class="report-header">
          <h2>Report Details</h2>
        </div>
        
        <div class="info-section">
          <div class="info-title">Basic Information</div>
          <table>
            <tr><th>Report ID</th><td>${report.id}</td></tr>
            <tr><th>Type</th><td>${report.type}</td></tr>
            <tr><th>Status</th><td>${report.status}</td></tr>
            <tr><th>Reason</th><td>${report.reason}</td></tr>
            <tr><th>Created At</th><td>${new Date(report.createdAt).toLocaleString()}</td></tr>
            <tr><th>IP Address</th><td>${report.ipAddress || "N/A"}</td></tr>
            ${report.comment ? `<tr><th>Additional Comment</th><td>${report.comment}</td></tr>` : ""}
          </table>
        </div>

        <div class="info-section">
          <div class="info-title">Reporter Information</div>
          <table>
            <tr><th>Reporter ID</th><td>${report.reporterData.id}</td></tr>
            <tr><th>Full Name</th><td>${report.reporterData.firstName} ${report.reporterData.lastName}</td></tr>
            <tr><th>Username</th><td>@${report.reporterData.username}</td></tr>
            <tr><th>Email</th><td>${report.reporterData.email}</td></tr>
            <tr><th>Role</th><td>${report.reporterData.role}</td></tr>
          </table>
        </div>

        <div class="info-section">
          <div class="info-title">Target Information</div>
          ${this.generateTargetHtml(report.targetData, report.type)}
        </div>

        ${
          report.resolvedByData
            ? `
        <div class="info-section">
          <div class="info-title">Resolution Information</div>
          <table>
            <tr><th>Resolved By ID</th><td>${report.resolvedByData.id}</td></tr>
            <tr><th>Resolved By</th><td>${report.resolvedByData.firstName} ${report.resolvedByData.lastName} (@${report.resolvedByData.username})</td></tr>
            <tr><th>Resolved At</th><td>${report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : "N/A"}</td></tr>
          </table>
        </div>
        `
            : ""
        }
      </div>

      <div class="footer">
        <p><strong>Confidential Report</strong> - Generated by Flipstaq Platform</p>
        <p>This report contains sensitive information and should be handled according to your organization's data protection policies.</p>
        <p>Report generated on ${now}</p>
      </div>
    </body>
    </html>
    `;

    return html;
  }

  private generateTargetHtml(targetData: any, type: string): string {
    if (!targetData) return "<p>No target data available</p>";

    if (type === "USER" && targetData.user) {
      const user = targetData.user;
      return `
        <table>
          <tr><th>Name</th><td>${user.firstName} ${user.lastName}</td></tr>
          <tr><th>Username</th><td>@${user.username}</td></tr>
          <tr><th>Email</th><td>${user.email}</td></tr>
          <tr><th>Role</th><td>${user.role}</td></tr>
          <tr><th>Account Status</th><td>${user.isActive ? "Active" : "Inactive"}</td></tr>
          <tr><th>Created At</th><td>${new Date(user.createdAt).toLocaleString()}</td></tr>
        </table>
      `;
    }

    if (type === "PRODUCT" && targetData.product) {
      const product = targetData.product;
      return `
        <table>
          <tr><th>Title</th><td>${product.title}</td></tr>
          <tr><th>Price</th><td>${product.price} ${product.currency}</td></tr>
          <tr><th>Location</th><td>${product.location}</td></tr>
          <tr><th>Owner</th><td>${product.owner.firstName} ${product.owner.lastName} (@${product.owner.username})</td></tr>
          <tr><th>Status</th><td>${product.isActive && product.visible ? "Visible" : "Hidden"}</td></tr>
        </table>
        ${product.description ? `<div class="target-content"><strong>Description:</strong><br>${product.description}</div>` : ""}
      `;
    }

    if (type === "MESSAGE" && targetData.message) {
      const message = targetData.message;
      return `
        <table>
          <tr><th>Sender</th><td>${message.sender.firstName} ${message.sender.lastName} (@${message.sender.username})</td></tr>
          <tr><th>Sent At</th><td>${new Date(message.createdAt).toLocaleString()}</td></tr>
          <tr><th>Participants</th><td>${message.conversationParticipants.map((p) => `${p.firstName} ${p.lastName} (@${p.username})`).join(", ")}</td></tr>
        </table>
        <div class="target-content"><strong>Message Content:</strong><br>"${message.content}"</div>
      `;
    }

    return "<p>Target data not available</p>";
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLegalDocumentDto } from "./dto/create-legal-document.dto";
import { UpdateLegalDocumentDto } from "./dto/update-legal-document.dto";
import { LegalDocument } from "@flipstaq/db";

@Injectable()
export class LegalService {
  private readonly logger = new Logger(LegalService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    createLegalDocumentDto: CreateLegalDocumentDto,
    userId: string
  ): Promise<LegalDocument> {
    const {
      type,
      language,
      title,
      content,
      isActive = true,
    } = createLegalDocumentDto;

    // If this document should be active, deactivate any existing active document of the same type/language
    if (isActive) {
      await this.prisma.legalDocument.updateMany({
        where: {
          type,
          language,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    // Get the next version number
    const lastDocument = await this.prisma.legalDocument.findFirst({
      where: { type, language },
      orderBy: { version: "desc" },
    });

    const version = lastDocument ? lastDocument.version + 1 : 1;

    const document = await this.prisma.legalDocument.create({
      data: {
        type,
        language,
        title,
        content,
        version,
        isActive,
        updatedById: userId,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(
      `Created legal document: ${type} (${language}) v${version} by user ${userId}`
    );
    return document;
  }

  async findAll(): Promise<LegalDocument[]> {
    return this.prisma.legalDocument.findMany({
      include: {
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ type: "asc" }, { language: "asc" }, { version: "desc" }],
    });
  }

  async findByTypeAndLanguage(
    type: string,
    language: string
  ): Promise<LegalDocument | null> {
    const document = await this.prisma.legalDocument.findFirst({
      where: {
        type,
        language,
        isActive: true,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!document) {
      this.logger.warn(`Legal document not found: ${type} (${language})`);
      return null;
    }

    return document;
  }

  async findOne(id: string): Promise<LegalDocument> {
    const document = await this.prisma.legalDocument.findUnique({
      where: { id },
      include: {
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Legal document with ID ${id} not found`);
    }

    return document;
  }

  async update(
    id: string,
    updateLegalDocumentDto: UpdateLegalDocumentDto,
    userId: string
  ): Promise<LegalDocument> {
    const existingDocument = await this.findOne(id);
    const { type, language, isActive } = updateLegalDocumentDto;

    // If this document should be active and type/language changed, deactivate others
    if (isActive && (type || language)) {
      const finalType = type || existingDocument.type;
      const finalLanguage = language || existingDocument.language;

      await this.prisma.legalDocument.updateMany({
        where: {
          type: finalType,
          language: finalLanguage,
          isActive: true,
          id: { not: id },
        },
        data: {
          isActive: false,
        },
      });
    }

    // Increment version if content is changing
    let version = existingDocument.version;
    if (
      updateLegalDocumentDto.content &&
      updateLegalDocumentDto.content !== existingDocument.content
    ) {
      version = existingDocument.version + 1;
    }

    const document = await this.prisma.legalDocument.update({
      where: { id },
      data: {
        ...updateLegalDocumentDto,
        version,
        updatedById: userId,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(
      `Updated legal document: ${document.type} (${document.language}) v${document.version} by user ${userId}`
    );
    return document;
  }

  async remove(id: string, userId: string): Promise<void> {
    const document = await this.findOne(id);

    await this.prisma.legalDocument.delete({
      where: { id },
    });

    this.logger.log(
      `Deleted legal document: ${document.type} (${document.language}) v${document.version} by user ${userId}`
    );
  }

  async getDocumentTypes(): Promise<string[]> {
    const result = await this.prisma.legalDocument.findMany({
      select: { type: true },
      distinct: ["type"],
      orderBy: { type: "asc" },
    });

    return result.map((doc) => doc.type);
  }

  async getDocumentLanguages(type: string): Promise<string[]> {
    const result = await this.prisma.legalDocument.findMany({
      where: { type },
      select: { language: true },
      distinct: ["language"],
      orderBy: { language: "asc" },
    });

    return result.map((doc) => doc.language);
  }
}

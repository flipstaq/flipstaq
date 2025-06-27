import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { LegalService } from "./legal.service";
import { CreateLegalDocumentDto } from "./dto/create-legal-document.dto";
import { UpdateLegalDocumentDto } from "./dto/update-legal-document.dto";
import { LegalDocumentResponseDto } from "./dto/legal-document-response.dto";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/guards/roles.decorator";
import { UserRole } from "@flipstaq/db";

@ApiTags("Legal Documents")
@Controller("internal/legal")
export class LegalController {
  private readonly logger = new Logger(LegalController.name);

  constructor(private readonly legalService: LegalService) {}

  @Post("documents")
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.HIGHER_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new legal document" })
  @ApiResponse({
    status: 201,
    description: "Legal document created successfully",
    type: LegalDocumentResponseDto,
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 409, description: "Document already exists" })
  async create(
    @Body() createLegalDocumentDto: CreateLegalDocumentDto,
    @Request() req: any
  ) {
    this.logger.log(
      `Creating legal document: ${createLegalDocumentDto.type} (${createLegalDocumentDto.language})`
    );
    return this.legalService.create(createLegalDocumentDto, req.user.sub);
  }

  @Get("documents")
  @ApiOperation({ summary: "Get all legal documents" })
  @ApiResponse({
    status: 200,
    description: "List of legal documents",
    type: [LegalDocumentResponseDto],
  })
  async findAll() {
    return this.legalService.findAll();
  }

  @Get("documents/types")
  @ApiOperation({ summary: "Get all document types" })
  @ApiResponse({
    status: 200,
    description: "List of document types",
    schema: {
      type: "array",
      items: { type: "string" },
      example: ["tos", "privacy", "cookie_policy"],
    },
  })
  async getDocumentTypes() {
    return this.legalService.getDocumentTypes();
  }

  @Get("documents/types/:type/languages")
  @ApiOperation({ summary: "Get available languages for a document type" })
  @ApiParam({ name: "type", description: "Document type", example: "tos" })
  @ApiResponse({
    status: 200,
    description: "List of available languages",
    schema: {
      type: "array",
      items: { type: "string" },
      example: ["en", "ar"],
    },
  })
  async getDocumentLanguages(@Param("type") type: string) {
    return this.legalService.getDocumentLanguages(type);
  }

  @Get("documents/:type")
  @ApiOperation({ summary: "Get legal document by type and language" })
  @ApiParam({ name: "type", description: "Document type", example: "tos" })
  @ApiQuery({
    name: "language",
    description: "Language code",
    example: "en",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Legal document found",
    type: LegalDocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: "Legal document not found" })
  async findByType(
    @Param("type") type: string,
    @Query("language") language: string = "en"
  ) {
    this.logger.log(`Fetching legal document: ${type} (${language})`);
    const document = await this.legalService.findByTypeAndLanguage(
      type,
      language
    );

    if (!document) {
      throw new NotFoundException(
        `Legal document ${type} not found for language ${language}`
      );
    }

    return document;
  }

  @Get("documents/id/:id")
  @ApiOperation({ summary: "Get legal document by ID" })
  @ApiParam({ name: "id", description: "Document ID" })
  @ApiResponse({
    status: 200,
    description: "Legal document found",
    type: LegalDocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: "Legal document not found" })
  async findOne(@Param("id") id: string) {
    return this.legalService.findOne(id);
  }

  @Patch("documents/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.HIGHER_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update legal document" })
  @ApiParam({ name: "id", description: "Document ID" })
  @ApiResponse({
    status: 200,
    description: "Legal document updated successfully",
    type: LegalDocumentResponseDto,
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Legal document not found" })
  async update(
    @Param("id") id: string,
    @Body() updateLegalDocumentDto: UpdateLegalDocumentDto,
    @Request() req: any
  ) {
    this.logger.log(`Updating legal document: ${id}`);
    return this.legalService.update(id, updateLegalDocumentDto, req.user.sub);
  }

  @Delete("documents/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.HIGHER_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete legal document" })
  @ApiParam({ name: "id", description: "Document ID" })
  @ApiResponse({
    status: 200,
    description: "Legal document deleted successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Legal document not found" })
  async remove(@Param("id") id: string, @Request() req: any) {
    this.logger.log(`Deleting legal document: ${id}`);
    await this.legalService.remove(id, req.user.sub);
    return { message: "Legal document deleted successfully" };
  }
}

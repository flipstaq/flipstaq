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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ProxyService } from "../proxy/proxy.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@ApiTags("Legal Documents")
@Controller("legal")
export class LegalGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get("documents/types")
  @ApiOperation({ summary: "Get all document types" })
  @ApiResponse({ status: 200, description: "List of document types" })
  async getDocumentTypes() {
    const response = await this.proxyService.forwardRequest(
      "LEGAL",
      "legal/documents/types",
      "GET"
    );
    return response.data;
  }

  @Get("documents/types/:type/languages")
  @ApiOperation({ summary: "Get available languages for a document type" })
  @ApiResponse({ status: 200, description: "List of available languages" })
  async getDocumentLanguages(@Param("type") type: string) {
    const response = await this.proxyService.forwardRequest(
      "LEGAL",
      `legal/documents/types/${type}/languages`,
      "GET"
    );
    return response.data;
  }

  @Get("documents/:type")
  @ApiOperation({ summary: "Get legal document by type and language" })
  @ApiResponse({ status: 200, description: "Legal document found" })
  @ApiResponse({ status: 404, description: "Legal document not found" })
  async findByType(
    @Param("type") type: string,
    @Query("language") language: string = "en"
  ) {
    const response = await this.proxyService.forwardRequest(
      "LEGAL",
      `legal/documents/${type}`,
      "GET",
      undefined,
      undefined,
      { language }
    );
    return response.data;
  }

  @Get("documents")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all legal documents (Admin only)" })
  @ApiResponse({ status: 200, description: "List of legal documents" })
  async findAll(@Request() req: any) {
    const response = await this.proxyService.forwardRequest(
      "LEGAL",
      "legal/documents",
      "GET",
      undefined,
      { Authorization: req.headers.authorization }
    );
    return response.data;
  }

  @Get("documents/id/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get legal document by ID (Admin only)" })
  @ApiResponse({ status: 200, description: "Legal document found" })
  @ApiResponse({ status: 404, description: "Legal document not found" })
  async findOne(@Param("id") id: string, @Request() req: any) {
    const response = await this.proxyService.forwardRequest(
      "LEGAL",
      `legal/documents/id/${id}`,
      "GET",
      undefined,
      { Authorization: req.headers.authorization }
    );
    return response.data;
  }

  @Post("documents")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new legal document (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Legal document created successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async create(@Body() createLegalDocumentDto: any, @Request() req: any) {
    const response = await this.proxyService.forwardRequest(
      "LEGAL",
      "legal/documents",
      "POST",
      createLegalDocumentDto,
      { Authorization: req.headers.authorization }
    );
    return response.data;
  }

  @Patch("documents/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update legal document (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Legal document updated successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Legal document not found" })
  async update(
    @Param("id") id: string,
    @Body() updateLegalDocumentDto: any,
    @Request() req: any
  ) {
    const response = await this.proxyService.forwardRequest(
      "LEGAL",
      `legal/documents/${id}`,
      "PATCH",
      updateLegalDocumentDto,
      { Authorization: req.headers.authorization }
    );
    return response.data;
  }

  @Delete("documents/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete legal document (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Legal document deleted successfully",
  })
  @ApiResponse({ status: 403, description: "Legal document not found" })
  @ApiResponse({ status: 404, description: "Legal document not found" })
  async remove(@Param("id") id: string, @Request() req: any) {
    const response = await this.proxyService.forwardRequest(
      "LEGAL",
      `legal/documents/${id}`,
      "DELETE",
      undefined,
      { Authorization: req.headers.authorization }
    );
    return response.data;
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Audit } from '../audit/audit.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { ImportProductsCsvDto } from './dto/import-products-csv.dto.js';
import { ProductsCsvImportService } from './products-csv-import.service.js';

@ApiTags('Bulk Import')
@ApiBearerAuth()
@Controller('bulk-import')
export class BulkImportController {
  constructor(private readonly productsCsvImport: ProductsCsvImportService) {}

  @Post('products')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'product', action: 'bulk_import' })
  @ApiOperation({ summary: 'Import products from CSV (row-level error reporting)' })
  @ApiResponse({ status: 201, description: 'Import completed with per-row results' })
  importProducts(@Body() dto: ImportProductsCsvDto) {
    return this.productsCsvImport.importCsv(dto.csv);
  }
}

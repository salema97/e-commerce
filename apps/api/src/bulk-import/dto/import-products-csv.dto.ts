import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ImportProductsCsvDto {
  @ApiProperty({
    description:
      'CSV text with header: name,slug,sku,price,categorySlug,stock,status,description',
    example:
      'name,slug,sku,price,categorySlug,stock,status,description\nCamiseta,camiseta,CAM-001,19.99,ropa,50,ACTIVE,Camiseta algodón',
  })
  @IsString()
  @MinLength(10)
  csv!: string;
}

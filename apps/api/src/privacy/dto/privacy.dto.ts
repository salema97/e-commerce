import { IsBoolean } from 'class-validator';

export class UpdateCcpaOptOutDto {
  @IsBoolean()
  optOut!: boolean;
}

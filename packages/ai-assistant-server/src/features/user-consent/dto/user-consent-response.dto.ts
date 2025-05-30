import { ApiProperty } from '@nestjs/swagger';

export class UserConsentResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  status!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<UserConsentResponseDto>) {
    Object.assign(this, partial);
  }
}

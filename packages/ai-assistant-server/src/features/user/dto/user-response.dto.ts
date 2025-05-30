import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Gender } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false, nullable: true })
  phoneNumber?: string;

  @Exclude()
  passwordHash!: string;

  @ApiProperty()
  termsAccepted!: boolean;

  @ApiProperty()
  marketingConsent!: boolean;

  @ApiProperty()
  postalCode!: string;
  @ApiProperty()
  locale!: string;

  @ApiProperty()
  preferredCurrency!: string;

  @ApiProperty({ required: false, nullable: true })
  birthDate?: Date;

  @ApiProperty({ enum: Gender, default: Gender.OTHER })
  gender!: Gender;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

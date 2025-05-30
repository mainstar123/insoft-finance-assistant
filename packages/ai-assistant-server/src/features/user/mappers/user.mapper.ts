import { User, Gender } from '@prisma/client';
import { IUser } from '../interfaces/user.interface';
import { UserResponseDto } from '../dto/user-response.dto';

export class UserMapper {
  static toEntity(prismaUser: User): IUser {
    return {
      ...prismaUser,
      phoneNumber: prismaUser.phoneNumber || undefined,
      locale: prismaUser.locale || 'pt_BR',
      preferredCurrency: prismaUser.preferredCurrency || 'BRL',
      gender: prismaUser.gender || Gender.OTHER,
    };
  }

  static toResponse(user: IUser): UserResponseDto {
    const response = new UserResponseDto({
      ...user,
      phoneNumber: user.phoneNumber || undefined,
      locale: user.locale,
      preferredCurrency: user.preferredCurrency,
      gender: user.gender,
      birthDate: user.birthDate || undefined,
    });
    return response;
  }
}

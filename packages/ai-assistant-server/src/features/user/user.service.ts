import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/services';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UpdateUserConsentDto } from './dto/update-user-consent.dto';
import { IUser } from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { UserMapper } from './mappers/user.mapper';
import {
  UserNotFoundException,
  DuplicateUserException,
} from './exceptions/user.exception';
import { User, FinancialGoal } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { RegistrationSteps } from '../orchestrator-pattern/types';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new user with email and password
   * @param createUserDto User creation data
   * @returns The created user
   * @throws DuplicateUserException if a user with the same email already exists
   */
  async create(
    createUserDto: CreateUserDto,
  ): Promise<IUser> {
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new DuplicateUserException(createUserDto.email);
    }

    const { password, primaryFinancialGoal, ...userData } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);

    // Set default values for optional fields
    const defaultedData = {
      ...userData,
      locale: userData.locale || 'pt_BR',
      preferredCurrency: userData.preferredCurrency || 'BRL',
      postalCode: userData.postalCode || '00000-000',
      // Map financialGoal to primaryFinancialGoal if provided
      primaryFinancialGoal: primaryFinancialGoal || FinancialGoal.SAVE_MONEY,
    };

    const user = await this.prismaService.client.user.create({
      data: {
        ...defaultedData,
        passwordHash,
      },
    });

    return UserMapper.toEntity(user);
  }

  /**
   * Create or find a user by phone number
   * @param data User data with phone number
   * @returns The created or existing user
   */
  async createOrFindByPhoneNumber(data: {
    phoneNumber: string;
    name?: string;
    email?: string;
  }): Promise<IUser> {
    // Check if user already exists with this phone number
    const existingUser = await this.findByPhoneNumber(data.phoneNumber);
    if (existingUser) {
      return UserMapper.toEntity(existingUser);
    }

    // Generate a secure random password
    const securePassword = uuidv4();
    const passwordHash = await bcrypt.hash(securePassword, 10);

    // Create a new user with the phone number
    const email = data.email || `user_${uuidv4().substring(0, 8)}@tamy.finance`;
    const name =
      data.name ||
      `User ${data.phoneNumber.substring(data.phoneNumber.length - 4)}`;

    const user = await this.prismaService.client.user.create({
      data: {
        name,
        email,
        phoneNumber: data.phoneNumber,
        passwordHash,
        termsAccepted: true, // Auto-accept terms for WhatsApp users
        marketingConsent: false,
      },
    });

    return UserMapper.toEntity(user);
  }

  /**
   * Find all users
   * @returns Array of all users
   */
  async findAll(): Promise<IUser[]> {
    const users = await this.prismaService.client.user.findMany();
    return users.map((user) => UserMapper.toEntity(user));
  }

  /**
   * Find a user by ID
   * @param id User ID
   * @returns The user if found, null otherwise
   */
  async findOne(id: number): Promise<IUser | null> {
    const user = await this.prismaService.client.user.findUnique({
      where: { id },
    });
    return user ? UserMapper.toEntity(user) : null;
  }

  /**
   * Update a user
   * @param id User ID
   * @param updateData Data to update
   * @returns The updated user
   * @throws UserNotFoundException if the user is not found
   */
  async update(id: number, updateData: Partial<CreateUserDto>): Promise<IUser> {
    // Check if user exists
    const existingUser = await this.prismaService.client.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new UserNotFoundException(id);
    }

    // Handle password update
    const dataToUpdate: any = { ...updateData };
    if (updateData.password) {
      const passwordHash = await bcrypt.hash(updateData.password, 10);
      delete dataToUpdate.password;
      dataToUpdate.passwordHash = passwordHash;
    }

    const updatedUser = await this.prismaService.client.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return UserMapper.toEntity(updatedUser);
  }

  /**
   * Remove a user
   * @param id User ID
   * @throws UserNotFoundException if the user is not found
   */
  async remove(id: number): Promise<void> {
    const existingUser = await this.prismaService.client.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new UserNotFoundException(id);
    }

    await this.prismaService.client.user.delete({ where: { id } });
  }

  /**
   * Find a user by email
   * @param email User email
   * @returns The user if found, null otherwise
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.prismaService.client.user.findUnique({
      where: { email },
    });
    return user ? UserMapper.toEntity(user) : null;
  }

  /**
   * Find a user by phone number
   * @param phoneNumber User phone number
   * @returns The user if found, null otherwise
   */
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.prismaService.client.user.findFirst({
      where: { phoneNumber },
    });
  }

  /**
   * Update user preferences
   * @param id User ID
   * @param updateUserPreferencesDto Preferences data
   * @returns The updated user
   * @throws UserNotFoundException if the user is not found
   */
  async updatePreferences(
    id: number,
    updateUserPreferencesDto: UpdateUserPreferencesDto,
  ): Promise<IUser> {
    const existingUser = await this.prismaService.client.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new UserNotFoundException(id);
    }

    const user = await this.prismaService.client.user.update({
      where: { id },
      data: updateUserPreferencesDto,
    });

    return UserMapper.toEntity(user);
  }

  /**
   * Update user consent settings
   * @param id User ID
   * @param updateUserConsentDto Consent data
   * @returns The updated user
   * @throws UserNotFoundException if the user is not found
   */
  async updateConsent(
    id: number,
    updateUserConsentDto: UpdateUserConsentDto,
  ): Promise<IUser> {
    const existingUser = await this.prismaService.client.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new UserNotFoundException(id);
    }

    const user = await this.prismaService.client.user.update({
      where: { id },
      data: updateUserConsentDto,
    });

    return UserMapper.toEntity(user);
  }

  /**
   * Update user's personal information during registration
   * @param id User ID
   * @param data Personal information data
   * @returns Updated user
   */
  async updatePersonalInfo(
    id: number,
    data: {
      birthDate: Date;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      postalCode?: string;
      locale?: string;
      preferredCurrency?: string;
    },
  ): Promise<IUser> {
    const user = await this.findOne(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }

    const updatedUser = await this.prismaService.client.user.update({
      where: { id },
      data: {
        birthDate: data.birthDate,
        gender: data.gender || 'OTHER',
        postalCode: data.postalCode,
        locale: data.locale || 'pt_BR',
        preferredCurrency: data.preferredCurrency || 'BRL',
      },
    });

    return UserMapper.toEntity(updatedUser);
  }

  /**
   * Validate user's registration completion
   * @param id User ID
   * @returns Validation result with missing steps if any
   */
  async validateRegistration(id: number): Promise<{
    isComplete: boolean;
    missingSteps: RegistrationSteps[];
    user: IUser | null;
  }> {
    const user = await this.prismaService.client.user.findUnique({
      where: { id },
    });

    if (!user) {
      return {
        isComplete: false,
        missingSteps: [RegistrationSteps.BASIC_INFO],
        user: null,
      };
    }

    const missingSteps: RegistrationSteps[] = [];

    // Check personal info
    if (!user.birthDate || !user.postalCode) {
      missingSteps.push(RegistrationSteps.PERSONAL_INFO);
    }

    return {
      isComplete: missingSteps.length === 0,
      missingSteps,
      user: UserMapper.toEntity(user),
    };
  }

  /**
   * Update user's consent settings during registration
   * @param id User ID
   * @param data Consent data
   * @returns Updated user
   */
  async updateRegistrationConsent(
    id: number,
    data: {
      termsAccepted: boolean;
      marketingConsent: boolean;
    },
  ): Promise<IUser> {
    const user = await this.findOne(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }

    const updatedUser = await this.prismaService.client.user.update({
      where: { id },
      data: {
        termsAccepted: data.termsAccepted,
        marketingConsent: data.marketingConsent,
      },
    });

    return UserMapper.toEntity(updatedUser);
  }
}

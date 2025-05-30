import { ModuleMetadata, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Creates a testing module with the given providers and imports
 * @param metadata Module metadata
 * @returns TestingModule
 */
export async function createTestingModule(
  metadata: ModuleMetadata,
): Promise<TestingModule> {
  return Test.createTestingModule(metadata).compile();
}

/**
 * Creates a mock for a class with all methods as jest functions
 * @param type Class to mock
 * @returns Mocked instance
 */
export function createMock<T>(type: Type<T>): jest.Mocked<T> {
  const mock = {} as jest.Mocked<T>;

  // Get all methods from the prototype
  const methods = Object.getOwnPropertyNames(type.prototype);

  // Create a jest function for each method
  methods.forEach((method) => {
    if (method !== 'constructor') {
      // Use type assertion to ensure method is a valid key of T
      (mock as any)[method] = jest.fn();
    }
  });

  return mock;
}

/**
 * Creates a partial mock with only the specified methods
 * @param methods Methods to mock
 * @returns Partial mock
 */
export function createPartialMock<T>(
  methods: Partial<Record<keyof T, any>>,
): Partial<jest.Mocked<T>> {
  const mock = {} as Partial<jest.Mocked<T>>;

  // Create a jest function for each specified method
  Object.keys(methods).forEach((key) => {
    const typedKey = key as keyof T;
    // Use type assertion to ensure compatibility
    (mock as any)[typedKey] = jest.fn().mockImplementation(methods[typedKey]);
  });

  return mock;
}

/**
 * Mocks a promise to resolve with the given value
 * @param value Value to resolve with
 * @returns Jest mock function
 */
export function mockResolvedValue<T>(value: T): jest.Mock {
  return jest.fn().mockResolvedValue(value);
}

/**
 * Mocks a promise to reject with the given error
 * @param error Error to reject with
 * @returns Jest mock function
 */
export function mockRejectedValue(error: Error): jest.Mock {
  return jest.fn().mockRejectedValue(error);
}

/**
 * Creates a spy on a method of an object
 * @param object Object to spy on
 * @param method Method to spy on
 * @returns Jest spy
 */
export function spyOnMethod<T extends object, M extends keyof T>(
  object: T,
  method: M,
): jest.SpyInstance {
  // Use a more direct type assertion approach
  return jest.spyOn(object, method as any);
}

/**
 * Resets all mocks
 */
export function resetAllMocks(): void {
  jest.resetAllMocks();
}

/**
 * Clears all mocks
 */
export function clearAllMocks(): void {
  jest.clearAllMocks();
}

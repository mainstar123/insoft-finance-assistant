const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'SESSION_MAX_AGE',
] as const;

export function validateEnv() {
  const missingVars = requiredEnvVars.filter(key => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }
}

export function getEnvVar(key: (typeof requiredEnvVars)[number]): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

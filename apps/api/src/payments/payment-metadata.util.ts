import { BadRequestException } from '@nestjs/common';

export function requirePaymentMetadataToken(
  metadata: Record<string, string> | undefined,
  key: string,
  providerName: string,
): string {
  const token = metadata?.[key]?.trim();
  if (!token) {
    throw new BadRequestException(
      `${providerName} requires client token in metadata.${key}`,
    );
  }
  return token;
}

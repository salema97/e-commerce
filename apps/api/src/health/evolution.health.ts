import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';

interface EvolutionRootHealth {
  version?: string;
  message?: string;
}

interface EvolutionConnectionState {
  instance?: {
    instanceName?: string;
    state?: string;
  };
}

const HEALTH_TIMEOUT_MS = 5_000;

@Injectable()
export class EvolutionHealthIndicator extends HealthIndicator {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const baseUrl = this.config.getOrThrow<string>('EVOLUTION_API_URL').replace(/\/$/, '');
    const apiKey = this.config.getOrThrow<string>('EVOLUTION_API_KEY');
    const instanceName = this.config.getOrThrow<string>('EVOLUTION_INSTANCE_NAME');

    try {
      const rootResponse = await fetch(`${baseUrl}/`, {
        method: 'GET',
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });

      if (!rootResponse.ok) {
        throw new HealthCheckError(
          `Evolution API returned ${rootResponse.status}`,
          this.getStatus(key, false, { statusCode: rootResponse.status }),
        );
      }

      let root: EvolutionRootHealth = {};
      try {
        root = (await rootResponse.json()) as EvolutionRootHealth;
      } catch {
        // Non-JSON root is still a successful TCP/HTTP reachability signal.
      }

      const whatsappState = await this.fetchWhatsappState(baseUrl, apiKey, instanceName);

      return this.getStatus(key, true, {
        version: root.version,
        instance: instanceName,
        whatsappState,
      });
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new HealthCheckError(
        'Evolution API is not reachable',
        this.getStatus(key, false, { message }),
      );
    }
  }

  private async fetchWhatsappState(
    baseUrl: string,
    apiKey: string,
    instanceName: string,
  ): Promise<string> {
    try {
      const response = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });

      if (!response.ok) {
        return 'unknown';
      }

      const data = (await response.json()) as EvolutionConnectionState;
      return data.instance?.state ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

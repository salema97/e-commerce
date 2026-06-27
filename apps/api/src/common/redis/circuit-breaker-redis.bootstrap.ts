import { Injectable, OnModuleInit } from '@nestjs/common';
import { setDistributedCircuitBreakerRedis } from '../resilience/distributed-circuit-breaker.js';
import { RedisService } from './redis.service.js';

@Injectable()
export class CircuitBreakerRedisBootstrap implements OnModuleInit {
  constructor(private readonly redis: RedisService) {}

  onModuleInit(): void {
    setDistributedCircuitBreakerRedis(this.redis.client);
  }
}

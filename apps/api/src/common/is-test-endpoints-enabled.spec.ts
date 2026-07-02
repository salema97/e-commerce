import { afterEach, describe, expect, it } from 'vitest';
import { isTestEndpointsEnabled } from './is-test-endpoints-enabled.js';

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe('isTestEndpointsEnabled', () => {
  it('blocks test endpoints in production APP_ENV', () => {
    process.env.APP_ENV = 'production';
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_TEST_AUTH = 'true';
    expect(isTestEndpointsEnabled()).toBe(false);
  });

  it('allows test endpoints in development by default', () => {
    process.env.APP_ENV = 'development';
    process.env.NODE_ENV = 'development';
    delete process.env.ENABLE_TEST_AUTH;
    expect(isTestEndpointsEnabled()).toBe(true);
  });

  it('allows explicit opt-out in development', () => {
    process.env.APP_ENV = 'development';
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_TEST_AUTH = 'false';
    expect(isTestEndpointsEnabled()).toBe(false);
  });

  it('requires ENABLE_TEST_AUTH in staging', () => {
    process.env.APP_ENV = 'staging';
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_TEST_AUTH = 'false';
    expect(isTestEndpointsEnabled()).toBe(false);

    process.env.ENABLE_TEST_AUTH = 'true';
    expect(isTestEndpointsEnabled()).toBe(true);
  });

  it('allows test endpoints when NODE_ENV is test', () => {
    process.env.APP_ENV = 'staging';
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_TEST_AUTH = 'false';
    expect(isTestEndpointsEnabled()).toBe(true);
  });
});

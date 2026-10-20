import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('should return status ok', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
  });

  it('should return a valid ISO 8601 timestamp', () => {
    const result = controller.check();
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
    expect(typeof result.timestamp).toBe('string');
  });

  it('should return an environment string', () => {
    const result = controller.check();
    expect(typeof result.environment).toBe('string');
    expect(result.environment.length).toBeGreaterThan(0);
  });

  it('should return a version string', () => {
    const result = controller.check();
    expect(typeof result.version).toBe('string');
  });
});

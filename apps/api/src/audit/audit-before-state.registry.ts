import { Injectable } from '@nestjs/common';

export type AuditBeforeStateLoader = (id: string) => Promise<unknown>;

@Injectable()
export class AuditBeforeStateRegistry {
  private readonly loaders = new Map<string, AuditBeforeStateLoader>();

  register(resource: string, loader: AuditBeforeStateLoader): void {
    this.loaders.set(resource, loader);
  }

  async load(resource: string, id: string): Promise<unknown | null> {
    const loader = this.loaders.get(resource);
    if (!loader) {
      return null;
    }

    try {
      return await loader(id);
    } catch {
      return null;
    }
  }
}

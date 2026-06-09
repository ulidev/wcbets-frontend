export interface AppConfig {
  maintenanceMode: 'maintenance' | 'countdown' | '';
}

const defaults: AppConfig = { maintenanceMode: '' };

let config: AppConfig = { ...defaults };

export async function initConfig(): Promise<void> {
  try {
    const data = (await fetch('/config.json').then((r) => r.json())) as Partial<AppConfig>;
    config = { ...defaults, ...data };
  } catch {
    // network error or invalid JSON — keep defaults
  }
}

export function getConfig(): AppConfig {
  return config;
}

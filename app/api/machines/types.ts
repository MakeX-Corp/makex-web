export interface MachineConfig {
  image: string;
  auto_destroy?: boolean;
  env?: Record<string, string>;
  guest?: {
    cpu_kind?: string;
    cpus?: number;
    memory_mb?: number;
  };
  services?: Array<{
    ports: Array<{
      port: number;
      handlers: string[];
    }>;
    protocol: string;
    internal_port: number;
  }>;
  // Add other config properties as needed
}

export interface Machine {
  id: string;
  name: string;
  state: string;
  region: string;
  instance_id: string;
  private_ip: string;
  config: MachineConfig;
  created_at: string;
  updated_at: string;
}

export interface MachineResponse {
  ok?: boolean;
  machine?: Machine;
  error?: string;
} 
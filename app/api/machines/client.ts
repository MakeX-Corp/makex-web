import { Machine, MachineConfig, MachineResponse } from "./types";

export class FlyMachinesClient {
  private baseUrl: string;
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
    this.baseUrl = "https://api.machines.dev/v1";
  }

  private async request(path: string, method = "POST"): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fly API error (${response.status})`);
    }
    return response.json();
  }

  async getMachine(appName: string, machineId: string) {
    const response = await this.request(`/apps/${appName}/machines/${machineId}`, "GET");
    return { state: response.state };
  }

  async stopMachine(appName: string, machineId: string) {
    return this.request(`/apps/${appName}/machines/${machineId}/stop`);
  }

  async startMachine(appName: string, machineId: string) {
    return this.request(`/apps/${appName}/machines/${machineId}/start`);
  }

  async suspendMachine(appName: string, machineId: string) {
    return this.request(`/apps/${appName}/machines/${machineId}/suspend`);
  }

  async waitForMachine(appName: string, machineId: string, state: string, timeout = 60) {
    return this.request(
      `/apps/${appName}/machines/${machineId}/wait?state=${state}&timeout=${timeout}`,
      "GET"
    );
  }
}

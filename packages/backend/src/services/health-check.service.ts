import { Service } from "typedi";

@Service()
export class HealthCheckService {
  private startTime: number = Date.now();

  constructor() {}

  /**
   * @returns {Promise<{ data: { status: string; uptime: string } }>}
   */
  async serverHealth(): Promise<{ data: { status: string; uptime: string } }> {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    const days = Math.floor(uptimeSeconds / (60 * 60 * 24));
    const hours = Math.floor((uptimeSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
    const seconds = uptimeSeconds % 60;

    const uptimeString = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;

    return {
      data: {
        status: "OK",
        uptime: uptimeString,
      },
    };
  }
}

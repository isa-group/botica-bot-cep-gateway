import axios, { AxiosInstance } from "axios";
import express, { Express } from "express";
import logger from "./logger";

export class PocketCepService {
  private readonly axios: AxiosInstance;
  private readonly express: Express;
  private readonly publicUrl: string;

  public constructor(
    axiosInstance: AxiosInstance,
    express: Express,
    publicUrl: string,
  ) {
    this.axios = axiosInstance;
    this.express = express;
    this.publicUrl = publicUrl;
  }

  public async createStream(stream: {}) {
    await this.axios.post("streams", stream);
  }

  public async createPattern(pattern: {}) {
    await this.axios.post("patterns", pattern);
  }

  public async publish(stream: string, event: {}) {
    await this.axios.post(`streams/${stream}/events`, event);
  }

  public async subscribe(stream: string, callback: (event: {}) => void) {
    this.express.post(`/${stream}`, (req) => callback(req.body));

    await this.axios.post(`streams/${stream}/subscriptions`, {
      webhook: sanitizeUrl(this.publicUrl.concat(`/${stream}`)),
      method: "POST",
    });
  }
}

export default function createPocketCepService(
  pocketCepUrl: string,
  publicUrl: string,
) {
  const axiosInstance = axios.create({
    baseURL: pocketCepUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });
  const app = express().use(express.json());
  app.listen(80, () => logger.info("Listening on port 80"));

  return new PocketCepService(axiosInstance, app, publicUrl);
}

function sanitizeUrl(url: string) {
  return url.replace(/([^:]\/)\/+/g, "$1"); // remove duplicate slashes
}

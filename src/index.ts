import { botica } from "botica-lib-node";
import createPocketCepService from "./PocketCepService";
import * as fs from "node:fs";

const POCKET_CEP_URL = "http://botica-pocket-cep:9999/api/v1/";
const BOT_URL = `http://botica-${process.env.BOTICA_BOT_ID}/`;

interface Configuration {
  streams: Array<any>;
  patterns: Array<any>;
  publications: Array<Publication>;
  subscriptions: Array<Subscription>;
}

interface Publication {
  orders: Array<string>;
  stream: string;
}

interface Subscription {
  streams: Array<string>;
  key: string;
  order: string;
}

const bot = await botica();
const cepService = createPocketCepService(POCKET_CEP_URL, BOT_URL);

setTimeout(setup, 10 * 1000);

async function setup() {
  registerBotOrders();
  await applyConfigurationFile();
  await bot.start();
}

function registerBotOrders() {
  const orders: { [order: string]: (parameter: any) => any } = {
    register_stream: cepService.createStream,
    register_pattern: cepService.createPattern,
    register_publication: registerPublication,
    register_subscription: registerSubscription,
  };
  const callback = async (order: string, message: string) => {
    orders[order](JSON.parse(message));
  };
  for (let order in orders) {
    bot.onOrderReceived(callback, order);
  }
}

async function applyConfigurationFile() {
  const configurationFilePath = process.env.CEP_GATEWAY_CONFIG_PATH;
  if (!configurationFilePath) return;

  const configuration: Configuration = JSON.parse(
    fs.readFileSync(configurationFilePath, {
      encoding: "utf-8",
    }),
  );

  for (const stream of configuration.streams) {
    await cepService.createStream(stream);
  }
  for (const pattern of configuration.patterns) {
    await cepService.createPattern(pattern);
  }
  for (const publication of configuration.publications) {
    registerPublication(publication);
  }
  for (const subscription of configuration.subscriptions) {
    await registerSubscription(subscription);
  }
}

function registerPublication(publication: Publication) {
  const callback = async (_order: string, message: string) => {
    await cepService.publish(publication.stream, message);
  };
  for (const order of publication.orders) {
    bot.onOrderReceived(callback, order);
  }
}

async function registerSubscription(subscription: Subscription) {
  const callback = async (event: {}) => {
    await bot.publishOrder(event, subscription.key, subscription.order);
  };
  for (const stream of subscription.streams) {
    await cepService.subscribe(stream, callback);
  }
}

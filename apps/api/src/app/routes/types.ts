import type { IncomingMessage, ServerResponse } from 'node:http';

export type GatewayJsonWriter = (
  res: ServerResponse,
  statusCode: number,
  payload: unknown
) => void;

export type GatewayRouteContext = {
  req: IncomingMessage;
  method: string;
  url: URL;
  reqUrl: URL;
  res: ServerResponse;
  config: unknown;
  readJsonBody: (req: IncomingMessage) => Promise<unknown>;
  writeJson: GatewayJsonWriter;
  gatewayDependencies: {
    getBrokerHealth?: (...args: never[]) => unknown;
    executeBrokerCycle?: (payload: unknown) => unknown;
    getMarketSnapshot?: (payload: unknown) => unknown;
  };
  userAccount: unknown;
};

export type RouteHandler = (
  context: GatewayRouteContext
) => boolean | Promise<boolean>;

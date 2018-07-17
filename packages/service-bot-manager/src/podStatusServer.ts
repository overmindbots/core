import { PodStatusServer } from '@overmindbots/shared-utils/podStatusServer';

export const podStatusServer = new PodStatusServer();

// TODO: make this testeable
if (process.env.NODE_ENV !== 'test') {
  podStatusServer.start();
}

import { PodStatusServer } from '~/shared/podStatusServer';

export const podStatusServer = new PodStatusServer();

if (process.env.NODE_ENV !== 'development') {
  podStatusServer.start();
}

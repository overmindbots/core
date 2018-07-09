import { PodStatusServer } from '~/shared/podStatusServer';

export const podStatusServer = new PodStatusServer();

podStatusServer.start();

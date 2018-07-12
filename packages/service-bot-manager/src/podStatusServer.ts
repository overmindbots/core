import { PodStatusServer } from '@overmindbots/shared-utils/podStatusServer';

export const podStatusServer = new PodStatusServer();

podStatusServer.start();

import localtunnel from 'localtunnel';
import { API_URL, PORT } from '~/constants';

export function getGlobalUrl() {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === 'development') {
      localtunnel(PORT, (err, tunnel) => {
        if (err) {
          reject(err);
        }

        resolve(tunnel.url);
      });
    } else {
      resolve(API_URL);
    }
  });
}

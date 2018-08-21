import { Collection, Guild, Role } from 'discord.js';
import { debounce, isNumber, max } from 'lodash';
import logger from 'winston';
import { bot } from '~/bot';
import { AssertionError } from '~/errors';

/**
 * Returns the highest numerical position of roles associated to the bot
 * in a given guild
 */
export function getBotHighestRolePosition(guild: Guild): number {
  if (!bot.client) {
    throw new AssertionError();
  }
  const ownMember = guild.members.find('id', bot.client.user.id);
  const pos = max(ownMember.roles.map(({ position }) => position));
  if (!isNumber(pos)) {
    throw new Error("Couldn't get own role position");
  }
  return pos;
}

/**
 * Returns all roles in a guild that are lower that the bot's highest assigned
 * role in Discord's {@link https://support.discordapp.com/hc/en-us/articles/214836687-Role-Management-101 Metaphoric Role Totem}
 */
export function getRolesLowerThanBot(guild: Guild): Collection<string, Role> {
  if (!bot.client) {
    throw new AssertionError();
  }
  const ownHighestRolePosition = getBotHighestRolePosition(guild);
  return guild.roles.filter(
    ({ position, name }) =>
      position < ownHighestRolePosition && name !== '@everyone'
  );
}

type GetKey = (...args: any[]) => string;
interface DebouncedTasks {
  [key: string]: (...args: any[]) => any;
}
const debouncedTasks: DebouncedTasks = {};
/**
 * Debounces an asyncronous task associated to a unique key.
 * if the key already exists in the debouncedTasks object it will replace
 * it without resetting the elapsed time
 * TODO: Replace this with a dedicated library
 */
export function debounceBy<T extends (...args: any[]) => Promise<any>>(
  getKey: GetKey | string,
  cb: T,
  delay: number,
  opts?: { maxWait?: number }
): (...args: any[]) => Promise<T> {
  return async (...funcArgs) => {
    const key = typeof getKey === 'string' ? getKey : getKey(...funcArgs);
    const debounced =
      debouncedTasks[key] || debounce(cb, delay, { ...opts, leading: true });
    debouncedTasks[key] = debounced;
    const res = await debounced(...funcArgs);
    return res;
  };
}

interface TasksQueueData {
  [key: string]: {
    promise: Promise<any>;
    resolve(): void;
    method(...args: any[]): any;
  };
}
const tasksQueueData: TasksQueueData = {};
const tasksQueue: string[] = [];
/**
 * Adds an asyncronous function into a queue, the task will be run eventually.
 * The task is saved associated to a unique key, if the key provided already
 * exists in the queue it will be replaced by the task passed in this occasion.
 * (The task keeps it's current position in the queue)
 * TODO: Replace this with a dedicated library
 */
export async function enqueueBy(key: string, cb: (...args: any[]) => any) {
  const enqueuedInfo = tasksQueueData[key];

  // If not enqueued yet simply add to queue and return promise
  if (!enqueuedInfo) {
    let resolvePromise;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    tasksQueueData[key] = {
      resolve: resolvePromise as any,
      promise,
      method: cb,
    };
    tasksQueue.push(key);
    promise
      .then(() => {
        return tasksQueueData[key].promise.then(() => {
          delete tasksQueueData[key];
        });
      })
      .catch(error => {
        logger.error(error.message, error);
      });
    return tasksQueueData[key].promise;
  }

  // If enqueued replace callback only, keep in queue
  tasksQueueData[key].method = cb;
  return tasksQueueData[key].promise;
}

let stopTaskQueue = false;

process.on('SIGTERM', () => {
  stopTaskQueue = true;
});

/**
 * Processes tasks enqueued through {@link utils.enqueueBy}
 */
function queueRunner() {
  const key = tasksQueue.shift();
  if (key) {
    const startTime = Date.now();
    tasksQueueData[key]
      .method()
      .then(() => {
        const elapsedTime = (Date.now() - startTime) / 1000;
        logger.debug(`Queue finished job => ${key} (${elapsedTime} seconds)`);
        tasksQueueData[key].resolve();
        queueRunner();
      })
      .catch(() => {
        tasksQueueData[key].resolve();
        queueRunner();
      });
    return;
  }

  setTimeout(() => {
    if (stopTaskQueue) {
      return;
    }
    queueRunner();
  }, 100);
}

// Starts queue runner
queueRunner();

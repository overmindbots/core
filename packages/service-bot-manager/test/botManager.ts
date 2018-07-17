import { BotManager } from '../src/botManager';

describe('BotManager', () => {
  describe('#shardsData', () => {
    describe('with different totalShards values', () => {
      it('should depend on totalShards', () => {
        [0, 1, 2, 3, 4, 5].forEach(totalShards => {
          const botManager = new BotManager(totalShards);
          let shards = botManager.shardsData.shards;
          expect(Object.keys(shards)).toHaveLength(totalShards);
        });
      });

      it('should contain a shard object with keys from 0 to totalShards', () => {
        [0, 1, 2, 3, 4, 5].forEach(totalShards => {
          const botManager = new BotManager(totalShards);
          const keys = Object.keys(botManager.shardsData.shards);
          const expected = Array.from(keys, (_, index) => String(index));
          expect(keys).toEqual(expected);
        });
      });

      it('should initialize every shard with null values', () => {
        const createShardObject = (n: number) =>
          new Array(n).fill(0).reduce((obj, _, index) => {
            obj[index] = null;
            return obj;
          }, {});

        const totalShards = 8;
        const botManager = new BotManager(totalShards);
        expect(botManager.shardsData).toEqual({
          shards: createShardObject(totalShards),
        });
      });
    });
  });
});

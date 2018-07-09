import { fromGlobalId, nodeDefinitions } from 'graphql-relay';
import mongoose from 'mongoose';
import * as models from '@overmindbots/shared-models';
function isMongooseObject(obj: any): obj is mongoose.Model<any> {
  return obj.collection && !!obj.collection.name;
}

const { nodeInterface, nodeField } = nodeDefinitions(
  async (globalId, context) => {
    const { type, id } = fromGlobalId(globalId);

    let result = await models[type].findOne(id);
    result = result || null;

    return result;
  },
  (obj: any) => {
    if (isMongooseObject(obj)) {
      return obj.collection.name;
    }

    throw new Error("Couldn't detect object's type in typeResolver");
  }
);

export { nodeInterface, nodeField };

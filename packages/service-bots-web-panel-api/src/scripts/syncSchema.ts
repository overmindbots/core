/* tslint:disable */
import '~/startup';
import fs from 'fs';
import { printSchema } from 'graphql/utilities';
import path from 'path';
import Schema from '~/schema';

// tslint:disable-next-line no-console
console.log('#### Compiling new graphql schema ####');

// Save user readable type system shorthand of schema
fs.writeFileSync(
  path.join(process.cwd(), '../client/schema.graphql'),
  printSchema(Schema)
);

process.exit();

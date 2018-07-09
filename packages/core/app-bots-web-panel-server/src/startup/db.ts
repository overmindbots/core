import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error(
    '"MONGODB_URI" is not set. Declare it as an environment variable'
  );
}
console.debug('=== Connecting to MongoDB ===');

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.debug('=== Connected ===');
});

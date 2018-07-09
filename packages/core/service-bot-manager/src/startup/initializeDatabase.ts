import mongoose from 'mongoose';
import { MONGODB_URI } from '~/constants';

mongoose.connect(MONGODB_URI);

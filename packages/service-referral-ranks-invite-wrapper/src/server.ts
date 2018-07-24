import { createAsyncCatcher } from '@overmindbots/shared-utils/utils';
import cors from 'cors';
import express from 'express';
import passport from 'passport';
import logger from 'winston';

const asyncCatcher = createAsyncCatcher();

const app = express();

app.use(cors());
app.use((req, res, next) => {
  console.debug('>> Receiving request');
  next();
});
app.use(passport.initialize());
app.get(
  '/oauth',
  passport.authenticate('discord', {
    scope: ['identify'],
  })
);
app.get(
  '/oauth/callback',
  passport.authenticate('discord', {
    // failureRedirect: `${CLIENT_URL}/login`, // Redirect back to oauth dialog
    session: false,
  }),
  asyncCatcher(
    async (req: { user: { _id: string } }, res: Express.Response) => {
      const { _id: userId } = req.user;
      logger.debug(req.user);
      logger.debug(`=> Received auth of userId: ${userId}`);
      // const user = await User.findOne(userId);
      // if (!user) {
      //   throw new Error('Unauthorized');
      // }
      // const { token } = await user.createSession();

      // res.redirect(inviteUrl); // Redirect to inviteUrl
    }
  )
);
const server = app.listen(PORT, () => {
  // tslint:disable-next-line
  console.log(`
    == Started server ==
    PORT: ${PORT}
    ...
  `);
});

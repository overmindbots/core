/* tslint:disable:ordered-imports */
import cors from 'cors';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import { formatError, GraphQLError } from 'graphql';
import passport from 'passport';
import { GraphQLUnauthorizedError } from '@overmindbots/shared-utils/graphqlErrors';
import '~/startup';
import { User } from '@overmindbots/shared-models';
import { createAsyncCatcher } from '@overmindbots/shared-utils/utils';
import schema from '~/schema';

const asyncCatcher = createAsyncCatcher(error => {
  throw error;
});

const { PORT, APP_URL } = process.env;

if (!PORT) {
  throw new Error('PORT Env variable missing');
}
if (!APP_URL) {
  throw new Error('APP_URL Env variable missing');
}

const app = express();

app.use(cors());
app.use((req, res, next) => {
  console.debug('>> Receiving request');
  next();
});
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true,
    formatError: (err: GraphQLError) => {
      // tslint:disable-next-line
      console.info('===> Handling GraphQL error');
      console.debug(err.message);
      const formattedError = formatError(err);

      return formattedError;
    },
  })
);
app.use(passport.initialize());

/*
 * Oauth2: Discord
 * Redirects to the initial Oauth2 request to Discord
 */
app.get(
  '/oauth2/discord',
  passport.authenticate('discord', {
    scope: ['identify', 'guilds', 'email'],
    session: false,
  })
);

/*
 * Oauth2: Discord Callback
 * Callback with Oauth data redirected from the Discord Oauth2 Dialog page
 */
app.get(
  '/oauth2/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: `${APP_URL}/login`,
    session: false,
  }),
  asyncCatcher(async (req, res) => {
    const { _id: userId } = req.user;
    const user = await User.findOne(userId);
    if (!user) {
      throw new GraphQLUnauthorizedError();
    }
    const { token } = await user.createSession();

    res.redirect(`${APP_URL}/oauth/discord/callback?token=${token}`);
  })
);
app.get(
  '/oauth2/discord/botCallback',
  asyncCatcher(async (req, res) => {
    const decoded = Buffer.from(req.query.state, 'base64').toString();
    const state = JSON.parse(decoded);

    res.redirect(`${APP_URL}/${state.redirectUrl}`);
  })
);

const server = app.listen(PORT, () => {
  // tslint:disable-next-line
  console.log(`
    == Started graphql server ==
    PORT: ${PORT}
    ...
  `);
});

process.once('SIGTERM', () => {
  // tslint:disable-next-line
  console.log('\n[SIGTERM] Closing web server...');
  server.close(() => {
    // tslint:disable-next-line
    console.log('[SIGTERM] Done closing server');
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('SIGINT', () => {
  // tslint:disable-next-line
  console.log('\n[SIGINT] Closing web server...');
  server.close(() => {
    // tslint:disable-next-line
    console.log('[SIGINT] Done closing server');
    process.exit(0);
  });
});

process.once('SIGUSR2', function() {
  // tslint:disable-next-line
  console.log('\n[SIGUSR2] Closing web server...');
  server.close(() => {
    // tslint:disable-next-line
    console.log('[SIGUSR2] Done closing server');
    process.kill(process.pid, 'SIGUSR2');
  });
});

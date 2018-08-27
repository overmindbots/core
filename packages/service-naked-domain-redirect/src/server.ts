import express, { Request, Response } from 'express';

import { PORT } from '~/constants';

const app = express();

// We assume the only way to reach this endpoint is through a naked domain
app.all(/.*/, function(req: Request, res: Response) {
  const host = req.header('host') as string;
  const protocol = req.secure ? 'https' : 'http';

  res.redirect(301, `${protocol}://www.` + host + req.url);
});
app.listen(PORT, () => {
  // tslint:disable-next-line no-console
  console.log('Listenting at port ', PORT);
});

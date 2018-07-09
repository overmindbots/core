const express = require('express');
const morgan = require('morgan');

const PORT = process.env.PORT || 3000;

const app = express();
const morganLogger = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms'
);

app.use(morganLogger);

// Redirect non-http requests
app.enable('trust proxy');
app.use(function(req, res, next) {
  if (req.secure) {
    next();
  } else {
    res.redirect('https://' + req.headers.host + req.url);
  }
});

app.use(express.static('./build'));
app.use('*', express.static('./build/index.html'));

// app.get('*', (req, res) => {
//   res.sendFile('./build/index.html');
// });

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}...`);
});

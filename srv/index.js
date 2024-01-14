const express = require('express');
const appConfig = require('./config/app');
const app = express();
const port = appConfig[app.get('env')].port;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
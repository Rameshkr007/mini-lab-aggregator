require('dotenv').config();
const { createApp } = require('./src/app');

const PORT = Number(process.env.PORT) || 5000;

createApp().listen(PORT, () => {
  console.log(`Mini Lab Aggregator API listening on http://localhost:${PORT}`);
});

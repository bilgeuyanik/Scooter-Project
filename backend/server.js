const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // frontend bağlandı.

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Merhaba Dünya :)' });
});

app.listen(5000,'0.0.0.0', () => {
  console.log("Backend sunucusu 5000 portunda ");
});
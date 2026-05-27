const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const healthRoute = require('./routes/health');
const configRoute = require('./routes/config');
const generateRoute = require('./routes/generate');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../client')));

app.use('/api/health', healthRoute);
app.use('/api/event-config', configRoute);
app.use('/api/generate', generateRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Fototime AI app is running on port ${PORT}`);
});

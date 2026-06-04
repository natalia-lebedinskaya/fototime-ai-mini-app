const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const healthRoute = require('./routes/health');
const configRoute = require('./routes/config');
const generateRoute = require('./routes/generate');
const stylesRoute = require('./routes/styles');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());



app.get('/api/version', (_req, res) => {
  const packageJson = require('../../package.json');

  const commit =
    process.env.RENDER_GIT_COMMIT ||
    process.env.GIT_COMMIT ||
    'local';

  res.json({
    version: packageJson.version || '0.1.0',
    commit: commit === 'local' ? 'local' : String(commit).slice(0, 7),
    environment: process.env.NODE_ENV || 'development',
    buildDate: new Date().toISOString()
  });
});

app.use(express.static(path.join(__dirname, '../client')));

app.use('/api/health', healthRoute);
app.use('/api/event-config', configRoute);
app.use('/api/generate', generateRoute);
app.use('/api/styles', stylesRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Fototime AI app is running on port ${PORT}`);
});

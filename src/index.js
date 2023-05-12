import 'dotenv/config';
import initializeMongoServer from './mongoConfig';
import createServer from './server';

initializeMongoServer().then(() => {
  const app = createServer();
  app.listen(process.env.PORT, () => {
    console.log(`Server started on http://localhost:${process.env.PORT}`);
  });
});

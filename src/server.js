import express from 'express';
import cors from 'cors';

function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  return app;
}

export default createServer;

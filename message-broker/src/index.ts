import FastMQ from 'fastmq';
import express, { Request, Response } from 'express';

const server = FastMQ.Server.create('master', 7500, '0.0.0.0');

const PORT = process.env.PORT || 3003;

// start server
Promise.all([server.start()]).then(async () => {
  const app = express();
  app.use(express.json());

  const channel = await FastMQ.Client.connect('mrv-data', 7500, '127.0.0.1');

  app.post('/mrv', async (req: Request, res: Response) => {
    try {
      console.log(req.body);

      await channel.request('ui-service', 'mrv-data', req.body, 'json');
      res.sendStatus(200);
    } catch (e) {
      res.status(500).send(e.message);
    }
  });

  app.get('/info', async (req: Request, res: Response) => {
    console.log(req.body);

    res.status(200).json({
      NAME: 'message-broker',
      RELEASE_VERSION: process.env.RELEASE_VERSION,
      OPERATOR_ID: process.env.OPERATOR_ID,
    });
  });

  app.listen(PORT, () => {
    console.log('Message Broker server started', PORT);
  });
});

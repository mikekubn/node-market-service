import { Application } from 'express';
import currencyPairRouter from './api/controllers/currency-pair/router';
export default function routes(app: Application): void {
  app.use('/api/v1/currency-pairs', currencyPairRouter);
}

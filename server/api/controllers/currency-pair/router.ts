import express from 'express';
import controller from './controller';
export default express
    .Router()
    .get('/', controller.getCurrencyPairs)
    .get('/:primaryCcy/:secondaryCcy', controller.getCurrencyPair)
    .get('/:primaryCcy/:secondaryCcy/values', controller.getExchangeRateValues);

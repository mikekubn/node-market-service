import { Request, Response } from 'express';
import MarketService from "../../services/market.service";

export class Controller {
    async getCurrencyPairs(_: Request, res: Response): Promise<void> {
        try {
            const pairs = await MarketService.listCurrencyPairsCached();
            res.status(200).json(pairs).end();
        }
        catch {
            res.status(500).end();
        }

    }

    async getCurrencyPair(req: Request, res: Response): Promise<void> {
        const primaryCcy = req.params['primaryCcy'];
        const secondaryCcy = req.params['secondaryCcy'];

        try {
            const pair = await MarketService.getCurrencyPair(primaryCcy, secondaryCcy);
            res.status(200).json(pair).end();
        }
        catch {
            res.status(500).end();
        }


    }

    async getExchangeRateValues(req: Request, res: Response) : Promise<void> {
        const primaryCcy = req.params['primaryCcy'];
        const secondaryCcy = req.params['secondaryCcy'];
        const period = req.query['period'] as string;
        if(!period || !['1W', '1D', '1M', '1Y'].includes(period)) {
            res.status(500).end();
        }
        else
        {
            try {
                const exchangeRateValues = await MarketService.getExchangeRateValuesCached(primaryCcy, secondaryCcy, period);
                res.json(exchangeRateValues).status(200).end();
            }
            catch {
                res.status(500).end();
            }
        }


    }
}
export default new Controller();

import axios, {Axios} from "axios";
import {parseStringPromise} from 'xml2js';
import memoize from 'timed-memoize';

export class CurrencyPair {

    constructor(primaryCcy: string, secondaryCcy: string, primaryCcyAmount: number, secondaryCcyAmount: number) {
        this.primaryCcy = primaryCcy;
        this.secondaryCcy = secondaryCcy;
        this.primaryCcyAmount = primaryCcyAmount;
        this.secondaryCcyAmount = secondaryCcyAmount;
    }

    id: number;
    primaryCcy: string;
    secondaryCcy: string;
    primaryCcyAmount: number;
    secondaryCcyAmount: number;
    lastExchangeRateAskValue: number;
    lastExchangeRateBidValue: number;
    lastExchangeRateDate: Date;
}

export class ExchangeRateValue {
    constructor(date: Date, bid: number, ask: number) {
        this.date = date;
        this.bid = bid;
        this.ask = ask;
    }

    date: Date;
    bid: number;
    ask: number;
}

const PeriodConversion: { [key in string]: string } = {
    "1D": "d",
    "1W": "w",
    "1M": "m",
    "1Y": "y"
}

export class MarketService {
    _axios: Axios;


    constructor() {
        this._axios = axios.create({
            baseURL: "http://partners.akcenta.cz/"
        });
    }

    /**
     * @internal This is internal function, please use `cachedCurrencyPairs`
     *
     */
    async listCurrencyPairs(): Promise<Array<CurrencyPair>> {
        const response = await this._axios.get("p.aspx?Action=RD&Device_Tag=0&Pair_List=0&List_Only=1");
        const responseData = response.data;

        const parsedData = await parseStringPromise(responseData);

        if (Array.isArray(parsedData.Pairs.Pair)) {
            const currencyPairs : Array<CurrencyPair> = parsedData.Pairs.Pair.map((pair: { Name: Array<String>, Pair_Id: Array<number> }) => {
                const nameComponents = pair.Name[0].split("/");
                const currencyPair = new CurrencyPair(nameComponents[0], nameComponents[1], 1, 1);
                currencyPair.id = new Number(pair.Pair_Id[0]).valueOf()
                return currencyPair;
            })

            const exchangeRates = await this.getLastExchangeRateValues();
            exchangeRates.forEach(exchangeRate => {
                const pair = currencyPairs.find(currencyPair => currencyPair.id == exchangeRate.id)
                if(pair) {
                    pair.lastExchangeRateDate = exchangeRate.rate.date;
                    pair.lastExchangeRateAskValue = exchangeRate.rate.ask;
                    pair.lastExchangeRateBidValue = exchangeRate.rate.bid;
                }
            });
            return currencyPairs;
        }

        throw "Invalid response"; //TODO: replace with ResponseResult
    }

    async getCurrencyPair(primaryCcy: string, secondaryCcy: string): Promise<CurrencyPair> {
        const pairs = await this.listCurrencyPairsCached();
        const foundPair = pairs.find(pair => pair.primaryCcy == primaryCcy && pair.secondaryCcy == secondaryCcy);
        if (!foundPair) {
            throw "Not found"; //todo replace with responseResult
        }
        return foundPair;
    }

    async getLastExchangeRateValues() : Promise<Array<{ id: number, rate: ExchangeRateValue}>> {
        const response = await this._axios.get(`p.aspx?Action=RR&Device_Tag=420605299728&Date_From=1.12.2014%2000:00:00&Date_To=31.12.2014%2023:59:59&Last=1`);
        const responseData = response.data;
        const parsedData = await parseStringPromise(responseData);

        if(Array.isArray(parsedData.Pairs.Pair)) {
            return parsedData.Pairs.Pair.map((pair : { Pair_Id: Array<string>, BID: Array<string>, ASK: Array<string>, Date_Of_Change: Array<string> } ) => {
                return {
                    id: new Number(pair.Pair_Id[0]).valueOf(),
                    rate: new ExchangeRateValue(new Date(pair.Date_Of_Change[0]), new Number(pair.BID[0]).valueOf(), new Number(pair.ASK[0]).valueOf())
                };
            })
        }
        throw "No data found"; //todo: fix
    }

    async getExchangeRateValues(primaryCcy: string, secondaryCcy: string, period: string): Promise<Array<ExchangeRateValue>> {
        const currencyPair = await this.getCurrencyPair(primaryCcy, secondaryCcy);
        console.log(currencyPair.id);
        const response = await this._axios.get(`p.aspx?Action=RC&Device_Tag=Optimato&Period=${PeriodConversion[period]}&Pair_Id=${currencyPair.id}`);
        const responseData = response.data;

        const parsedData = await parseStringPromise(responseData);

        if(Array.isArray(parsedData.Pairs.Pair)) {
            return parsedData.Pairs.Pair.map((pair : { Pair_Id: Array<string>, BID: Array<string>, ASK: Array<string>, Date_Of_Change_Int: Array<string> } ) => {
                return new ExchangeRateValue(new Date(pair.Date_Of_Change_Int[0]), new Number(pair.BID[0]).valueOf(), new Number(pair.ASK[0]).valueOf());
            })
        }

        throw 'No data' //todo fix
    }


    listCurrencyPairsCached = memoize(this.listCurrencyPairs.bind(this), {
        resolver: (args) => `${args[0]}-${args[1]}`,
        timeout: 30_000
    });

    getExchangeRateValuesCached = memoize(this.getExchangeRateValues.bind(this), {
        resolver: (args) => `${args[0]}-${args[1]}-${args[2]}`,
        timeout: 60_000
    })

}

export default new MarketService();
import * as CsvtoJson from 'convert-csv-to-json'
import axios from 'axios'

export type Transaction = {
    timestamp: number;
    transaction_type: string;
    token: string;
    amount: number;
}

export type TokenBalance = {
    token: string,
    amount: number,
    price: number,
    totalPrice: number,
}

const transactions: Transaction[] = CsvtoJson.fieldDelimiter(',')
    .getJsonFromCsv("./data/transactions.csv");

const tokens: { [key: string]: number; } = {};
transactions.map(transaction => {
    if (transaction.transaction_type == "DEPOSIT") {
        if (!tokens[transaction.token]) tokens[transaction.token] = 0;
        tokens[transaction.token] += Number(transaction.amount);
    } else {
        if (tokens[transaction.token]) tokens[transaction.token] -= Number(transaction.amount);
        else tokens[transaction.token] = 0;
    }
})

Promise.all(Object.keys(tokens).map(async token => {
    const tokenBalance: TokenBalance = {
        token: token,
        amount: tokens[token],
        price: 0,
        totalPrice: 0,
    }
    try {
        const { data } = await axios.get('https://min-api.cryptocompare.com/data/price',
            {
                params: {
                    fsym: token,
                    tsyms: 'USD',
                    api_key: '9f5cb5480bcaf9dcdd99ab496e8112980d68db09d4a500a05eafd46cb422343b'
                }
            })
        data && data.USD && (tokenBalance.price = data.USD);
        tokenBalance.totalPrice = tokenBalance.price * tokenBalance.amount;
    } catch (error) {
        console.error(error);
    }
    return tokenBalance;
})).then((result) => {
    console.log(result)
})

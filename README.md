# DummyData Project Description

## How to run this project?

The env use node version is `v23.11.0`, and remove some useless file ,if there is any problem to reuse this repo, plz recompile, also you can contact me directly.

TO view the dummy.db, you need to install the `sqlite-viewer` plugin .

1. **Install dependencies:**
   ```bash
   npm run prepare
   ```
2. **Initialize the database:（only once）**
   ```bash
   npm run preparedb
   ```
3. **Start the API service:**
   ```bash
   npm run start
   ```

## Data Source

All data is collected from real public sources on July 25, 2025, and is for development and testing purposes only. No investment advice is provided.

## Data Update Mechanism

- Stock and fund prices/net values are automatically simulated as "one day" every **1 minute**, with random fluctuations.
- After each fluctuation, the latest price/net value is written to the database and a historical record is generated for review and analysis.

## API Access and Response Examples

After starting the service, it listens on `http://localhost:3000`. You can access data via the following endpoints:

### Stock APIs

- **Get all stocks (pagination & sorting supported)**  
  `GET /api/stocks?page=1&limit=20&sort=market_cap&order=desc`  
  Response:

  ```json
  [
    {
      "code": "601398",
      "name": "工商银行",
      "latest_price": 7.68,
      "market_cap": "2.73万亿",
      "turnover_rate": 0.18,
      "pe_ratio": 8.1,
      "pb_ratio": 0.74,
      "change_percent": null
    },
    {
      "code": "601939",
      "name": "建设银行",
      "latest_price": 9.46,
      "market_cap": "2.49万亿",
      "turnover_rate": 1.26,
      "pe_ratio": 7.45,
      "pb_ratio": 0.75,
      "change_percent": null
    },
    {
      "code": "600941",
      "name": "中国移动",
      "latest_price": 109.97,
      "market_cap": "2.41万亿",
      "turnover_rate": 1.16,
      "pe_ratio": 19.65,
      "pb_ratio": 1.73,
      "change_percent": null
    },
    {
      "code": "601288",
      "name": "农业银行",
      "latest_price": 6.2,
      "market_cap": "2.19万亿",
      "turnover_rate": 0.2,
      "pe_ratio": 7.6,
      "pb_ratio": 0.84,
      "change_percent": null
    },
    {
      "code": "002594",
      "name": "比亚迪",
      "latest_price": 339.79,
      "market_cap": "1.86万亿",
      "turnover_rate": 1.37,
      "pe_ratio": 50.73,
      "pb_ratio": 8.8,
      "change_percent": null
    },
    {
      "code": "600519",
      "name": "贵州茅台",
      "latest_price": 1452.33,
      "market_cap": "1.85万亿",
      "turnover_rate": 0.36,
      "pe_ratio": 17.26,
      "pb_ratio": 8.29,
      "change_percent": null
    },
    {
      "code": "601988",
      "name": "中国银行",
      "latest_price": 5.71,
      "market_cap": "1.81万亿",
      "turnover_rate": 0.18,
      "pe_ratio": 8.34,
      "pb_ratio": 0.7,
      "change_percent": null
    },
    {
      "code": "601857",
      "name": "中国石油",
      "latest_price": 8.88,
      "market_cap": "1.64万亿",
      "turnover_rate": 0.09,
      "pe_ratio": 8.74,
      "pb_ratio": 1.07,
      "change_percent": null
    },
    {
      "code": "300750",
      "name": "宁德时代",
      "latest_price": 287.74,
      "market_cap": "1.31万亿",
      "turnover_rate": 0.51,
      "pe_ratio": 23.43,
      "pb_ratio": 5.42,
      "change_percent": null
    },
    {
      "code": "600938",
      "name": "中国海油",
      "latest_price": 26.28,
      "market_cap": "1.24万亿",
      "turnover_rate": 1.25,
      "pe_ratio": 8.47,
      "pb_ratio": 1.58,
      "change_percent": null
    }
  ]
  ```

- **Get single stock details**  
   `GET /api/stocks/{code}`  
   Response:

  ```json
  [
    {
      "code": "601398",
      "name": "工商银行",
      "latest_price": 7.81,
      "market_cap": "2.73万亿",
      "turnover_rate": 0.18,
      "pe_ratio": 8.1,
      "pb_ratio": 0.74,
      "change_percent": 1.96
    },
    {
      "code": "601939",
      "name": "建设银行",
      "latest_price": 9.46,
      "market_cap": "2.49万亿",
      "turnover_rate": 1.26,
      "pe_ratio": 7.45,
      "pb_ratio": 0.75,
      "change_percent": -1.77
    },
    {
      "code": "600941",
      "name": "中国移动",
      "latest_price": 107.16,
      "market_cap": "2.41万亿",
      "turnover_rate": 1.16,
      "pe_ratio": 19.65,
      "pb_ratio": 1.73,
      "change_percent": 0.53
    },
    {
      "code": "601288",
      "name": "农业银行",
      "latest_price": 6.13,
      "market_cap": "2.19万亿",
      "turnover_rate": 0.2,
      "pe_ratio": 7.6,
      "pb_ratio": 0.84,
      "change_percent": -0.65
    },
    {
      "code": "002594",
      "name": "比亚迪",
      "latest_price": 338.63,
      "market_cap": "1.86万亿",
      "turnover_rate": 1.37,
      "pe_ratio": 50.73,
      "pb_ratio": 8.8,
      "change_percent": -0.72
    },
    {
      "code": "600519",
      "name": "贵州茅台",
      "latest_price": 1445.56,
      "market_cap": "1.85万亿",
      "turnover_rate": 0.36,
      "pe_ratio": 17.26,
      "pb_ratio": 8.29,
      "change_percent": -0.58
    },
    {
      "code": "601988",
      "name": "中国银行",
      "latest_price": 5.6,
      "market_cap": "1.81万亿",
      "turnover_rate": 0.18,
      "pe_ratio": 8.34,
      "pb_ratio": 0.7,
      "change_percent": -0.88
    },
    {
      "code": "601857",
      "name": "中国石油",
      "latest_price": 8.76,
      "market_cap": "1.64万亿",
      "turnover_rate": 0.09,
      "pe_ratio": 8.74,
      "pb_ratio": 1.07,
      "change_percent": -0.23
    },
    {
      "code": "300750",
      "name": "宁德时代",
      "latest_price": 280.31,
      "market_cap": "1.31万亿",
      "turnover_rate": 0.51,
      "pe_ratio": 23.43,
      "pb_ratio": 5.42,
      "change_percent": 0.48
    },
    {
      "code": "600938",
      "name": "中国海油",
      "latest_price": 25.49,
      "market_cap": "1.24万亿",
      "turnover_rate": 1.25,
      "pe_ratio": 8.47,
      "pb_ratio": 1.58,
      "change_percent": -1.92
    }
  ]
  ```

- **Get stock info**  
   `GET /api/stocks/{code}`  
   Response:

  ```json
  {"data": {
        "stock_code": "000560",
        "name": "我爱我家",
        "latest_price": 2.58,
        "market_cap": "73.02亿",
        "turnover_rate": 7.37,
        "pe_ratio": 291.12,
        "pb_ratio": 0.78,
        "change_percent": -1.12
    }}
  ```


- **Get stock price history**  
   `GET /api/stocks/{code}/history?day=(day)`  
   Response:
  ```json
  {"data": [
        "11.86",
        "11.77",
        "11.59",
        "11.42",
        "11.22",
        "11.28",
        "11.2"
    ]}
    
  ```

### Fund APIs

- **Get all funds (pagination, type filter, sorting supported)**  
   `GET /api/funds?page=1&limit=20&sort=fund_size&order=desc`  
   the funds api is the same as stocks, but the sort can be {fund_size, change_percent}.

## Other Notes

- This project is for learning and testing only; all data is simulated.
- For batch testing, you can import the Postman collection file

# DummyData Project Description

## How to run this project?

1. **Install dependencies:**
   ```bash
   npm install express better-sqlite3 xlsx
   ```
2. **Initialize the database:（only once）**
   ```bash
   node scripts/initDB.js
   ```
3. **Start the API service:**
   ```bash
   node app.js
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

- **Get brief stock info**  
   `GET /api/stocks/{code}/brief`  
   Response:

  ```json
  {
    "code": "601939",
    "name": "建设银行",
    "latest_price": 9.45,
    "change_percent": -1.87
  }
  ```

- **Get stock price history**  
   `GET /api/stocks/{code}/history?start=2025-07-01&end=2025-07-25`  
   Response:
  ```json
  [
    {
      "date": "2025-01-01",
      "price": 9.46
    },
    {
      "date": "2025-01-01",
      "price": 9.62
    },
    {
      "date": "2025-01-01",
      "price": 9.34
    },
    {
      "date": "2025-01-02",
      "price": 9.63
    },
    {
      "date": "2025-01-02",
      "price": 9.45
    },
    {
      "date": "2025-01-03",
      "price": 9.46
    }
  ]
  ```

### Fund APIs

- **Get all funds (pagination, type filter, sorting supported)**  
   `GET /api/funds?page=1&limit=20&type=Hybrid&sort=fund_size&order=desc`  
   Response:

  ```json
  [
    {
      "fund_code": "011722",
      "short_name": "前海开源深圳特区精选股票A",
      "fund_type": "股票型",
      "fund_size": "2.36亿",
      "industries": null,
      "managers": "杨德龙",
      "latest_net_value": 0.9169,
      "change_percent": 0
    },
    {
      "fund_code": "011723",
      "short_name": "前海开源深圳特区精选股票C",
      "fund_type": "股票型",
      "fund_size": "4426.88万",
      "industries": null,
      "managers": "杨德龙",
      "latest_net_value": 0.9061,
      "change_percent": 0
    },
    {
      "fund_code": "011726",
      "short_name": "安信新常态股票C",
      "fund_type": "股票型",
      "fund_size": "1.32亿",
      "industries": null,
      "managers": "袁玮",
      "latest_net_value": 1.7176,
      "change_percent": 0
    },
    {
      "fund_code": "011824",
      "short_name": "浙商汇金量化臻选股票A",
      "fund_type": "股票型",
      "fund_size": "6380.80万",
      "industries": null,
      "managers": "陈顾君",
      "latest_net_value": 1.094,
      "change_percent": 0
    },
    {
      "fund_code": "011825",
      "short_name": "浙商汇金量化臻选股票C",
      "fund_type": "股票型",
      "fund_size": "6303.86万",
      "industries": null,
      "managers": "陈顾君",
      "latest_net_value": 1.0374,
      "change_percent": 0
    },
    {
      "fund_code": "011923",
      "short_name": "大成消费精选股票A",
      "fund_type": "股票型",
      "fund_size": "2.75亿",
      "industries": null,
      "managers": "张烨",
      "latest_net_value": 0.8525,
      "change_percent": 0
    },
    {
      "fund_code": "011926",
      "short_name": "大成消费精选股票C",
      "fund_type": "股票型",
      "fund_size": "1186.66万",
      "industries": null,
      "managers": "张烨",
      "latest_net_value": 0.801,
      "change_percent": 0
    },
    {
      "fund_code": "011221",
      "short_name": "南方匠心优选股票C",
      "fund_type": "股票型",
      "fund_size": "1.53亿",
      "industries": null,
      "managers": "李锦文",
      "latest_net_value": 0.8585,
      "change_percent": 0
    },
    {
      "fund_code": "011295",
      "short_name": "中信保诚量化阿尔法股票C",
      "fund_type": "股票型",
      "fund_size": "3.49亿",
      "industries": null,
      "managers": "姜鹏",
      "latest_net_value": 1.0053,
      "change_percent": 0
    },
    {
      "fund_code": "011220",
      "short_name": "南方匠心优选股票A",
      "fund_type": "股票型",
      "fund_size": "27.45亿",
      "industries": null,
      "managers": "李锦文",
      "latest_net_value": 0.9098,
      "change_percent": 0
    }
  ]
  ```

- **Get single fund details**  
   `GET /api/funds/{code}`  
   Response:

  ```json
  {
    "fund_code": "011709",
    "short_name": "中欧嘉益一年持有期混合C",
    "fund_type": "混合型-偏股",
    "fund_size": "9668.70万",
    "industries": null,
    "managers": "叶培培",
    "latest_net_value": 1.0154,
    "change_percent": 0
  }
  ```

- **Get brief fund info**  
   `GET /api/funds/{code}/brief`  
   Response:

  ```json
  {
    "fund_code": "011709",
    "short_name": "中欧嘉益一年持有期混合C",
    "latest_net_value": 1.0149,
    "change_percent": -0.06
  }
  ```

- **Get fund net value history**  
   `GET /api/funds/{code}/history?start=2025-07-01&end=2025-07-25`  
   Response:
  ```json
  [
    {
      "date": "2025-01-01",
      "net_value": 1.1968
    },
    {
      "date": "2025-01-01",
      "net_value": 1.2086
    },
    {
      "date": "2025-01-01",
      "net_value": 1.2333
    },
    {
      "date": "2025-01-02",
      "net_value": 1.2178
    },
    {
      "date": "2025-01-02",
      "net_value": 1.2276
    },
    {
      "date": "2025-01-03",
      "net_value": 1.2233
    },
    {
      "date": "2025-01-03",
      "net_value": 1.2329
    },
    {
      "date": "2025-01-04",
      "net_value": 1.2404
    }
  ]
  ```

## Other Notes

- This project is for learning and testing only; all data is simulated.
- For batch testing, you can import the Postman collection file

# System Architecture (AWS)

The diagram below shows how the `auth`, `banner`, and `category` services interact with AWS services (S3, DynamoDB, SNS, Lambda, API Gateway).

```mermaid
flowchart LR
  subgraph ClientLayer["Client Layer"]
    Client[Client]
  end

  subgraph APIGW["API Gateway"]
    API["HTTP API"]
  end

  subgraph CategoryService["Category Service"]
    GU["GetUploadUrl Lambda"]
    UP["updateCategoryImage Lambda"]
    CLEAN["cleanCategories Lambda\n(EventBridge schedule)"]
    S3["S3 Bucket\n(category-nimat-images)"]
    DDB["DynamoDB\nCategories table"]
    SNS["SNS Topic\nCategoryCleanupTopic"]
  end

  subgraph BannerService["Banner Service"]
    B_UP["uploadBanner Lambda"]
  end

  subgraph AuthService["Auth Service"]
    AUTH["Auth Lambdas"]
  end

  Client -->|"POST /upload-url"| API
  API --> GU
  GU -->|"Presigned URL"| Client
  Client -->|"PUT to presigned URL"| S3
  S3 -->|"s3:ObjectCreated:Put"| UP
  UP --> DDB

  CLEAN -->|"Scan & delete"| DDB
  CLEAN -->|"Publish cleanup events"| SNS
  SNS -->|"Email subscription"| Email[(Email)]

  B_UP -->|"writes metadata"| DDB
  AUTH -->|"access control"| API

  click S3 "https://console.aws.amazon.com/s3" "Open S3 console"
  click DDB "https://console.aws.amazon.com/dynamodb" "Open DynamoDB console"

```

Legend:

- Solid arrows indicate event flow or API calls.
- `cleanCategories` is scheduled using EventBridge (Serverless schedule event).

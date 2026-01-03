# Category Service (Serverless on AWS)

The Category service handles uploading and storing category banners/images and maintaining a `Categories` DynamoDB table.

## Overview

- Lambda functions:
  - `getUploadUrl` — returns a pre-signed S3 upload URL to clients.
  - `updateCategoryImage` — triggered by S3 `ObjectCreated:Put` events; saves metadata to DynamoDB.
  - `cleanuCategories` — scheduled cleanup (EventBridge) that removes old, incomplete categories and publishes notifications to an SNS topic.
- AWS resources:
  - S3 bucket: `category-nimat-images` (stores images)
  - DynamoDB table: `Categories` (PK: `fileName`)
  - SNS topic: `CategoryCleanupTopic` (email subscription)

## How it works 🔧

1. Client requests upload URL from `POST /upload-url` (HTTP API → `getUploadUrl`).
2. Client uploads directly to S3 using the signed URL.
3. S3 `ObjectCreated` triggers `updateCategoryImage`, which writes a `fileName`, `imageUrl`, and `createdAt` to the `Categories` table.
4. A scheduled Lambda (`cleanuCategories`) runs every 2 minutes and deletes categories older than 1 hour that don't have an `imageUrl` set, then publishes a message to the `CategoryCleanupTopic` SNS topic for notifications.

> Note: `SNS_TOPIC_ARN` is injected from `serverless.yml` as `Ref: CategoryCleanupTopic` and is available at runtime via `process.env.SNS_TOPIC_ARN`.

## Environment variables

- `BUCKET_NAME` — S3 bucket name (default: `category-nimat-images`)
- `DYNAMODB_TABLE` — DynamoDB table name (default: `Categories`)
- `SNS_TOPIC_ARN` — ARN of SNS topic used to publish cleanup notifications

## Deployment ✅

From the `category` directory:

```bash
serverless deploy --stage dev
```

## Local development

- Use `serverless dev` for a fast iteration loop.
- Ensure environment variables are exported when running locally, e.g.:

```bash
export AWS_REGION=us-east-1
export BUCKET_NAME=category-nimat-images
export DYNAMODB_TABLE=Categories
export SNS_TOPIC_ARN=<local-or-deployed-topic-arn>
```

## Testing and verification

- Upload an image using the URL returned by `getUploadUrl` and verify the record appears in the `Categories` table.
- For cleanup testing: create an item with `createdAt` older than 1 hour and no `imageUrl` and run the scheduled cleanup.
- Check email inbox configured in `CategoryCleanupTopicSubscription` to see cleanup notifications.

## Diagram & cross-service architecture

See the system-wide architecture diagram in `ARCHITECTURE.md` (root) for a visual of how `auth`, `banner`, and `category` services interact with AWS components.

---

If you'd like, I can also add a short example of the SNS publish call inside `cleanCategory.js` and a test script to trigger it.

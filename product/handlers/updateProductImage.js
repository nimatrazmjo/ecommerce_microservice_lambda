const {
  DynamoDBClient,
  UpdateItemCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb");

const ddbClient = new DynamoDBClient({ region: "us-east-1" });
exports.updateProductImage = async (event) => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;

    // extract the first record from the event
    const record = event.Records[0];

    // GET THE S3 BUCKET NAME AND OBJECT KEY FROM THE RECORD
    const bucketName = record.s3.bucket.name;

    // EXTRACT THE file name (object key) from the record
    const fileName = record.s3.object.key;

    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression: "fileName = :fileName",
      ExpressionAttributeValues: {
        ":fileName": { S: fileName },
      },
    });

    const scanResult = await ddbClient.send(scanCommand);

    if (scanResult.Items.length === 0) {
      console.error("No product found with the given fileName:", fileName);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    const productId = scanResult.Items[0].productId.S;

    const updateCommand = new UpdateItemCommand({
      TableName: tableName,
      Key: {
        productId: { S: productId },
      },
      UpdateExpression: "SET imageUrl = :imageUrl",
      ExpressionAttributeValues: {
        ":imageUrl": { S: imageUrl },
      },
    });

    await ddbClient.send(updateCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Product image updated successfully" }),
    };
  } catch (error) {
    console.error("Error updating product image:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};

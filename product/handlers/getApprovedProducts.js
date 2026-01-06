const {
  DynamoDBClient,
  GetItemCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({ region: "us-east-1" });

exports.getApprovedProducts = async () => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;

    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: "isApproved = :trueVal",
      ExpressionAttributeValues: {
        ":trueVal": { BOOL: true },
      },
    });

    const response = await dynamoDbClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify(response.Items || []),
    };
  } catch (error) {
    console.error("Error fetching approved products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

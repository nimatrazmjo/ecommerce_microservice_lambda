const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.getAllCategories = async (event) => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };

    const command = new ScanCommand(params);
    const data = await ddbClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(data.Items || []),
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

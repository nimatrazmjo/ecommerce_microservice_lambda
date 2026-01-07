const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

exports.processOrder = async (event) => {
  try {
    const dynamoDbClient = new DynamoDBClient({ region: "us-east-1" });

    for (const record of event.Records) {
      const order = JSON.parse(record.body);
      const orderItem = {
        orderId: { S: order.orderId },
        productId: { S: order.productId },
        quantity: { N: order.quantity.toString() },
        email: { S: order.email },
        status: { S: order.status },
        orderDate: { S: new Date().toISOString() },
      };

      const putCommand = new PutItemCommand({
        TableName: process.env.ORDERS_TABLE,
        Item: orderItem,
      });

      await dynamoDbClient.send(putCommand);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Orders processed successfully" }),
    };
  } catch (error) {
    console.error("Error processing orders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

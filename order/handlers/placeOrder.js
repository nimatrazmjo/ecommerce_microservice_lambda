const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const axios = require("axios");
const crypto = require("crypto");

const dynamoDbClient = new DynamoDBClient({ region: "us-east-1" });

exports.placeOrder = async (event) => {
  try {
    const { id, quantity, email } = JSON.parse(event.body);
    if (!id || !quantity || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    // Fetch product details from Product Service
    const productsResponse = await axios.get(
      `https://xfoky77yeg.execute-api.us-east-1.amazonaws.com/approved-products`
    );
    const products = productsResponse.data;
    console.log("Fetched products:", products);
    const product = products.find((prod) => prod.productId?.S === id);

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    // if quantity is more than available stock
    if (product && quantity > product.quantity?.N) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Insufficient stock available" }),
      };
    }

    const orderId = crypto.randomUUID();
    const orderItem = {
      orderId: { S: orderId },
      productId: { S: id },
      quantity: { N: quantity.toString() },
      email: { S: email },
      orderDate: { S: new Date().toISOString() },
    };

    const putCommand = new PutItemCommand({
      TableName: "Orders",
      Item: orderItem,
    });

    await dynamoDbClient.send(putCommand);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Order placed successfully", orderId }),
    };
  } catch (error) {
    console.error("Error placing order:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

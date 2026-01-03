const {
  DynamoDBClient,
  UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");

const ddbClient = new DynamoDBClient({ region: "us-east-1" });

exports.updateCategoryImage = async (event) => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;
    const record = event.Records[0];

    // get the s3 bucket name from the event record
    const bucketName = record.s3.bucket.name;

    // extract the file name directly from the s3 record
    const fileName = record.s3.object.key;

    // Extract the actual uploaded filename (basename) — we stored the file name (e.g., 'electronic.png') in DynamoDB
    const objectKey = fileName; // s3.object.key, e.g., 'categories/electronic.png'
    const uploadedFileName = objectKey.split("/").pop();

    const imageURL = `https://${bucketName}.s3.amazonaws.com/${objectKey}`;

    // prepare the DynamoDB update parameters (use the table's primary key: fileName)
    const updateParams = {
      TableName: tableName,
      Key: {
        fileName: { S: uploadedFileName },
      },
      UpdateExpression: "SET imageUrl = :imageUrl",
      ExpressionAttributeValues: {
        ":imageUrl": { S: imageURL },
      },
      ConditionExpression: "attribute_exists(fileName)",
      ReturnValues: "UPDATED_NEW",
    };

    const result = await ddbClient.send(new UpdateItemCommand(updateParams));
    console.log("DynamoDB update result:", result);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Category image updated successfully",
        updatedAttributes: result.Attributes || null,
      }),
    };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.error("Item not found for update", error);
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Item not found to update",
        }),
      };
    }

    console.error("Error updating category image", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error.message || error,
      }),
    };
  }
};

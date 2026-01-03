const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const ddbClient = new DynamoDBClient({ region: "us-east-1" });

exports.confirmUpload = async (event) => {
  const bucketName = process.env.BUCKET_NAME;
  const tableName = process.env.DYNAMODB_TABLE;
  const record = event.Records[0];
  const fileName = record.s3.object.key;

  const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

  const putParams = {
    TableName: tableName,
    Item: {
      fileName: { S: fileName },
      ImageUrl: { S: imageUrl },
      UploadedAt: { S: new Date().toISOString() },
    },
  };
  try {
    await ddbClient.send(new PutItemCommand(putParams));
    console.log(`Successfully inserted record for ${fileName} into DynamoDB`);
  } catch (err) {
    console.error("Error inserting record into DynamoDB:", err);
    throw err;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Upload confirmed and record inserted." }),
  };
};

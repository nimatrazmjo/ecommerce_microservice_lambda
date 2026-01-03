const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const s3Client = new S3Client({ region: "us-east-1" });
const ddbClient = new DynamoDBClient({ region: "us-east-1" });

exports.getUploadUrl = async (event) => {
  try {
    const { fileName, fileType, categoryName } = JSON.parse(event.body);

    if (!fileName || !fileType || !categoryName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "fileName, fileType, and categoryName are required",
        }),
      };
    }

    const bucketName = process.env.BUCKET_NAME;
    const objectKey = `categories/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL valid for 1 hour
    });

    // Store metadata in DynamoDB
    const putItemCommand = new PutItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        fileName: { S: fileName },
        categoryName: { S: categoryName },
        uploadTimestamp: { S: new Date().toISOString() },
      },
    });

    await ddbClient.send(putItemCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl: signedUrl,
      }),
    };
  } catch (error) {
    console.error("Error generating signed URL", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error,
      }),
    };
  }
};

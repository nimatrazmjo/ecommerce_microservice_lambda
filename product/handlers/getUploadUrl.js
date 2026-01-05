const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const crypto = require("crypto");

const s3Client = new S3Client({ region: "us-east-1" });
const ddbClient = new DynamoDBClient({ region: "us-east-1" });

exports.getUploadUrl = async (event) => {
  try {
    const bucketName = process.env.BUCKET_NAME;
    const tableName = process.env.DYNAMODB_TABLE;

    const {
      fileName,
      fileType,
      productName,
      productPrice,
      description,
      quantity,
      category,
      email,
    } = JSON.parse(event.body);

    if (
      !fileName ||
      !fileType ||
      !productName ||
      !productPrice ||
      !description ||
      !quantity ||
      !category ||
      !email
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    const productId = crypto.randomUUID();

    const putItemCommand = new PutItemCommand({
      TableName: tableName,
      Item: {
        productId: { S: productId },
        productName: { S: productName },
        productPrice: { N: productPrice.toString() },
        description: { S: description },
        quantity: { N: quantity.toString() },
        category: { S: category },
        email: { S: email },
        isApproved: { BOOL: false },
        fileName: { S: fileName },
        createdAt: { S: new Date().toISOString() },
      },
    });

    await ddbClient.send(putItemCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl,
        productId,
      }),
    };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

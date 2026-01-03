const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({ region: "us-east-1" });

exports.getUploadUrl = async (event) => {
  try {
    const { fileName, fileType } = JSON.parse(event.body);

    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "fileName and fileType are required" }),
      };
    }

    const bucketName = process.env.BUCKET_NAME;
    const objectKey = `banners/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL valid for 1 hour
    });

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

const {
  DynamoDBClient,
  DeleteItemCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamodbClient = new DynamoDBClient({ region: "us-east-1" });
const snsClient = new SNSClient({ region: "us-east-1" });

exports.cleanCategory = async () => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;
    const snsTopicArn = process.env.SNS_TOPIC_ARN;

    // calculate the timestamp for an hour ago(to filter old items only)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // create a scan command to find categories older than one hour:
    // older than on hour uploadTimestamp attribute
    // and do not have the imageUrl attribute

    const scanParams = {
      TableName: tableName,
      FilterExpression:
        "uploadTimestamp < :oneHourAgo AND attribute_not_exists(imageUrl)",
      ExpressionAttributeValues: {
        ":oneHourAgo": { S: fiveMinutesAgo },
      },
    };

    const { Items } = await dynamodbClient.send(new ScanCommand(scanParams));

    // delete each old category without imageUrl
    if (!Items || Items.length === 0) {
      console.log("No items to delete.");
      return { statusCode: 200, body: "No items to delete." };
    }

    for (const item of Items) {
      const unmarshalled = unmarshall(item);
      const { fileName } = unmarshalled;

      const deleteParams = {
        TableName: tableName,
        Key: {
          fileName: { S: fileName },
        },
      };

      await dynamodbClient.send(new DeleteItemCommand(deleteParams));

      console.log(`Deleted category with fileName: ${fileName}`);
    }

    const snsMessage = `Cleanup completed. Deleted ${Items.length} categories without imageUrl older than one hour.`;

    // publish a message to SNS topic
    const publishParams = {
      TopicArn: snsTopicArn,
      Message: snsMessage,
      Subject: "Category Cleanup Notification",
    };

    await snsClient.send(new PublishCommand(publishParams));

    return { statusCode: 200, body: "Cleanup completed successfully." };
  } catch (error) {
    console.error("Error during cleanup:", error);
    return { statusCode: 500, body: "Error during cleanup." };
  }
};

const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const sesClient = new SESClient({ region: "us-east-1" });

eports.sendEmail = async (toAddress, orderId, productName) => {
  const emailParams = {
    Destination: {
      ToAddresses: [toAddress],
    },
    Message: {
      Body: {
        Text: {
          Data: `Thank you for your order!\n\nOrder ID: ${orderId}\nProduct: ${productName}\n\nWe will notify you once your order is shipped.`,
        },
      },
      Subject: {
        Data: "Order Confirmation",
      },
    },
    Source: "nimatullah.razmjo@gmail.com", // Replace with your verified SES email address
  };

  const sendEmailCommand = new SendEmailCommand(emailParams);
  try {
    await sesClient.send(sendEmailCommand);
    console.log(`Order confirmation email sent to ${toAddress}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

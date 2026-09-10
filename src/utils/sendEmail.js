import Mailgen from "mailgen";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";

dotenv.config();

function getSesClient() {
  const config = {
    region: process.env.AWS_REGION || "ap-south-1",
  };

  // Only supply static credentials if explicitly provided in environment (e.g. local .env).
  // In production on AWS (ECS, Fargate, EC2), credentials are automatically retrieved from the
  // IAM Task Role (rentosphere-ecs-task-role) via container metadata.
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN && {
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }),
    };
  }

  return new SESClient(config);
}

const sendEmail = async (options) => {
  const clientUrl = process.env.CLIENT_URL || "https://rentosphere.clouddrive.page";
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Rentosphere",
      link: clientUrl,
      logo: `${clientUrl}/logo.png`,
      copyright: `Copyright © ${new Date().getFullYear()} Rentosphere. All rights reserved.`,
    },
  });

  const fromEmail = process.env.SES_FROM_EMAIL || "aryanpatel8082@gmail.com";

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);
  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [options.email],
    },
    Message: {
      Subject: {
        Data: options.subject,
      },
      Body: {
        Text: {
          Data: emailTextual,
        },
        Html: {
          Data: emailHtml,
        },
      },
    },
  });

  try {
    const sesClient = getSesClient();
    await sesClient.send(command);
    console.log(`Email sent successfully to ${options.email}`);
  } catch (error) {
    console.error("Email service failed:", {
      name: error.name,
      message: error.message,
      region: process.env.AWS_REGION || "ap-south-1",
      fromEmail,
      toEmail: options.email,
    });

    if (error.name === "MessageRejected") {
      console.error(
        "SES rejected the email. If your SES account is in sandbox mode, " +
          "recipient addresses must also be verified in the SES console.",
      );
    }

    throw error;
  }
};

const contactUsSendEmail = async (options) => {
  const clientUrl = process.env.CLIENT_URL || "https://rentosphere.clouddrive.page";
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Rentosphere",
      link: clientUrl,
      logo: `${clientUrl}/logo.png`,
    },
  });

  const fromEmail = process.env.SES_FROM_EMAIL || "aryanpatel8082@gmail.com";
  const toEmail = process.env.SES_CONTACT_US_EMAIL || "aryanpatel80822@gmail.com";

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);
  const command = new SendEmailCommand({
    Source: fromEmail,
    ReplyToAddresses: options.email ? [options.email] : undefined,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: options.subject,
      },
      Body: {
        Text: {
          Data: emailTextual,
        },
        Html: {
          Data: emailHtml,
        },
      },
    },
  });

  try {
    const sesClient = getSesClient();
    await sesClient.send(command);
    console.log(`Contact email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error("Email service failed:", {
      name: error.name,
      message: error.message,
      region: process.env.AWS_REGION || "ap-south-1",
      fromEmail,
      toEmail,
    });

    if (error.name === "MessageRejected") {
      console.error(
        "SES rejected the email. If your SES account is in sandbox mode, " +
          "recipient addresses must also be verified in the SES console.",
      );
    }

    throw error;
  }
};

const emailVerificationMailgenContent = (username, otp) => {
  return {
    body: {
      name: username,

      intro: [
        "Welcome to Rentosphere! 🎉",
        "Thank you for creating an account. To complete your registration, please verify your email address using the One-Time Password (OTP) below.",
      ],

      table: {
        data: [
          {
            "Verification Code": otp,
          },
        ],
        columns: {
          customWidth: {
            "Verification Code": "200px",
          },
          customAlignment: {
            "Verification Code": "center",
          },
        },
      },

      dictionary: {
        verificationCode: otp,
      },

      outro: [
        "This verification code is valid for **5 minutes**.",
        "For your security, never share this OTP with anyone.",
        "If you did not create a Rentosphere account, you can safely ignore this email.",
      ],

      signature: "The Rentosphere Team",
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,

      intro: [
        "We received a request to reset the password for your Rentosphere account.",
      ],

      action: {
        instructions:
          "Click the button below to create a new password. This link is valid for 15 minutes.",

        button: {
          color: "#009587",
          text: "Reset Password",
          link: passwordResetUrl,
        },
      },

      outro: [
        "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
        "Need help? Simply reply to this email and we'll be happy to assist you.",
      ],

      signature: "The Rentosphere Team",
    },
  };
};

const contactUsMailgenContent = (name, email, message) => {
  return {
    body: {
      name: "Rentosphere Support Team",
      intro: [
        `You have received a new message from the Contact Us form on your website.`,
      ],
      table: {
        data: [
          {
            Name: name,
            Email: email,
            Message: message,
          },
        ],
        columns: {
          customWidth: {
            Name: "150px",
            Email: "200px",
            Message: "300px",
          },
          customAlignment: {
            Name: "left",
            Email: "left",
            Message: "left",
          },
        },
      },
      outro: [
        "Please respond to the user as soon as possible.",
      ],
      signature: "The Rentosphere Team",
    },
  };
};

export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  contactUsSendEmail,
  contactUsMailgenContent,
};

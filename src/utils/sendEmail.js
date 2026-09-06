import Mailgen from "mailgen";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";

dotenv.config();

function getSesClient() {
  return new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Rentosphere",
      link: process.env.CLIENT_URL || "https://rentosphere.in",
      logo: `${process.env.CLIENT_URL}/logo.png` || "https://rentosphere.in/logo.png",
      copyright: `Copyright © ${new Date().getFullYear()} Rentosphere. All rights reserved.`,
    },
  });

  const fromEmail = process.env.SES_FROM_EMAIL || "noreply@rentosphere.in";

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
      region: process.env.AWS_REGION,
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
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Rentosphere",
      link: process.env.CLIENT_URL || "https://rentosphere.in",
      logo: `${process.env.CLIENT_URL}/logo.png` || "https://rentosphere.in/logo.png",
    },
  });

  const fromEmail = options.email;

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);
  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [process.env.SES_CONTACT_US_EMAIL || "aryanpatel80822@gmail.com"],
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
      region: process.env.AWS_REGION,
      fromEmail: options.email,
      toEmail: process.env.SES_CONTACT_US_EMAIL || "aryanpatel8082@gmail.com",
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
}

export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  contactUsSendEmail,
  contactUsMailgenContent,
};

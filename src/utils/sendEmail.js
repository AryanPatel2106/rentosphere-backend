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

const MONTH_NAMES_LIST = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getClientUrl = () => process.env.CLIENT_URL || "https://rentosphere.clouddrive.page";
const formatCurrency = (amt) => "₹" + (Number(amt) || 0).toLocaleString("en-IN");

const sendEmailSafe = async (options) => {
  try {
    if (!options?.email) {
      console.warn("[Email Notification Skipped] No recipient email address provided");
      return;
    }
    await sendEmail(options);
  } catch (error) {
    console.warn(`[Email Notification Skipped/Failed] Could not send "${options?.subject}" to ${options?.email}:`, error?.message);
  }
};

const welcomeUserMailgenContent = (userName) => {
  const clientUrl = getClientUrl();
  return {
    body: {
      name: userName || "Valued Member",
      intro: [
        "Welcome to Rentosphere! 🎉 Your account has been successfully created.",
        "Rentosphere connects verified property owners directly with prospective tenants — completely brokerage-free with transparent listings and instant digital agreements.",
      ],
      action: {
        instructions: "Start browsing verified rental listings across top cities:",
        button: {
          color: "#009587",
          text: "Explore Verified Properties",
          link: `${clientUrl}/search`,
        },
      },
      outro: [
        "Have a home or flat to rent out? You can post your property for free anytime from your dashboard.",
        "If you ever have questions or feedback, reach out to our team at support@rentosphere.com.",
      ],
      signature: "The Rentosphere Team",
    },
  };
};

const passwordChangedMailgenContent = (userName) => {
  return {
    body: {
      name: userName || "Valued Member",
      intro: [
        "Security Alert: The password for your Rentosphere account was recently updated.",
      ],
      table: {
        data: [
          {
            "Event": "Password Changed",
            "Date & Time": new Date().toUTCString(),
            "Status": "Successful",
          },
        ],
      },
      outro: [
        "If you performed this action, no further steps are needed.",
        "IMPORTANT: If you did NOT change your password, please reset your password immediately or contact our security team at support@rentosphere.com.",
      ],
      signature: "Rentosphere Security Team",
    },
  };
};

const emailChangedMailgenContent = (userName, newEmail) => {
  return {
    body: {
      name: userName || "Valued Member",
      intro: [
        "Security Notice: The primary email address for your Rentosphere account has been successfully updated.",
      ],
      table: {
        data: [
          {
            "New Primary Email": newEmail,
            "Updated At": new Date().toUTCString(),
          },
        ],
      },
      outro: [
        "Future account notifications, rent receipts, and tenancy alerts will be sent to this email address.",
        "If you did not authorize this change, please contact us immediately at support@rentosphere.com.",
      ],
      signature: "Rentosphere Security Team",
    },
  };
};

const propertyPublishedMailgenContent = (ownerName, property) => {
  const clientUrl = getClientUrl();
  const localityName = property.locality?.text || property.locality?.label || "Verified Location";
  const propertyUrl = `${clientUrl}/property/${property._id}`;
  return {
    body: {
      name: ownerName || "Property Owner",
      intro: [
        `Your property "${property.title}" has been successfully published and is now live on Rentosphere! 🏡`,
      ],
      table: {
        data: [
          {
            "Property": property.title,
            "Location": localityName,
            "Monthly Rent": formatCurrency(property.rent),
            "Security Deposit": formatCurrency(property.deposit),
            "Configuration": `${property.BHKType || "Apartment"} • ${property.Furnishing || "Unfurnished"}`,
          },
        ],
      },
      action: {
        instructions: "View your live listing or manage tenant applications from your dashboard:",
        button: {
          color: "#009587",
          text: "View Live Listing",
          link: propertyUrl,
        },
      },
      outro: [
        "Verified prospective tenants can now discover your property and send direct rental applications with zero brokerage.",
      ],
      signature: "The Rentosphere Team",
    },
  };
};

const newRentalApplicationMailgenContent = (ownerName, property, tenant, request) => {
  const clientUrl = getClientUrl();
  const moveIn = request.moveInDate
    ? new Date(request.moveInDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Flexible";
  return {
    body: {
      name: ownerName || "Property Owner",
      intro: [
        `You have received a new rental application for your listing "${property.title}"! 📋`,
      ],
      table: {
        data: [
          {
            "Applicant Name": tenant?.fullName || "Prospective Tenant",
            "Contact Email": tenant?.email || "—",
            "Contact Phone": tenant?.mobileNumber || "—",
            "Preferred Move-in": moveIn,
            "Applicant Note": request.message || "Interested in renting",
          },
        ],
      },
      action: {
        instructions: "Review this application and accept or decline directly in your landlord portal:",
        button: {
          color: "#009587",
          text: "Review Application in Dashboard",
          link: `${clientUrl}/profile?tab=interested`,
        },
      },
      outro: [
        "Accepting the application will automatically mark the property as booked, notify the tenant, and initiate digital tenancy management.",
      ],
      signature: "The Rentosphere Team",
    },
  };
};

const rentalApplicationAcceptedMailgenContent = (tenantName, property, owner, request) => {
  const clientUrl = getClientUrl();
  return {
    body: {
      name: tenantName || "Tenant",
      intro: [
        `Congratulations! 🎉 Your rental application for "${property.title}" has been accepted by the owner!`,
        "The property has been officially booked for you.",
      ],
      table: {
        data: [
          {
            "Property": property.title,
            "Landlord Name": owner?.fullName || "Property Owner",
            "Landlord Phone": owner?.mobileNumber || "—",
            "Landlord Email": owner?.email || "—",
            "Monthly Rent": formatCurrency(request?.monthlyRent || property.rent),
            "Security Deposit": formatCurrency(request?.deposit || property.deposit),
          },
        ],
      },
      action: {
        instructions: "Access your tenancy portal to view agreement details and pay rent securely online:",
        button: {
          color: "#009587",
          text: "View Tenancy & Pay Rent",
          link: `${clientUrl}/profile?tab=payments`,
        },
      },
      outro: [
        "Feel free to connect directly with the landlord using the contact details provided above to coordinate keys and move-in logistics.",
      ],
      signature: "The Rentosphere Team",
    },
  };
};

const rentalApplicationRejectedMailgenContent = (tenantName, property) => {
  const clientUrl = getClientUrl();
  return {
    body: {
      name: tenantName || "Valued Member",
      intro: [
        `Thank you for your interest in "${property.title}".`,
        "We are writing to let you know that the property owner has selected another applicant or the listing is no longer available.",
      ],
      action: {
        instructions: "There are hundreds of other verified, zero-brokerage listings available right now:",
        button: {
          color: "#009587",
          text: "Browse Similar Properties",
          link: `${clientUrl}/search`,
        },
      },
      outro: [
        "New properties are listed every day on Rentosphere. Save your favorite searches to be alerted when matching homes become available.",
      ],
      signature: "The Rentosphere Team",
    },
  };
};

const rentPaymentReceiptMailgenContent = (tenantName, property, payment, owner) => {
  const clientUrl = getClientUrl();
  const monthName = MONTH_NAMES_LIST[payment.month - 1] || `Month ${payment.month}`;
  return {
    body: {
      name: tenantName || "Tenant",
      intro: [
        `Rent Payment Receipt: Your payment of ${formatCurrency(payment.amount)} has been successfully recorded! 🧾`,
        "This digital receipt confirms your rent payment for your tenancy records and HRA tax exemption claims.",
      ],
      table: {
        data: [
          {
            "Receipt Period": `${monthName} ${payment.year}`,
            "Amount Paid": formatCurrency(payment.amount),
            "Property": property.title || "Rental Property",
            "Payment Method": (payment.method || "Online").toUpperCase(),
            "Transaction Ref": payment.transactionId || "—",
            "Payment Date": new Date(payment.paidAt || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            "Landlord": owner?.fullName || "Property Owner",
          },
        ],
      },
      action: {
        instructions: "View your full rent payment history and HRA receipts anytime:",
        button: {
          color: "#009587",
          text: "View Payment Records",
          link: `${clientUrl}/profile?tab=payments`,
        },
      },
      outro: [
        "Thank you for being a valued resident on Rentosphere.",
      ],
      signature: "The Rentosphere Billing Team",
    },
  };
};

const rentPaymentReceivedMailgenContent = (ownerName, property, payment, tenant) => {
  const clientUrl = getClientUrl();
  const monthName = MONTH_NAMES_LIST[payment.month - 1] || `Month ${payment.month}`;
  return {
    body: {
      name: ownerName || "Property Owner",
      intro: [
        `Rent Payment Notice: A rent payment of ${formatCurrency(payment.amount)} has been received for your property "${property.title}". 💰`,
      ],
      table: {
        data: [
          {
            "Tenant Name": tenant?.fullName || "Tenant",
            "Rent Period": `${monthName} ${payment.year}`,
            "Amount": formatCurrency(payment.amount),
            "Payment Mode": (payment.method || "Online").toUpperCase(),
            "Transaction Ref": payment.transactionId || "—",
            "Date": new Date(payment.paidAt || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          },
        ],
      },
      action: {
        instructions: "Track your rental income and active tenancies in your landlord dashboard:",
        button: {
          color: "#009587",
          text: "View Active Tenancies",
          link: `${clientUrl}/profile?tab=rented`,
        },
      },
      outro: [
        "Your payment records are automatically maintained for your financial and tax tracking.",
      ],
      signature: "The Rentosphere Team",
    },
  };
};

const leaseEndedMailgenContent = (recipientName, property, isOwner) => {
  const clientUrl = getClientUrl();
  return {
    body: {
      name: recipientName || "Valued Member",
      intro: [
        isOwner
          ? `The tenancy for "${property.title}" has been marked as concluded. 🏠`
          : `Your lease agreement for "${property.title}" has come to an end. 🏠`,
      ],
      table: {
        data: [
          {
            "Property": property.title,
            "Status": isOwner ? "Re-listed (Active)" : "Completed",
            "Concluded At": new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          },
        ],
      },
      action: {
        instructions: isOwner
          ? "Your property is now active and visible to new tenants on Rentosphere:"
          : "Looking for your next home? Explore verified rental properties with zero brokerage:",
        button: {
          color: "#009587",
          text: isOwner ? "Manage Listed Property" : "Find Your Next Home",
          link: isOwner ? `${clientUrl}/profile?tab=properties` : `${clientUrl}/search`,
        },
      },
      outro: [
        "Thank you for choosing Rentosphere for your rental journey.",
      ],
      signature: "The Rentosphere Team",
    },
  };
};

export {
  sendEmail,
  sendEmailSafe,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  contactUsSendEmail,
  contactUsMailgenContent,
  welcomeUserMailgenContent,
  passwordChangedMailgenContent,
  emailChangedMailgenContent,
  propertyPublishedMailgenContent,
  newRentalApplicationMailgenContent,
  rentalApplicationAcceptedMailgenContent,
  rentalApplicationRejectedMailgenContent,
  rentPaymentReceiptMailgenContent,
  rentPaymentReceivedMailgenContent,
  leaseEndedMailgenContent,
};


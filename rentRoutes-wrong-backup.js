
const fs = require("fs");
const path = require("path");

const file = path.join(
  process.cwd(),
  "server",
  "routes",
  "rentRoutes.js"
);

if (!fs.existsSync(file)) {
  console.error("rentRoutes.js not found. Run from C-Mart root.");
  process.exit(1);
}

let code = fs.readFileSync(file, "utf8");

if (code.includes("const notifyRent = async")) {
  console.log("Rent notifications already installed.");
  process.exit(0);
}

const original = code;

function replaceRequired(source, pattern, replacement, name) {
  if (!pattern.test(source)) {
    throw new Error("Cannot find: " + name);
  }
  return source.replace(pattern, replacement);
}

// Import Notification model
code = replaceRequired(
  code,
  /const User = require\(["']\.\.\/models\/User["']\);/,
  '$&\nconst Notification = require("../models/Notification");',
  "User import"
);

// Notification helpers
const helpers = `
const notifyRent = async ({
  recipient,
  sender,
  title,
  message,
}) => {
  try {
    const id = (value) =>
      String(value?._id || value?.id || value || "");

    if (!recipient || !sender || id(recipient) === id(sender)) {
      return;
    }

    await Notification.create({
      recipient: id(recipient),
      sender: id(sender),
      type: "rent",
      title,
      message,
      link: "/rent",
      isRead: false,
    });

    console.log("Rent notification created:", title);
  } catch (error) {
    console.error("Rent notification error:", error.message);
  }
};

const notifyRentOther = async (
  request,
  sender,
  title,
  message
) => {
  const id = (value) =>
    String(value?._id || value?.id || value || "");

  const recipient =
    id(request.ownerId) === id(sender)
      ? request.renterId
      : request.ownerId;

  await notifyRent({
    recipient,
    sender,
    title,
    message,
  });
};
`;

code = replaceRequired(
  code,
  /const router = express\.Router\(\);/,
  "$&\n" + helpers,
  "router declaration"
);

// Add notifications after successful rental operations
function addToRoute(route, notification, options = {}) {
  const marker = `"${route}"`;

  const createMatch = options.create
    ? /router\.post\(\s*"\/requests"/.exec(code)
    : null;

  const begin = options.create
    ? createMatch
      ? createMatch.index + createMatch[0].indexOf(marker)
      : -1
    : code.indexOf(marker);

  if (begin < 0) {
    throw new Error("Route missing: " + route);
  }

  const next = code.indexOf("router.", begin + marker.length);
  const end = next < 0 ? code.length : next;

  let section = code.slice(begin, end);

  const saves = (
    section.match(/await request\.save\(\);/g) || []
  ).length;

  if (options.create) {
    section = replaceRequired(
      section,
      /(?=return res\.status\(201\)\.json\()/,
      notification + "\n    ",
      "Rent request creation response"
    );
  } else if (Array.isArray(notification)) {
    if (saves !== notification.length) {
      throw new Error("Unexpected saves in " + route);
    }

    let index = 0;

    section = section.replace(
      /await request\.save\(\);/g,
      (match) => match + "\n      " + notification[index++]
    );
  } else {
    if (saves !== 1) {
      throw new Error("Unexpected saves in " + route);
    }

    section = section.replace(
      "await request.save();",
      "await request.save();\n      " + notification
    );
  }

  code = code.slice(0, begin) + section + code.slice(end);
}

// 1. New rental request
addToRoute(
  "/requests",
  `await notifyRent({
    recipient: request.ownerId,
    sender: req.rentUserId,
    title: "New Rent Request",
    message: \`A student requested to rent \${product.name}.\`,
  });`,
  { create: true }
);

// 2. Request accepted or rejected
addToRoute(
  "/requests/:id/status",
  `await notifyRent({
    recipient: request.renterId,
    sender: req.rentUserId,
    title: status === "Accepted"
      ? "Rent Request Accepted"
      : "Rent Request Rejected",
    message: status === "Accepted"
      ? "Your rental request was accepted."
      : "Your rental request was rejected.",
  });`
);

// 3. Meeting scheduled
addToRoute(
  "/requests/:id/meetpoint",
  `await notifyRentOther(
    request,
    req.rentUserId,
    "Rental Meet Point Scheduled",
    \`Meeting location: \${request.meetPoint}. Check the Rent page.\`
  );`
);

// 4. Meeting confirmed
addToRoute(
  "/requests/:id/confirm-meet",
  `await notifyRentOther(
    request,
    req.rentUserId,
    "Rental Meeting Confirmation",
    request.meetStatus === "Confirmed"
      ? "Both students confirmed the meeting."
      : "The other student confirmed the meeting."
  );`
);

// 5. Payment settings
addToRoute(
  "/requests/:id/payment-settings",
  `await notifyRent({
    recipient: request.renterId,
    sender: req.rentUserId,
    title: "Rental Payment Settings",
    message: request.paymentRequired
      ? \`Owner selected \${request.paymentMethod} payment.\`
      : "Owner confirmed no payment verification is required.",
  });`
);

// 6. Payment proof submitted
addToRoute(
  "/requests/:id/payment-proof",
  `await notifyRent({
    recipient: request.ownerId,
    sender: req.rentUserId,
    title: "Rental Payment Proof Submitted",
    message: "Renter submitted UPI payment proof. Please verify it.",
  });`
);

// 7. Cash and UPI payment verification
addToRoute(
  "/requests/:id/verify-payment",
  [
    `await notifyRent({
      recipient: request.renterId,
      sender: req.rentUserId,
      title: "Rental Payment Verified",
      message: "Owner confirmed receipt of rental cash payment.",
    });`,

    `await notifyRent({
      recipient: request.renterId,
      sender: req.rentUserId,
      title: decision === "Verified"
        ? "Rental Payment Verified"
        : "Rental Payment Rejected",
      message: decision === "Verified"
        ? "Your UPI payment was verified."
        : "Your UPI payment proof was rejected.",
    });`
  ]
);

// 8. Order confirmed
addToRoute(
  "/requests/:id/confirm-order",
  `await notifyRentOther(
    request,
    req.rentUserId,
    "Rental Order Confirmed",
    "The rental order has been confirmed."
  );`
);

// 9. Handover confirmed
addToRoute(
  "/requests/:id/confirm-handover",
  `await notifyRentOther(
    request,
    req.rentUserId,
    request.status === "Active"
      ? "Rental Handover Completed"
      : "Rental Handover Confirmation",
    request.status === "Active"
      ? "Both students confirmed product handover."
      : "The other student confirmed product handover."
  );`
);

// 10. Product return scheduled
addToRoute(
  "/requests/:id/return-schedule",
  `await notifyRent({
    recipient: request.renterId,
    sender: req.rentUserId,
    title: "Rental Return Scheduled",
    message: \`Owner scheduled product return at \${request.returnMeetPoint}. Please confirm the schedule.\`,
  });`
);

// 11. Return schedule confirmed
addToRoute(
  "/requests/:id/confirm-return-schedule",
  `await notifyRentOther(
    request,
    req.rentUserId,
    "Rental Return Schedule Confirmation",
    request.returnStatus === "Confirmed"
      ? "Both students confirmed the return schedule."
      : "The other student confirmed the return schedule."
  );`
);

// 12. Actual product return confirmed
addToRoute(
  "/requests/:id/confirm-return",
  `await notifyRentOther(
    request,
    req.rentUserId,
    request.status === "Completed"
      ? "Rental Completed"
      : "Rental Return Confirmation",
    request.status === "Completed"
      ? "Product return confirmed by both students. Rental completed!"
      : "The other student confirmed product return."
  );`
);

// Backup and save complete updated route file
const backup = file + ".before-notifications.bak";

fs.writeFileSync(backup, original);
fs.writeFileSync(file, code);

console.log("SUCCESS: Rent notifications added!");
console.log("Updated:", file);
console.log("Backup:", backup);
console.log("Next: node --check server/routes/rentRoutes.js");

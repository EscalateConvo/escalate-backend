import admin from "firebase-admin";
import path from "path";
import fs from "fs";

let firebaseServiceAccount: admin.ServiceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  firebaseServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const serviceAccountPath = path.join(
    __dirname,
    "../../etc/secrets/firebase-service-account-key.json",
  );
  if (fs.existsSync(serviceAccountPath)) {
    firebaseServiceAccount = require(serviceAccountPath);
  } else {
    throw new Error(
      "Firebase service account credentials not found. Set FIREBASE_SERVICE_ACCOUNT env variable or provide the JSON file.",
    );
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseServiceAccount),
    storageBucket: "weather-app-370012.firebasestorage.app",
  });
}

export { admin };

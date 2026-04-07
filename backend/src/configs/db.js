import mongoose from "mongoose";
import path from "path";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      tlsCertificateKeyFile: path.resolve(process.env.CERT_PATH),
    });

    console.log("MongoDB Atlas connected (X.509)");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;

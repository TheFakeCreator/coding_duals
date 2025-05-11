// server/config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB Connected");
      break;
    } catch (err) {
      console.error(err.message);
      retries -= 1;
      console.log(`Retries left: ${retries}`);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
  if (!retries) {
    console.error("Failed to connect to MongoDB after retries");
    process.exit(1);
  }
};

export default connectDB;

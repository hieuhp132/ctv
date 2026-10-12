const mongoose = require("mongoose");

module.exports = async () => {
  try {
    console.log("debug:", process.env.MONGO_URI);

    mongoose.set("bufferCommands", false); // ? tránh l?i m?p m?

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log("? MongoDB connected");
  } catch (err) {
    console.error("? MongoDB connection error:", err.message);
    throw err;
  }
};

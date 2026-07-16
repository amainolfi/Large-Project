import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication token required." });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired authentication token." });
  }
}

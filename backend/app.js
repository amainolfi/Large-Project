import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import goalsRoutes from "./routes/goalsRoutes.js";
import presetFoodRoutes from "./routes/presetFoodRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // Optional browser-based development client
  "http://localhost:8081",
  "http://127.0.0.1:8081"
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS."));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "MacroVanta API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/preset-foods", presetFoodRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

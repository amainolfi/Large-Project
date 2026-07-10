import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Message from "../components/Message";
import { verifyEmail } from "../lib/api";

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("Verifying your email…");
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) {
      return;
    }

    requested.current = true;

    verifyEmail(token)
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Verification failed.");
      });
  }, [token]);

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <h1>Email verification</h1>
        {status === "pending" && <p>{message}</p>}
        {status === "success" && <Message kind="success">{message}</Message>}
        {status === "error" && <Message kind="error">{message}</Message>}
        <div className="auth-links">
          <Link to="/">Go to login</Link>
        </div>
      </div>
    </div>
  );
}

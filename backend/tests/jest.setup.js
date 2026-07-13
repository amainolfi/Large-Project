process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";

// Make sure no SMTP config leaks in from a local .env — emails must be
// skipped (logged) during tests, never sent.
delete process.env.EMAIL_HOST;
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;

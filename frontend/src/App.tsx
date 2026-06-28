import { useEffect, useState } from "react";

function App() {
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage("Could not connect to API"));
  }, []);

  return (
    <main style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Macro Tracker</h1>
      <p>{apiMessage}</p>
    </main>
  );
}

export default App;
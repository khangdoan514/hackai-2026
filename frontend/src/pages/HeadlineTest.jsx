import { useState } from "react";

export default function HeadlineTest() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const sendPrompt = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      setResponse("Error talking to backend.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f0f0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}
    >
      <h1 style={{ color: "white", marginBottom: "20px" }}>Prompt Tester</h1>

      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "700px",
          gap: "10px"
        }}
      >
        <input
          type="text"
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendPrompt();
          }}
          style={{
            flex: 1,
            padding: "14px 16px",
            fontSize: "16px",
            borderRadius: "999px",
            border: "1px solid #333",
            outline: "none",
            backgroundColor: "#1e1e1e",
            color: "white"
          }}
        />

        <button
          onClick={sendPrompt}
          disabled={loading}
          style={{
            padding: "14px 20px",
            fontSize: "16px",
            borderRadius: "999px",
            border: "none",
            backgroundColor: loading ? "#555" : "#2563eb",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>

      <div
        style={{
          marginTop: "30px",
          width: "100%",
          maxWidth: "700px",
          minHeight: "120px",
          backgroundColor: "#1a1a1a",
          color: "white",
          padding: "20px",
          borderRadius: "16px",
          border: "1px solid #333",
          whiteSpace: "pre-wrap"
        }}
      >
        {response || "Response will show here..."}
      </div>
    </div>
  );
}
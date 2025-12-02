import { useState } from "react";

// ------------------ ENTITY COLORS ------------------
const ENTITY_COLORS = {
  "[NAME]": "bg-blue-200/50 text-blue-800/70",
  "[LOCATION]": "bg-green-200/50 text-green-800/70",
  "[EMAIL]": "bg-purple-200/50 text-purple-800/70",
  "[PHONE]": "bg-pink-200/50 text-pink-800/70",
  "[CARD_NUMBER]": "bg-red-200/50 text-red-800/70",
  "[NATIONAL_ID]": "bg-yellow-200/50 text-yellow-800/70",
  "[DOB]": "bg-indigo-200/50 text-indigo-800/70",
  "[IP_ADDRESS]": "bg-gray-200/50 text-gray-800/70",
  "[DATE]": "bg-teal-200/50 text-teal-800/70",
  "[TIME]" : "bg-teal-200/50 text-teal-800/70",
  "[URL]": "bg-orange-200/50 text-orange-800/70",
};

// ------------------ LEVENSHTEIN FUNCTIONS ------------------
function levenshteinDistance(s1, s2) {
  const n = s1.length;
  const m = s2.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,        
        dp[i][j - 1] + 1,        
        dp[i - 1][j - 1] + cost  
      );
    }
  }
  return dp[n][m];
}

function levenshteinSimilarity(s1, s2) {
  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  return 1 - dist / maxLen;
}

// ------------------ HIGHLIGHT FUNCTION ------------------
const highlightEntities = (text) =>
  text.split(/(\[.*?\])/g).map((el, idx) => {
    if (ENTITY_COLORS[el]) {
      return (
        <span key={idx} className={`px-1 py-0.5 rounded ${ENTITY_COLORS[el]}`}>
          {el}
        </span>
      );
    }
    return <span key={idx}>{el}</span>;
  });

// ------------------ MAIN COMPONENT ------------------
export default function TextToolsPage() {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [redactionResponse, setRedactionResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redactionMode, setRedactionMode] = useState("placeholder"); // <-- New state

  const handleRedact = async () => {
    if (!inputText && !selectedFile) return alert("Enter text or upload a file");
    setLoading(true);
    const formData = new FormData();
    if (inputText) formData.append("text", inputText);
    if (selectedFile) formData.append("file", selectedFile);
    formData.append("mode", redactionMode); // send mode to backend

    try {
      const res = await fetch("http://127.0.0.1:8000/redact", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      // Normalize placeholders
      if (data.redacted) {
        data.redacted = data.redacted.replace(/\[CREDIT_CARD\]/g, "[CARD_NUMBER]");
        data.redacted = data.redacted.replace(/\[LOCATION\]/g, "[LOCATION]");
      }
      setRedactionResponse(data);
    } catch (err) {
      alert("Backend not running!");
    }
    setLoading(false);
  };

  const [originalText, setOriginalText] = useState("");
  const [redactedText, setRedactedText] = useState("");
  const [similarity, setSimilarity] = useState(null);

  const handleCalculateAccuracy = () => {
    if (!originalText || !redactedText) return alert("Enter both original and redacted text");
    const sim = levenshteinSimilarity(originalText, redactedText);
    setSimilarity((sim * 100).toFixed(2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-50 flex flex-col items-center justify-start p-6 space-y-16">

      {/* ---------------- Text Redaction Tool ---------------- */}
      <div className="w-full max-w-5xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-purple-200">
        <h1 className="text-3xl font-extrabold text-purple-700 mb-6 text-center animate-pulse">
          🔒 Text Redaction Tool
        </h1>

        <textarea
          rows={6}
          className="w-full p-4 mb-4 rounded-xl border-2 border-purple-300 focus:border-purple-500 focus:ring focus:ring-purple-200 outline-none text-gray-800 font-medium"
          placeholder="Enter text here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          className="mb-4 text-gray-700"
        />

        {/* ---------------- Mode Selector ---------------- */}
        <div className="mb-4 flex items-center space-x-4">
          <label className="font-semibold text-gray-700">Redaction Mode:</label>
          <select
            className="p-2 rounded border border-gray-300 focus:ring focus:ring-purple-200"
            value={redactionMode}
            onChange={(e) => setRedactionMode(e.target.value)}
          >
            <option value="placeholder">With Placeholder</option>
            <option value="empty">Empty Fields</option>
          </select>
        </div>

        <button
          onClick={handleRedact}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
            loading
              ? "bg-purple-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-purple-500/50"
          }`}
        >
          {loading ? "Processing..." : "Redact"}
        </button>

        {redactionResponse && (
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-xl shadow-md bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-400">
              <h2 className="font-bold text-purple-700 mb-2">Original Text</h2>
              <pre className="whitespace-pre-wrap">{redactionResponse.original}</pre>
            </div>
            <div className="p-4 rounded-xl shadow-md bg-gradient-to-r from-pink-50 to-pink-100 border-l-4 border-pink-400">
              <h2 className="font-bold text-pink-700 mb-2">Redacted Text</h2>
              <pre className="whitespace-pre-wrap">{highlightEntities(redactionResponse.redacted)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- Accuracy Evaluation Tool ---------------- */}
      <div className="w-full max-w-5xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-teal-200">
        <h1 className="text-3xl font-extrabold text-teal-700 mb-6 text-center animate-pulse">
          📊 Accuracy Evaluation Tool
        </h1>

        <textarea
          rows={4}
          className="w-full p-4 mb-4 rounded-xl border-2 border-teal-300 focus:border-teal-500 focus:ring focus:ring-teal-200 outline-none text-gray-800 font-medium"
          placeholder="Enter original text..."
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
        />

        <textarea
          rows={4}
          className="w-full p-4 mb-4 rounded-xl border-2 border-teal-300 focus:border-teal-500 focus:ring focus:ring-teal-200 outline-none text-gray-800 font-medium"
          placeholder="Enter redacted text..."
          value={redactedText}
          onChange={(e) => setRedactedText(e.target.value)}
        />

        <button
          onClick={handleCalculateAccuracy}
          className="w-full py-3 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-teal-500/50 transition-all"
        >
          Calculate Accuracy
        </button>

        {similarity !== null && (
          <div className="mt-4 text-center p-4 rounded-xl bg-teal-50 border-l-4 border-teal-400 text-teal-800 font-semibold text-lg">
            🔹 Detection Accuracy: {similarity}%
          </div>
        )}
      </div>

      {/* ---------------- Entity Table ---------------- */}
      {redactionResponse && redactionResponse.entities && redactionResponse.entities.length > 0 && (
        <div className="w-full max-w-5xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-indigo-200 mt-8">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center">
            🗂 Detected Entities
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-indigo-300">
              <thead>
                <tr className="bg-indigo-100">
                  <th className="border border-indigo-300 px-4 py-2 text-left">Entity Name</th>
                  <th className="border border-indigo-300 px-4 py-2 text-left">Extracted Text</th>
                  <th className="border border-indigo-300 px-4 py-2 text-left">Start Index</th>
                  <th className="border border-indigo-300 px-4 py-2 text-left">End Index</th>
                </tr>
              </thead>
              <tbody>
                {redactionResponse.entities.map((ent, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50">
                    <td className="border border-indigo-300 px-4 py-2">{ent.entity}</td>
                    <td className="border border-indigo-300 px-4 py-2">{ent.text}</td>
                    <td className="border border-indigo-300 px-4 py-2">{ent.start}</td>
                    <td className="border border-indigo-300 px-4 py-2">{ent.end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

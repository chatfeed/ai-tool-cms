"use client";

import { useMemo, useState } from "react";
import { Clipboard, Loader2, Wand2 } from "lucide-react";

export default function ToolRunner({ tool, preview = false }) {
  const initialValues = useMemo(() => {
    return Object.fromEntries(tool.fields.map((field) => [field.key, field.defaultValue || ""]));
  }, [tool.fields]);
  const [values, setValues] = useState(initialValues);
  const [result, setResult] = useState("");
  const [meta, setMeta] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/run-tool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: tool.slug, values, preview })
    });

    const payload = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(payload.error || "The tool could not run.");
      return;
    }

    setResult(payload.result);
    setMeta({
      provider: payload.provider,
      durationMs: payload.durationMs
    });
  }

  function updateValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function copyResult() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="tool-layout">
      <section className="panel pad">
        <h2>Generate result</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          {tool.fields.map((field) => (
            <Field key={field.key} field={field} value={values[field.key] || ""} onChange={updateValue} />
          ))}
          {error ? <p className="error">{error}</p> : null}
          <button className="btn primary" disabled={isLoading} type="submit">
            {isLoading ? <Loader2 size={17} /> : <Wand2 size={17} />}
            {isLoading ? "Generating..." : "Generate"}
          </button>
        </form>
      </section>

      <aside className="panel pad">
        <div className="panel-head">
          <h2>Result</h2>
          {meta ? <span className="tag">{meta.provider} · {meta.durationMs}ms</span> : null}
        </div>
        <div className="result-box">{result || "Your generated output will appear here."}</div>
        {result && tool.result?.copyable ? (
          <div className="actions">
            <button className="btn" type="button" onClick={copyResult}>
              <Clipboard size={17} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function Field({ field, value, onChange }) {
  const common = {
    id: field.key,
    name: field.key,
    required: field.required,
    placeholder: field.placeholder || "",
    value,
    onChange: (event) => onChange(field.key, event.target.value)
  };

  return (
    <div className="field">
      <label htmlFor={field.key}>{field.label}</label>
      {field.type === "textarea" ? (
        <textarea className="input" {...common} />
      ) : field.type === "select" ? (
        <select className="input" {...common}>
          <option value="" disabled>Select an option</option>
          {(field.options || []).map((option) => (
            <option value={option} key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          className="input"
          type={field.type || "text"}
          min={field.min}
          max={field.max}
          {...common}
        />
      )}
      {field.help ? <small>{field.help}</small> : null}
    </div>
  );
}

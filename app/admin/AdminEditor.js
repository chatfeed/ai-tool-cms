"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Copy,
  Eye,
  FilePlus2,
  GripVertical,
  Plus,
  Save,
  ShieldCheck,
  ShieldAlert,
  Trash2
} from "lucide-react";

const fieldTypes = ["text", "textarea", "select", "number"];
const resultFormats = ["text", "list", "markdown", "json"];
const models = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"];

export default function AdminEditor({ authEnabled, initialTools, initialRuns }) {
  const [tools, setTools] = useState(initialTools);
  const [runs, setRuns] = useState(initialRuns);
  const [selectedId, setSelectedId] = useState(initialTools[0]?.id);
  const [activeTab, setActiveTab] = useState("page");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedTool = useMemo(() => {
    return tools.find((tool) => tool.id === selectedId) || tools[0];
  }, [selectedId, tools]);

  const selectedRuns = runs.filter((run) => run.toolId === selectedTool?.id);

  function updateSelected(nextTool) {
    setTools((current) => current.map((tool) => (tool.id === selectedTool.id ? nextTool : tool)));
  }

  function updateField(path, value) {
    const nextTool = structuredClone(selectedTool);
    setDeepValue(nextTool, path, value);
    updateSelected(nextTool);
  }

  function createTool() {
    const id = crypto.randomUUID();
    const tool = createBlankTool(id, uniqueSlug("new-ai-tool", tools));
    setTools((current) => [tool, ...current]);
    setSelectedId(id);
    setActiveTab("page");
    setMessage("New draft tool created. Fill it in, then save.");
  }

  function duplicateTool() {
    const id = crypto.randomUUID();
    const copy = structuredClone(selectedTool);
    copy.id = id;
    copy.status = "draft";
    copy.name = `${copy.name} Copy`;
    copy.slug = uniqueSlug(`${copy.slug}-copy`, tools);
    setTools((current) => [copy, ...current]);
    setSelectedId(id);
    setMessage("Draft copy created.");
  }

  function deleteTool() {
    if (tools.length === 1) {
      setError("Keep at least one tool in the CMS.");
      return;
    }

    const nextTools = tools.filter((tool) => tool.id !== selectedTool.id);
    setTools(nextTools);
    setSelectedId(nextTools[0]?.id);
    setMessage("Tool removed locally. Save to persist the change.");
  }

  async function saveTools() {
    setIsSaving(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/admin/tools", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tools })
    });

    const payload = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setError(payload.error || "Could not save tools.");
      return;
    }

    setMessage("Saved. Published pages now use the updated configuration.");
  }

  async function refreshRuns() {
    const response = await fetch("/api/admin/runs");
    const payload = await response.json();
    setRuns(payload.runs || []);
  }

  if (!selectedTool) {
    return <p>No tools found.</p>;
  }

  return (
    <div className="admin-layout">
      <aside className="panel sidebar">
        <button className="btn primary" type="button" onClick={createTool} style={{ width: "100%", marginBottom: 12 }}>
          <FilePlus2 size={17} />
          New tool
        </button>
        {tools.map((tool) => (
          <button
            className="btn ghost"
            key={tool.id}
            type="button"
            onClick={() => setSelectedId(tool.id)}
            style={{ width: "100%", justifyContent: "flex-start", marginBottom: 8, background: tool.id === selectedTool.id ? "var(--soft)" : "transparent" }}
          >
            <span className={`status-dot ${tool.status}`} />
            {tool.name}
          </button>
        ))}
      </aside>

      <section className="editor">
        <div className="panel pad">
          <div className="actions admin-head">
            <div>
              <p className="eyebrow">Tool page CMS</p>
              <h1 className="admin-title">{selectedTool.name}</h1>
              <p className="muted-line">/{selectedTool.slug} · {selectedTool.status}</p>
            </div>
            <div className="actions" style={{ marginTop: 0 }}>
              <button className="btn" type="button" onClick={duplicateTool}>
                <Copy size={17} />
                Duplicate
              </button>
              <Link className="btn" href={`/${selectedTool.slug}?preview=1`} target="_blank">
                <Eye size={17} />
                Preview
              </Link>
              <button className="btn primary" type="button" onClick={saveTools} disabled={isSaving}>
                <Save size={17} />
                {isSaving ? "Saving..." : "Save"}
              </button>
              {authEnabled ? (
                <form action="/api/admin/logout" method="post">
                  <button className="btn" type="submit">Logout</button>
                </form>
              ) : null}
            </div>
          </div>
          <p className={authEnabled ? "notice success" : "notice warn"}>
            {authEnabled ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            {authEnabled
              ? "Admin password protection is enabled."
              : "Admin password protection is disabled. Set ADMIN_PASSWORD before deployment."}
          </p>
          {message ? <p className="notice">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
          <div className="tabs" role="tablist">
            {[
              ["page", "Page"],
              ["form", "Form"],
              ["prompt", "Prompt"],
              ["seo", "SEO Blocks"],
              ["runs", "Runs"]
            ].map(([key, label]) => (
              <button className={activeTab === key ? "active" : ""} key={key} type="button" onClick={() => setActiveTab(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "page" ? (
          <PagePanel tool={selectedTool} updateField={updateField} deleteTool={deleteTool} />
        ) : null}
        {activeTab === "form" ? (
          <FormPanel tool={selectedTool} updateField={updateField} />
        ) : null}
        {activeTab === "prompt" ? (
          <PromptPanel tool={selectedTool} updateField={updateField} />
        ) : null}
        {activeTab === "seo" ? (
          <SeoPanel tool={selectedTool} updateField={updateField} />
        ) : null}
        {activeTab === "runs" ? (
          <RunsPanel runs={selectedRuns} refreshRuns={refreshRuns} />
        ) : null}
      </section>
    </div>
  );
}

function PagePanel({ tool, updateField, deleteTool }) {
  return (
    <EditorPanel title="Page Settings">
      <TextInput label="Name" value={tool.name} onChange={(value) => updateField(["name"], value)} />
      <TextInput label="Slug" value={tool.slug} onChange={(value) => updateField(["slug"], slugify(value))} />
      <TextInput label="Category" value={tool.category} onChange={(value) => updateField(["category"], value)} />
      <SelectInput label="Status" value={tool.status} options={["published", "draft"]} onChange={(value) => updateField(["status"], value)} />
      <TextInput label="Meta title" value={tool.title} onChange={(value) => updateField(["title"], value)} />
      <TextArea label="Meta description" value={tool.description} onChange={(value) => updateField(["description"], value)} />
      <TextInput label="H1" value={tool.h1} onChange={(value) => updateField(["h1"], value)} />
      <TextArea label="Intro" value={tool.intro} onChange={(value) => updateField(["intro"], value)} />
      <div className="editor-row">
        <span>Danger zone</span>
        <button className="btn danger" type="button" onClick={deleteTool}>
          <Trash2 size={17} />
          Remove tool
        </button>
      </div>
    </EditorPanel>
  );
}

function FormPanel({ tool, updateField }) {
  function updateFormField(index, key, value) {
    const fields = structuredClone(tool.fields);
    fields[index][key] = value;
    updateField(["fields"], fields);
  }

  function addField() {
    updateField(["fields"], [
      ...tool.fields,
      {
        key: uniqueFieldKey("input", tool.fields),
        label: "New input",
        type: "text",
        required: false,
        placeholder: ""
      }
    ]);
  }

  function removeField(index) {
    updateField(["fields"], tool.fields.filter((_, fieldIndex) => fieldIndex !== index));
  }

  function moveField(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= tool.fields.length) return;
    const fields = structuredClone(tool.fields);
    [fields[index], fields[target]] = [fields[target], fields[index]];
    updateField(["fields"], fields);
  }

  return (
    <EditorPanel
      title="Form Builder"
      action={<button className="btn" type="button" onClick={addField}><Plus size={17} />Add field</button>}
    >
      {tool.fields.map((field, index) => (
        <div className="field-card" key={`${field.key}-${index}`}>
          <div className="field-card-head">
            <GripVertical size={17} />
            <strong>{field.label || field.key}</strong>
            <span className="tag">{field.type}</span>
            <div className="mini-actions">
              <button className="icon-btn" type="button" onClick={() => moveField(index, -1)} aria-label="Move field up">↑</button>
              <button className="icon-btn" type="button" onClick={() => moveField(index, 1)} aria-label="Move field down">↓</button>
              <button className="icon-btn danger" type="button" onClick={() => removeField(index)} aria-label="Remove field"><Trash2 size={15} /></button>
            </div>
          </div>
          <div className="compact-grid">
            <TextInput label="Label" value={field.label} onChange={(value) => updateFormField(index, "label", value)} />
            <TextInput label="Key" value={field.key} onChange={(value) => updateFormField(index, "key", keyify(value))} />
            <SelectInput label="Type" value={field.type} options={fieldTypes} onChange={(value) => updateFormField(index, "type", value)} />
            <ToggleInput label="Required" checked={Boolean(field.required)} onChange={(value) => updateFormField(index, "required", value)} />
            <TextInput label="Placeholder" value={field.placeholder || ""} onChange={(value) => updateFormField(index, "placeholder", value)} />
            <TextInput label="Default value" value={field.defaultValue || ""} onChange={(value) => updateFormField(index, "defaultValue", value)} />
            {field.type === "select" ? (
              <TextInput
                label="Options"
                value={(field.options || []).join(", ")}
                onChange={(value) => updateFormField(index, "options", value.split(",").map((item) => item.trim()).filter(Boolean))}
              />
            ) : null}
            <TextInput label="Help" value={field.help || ""} onChange={(value) => updateFormField(index, "help", value)} />
          </div>
        </div>
      ))}
    </EditorPanel>
  );
}

function PromptPanel({ tool, updateField }) {
  return (
    <EditorPanel title="Prompt and Result">
      <TextArea label="System prompt" value={tool.prompt.system} onChange={(value) => updateField(["prompt", "system"], value)} />
      <TextArea label="User template" value={tool.prompt.userTemplate} onChange={(value) => updateField(["prompt", "userTemplate"], value)} />
      <SelectInput label="Model" value={tool.prompt.model || "gpt-4o-mini"} options={models} onChange={(value) => updateField(["prompt", "model"], value)} />
      <TextInput label="Temperature" value={String(tool.prompt.temperature ?? 0.7)} onChange={(value) => updateField(["prompt", "temperature"], value)} />
      <SelectInput label="Result format" value={tool.result?.format || "text"} options={resultFormats} onChange={(value) => updateField(["result", "format"], value)} />
      <ToggleInput label="Copy button" checked={tool.result?.copyable !== false} onChange={(value) => updateField(["result", "copyable"], value)} />
      <div className="notice">
        Use field variables like {"{{topic}}"} or {"{{tone}}"} in the user template. When OPENAI_API_KEY is set, this panel calls the configured model; otherwise it uses the local mock provider.
      </div>
    </EditorPanel>
  );
}

function SeoPanel({ tool, updateField }) {
  return (
    <EditorPanel title="SEO Blocks">
      <ListEditor label="How-to steps" items={tool.seo.steps} onChange={(items) => updateField(["seo", "steps"], items)} placeholder="Add a step" />
      <ListEditor label="Use cases" items={tool.seo.useCases} onChange={(items) => updateField(["seo", "useCases"], items)} placeholder="Add a use case" />
      <FaqEditor items={tool.seo.faqs} onChange={(items) => updateField(["seo", "faqs"], items)} />
    </EditorPanel>
  );
}

function RunsPanel({ runs, refreshRuns }) {
  return (
    <EditorPanel
      title="Recent Runs"
      action={<button className="btn" type="button" onClick={refreshRuns}>Refresh</button>}
    >
      {runs.length === 0 ? <p className="muted-line">No runs for this tool yet.</p> : null}
      {runs.map((run) => (
        <div className="run-card" key={run.id}>
          <div className="run-head">
            <strong>{new Date(run.createdAt).toLocaleString()}</strong>
            <span className="tag">{run.provider}</span>
            <span className="muted-line">{run.durationMs}ms</span>
          </div>
          {run.error ? <p className="error">{run.error}</p> : <pre className="result-preview">{run.result}</pre>}
        </div>
      ))}
    </EditorPanel>
  );
}

function EditorPanel({ title, action, children }) {
  return (
    <section className="panel pad">
      <div className="panel-head">
        <h2>{title}</h2>
        {action}
      </div>
      <div className="editor">{children}</div>
    </section>
  );
}

function TextInput({ label, value, onChange }) {
  return (
    <label className="editor-row">
      <span>{label}</span>
      <input className="input" value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectInput({ label, value, options, onChange }) {
  return (
    <label className="editor-row">
      <span>{label}</span>
      <select className="input" value={value || ""} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option value={option} key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="editor-row">
      <span>{label}</span>
      <textarea className="input" value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ToggleInput({ label, checked, onChange }) {
  return (
    <label className="editor-row">
      <span>{label}</span>
      <span className="toggle-row">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span>{checked ? "Enabled" : "Disabled"}</span>
      </span>
    </label>
  );
}

function ListEditor({ label, items, onChange, placeholder }) {
  function updateItem(index, value) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  return (
    <div className="editor-row">
      <span>{label}</span>
      <div className="stack">
        {items.map((item, index) => (
          <div className="inline-edit" key={`${item}-${index}`}>
            <input className="input" value={item} onChange={(event) => updateItem(index, event.target.value)} />
            <button className="icon-btn danger" type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button className="btn" type="button" onClick={() => onChange([...items, placeholder])}>
          <Plus size={17} />
          Add
        </button>
      </div>
    </div>
  );
}

function FaqEditor({ items, onChange }) {
  function updateItem(index, key, value) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  return (
    <div className="editor-row">
      <span>FAQ</span>
      <div className="stack">
        {items.map((item, index) => (
          <div className="faq-editor" key={`${item.question}-${index}`}>
            <input className="input" value={item.question} onChange={(event) => updateItem(index, "question", event.target.value)} placeholder="Question" />
            <textarea className="input" value={item.answer} onChange={(event) => updateItem(index, "answer", event.target.value)} placeholder="Answer" />
            <button className="btn danger" type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
              <Trash2 size={17} />
              Remove FAQ
            </button>
          </div>
        ))}
        <button className="btn" type="button" onClick={() => onChange([...items, { question: "New question", answer: "New answer" }])}>
          <Plus size={17} />
          Add FAQ
        </button>
      </div>
    </div>
  );
}

function setDeepValue(target, path, value) {
  let cursor = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    if (!cursor[path[index]]) {
      cursor[path[index]] = {};
    }
    cursor = cursor[path[index]];
  }
  cursor[path[path.length - 1]] = value;
}

function createBlankTool(id, slug) {
  return {
    id,
    status: "draft",
    slug,
    name: "New AI Tool",
    category: "Writing",
    title: "New AI Tool",
    description: "Describe what this AI tool does and who it helps.",
    h1: "New AI Tool",
    intro: "Explain the outcome users can generate with this tool.",
    fields: [
      {
        key: "topic",
        label: "Topic",
        type: "textarea",
        required: true,
        placeholder: "Enter your topic"
      }
    ],
    prompt: {
      system: "You are a helpful assistant.",
      userTemplate: "Create a useful result for this topic: {{topic}}",
      model: "gpt-4o-mini",
      temperature: 0.7
    },
    result: {
      format: "text",
      copyable: true
    },
    seo: {
      steps: ["Enter your input.", "Generate a result.", "Copy and refine the output."],
      useCases: ["Content planning", "Drafting", "Research support"],
      faqs: [
        {
          question: "How does this tool work?",
          answer: "It turns the form input into a prompt and returns a generated result."
        }
      ]
    }
  };
}

function uniqueSlug(base, tools) {
  const clean = slugify(base) || "new-tool";
  const slugs = new Set(tools.map((tool) => tool.slug));
  let candidate = clean;
  let index = 2;

  while (slugs.has(candidate)) {
    candidate = `${clean}-${index}`;
    index += 1;
  }

  return candidate;
}

function uniqueFieldKey(base, fields) {
  const keys = new Set(fields.map((field) => field.key));
  let candidate = base;
  let index = 2;
  while (keys.has(candidate)) {
    candidate = `${base}_${index}`;
    index += 1;
  }
  return candidate;
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function keyify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

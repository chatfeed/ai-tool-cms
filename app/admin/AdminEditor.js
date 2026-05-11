"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Copy,
  Eye,
  FilePlus2,
  GripVertical,
  Plus,
  Rocket,
  Save,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  SearchCheck,
  Network,
  Trash2
} from "lucide-react";
import { parseDiscoveryInput } from "@/lib/discovery-parser";

const fieldTypes = ["text", "textarea", "select", "number"];
const resultFormats = ["text", "list", "markdown", "json"];
const models = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"];

export default function AdminEditor({ authEnabled, initialTools, initialRuns, initialKeywords }) {
  const [tools, setTools] = useState(initialTools);
  const [runs, setRuns] = useState(initialRuns);
  const [keywords, setKeywords] = useState(initialKeywords);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState([]);
  const [selectedPublishIds, setSelectedPublishIds] = useState([]);
  const [discoveryOpportunities, setDiscoveryOpportunities] = useState([]);
  const [selectedOpportunityIds, setSelectedOpportunityIds] = useState([]);
  const [selectedId, setSelectedId] = useState(initialTools[0]?.id);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tools");
  const [toolEditorTab, setToolEditorTab] = useState("page");
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
    setIsEditorOpen(true);
    setActiveTab("tools");
    setToolEditorTab("page");
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
    setIsEditorOpen(true);
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
    <div className="admin-single">
      <section className="editor">
        <div className="panel pad">
          <div className="actions admin-head">
            <div>
              <p className="eyebrow">Tool page CMS</p>
              <h1 className="admin-title">Admin workspace</h1>
              <p className="muted-line">{tools.length} tools · {keywords.length} keywords</p>
            </div>
            <div className="actions" style={{ marginTop: 0 }}>
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
              ["tools", "Tools"],
              ["discovery", "Discovery"],
              ["growth", "Growth"],
              ["runs", "Runs"],
              ["settings", "Settings"]
            ].map(([key, label]) => (
              <button className={activeTab === key ? "active" : ""} key={key} type="button" onClick={() => setActiveTab(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "tools" ? (
          <ToolsPanel
            createTool={createTool}
            deleteTool={deleteTool}
            duplicateTool={duplicateTool}
            refreshRuns={refreshRuns}
            runs={selectedRuns}
            selectedId={selectedId}
            selectedPublishIds={selectedPublishIds}
            selectedTool={selectedTool}
            isEditorOpen={isEditorOpen}
            setIsEditorOpen={setIsEditorOpen}
            setSelectedId={setSelectedId}
            setSelectedPublishIds={setSelectedPublishIds}
            setToolEditorTab={setToolEditorTab}
            setTools={setTools}
            toolEditorTab={toolEditorTab}
            tools={tools}
            updateField={updateField}
          />
        ) : null}
        {activeTab === "discovery" ? (
          <DiscoveryPanel
            opportunities={discoveryOpportunities}
            selectedOpportunityIds={selectedOpportunityIds}
            setKeywords={setKeywords}
            setOpportunities={setDiscoveryOpportunities}
            setSelectedOpportunityIds={setSelectedOpportunityIds}
            setTools={setTools}
          />
        ) : null}
        {activeTab === "growth" ? (
          <GrowthPanel
            keywords={keywords}
            selectedKeywordIds={selectedKeywordIds}
            setKeywords={setKeywords}
            setSelectedKeywordIds={setSelectedKeywordIds}
            setTools={setTools}
            tools={tools}
          />
        ) : null}
        {activeTab === "runs" ? (
          <GlobalRunsPanel runs={runs} refreshRuns={refreshRuns} />
        ) : null}
        {activeTab === "settings" ? (
          <SettingsPanel authEnabled={authEnabled} />
        ) : null}
      </section>
    </div>
  );
}

function DiscoveryPanel({
  opportunities,
  selectedOpportunityIds,
  setKeywords,
  setOpportunities,
  setSelectedOpportunityIds,
  setTools
}) {
  const [source, setSource] = useState("manual");
  const [fetchProvider, setFetchProvider] = useState("internal_seed");
  const [fetchGeo, setFetchGeo] = useState("US");
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  async function analyze() {
    setMessage("");
    setError("");
    const queries = parseDiscoveryInput(input, source);

    if (queries.length === 0) {
      setError("Paste at least one valid keyword row.");
      return;
    }

    setIsAnalyzing(true);
    const response = await fetch("/api/admin/discovery/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries })
    });
    const payload = await response.json();
    setIsAnalyzing(false);

    if (!response.ok) {
      setError(payload.error || "Could not analyze opportunities.");
      return;
    }

    setOpportunities(payload.opportunities || []);
    setSelectedOpportunityIds([]);
    setMessage(`Analyzed ${payload.opportunities?.length || 0} opportunities.`);
  }

  async function fetchSignals() {
    setMessage("");
    setError("");
    setIsAnalyzing(true);

    const response = await fetch("/api/admin/discovery/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: fetchProvider, geo: fetchGeo })
    });
    const payload = await response.json();
    setIsAnalyzing(false);

    if (!response.ok) {
      setError(payload.error || "Could not fetch discovery signals.");
      return;
    }

    const lines = (payload.queries || []).map((query) => {
      const volume = Number.isFinite(query.searchVolume) ? query.searchVolume : "";
      const competition = Number.isFinite(query.competition) ? query.competition : "";
      return `${query.keyword}, ${volume}, ${competition}`;
    });

    setSource("internal-logs");
    setInput(lines.join("\n"));
    if (payload.warning) {
      setError(payload.warning);
    }
    setMessage(`Fetched ${lines.length} keyword signals from ${payload.providerUsed || payload.providerRequested} (${payload.geo || fetchGeo}).`);
  }

  function toggleOpportunity(id) {
    setSelectedOpportunityIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function selectHighScore() {
    setSelectedOpportunityIds(opportunities.filter((item) => item.score >= 70).map((item) => item.id));
  }

  async function createTools() {
    setMessage("");
    setError("");
    setIsCreating(true);

    const response = await fetch("/api/admin/discovery/create-tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedIds: selectedOpportunityIds,
        opportunities
      })
    });
    const payload = await response.json();
    setIsCreating(false);

    if (!response.ok) {
      setError(payload.error || "Could not create tools.");
      return;
    }

    setTools(payload.tools);
    setKeywords(payload.keywords);
    setSelectedOpportunityIds([]);
    setMessage(`Created ${payload.createdTools} draft tools.`);
  }

  return (
    <EditorPanel title="Keyword Discovery Pipeline">
      <div className="growth-summary">
        <div>
          <p className="eyebrow">Discovery flow</p>
          <h3>Keyword signals to generated tools</h3>
          <p>Paste keyword rows from GSC or other sources, score opportunities, then generate draft tools in one step.</p>
        </div>
        <Sparkles size={30} />
      </div>
      <div className="tool-table-toolbar">
        <select className="input" value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="manual">manual</option>
          <option value="gsc">gsc</option>
          <option value="trends">trends</option>
          <option value="keyword-tool">keyword-tool</option>
          <option value="internal-logs">internal-logs</option>
        </select>
        <select className="input" value={fetchProvider} onChange={(event) => setFetchProvider(event.target.value)}>
          <option value="internal_seed">internal_seed</option>
          <option value="google_trends_free">google_trends_free</option>
        </select>
        <select className="input" value={fetchGeo} onChange={(event) => setFetchGeo(event.target.value)}>
          <option value="US">US</option>
          <option value="GB">GB</option>
          <option value="CA">CA</option>
          <option value="AU">AU</option>
          <option value="IN">IN</option>
          <option value="SG">SG</option>
          <option value="DE">DE</option>
          <option value="FR">FR</option>
          <option value="JP">JP</option>
          <option value="BR">BR</option>
          <option value="MX">MX</option>
        </select>
      </div>
      <textarea
        className="input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={
          source === "gsc"
            ? "Paste Google Search Console CSV rows (with header).\nquery,clicks,impressions,ctr,position\nai resume summary generator,31,1900,1.63%,8.7"
            : "keyword, search_volume(optional), competition(optional)\nai resume summary generator, 1900, 0.42\nyoutube title generator, 5400, 0.58"
        }
      />
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn" type="button" onClick={fetchSignals} disabled={isAnalyzing}>Fetch signals</button>
        <button className="btn" type="button" onClick={analyze} disabled={isAnalyzing}>{isAnalyzing ? "Analyzing..." : "Analyze opportunities"}</button>
        <button className="btn" type="button" onClick={selectHighScore} disabled={opportunities.length === 0}>Select score &gt;= 70</button>
        <button className="btn primary" type="button" onClick={createTools} disabled={selectedOpportunityIds.length === 0 || isCreating}>
          {isCreating ? "Creating..." : "Generate draft tools"}
        </button>
      </div>
      {message ? <p className="notice success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="publish-table">
        {opportunities.map((item) => (
          <div className="publish-row" key={item.id}>
            <input
              type="checkbox"
              checked={selectedOpportunityIds.includes(item.id)}
              onChange={() => toggleOpportunity(item.id)}
              aria-label={`Select ${item.phrase}`}
            />
            <div>
              <strong>{item.phrase}</strong>
              <p className="muted-line">{item.source} · {item.category} · {item.toolType}</p>
            </div>
            <span className={`score-pill ${item.score >= 80 ? "good" : item.score >= 60 ? "warn" : ""}`}>{item.score}%</span>
            <span className="tag">{item.intent}</span>
            <div className="publish-blockers">
              <span>{item.rationale}</span>
            </div>
            <span className="muted-line">vol {item.searchVolume} · comp {item.competition}</span>
          </div>
        ))}
      </div>
    </EditorPanel>
  );
}

function ToolsPanel({
  createTool,
  deleteTool,
  duplicateTool,
  refreshRuns,
  runs,
  selectedId,
  selectedPublishIds,
  selectedTool,
  isEditorOpen,
  setIsEditorOpen,
  setSelectedId,
  setSelectedPublishIds,
  setToolEditorTab,
  setTools,
  toolEditorTab,
  tools,
  updateField
}) {
  const editorRef = useRef(null);
  const [filter, setFilter] = useState("draft");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const categories = ["all", ...Array.from(new Set(tools.map((tool) => tool.category).filter(Boolean))).sort()];

  const rows = tools
    .map((tool) => {
      const checks = getSeoChecks(tool);
      const score = Math.round((checks.filter((check) => check.ok).length / checks.length) * 100);
      return { tool, score, checks };
    })
    .filter((row) => filter === "all" || row.tool.status === filter)
    .filter((row) => category === "all" || row.tool.category === category)
    .filter((row) => {
      const haystack = `${row.tool.name} ${row.tool.slug} ${row.tool.category}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    })
    .sort((first, second) => first.tool.status.localeCompare(second.tool.status) || second.score - first.score);

  function toggleTool(id) {
    setSelectedPublishIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function editTool(id) {
    setSelectedId(id);
    setIsEditorOpen(true);
    setToolEditorTab("page");
    window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function applyStatus(status) {
    setMessage("");
    setError("");

    const nextTools = tools.map((tool) => selectedPublishIds.includes(tool.id) ? { ...tool, status } : tool);
    const response = await fetch("/api/admin/tools", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tools: nextTools })
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Could not update tool statuses.");
      return;
    }

    setTools(nextTools);
    setSelectedPublishIds([]);
    setMessage(`${selectedPublishIds.length} tools moved to ${status}.`);
  }

  function selectReadyDrafts() {
    setSelectedPublishIds(
      tools
        .map((tool) => {
          const checks = getSeoChecks(tool);
          const score = Math.round((checks.filter((check) => check.ok).length / checks.length) * 100);
          return { tool, score };
        })
        .filter((row) => row.tool.status === "draft" && row.score >= 80)
        .map((row) => row.tool.id)
    );
  }

  return (
    <>
    <EditorPanel
      title="Tools"
      action={<button className="btn primary" type="button" onClick={createTool}><FilePlus2 size={17} />New tool</button>}
    >
      <div className="tool-table-toolbar">
        <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, slug, or category" />
        <select className="input" value={filter} onChange={(event) => setFilter(event.target.value)}>
          {["draft", "published", "all"].map((value) => <option value={value} key={value}>{value}</option>)}
        </select>
        <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((value) => <option value={value} key={value}>{value}</option>)}
        </select>
      </div>
      <div className="publish-toolbar">
        <div className="actions" style={{ marginTop: 0 }}>
          <button className="btn" type="button" onClick={selectReadyDrafts}>Select ready drafts</button>
          <button className="btn primary" type="button" onClick={() => applyStatus("published")} disabled={selectedPublishIds.length === 0}>
            <Rocket size={17} />
            Publish selected
          </button>
          <button className="btn" type="button" onClick={() => applyStatus("draft")} disabled={selectedPublishIds.length === 0}>Move to draft</button>
        </div>
      </div>
      {message ? <p className="notice success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!isEditorOpen ? <p className="muted-line">Use the table to search and batch manage tools. Click Edit on a row to open the editor below.</p> : null}
      <div className="publish-table">
        {rows.map(({ tool, score, checks }) => {
          const blockers = checks.filter((check) => !check.ok).slice(0, 2);
          return (
            <div className="publish-row" key={tool.id}>
              <input
                type="checkbox"
                checked={selectedPublishIds.includes(tool.id)}
                onChange={() => toggleTool(tool.id)}
                aria-label={`Select ${tool.name}`}
              />
              <div>
                <strong>{tool.name}</strong>
                <p className="muted-line">/{tool.slug} · {tool.category}</p>
              </div>
              <span className={`score-pill ${score >= 80 ? "good" : score >= 60 ? "warn" : ""}`}>{score}%</span>
              <span className="tag">{tool.status}</span>
              <div className="publish-blockers">
                {blockers.length === 0 ? <span className="muted-line">Ready</span> : blockers.map((blocker) => <span key={blocker.label}>{blocker.label}</span>)}
              </div>
              <button className="btn ghost" type="button" onClick={() => editTool(tool.id)}>Edit</button>
            </div>
          );
        })}
      </div>
    </EditorPanel>
    {selectedTool && isEditorOpen ? (
      <EditorPanel
        anchorRef={editorRef}
        title={`Edit ${selectedTool.name}`}
        action={
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="btn" type="button" onClick={duplicateTool}><Copy size={17} />Duplicate</button>
            <Link className="btn" href={`/${selectedTool.slug}?preview=1`} target="_blank"><Eye size={17} />Preview</Link>
            <button className="btn" type="button" onClick={() => setIsEditorOpen(false)}>Close</button>
          </div>
        }
      >
        <div className="selected-tool-strip">
          <div>
            <strong>{selectedTool.name}</strong>
            <p className="muted-line">/{selectedTool.slug} · {selectedTool.category} · {selectedTool.status}</p>
          </div>
          <span className={`status-dot ${selectedTool.status}`} />
        </div>
        <div className="tabs compact-tabs" role="tablist">
          {[
            ["page", "Page"],
            ["form", "Form"],
            ["prompt", "Prompt"],
            ["seo", "SEO Blocks"],
            ["runs", "Tool Runs"]
          ].map(([key, label]) => (
            <button className={toolEditorTab === key ? "active" : ""} key={key} type="button" onClick={() => setToolEditorTab(key)}>
              {label}
            </button>
          ))}
        </div>
        {toolEditorTab === "page" ? <PagePanel tool={selectedTool} updateField={updateField} deleteTool={deleteTool} /> : null}
        {toolEditorTab === "form" ? <FormPanel tool={selectedTool} updateField={updateField} /> : null}
        {toolEditorTab === "prompt" ? <PromptPanel tool={selectedTool} updateField={updateField} /> : null}
        {toolEditorTab === "seo" ? <SeoPanel tool={selectedTool} updateField={updateField} /> : null}
        {toolEditorTab === "runs" ? <RunsPanel runs={runs} refreshRuns={refreshRuns} /> : null}
      </EditorPanel>
    ) : null}
    </>
  );
}

function GrowthPanel({ keywords, selectedKeywordIds, setKeywords, setSelectedKeywordIds, setTools, tools }) {
  const [draftText, setDraftText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const generatedKeywordIds = new Set(tools.map((tool) => tool.sourceKeywordId).filter(Boolean));

  function addKeywordsFromText() {
    const existing = new Set(keywords.map((keyword) => keyword.phrase.toLowerCase()));
    const rows = draftText
      .split("\n")
      .map((row) => row.trim())
      .filter(Boolean);

    const additions = rows
      .map((row) => {
        const [phrase, category = "Writing", priority = "2", tags = ""] = row.split(",").map((item) => item.trim());
        if (!phrase || existing.has(phrase.toLowerCase())) return null;
        existing.add(phrase.toLowerCase());
        return {
          id: crypto.randomUUID(),
          phrase,
          category,
          intent: "tool",
          priority: Number(priority) || 2,
          status: "planned",
          tags: tags.split("|").map((tag) => tag.trim()).filter(Boolean),
          notes: ""
        };
      })
      .filter(Boolean);

    setKeywords((current) => [...additions, ...current]);
    setSelectedKeywordIds((current) => [
      ...new Set([...current, ...additions.map((keyword) => keyword.id)])
    ]);
    setDraftText("");
    setMessage(`${additions.length} keywords added and selected. Generate draft tools will save them automatically.`);
  }

  async function saveKeywords() {
    setMessage("");
    setError("");
    const response = await fetch("/api/admin/keywords", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Could not save keywords.");
      return;
    }
    setMessage("Keywords saved.");
  }

  async function generateTools() {
    setMessage("");
    setError("");
    const response = await fetch("/api/admin/generate-tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywordIds: selectedKeywordIds, keywords })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Could not generate tools.");
      return;
    }
    setTools(payload.tools);
    setKeywords(payload.keywords);
    setSelectedKeywordIds([]);
    setMessage(`${payload.generated} draft tools generated from selected keywords.`);
  }

  function updateKeyword(id, key, value) {
    setKeywords((current) => current.map((keyword) => (keyword.id === id ? { ...keyword, [key]: value } : keyword)));
  }

  function toggleKeyword(id) {
    setSelectedKeywordIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <EditorPanel title="Keyword Library and Bulk Generation">
      <div className="growth-summary">
        <div>
          <p className="eyebrow">Auto internal linking</p>
          <h3>Category + keyword tags</h3>
          <p>Related tools are ranked by shared category, matching intent, and overlapping keyword tags.</p>
        </div>
        <Network size={30} />
      </div>
      <div className="editor-row">
        <span>Bulk add</span>
        <div className="stack">
          <textarea
            className="input"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            placeholder={"one keyword per line: phrase, category, priority, tag|tag\nexample: ai email subject line generator, Marketing, 3, email|copywriting"}
          />
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="btn" type="button" onClick={addKeywordsFromText}>Add to library</button>
            <button className="btn" type="button" onClick={saveKeywords}>Save keywords</button>
            <button className="btn primary" type="button" onClick={generateTools} disabled={selectedKeywordIds.length === 0}>Generate draft tools</button>
          </div>
          {message ? <p className="notice success">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
      </div>
      <div className="keyword-table">
        {keywords.map((keyword) => (
          <div className="keyword-row" key={keyword.id}>
            <input
              type="checkbox"
              checked={selectedKeywordIds.includes(keyword.id)}
              disabled={generatedKeywordIds.has(keyword.id)}
              onChange={() => toggleKeyword(keyword.id)}
              aria-label={`Select ${keyword.phrase}`}
            />
            <input className="input" value={keyword.phrase} onChange={(event) => updateKeyword(keyword.id, "phrase", event.target.value)} />
            <input className="input" value={keyword.category} onChange={(event) => updateKeyword(keyword.id, "category", event.target.value)} />
            <select className="input" value={keyword.priority} onChange={(event) => updateKeyword(keyword.id, "priority", Number(event.target.value))}>
              {[1, 2, 3, 4, 5].map((priority) => <option value={priority} key={priority}>{priority}</option>)}
            </select>
            <input
              className="input"
              value={(keyword.tags || []).join(", ")}
              onChange={(event) => updateKeyword(keyword.id, "tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))}
            />
            <span className="tag">{generatedKeywordIds.has(keyword.id) ? "generated" : keyword.status}</span>
          </div>
        ))}
      </div>
    </EditorPanel>
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
  const checks = getSeoChecks(tool);
  const passed = checks.filter((check) => check.ok).length;
  const score = Math.round((passed / checks.length) * 100);

  return (
    <EditorPanel title="SEO Blocks">
      <div className="seo-score">
        <div>
          <p className="eyebrow">SEO readiness</p>
          <strong>{score}%</strong>
          <span>{passed} of {checks.length} checks passed</span>
        </div>
        <SearchCheck size={28} />
      </div>
      <div className="checklist">
        {checks.map((check) => (
          <div className={check.ok ? "check-row ok" : "check-row"} key={check.label}>
            <span>{check.ok ? "✓" : "!"}</span>
            <div>
              <strong>{check.label}</strong>
              <p>{check.help}</p>
            </div>
          </div>
        ))}
      </div>
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

function GlobalRunsPanel({ runs, refreshRuns }) {
  return (
    <EditorPanel
      title="All Runs"
      action={<button className="btn" type="button" onClick={refreshRuns}>Refresh</button>}
    >
      {runs.length === 0 ? <p className="muted-line">No tool runs yet.</p> : null}
      {runs.map((run) => (
        <div className="run-card" key={run.id}>
          <div className="run-head">
            <strong>{run.toolName}</strong>
            <span className="tag">{run.provider}</span>
            <span className="muted-line">{new Date(run.createdAt).toLocaleString()}</span>
            <span className="muted-line">{run.durationMs}ms</span>
          </div>
          {run.error ? <p className="error">{run.error}</p> : <pre className="result-preview">{run.result}</pre>}
        </div>
      ))}
    </EditorPanel>
  );
}

function SettingsPanel({ authEnabled }) {
  return (
    <EditorPanel title="Settings">
      <p className={authEnabled ? "notice success" : "notice warn"}>
        {authEnabled ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
        {authEnabled
          ? "Admin password protection is enabled."
          : "Admin password protection is disabled. Set ADMIN_PASSWORD before deployment."}
      </p>
      <div className="notice">
        Database-backed storage is active when DATABASE_URL is set. OPENAI_API_KEY switches tool execution from mock output to the configured model provider.
      </div>
    </EditorPanel>
  );
}

function EditorPanel({ title, action, anchorRef, children }) {
  return (
    <section className="panel pad" ref={anchorRef}>
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

function getSeoChecks(tool) {
  const titleLength = tool.title?.length || 0;
  const descriptionLength = tool.description?.length || 0;
  const introLength = tool.intro?.length || 0;
  const faqCount = tool.seo?.faqs?.length || 0;
  const stepCount = tool.seo?.steps?.length || 0;
  const useCaseCount = tool.seo?.useCases?.length || 0;
  const fieldCount = tool.fields?.length || 0;
  const promptVariables = extractVariables(tool.prompt?.userTemplate || "");
  const fieldKeys = new Set((tool.fields || []).map((field) => field.key));

  return [
    {
      ok: titleLength >= 35 && titleLength <= 65,
      label: "Meta title length",
      help: `${titleLength} characters. Aim for 35-65 characters.`
    },
    {
      ok: descriptionLength >= 90 && descriptionLength <= 160,
      label: "Meta description length",
      help: `${descriptionLength} characters. Aim for 90-160 characters.`
    },
    {
      ok: Boolean(tool.h1 && tool.h1.length >= 12),
      label: "Clear H1",
      help: "Use a specific H1 that names the tool and outcome."
    },
    {
      ok: introLength >= 90,
      label: "Intro depth",
      help: `${introLength} characters. Add context, audience, and outcome.`
    },
    {
      ok: stepCount >= 3,
      label: "How-to section",
      help: `${stepCount} steps. Three or more steps help search engines understand the workflow.`
    },
    {
      ok: useCaseCount >= 3,
      label: "Use cases",
      help: `${useCaseCount} use cases. Add multiple intents for long-tail coverage.`
    },
    {
      ok: faqCount >= 2,
      label: "FAQ schema",
      help: `${faqCount} FAQs. Two or more Q&A items support rich structured content.`
    },
    {
      ok: fieldCount > 0,
      label: "Runnable form",
      help: `${fieldCount} fields configured. Each SEO page should provide a real utility.`
    },
    {
      ok: promptVariables.every((variable) => fieldKeys.has(variable)),
      label: "Prompt variables",
      help: promptVariables.length > 0
        ? `Variables used: ${promptVariables.join(", ")}.`
        : "Use at least one form variable in the prompt template."
    }
  ];
}

function extractVariables(template) {
  return Array.from(template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map((match) => match[1]);
}

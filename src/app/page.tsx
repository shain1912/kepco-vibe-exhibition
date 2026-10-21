"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, type Project } from "@/lib/supabase";

const LINK_TYPES = [
  { key: "web_url", label: "웹", icon: "🌐", placeholder: "https://my-app.vercel.app" },
  { key: "video_url", label: "영상", icon: "🎬", placeholder: "https://youtu.be/..." },
  { key: "github_url", label: "GitHub", icon: "💻", placeholder: "https://github.com/..." },
  { key: "report_url", label: "보고서", icon: "📄", placeholder: "https://docs.google.com/..." },
] as const;

type LinkKey = (typeof LINK_TYPES)[number]["key"];

function youtubeId(url: string | null) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LinkKey | "all">("all");
  const [showForm, setShowForm] = useState(false);

  function load() {
    return supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setProjects(data ?? []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== "all" && !p[filter]) return false;
      if (!q) return true;
      return [p.title, p.author, p.team, p.description].some((v) => v?.toLowerCase().includes(q));
    });
  }, [projects, query, filter]);

  async function handleDelete(p: Project) {
    const pw = window.prompt(`"${p.title}" 삭제\n등록할 때 입력한 비밀번호를 입력하세요.`);
    if (!pw) return;
    const { data, error } = await supabase.rpc("delete_project", { p_id: p.id, p_password: pw });
    if (error) return alert(error.message);
    if (!data) return alert("비밀번호가 일치하지 않습니다.");
    setProjects((prev) => prev.filter((x) => x.id !== p.id));
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">한전 직무교육 · 업무자동화 바이브코딩</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">성과 전시관</h1>
          <p className="mt-2 text-gray-600">
            수강생이 직접 만든 웹 서비스, 영상, GitHub 저장소, 보고서를 모아봅니다. 로그인 없이 누구나 등록할 수 있어요.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + 결과물 등록
        </button>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목, 이름, 팀, 설명으로 검색"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            전체 {projects.length}
          </FilterChip>
          {LINK_TYPES.map((t) => (
            <FilterChip key={t.key} active={filter === t.key} onClick={() => setFilter(t.key)}>
              {t.icon} {t.label} {projects.filter((p) => p[t.key]).length}
            </FilterChip>
          ))}
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">불러오기 실패: {error}</p>}
      {loading ? (
        <p className="py-20 text-center text-gray-500">불러오는 중…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 py-20 text-center text-gray-500">
          {projects.length === 0 ? "아직 등록된 결과물이 없습니다. 첫 번째로 등록해 보세요!" : "검색 결과가 없습니다."}
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} onDelete={() => handleDelete(p)} />
          ))}
        </ul>
      )}

      {showForm && (
        <RegisterForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </main>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium ${
        active ? "bg-gray-900 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function ProjectCard({ project: p, onDelete }: { project: Project; onDelete: () => void }) {
  const yt = youtubeId(p.video_url);
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {yt && (
        <a href={p.video_url!} target="_blank" rel="noreferrer" className="relative block aspect-video bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center text-5xl drop-shadow">▶️</span>
        </a>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-bold leading-snug">{p.title}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {p.author}
          {p.team && ` · ${p.team}`} · {new Date(p.created_at).toLocaleDateString("ko-KR")}
        </p>
        {p.description && <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{p.description}</p>}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {LINK_TYPES.filter((t) => p[t.key]).map((t) => (
            <a
              key={t.key}
              href={p[t.key]!}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              {t.icon} {t.label}
            </a>
          ))}
          <button onClick={onDelete} className="ml-auto text-xs text-gray-400 hover:text-red-500">
            삭제
          </button>
        </div>
      </div>
    </li>
  );
}

function RegisterForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const links = LINK_TYPES.map((t) => get(t.key));
    if (links.every((l) => !l)) return setError("링크를 하나 이상 입력해 주세요.");
    if (links.some((l) => l && !/^https?:\/\//i.test(l))) return setError("링크는 http:// 또는 https:// 로 시작해야 합니다.");

    setSubmitting(true);
    setError(null);
    const { error } = await supabase.rpc("create_project", {
      p_author: get("author"),
      p_team: get("team"),
      p_title: get("title"),
      p_description: get("description"),
      p_web_url: get("web_url"),
      p_video_url: get("video_url"),
      p_github_url: get("github_url"),
      p_report_url: get("report_url"),
      p_password: get("password"),
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else onCreated();
  }

  const input = "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">결과물 등록</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="이름 *">
              <input name="author" required maxLength={50} className={input} />
            </Field>
            <Field label="소속 / 팀">
              <input name="team" maxLength={50} placeholder="예: OO사업소" className={input} />
            </Field>
          </div>
          <Field label="프로젝트 제목 *">
            <input name="title" required maxLength={100} className={input} />
          </Field>
          <Field label="한 줄 설명">
            <textarea name="description" rows={3} maxLength={2000} placeholder="어떤 업무를 자동화했나요?" className={input} />
          </Field>

          <fieldset className="grid gap-3 rounded-xl bg-gray-50 p-4">
            <legend className="px-1 text-sm font-semibold text-gray-700">링크 (하나 이상)</legend>
            {LINK_TYPES.map((t) => (
              <Field key={t.key} label={`${t.icon} ${t.label}`}>
                <input name={t.key} type="url" maxLength={500} placeholder={t.placeholder} className={`${input} bg-white`} />
              </Field>
            ))}
          </fieldset>

          <Field label="삭제용 비밀번호 * (4자 이상)">
            <input name="password" type="password" required minLength={4} maxLength={50} className={input} />
          </Field>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          disabled={submitting}
          className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "등록 중…" : "등록하기"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

import { useState } from "react";

export interface CreatedProject {
  id: number;
  name: string;
  dueDate: string;
  status: string;
  milestones: { name: string; dueDate: string | null; completed: boolean }[];
}

interface MilestoneDraft {
  name: string;
  dueDate: string;
}

interface ProjectCreateModalProps {
  onClose: () => void;
  onCreated: (project: CreatedProject) => void;
}

/**
 * 新建编织项目弹窗（FT-02-US-01）。
 *
 * <p>AC-3/AC-4/AC-6：前端必填校验（与后端 400 文案一致），不合法不发请求；
 * 后端若仍返回 400 字段错误则回显；404 提示"接口不存在/服务未就绪"，5xx 提示"请稍后重试"。
 * AC-5 由调用方保证仅登录用户可见。
 */
export default function ProjectCreateModal({ onClose, onCreated }: ProjectCreateModalProps) {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!name.trim()) {
      next.name = "请填写项目名称";
    } else if (name.length > 100) {
      next.name = "名称不超过100字";
    }
    if (!dueDate) {
      next.dueDate = "请选择预计完成日期";
    }
    if (milestones.some((m) => !m.name.trim())) {
      next.milestones = "里程碑名称必填";
    }
    return next;
  }

  function addMilestone() {
    setMilestones((prev) => [...prev, { name: "", dueDate: "" }]);
  }

  function updateMilestone(index: number, patch: Partial<MilestoneDraft>) {
    setMilestones((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function removeMilestone(index: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const frontErrors = validate();
    if (Object.keys(frontErrors).length > 0) {
      setErrors(frontErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dueDate,
          milestones: milestones.map((m) => ({ name: m.name.trim(), dueDate: m.dueDate || null })),
        }),
      });
      if (res.status === 201) {
        const project = (await res.json()) as CreatedProject;
        onCreated(project);
        onClose();
        return;
      }
      if (res.status === 400) {
        const data = (await res.json()) as { errors?: Record<string, string> };
        setErrors(data.errors ?? { form: "提交失败，请检查输入" });
        return;
      }
      if (res.status === 401) {
        setErrors({ form: "请先登录" });
        return;
      }
      if (res.status === 404) {
        setErrors({ form: "服务未就绪：创建接口不存在，请确认后端已启动并包含本项目（FT-02）" });
        return;
      }
      if (res.status >= 500) {
        setErrors({ form: "服务器开小差了，请稍后重试" });
        return;
      }
      setErrors({ form: "创建失败，请稍后重试" });
    } catch {
      setErrors({ form: "网络异常，创建失败" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(44, 26, 14, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]"
        style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl leading-none"
          style={{ color: "var(--muted-foreground)" }}
        >
          ×
        </button>

        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
          新建编织项目
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
              项目名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如 祖母的生日披肩"
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2"
              style={{ background: "var(--muted)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: "#B54B22" }}>{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
              预计完成日期
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2"
              style={{ background: "var(--muted)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
            />
            {errors.dueDate && (
              <p className="text-xs mt-1" style={{ color: "#B54B22" }}>{errors.dueDate}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
                里程碑（可选）
              </label>
              <button
                type="button"
                onClick={addMilestone}
                className="text-xs px-2 py-1 rounded-md"
                style={{ background: "var(--muted)", color: "var(--primary)" }}
              >
                + 添加里程碑
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => updateMilestone(i, { name: e.target.value })}
                    placeholder="里程碑名称"
                    className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none focus:ring-2"
                    style={{ background: "var(--muted)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                  />
                  <input
                    type="date"
                    value={m.dueDate}
                    onChange={(e) => updateMilestone(i, { dueDate: e.target.value })}
                    className="w-36 px-2 py-1.5 rounded-lg text-sm outline-none focus:ring-2"
                    style={{ background: "var(--muted)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    className="text-sm px-2 py-1.5 rounded-md"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {milestones.length === 0 && (
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>暂无里程碑，可留空直接创建。</p>
              )}
            </div>
            {errors.milestones && (
              <p className="text-xs mt-1" style={{ color: "#B54B22" }}>{errors.milestones}</p>
            )}
          </div>

          {errors.form && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "#FDE8E0", color: "#B54B22", border: "1px solid #F4C9B8" }}>
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {submitting ? "创建中…" : "创建项目"}
          </button>
        </form>
      </div>
    </div>
  );
}

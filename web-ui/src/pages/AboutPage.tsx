import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="py-10" style={{ background: "var(--foreground)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "Lora, serif", color: "#F7F1E8" }}>
            关于 KnitHub
          </h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8">
          {[
            {
              title: "我们的故事",
              content: "KnitHub 诞生于一群痴迷于编织的开发者和设计师之间。我们热爱手作，却苦于没有一个足够好的工具来记录项目、管理纱线和发现新图案。于是我们自己建了一个。",
            },
            {
              title: "社区准则",
              content: "KnitHub 是一个温暖、包容的空间。我们欢迎所有技能水平的手作人，不论你是刚拿起棒针的新手，还是拥有三十年经验的大师。请保持善意，尊重他人的作品，共同维护这个我们都热爱的社区。",
            },
            {
              title: "帮助中心",
              content: "如果你遇到任何问题，请先查看我们的常见问题页面。如仍需帮助，可通过下方联系方式与我们取得联系。我们的支持团队通常在 1-2 个工作日内回复。",
            },
            {
              title: "联系方式",
              content: "📧 hello@knithub.com\n💬 社区论坛 · @KnitHubOfficial\n📍 Portland, OR · Brooklyn, NY · Edinburgh, Scotland",
            },
          ].map((section) => (
            <div
              key={section.title}
              className="p-6 rounded-xl"
              style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
            >
              <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "Lora, serif", color: "var(--foreground)" }}>
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--muted-foreground)" }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-block px-6 py-2.5 rounded-lg font-semibold text-sm"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

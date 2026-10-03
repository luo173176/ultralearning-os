import { t } from "@/lib/i18n";
import { PRINCIPLES } from "@/lib/principles";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t("app.name")}</h1>
        <p className="mt-3 text-muted-foreground">{t("app.tagline")}</p>
      </header>

      <section className="mt-10 rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {t("home.stageNote")} — {t("home.comingSoon")}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">{t("home.principlesTitle")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.key} className="rounded-lg border bg-card p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">
                  #{p.order}
                </span>
                <span className="font-medium">{p.zh}</span>
                <span className="text-xs text-muted-foreground">{p.en}</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {p.tagline}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 text-xs text-muted-foreground">
        {t("home.footer")}
      </footer>
    </main>
  );
}

import { CreateWizard } from "@/components/wizard/create-wizard";
import { t } from "@/lib/i18n";

export const metadata = { title: t("wizard.title") };

export default function NewProjectPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("wizard.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("wizard.subtitle")}
        </p>
      </header>
      <CreateWizard />
    </main>
  );
}

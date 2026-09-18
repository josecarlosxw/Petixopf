import { DashHero } from "@/components/painel/dash-hero";
import { KpiGrid } from "@/components/painel/kpi-grid";
import { CategoryGrid } from "@/components/painel/category-grid";
import { QuickAccessList } from "@/components/painel/quick-access-list";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-medium text-muted-foreground">{children}</h2>
  );
}

export default function PainelPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <DashHero />

      <div className="flex flex-col gap-4">
        <SectionHeading>Visão geral</SectionHeading>
        <KpiGrid />
      </div>

      <div className="flex flex-col gap-4">
        <SectionHeading>Explorar por categoria</SectionHeading>
        <CategoryGrid />
      </div>

      <div className="flex flex-col gap-4">
        <SectionHeading>Acesso rápido</SectionHeading>
        <QuickAccessList />
      </div>
    </div>
  );
}

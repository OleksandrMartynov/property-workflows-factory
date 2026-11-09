import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { MESSAGES } from "@/lib/runs/messages";
import { PageShell } from "./ui";

// AC-EDITOR-07, AC-DSYS-02: сторінка, на яку роль не має прав, — «Not enough rights» і «Back to templates» у тому самому
// каркасі, що й інші сторінки (AppShell групи (app)), без жодного вмісту захищеної сторінки.
export function Forbidden({
  title,
  back = { href: "/templates", label: "Back to templates" },
}: {
  title: string;
  back?: { href: string; label: string };
}) {
  return (
    <PageShell title={title}>
      <div className="flex flex-col items-start gap-4">
        <Alert variant="error">
          <span data-testid="forbidden">{MESSAGES.NOT_ALLOWED_TEMPLATES}</span>
        </Alert>
        <Link href={back.href} className={buttonVariants({ variant: "outline" })}>
          {back.label}
        </Link>
      </div>
    </PageShell>
  );
}

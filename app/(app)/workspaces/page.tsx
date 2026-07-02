import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { listMine } from "@/lib/workspaces";
import { NewWorkspaceForm } from "./_components/new-workspace-form";

export default async function WorkspacesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const workspaces = await listMine(session.userId);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-tight">我的工作空间</h1>
        <NewWorkspaceForm />
      </div>
      {workspaces.length === 0 ? (
        <p className="text-steel">还没有空间，点击右上角「新建空间」创建一个。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workspaces.map((workspace) => (
            <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
              <Card className="transition-colors hover:border-hairline-strong">
                <CardHeader>
                  <CardTitle className="font-display text-xl">{workspace.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-steel text-sm">{workspace.slug}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

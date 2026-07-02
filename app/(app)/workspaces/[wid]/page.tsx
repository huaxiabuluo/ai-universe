import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import {
  assertMember,
  getWorkspace,
  listMembers,
  WorkspaceNotFound,
  type Workspace,
} from "@/lib/workspaces";
import { MembersPanel } from "./_components/members-panel";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ wid: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { wid } = await params;

  let workspace: Workspace | undefined;
  try {
    workspace = await getWorkspace(wid);
  } catch (error) {
    if (error instanceof WorkspaceNotFound) notFound();
    throw error;
  }
  if (!workspace) notFound();
  try {
    await assertMember(wid, session.userId);
  } catch {
    notFound();
  }

  const members = await listMembers(wid);
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl tracking-tight">{workspace.name}</h1>
      <MembersPanel currentUserId={session.userId} initialMembers={members} workspaceId={wid} />
      <Card>
        <CardContent>
          <p className="text-steel text-sm py-12 text-center">协作聊天即将上线（下一阶段接入）</p>
        </CardContent>
      </Card>
    </div>
  );
}

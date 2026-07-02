import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  assertMember,
  getWorkspace,
  listMembers,
  WorkspaceNotFound,
  type Workspace,
} from "@/lib/workspaces";
import { MembersPanel } from "./_components/members-panel";
import { WorkspaceChat } from "./_components/workspace-chat";

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
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-tight">{workspace.name}</h1>
      </div>
      <MembersPanel currentUserId={session.userId} initialMembers={members} workspaceId={wid} />
      <WorkspaceChat workspaceId={wid} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { WorkspaceMember } from "@/lib/workspaces";

export function MembersPanel({
  currentUserId,
  initialMembers,
  workspaceId,
}: {
  readonly currentUserId: string;
  readonly initialMembers: WorkspaceMember[];
  readonly workspaceId: string;
}) {
  const router = useRouter();
  const [members] = useState(initialMembers);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    setLoading(false);
    if (res.ok) {
      setUsername("");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "邀请失败");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">成员</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-1 text-sm">
          {members.map((member) => (
            <li className="flex items-center gap-2" key={member.userId}>
              <span>{member.username}</span>
              <span className="text-stone text-xs">
                {member.role === "owner" ? "owner" : "member"}
              </span>
              {member.userId === currentUserId ? (
                <span className="text-stone text-xs">（你）</span>
              ) : null}
            </li>
          ))}
        </ul>
        <form className="flex items-end gap-2" onSubmit={invite}>
          <div className="flex-1 space-y-1">
            <label className="text-steel text-xs" htmlFor="invite-username">
              按用户名邀请
            </label>
            <Input
              id="invite-username"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              value={username}
            />
          </div>
          <Button disabled={loading || !username.trim()} type="submit">
            {loading ? "邀请中…" : "邀请"}
          </Button>
        </form>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

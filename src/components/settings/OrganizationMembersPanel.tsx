"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCapex } from "@/context/CapexContext";
import { CapexApiError } from "@/lib/api/client";
import {
  createOrgInvitation,
  listOrgInvitations,
  listOrgMembers,
  removeOrgMember,
  revokeOrgInvitation,
  updateOrgMemberRole,
  type OrgInvitation,
  type OrgMember,
} from "@/lib/api/capex-api";
import { roleLabel } from "@/lib/roles";

type InviteRole = "admin" | "editor" | "viewer";

export function OrganizationMembersPanel() {
  const {
    canManageOrg,
    currentUserEmail,
    membershipRole,
    organizationName,
    renameWorkspace,
  } = useCapex();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("editor");
  const [inviting, setInviting] = useState(false);
  const [nameDraft, setNameDraft] = useState(organizationName ?? "");
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    setNameDraft(organizationName ?? "");
  }, [organizationName]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const memberRows = await listOrgMembers();
      setMembers(memberRows);
      if (canManageOrg) {
        setInvites(await listOrgInvitations());
      } else {
        setInvites([]);
      }
    } catch (error) {
      toast.error("Could not load members", {
        description:
          error instanceof Error ? error.message : "Request failed",
      });
    } finally {
      setLoading(false);
    }
  }, [canManageOrg]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setInviting(true);
    try {
      const created = await createOrgInvitation({ email: trimmed, role });
      toast.success("Invitation created", {
        description: "Copy the link and send it to the teammate.",
      });
      setEmail("");
      if (created.acceptUrl && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(created.acceptUrl);
          toast.message("Invite link copied to clipboard");
        } catch {
          // ignore
        }
      }
      await reload();
    } catch (error) {
      toast.error("Invite failed", {
        description:
          error instanceof CapexApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Unable to invite",
      });
    } finally {
      setInviting(false);
    }
  };

  const onCopyLink = async (invite: OrgInvitation) => {
    const url =
      invite.acceptUrl ||
      `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${invite.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.message("Invite link copied");
    } catch {
      toast.message(url);
    }
  };

  const onRename = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === organizationName) return;
    setRenaming(true);
    try {
      await renameWorkspace(trimmed);
    } catch (error) {
      toast.error("Could not rename", {
        description:
          error instanceof CapexApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Request failed",
      });
      setNameDraft(organizationName ?? "");
    } finally {
      setRenaming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading members…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h3 className="text-sm font-semibold">Workspace name</h3>
          <p className="text-sm text-muted-foreground">
            Shown in the header for everyone in this organization.
          </p>
        </div>
        {canManageOrg ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1 space-y-1">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                disabled={renaming}
              />
            </div>
            <Button
              type="button"
              disabled={
                renaming ||
                !nameDraft.trim() ||
                nameDraft.trim() === (organizationName ?? "")
              }
              onClick={() => void onRename()}
            >
              {renaming ? "Saving…" : "Save name"}
            </Button>
          </div>
        ) : (
          <p className="text-sm font-medium">{organizationName ?? "—"}</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold">Members</h3>
        <p className="text-sm text-muted-foreground">
          People with access to this workspace
          {membershipRole ? ` (you are ${roleLabel(membershipRole)})` : ""}.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {canManageOrg ? (
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isSelf =
                currentUserEmail?.toLowerCase() === member.email.toLowerCase();
              const isOwner = member.role === "owner";
              return (
                <TableRow key={member.userId}>
                  <TableCell className="font-medium">
                    {member.email}
                    {isSelf ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (you)
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {canManageOrg && !isOwner && !isSelf ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) => {
                          void (async () => {
                            try {
                              await updateOrgMemberRole(
                                member.userId,
                                value as InviteRole,
                              );
                              await reload();
                            } catch (error) {
                              toast.error("Could not update role", {
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "Failed",
                              });
                            }
                          })();
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      roleLabel(member.role)
                    )}
                  </TableCell>
                  {canManageOrg ? (
                    <TableCell className="text-right">
                      {!isOwner && !isSelf ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${member.email}`}
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Remove ${member.email} from this workspace?`,
                              )
                            ) {
                              return;
                            }
                            void (async () => {
                              try {
                                await removeOrgMember(member.userId);
                                await reload();
                              } catch (error) {
                                toast.error("Could not remove member", {
                                  description:
                                    error instanceof Error
                                      ? error.message
                                      : "Failed",
                                });
                              }
                            })();
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {canManageOrg ? (
        <>
          <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
            <h4 className="text-sm font-semibold">Invite teammate</h4>
            <p className="text-xs text-muted-foreground">
              Creates a shareable link (email delivery not configured). The
              invitee must use the same email address.
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
              <div className="space-y-1">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as InviteRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  disabled={inviting || !email.trim()}
                  onClick={() => void onInvite()}
                >
                  {inviting ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-1 h-4 w-4" />
                  )}
                  Invite
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Pending invitations</h4>
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invites.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="w-[100px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>{invite.email}</TableCell>
                        <TableCell>{roleLabel(invite.role)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Copy invite link"
                              onClick={() => void onCopyLink(invite)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Revoke invite"
                              onClick={() => {
                                void (async () => {
                                  try {
                                    await revokeOrgInvitation(invite.id);
                                    await reload();
                                  } catch (error) {
                                    toast.error("Could not revoke", {
                                      description:
                                        error instanceof Error
                                          ? error.message
                                          : "Failed",
                                    });
                                  }
                                })();
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

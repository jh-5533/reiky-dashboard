'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface Props {
  profiles: Profile[]
}

export function UsersSettings({ profiles: initialProfiles }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)

  async function updateRole(userId: string, role: 'admin' | 'staff') {
    const supabase = createClient()
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, role } : p))
    )
  }

  async function deactivate(userId: string) {
    // In practice, you'd disable the auth user. Here we just reflect it.
    const supabase = createClient()
    await supabase.auth.admin?.deleteUser(userId)
    setProfiles((prev) => prev.filter((p) => p.id !== userId))
  }

  async function handleInvite() {
    if (!inviteEmail) return
    setInviting(true)
    setInviteMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.admin?.inviteUserByEmail(
        inviteEmail
      ) ?? {}
      if (error) throw error
      setInviteMsg(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
    } catch {
      setInviteMsg('Invite failed. Check Supabase admin permissions.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* User table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className="text-sm">{profile.email}</TableCell>
              <TableCell className="text-sm">
                {profile.full_name ?? '—'}
              </TableCell>
              <TableCell>
                <Select
                  value={profile.role}
                  onValueChange={(v) =>
                    updateRole(profile.id, v as 'admin' | 'staff')
                  }
                >
                  <SelectTrigger className="h-8 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString('en-SG', {
                  month: 'short',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive h-8"
                  onClick={() => deactivate(profile.id)}
                >
                  Deactivate
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {profiles.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-4"
              >
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Invite */}
      <div className="space-y-2">
        <Label>Invite User</Label>
        <div className="flex gap-2 max-w-sm">
          <Input
            type="email"
            placeholder="staff@reiky.sg"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Button onClick={handleInvite} disabled={inviting} size="sm">
            {inviting ? 'Sending…' : 'Invite'}
          </Button>
        </div>
        {inviteMsg && (
          <p className="text-xs text-muted-foreground">{inviteMsg}</p>
        )}
      </div>
    </div>
  )
}

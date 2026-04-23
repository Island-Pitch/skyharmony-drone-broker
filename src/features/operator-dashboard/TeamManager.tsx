import { useState } from 'react';
import type { TeamMember } from '@/hooks/useOperatorOverview';
import posthog from '@/lib/posthog';

interface TeamManagerProps {
  team: TeamMember[];
  isAdmin: boolean;
  onInvite: (
    email: string,
    name: string,
    role: string,
  ) => Promise<Pick<TeamMember, 'temporary_password'> | void>;
  onRemove: (userId: string) => Promise<void>;
}

export function TeamManager({ team, isAdmin, onInvite, onRemove }: TeamManagerProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [inviteTempPassword, setInviteTempPassword] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      setInviteTempPassword(null);
      const result = await onInvite(inviteEmail.trim(), inviteName.trim(), 'OperatorStaff');
      posthog.capture('team_member_invited', { role: 'OperatorStaff' });
      if (result?.temporary_password) {
        setInviteTempPassword(result.temporary_password);
      }
      setInviteEmail('');
      setInviteName('');
      setShowInvite(false);
    } catch (err) {
      posthog.captureException(err);
      setInviteError(err instanceof Error ? err.message : 'Failed to invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string) {
    setRemoving(true);
    try {
      await onRemove(userId);
      posthog.capture('team_member_removed', { removed_user_id: userId });
      setConfirmRemove(null);
    } catch {
      // silently fail
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="dashboard-widget op-team-section">
      <div className="op-team-header">
        <h3>Team</h3>
        {isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setShowInvite(!showInvite)}
            type="button"
          >
            {showInvite ? 'Cancel' : 'Invite Member'}
          </button>
        )}
      </div>

      {inviteTempPassword && (
        <div className="dashboard-widget" style={{ marginBottom: '1rem' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Initial sign-in password (copy and share securely)</p>
          <code style={{ display: 'block', marginTop: '0.5rem', wordBreak: 'break-all' }}>{inviteTempPassword}</code>
          <button type="button" className="btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => setInviteTempPassword(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Slide-in invite panel */}
      <div className={`op-invite-panel ${showInvite ? 'op-invite-panel--open' : ''}`}>
        <div className="op-invite-panel-inner">
          <h4>Invite Team Member</h4>
          <form onSubmit={handleInvite} className="op-invite-form">
            <label>
              Name
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full name"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </label>
            <label>
              Role
              <select disabled>
                <option value="OperatorStaff">Operator Staff</option>
              </select>
            </label>
            {inviteError && <span className="field-error">{inviteError}</span>}
            <button className="btn-primary" type="submit" disabled={inviting}>
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        </div>
      </div>

      {/* Team member list */}
      {team.length === 0 ? (
        <p className="empty-state">No team members yet.</p>
      ) : (
        <div className="op-team-list">
          {team.map((member) => (
            <div key={member.id} className="op-team-member">
              <div className="op-team-avatar">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="op-team-info">
                <span className="op-team-name">{member.name}</span>
                <span className="op-team-email">{member.email}</span>
              </div>
              <span className={`op-role-badge op-role-${member.role.toLowerCase()}`}>
                {member.role === 'OperatorAdmin' ? 'Admin' : 'Staff'}
              </span>
              <span className="op-team-joined">
                {member.created_at
                  ? new Date(member.created_at).toLocaleDateString()
                  : ''}
              </span>
              {isAdmin && member.role !== 'OperatorAdmin' && (
                <>
                  {confirmRemove === member.id ? (
                    <span className="op-confirm-remove">
                      <button
                        className="op-confirm-yes"
                        onClick={() => handleRemove(member.id)}
                        disabled={removing}
                        type="button"
                      >
                        Confirm
                      </button>
                      <button
                        className="op-confirm-no"
                        onClick={() => setConfirmRemove(null)}
                        type="button"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      className="op-remove-btn"
                      onClick={() => setConfirmRemove(member.id)}
                      title="Remove member"
                      type="button"
                    >
                      Remove
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

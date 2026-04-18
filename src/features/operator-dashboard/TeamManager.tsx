import { useState } from 'react';
import type { TeamMember } from '@/hooks/useOperatorOverview';

interface TeamManagerProps {
  team: TeamMember[];
  isAdmin: boolean;
  onInvite: (email: string, name: string, role: string) => Promise<void>;
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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      await onInvite(inviteEmail.trim(), inviteName.trim(), 'OperatorStaff');
      setInviteEmail('');
      setInviteName('');
      setShowInvite(false);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string) {
    setRemoving(true);
    try {
      await onRemove(userId);
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

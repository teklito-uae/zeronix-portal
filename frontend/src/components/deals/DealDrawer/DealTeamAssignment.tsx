import { useQuery } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import Avatar from 'boring-avatars';
import api from '@/lib/axios';
import type { Deal, User } from '@/types';
import { Label } from '@/components/ui/label';
import { useThemeStore } from '@/store/useThemeStore';
import { Users } from 'lucide-react';

interface DealTeamAssignmentProps {
  deal: Deal;
  assignDeal: UseMutationResult<Deal, unknown, { id: number | string; user_ids: number[] }, unknown>;
}

/**
 * Team-assignment avatar toggles. `assignDeal`'s endpoint (`PUT
 * .../assign`) does a full sync of `user_ids`, not an incremental
 * add/remove — every click here sends the full resulting id list, exactly
 * like Deals.tsx's `assignTeam` mutation.
 */
export const DealTeamAssignment = ({ deal, assignDeal }: DealTeamAssignmentProps) => {
  const { theme } = useThemeStore();
  const avatarColors = theme === 'dark'
    ? ['#ff4d6d', '#ff758f', '#ffbe0b', '#fdfcdc', '#48cae4']
    : ['#cc063e', '#e83535', '#fd9407', '#e2d9c2', '#10898b'];

  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => (await api.get('/admin/users?per_page=100')).data.data as User[],
  });

  const toggleUser = (userId: number) => {
    const isAssigned = deal.assigned_users?.some((au) => au.id === userId);
    const currentIds = deal.assigned_users?.map((au) => au.id) || [];
    const newIds = isAssigned ? currentIds.filter((id) => id !== userId) : [...currentIds, userId];
    assignDeal.mutate({ id: deal.id, user_ids: newIds });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[12px] font-medium text-brand-secondary ml-1 flex items-center gap-1.5">
          <Users size={13} /> Team Assignment
        </Label>
        <span className="text-[11px] font-medium text-brand-subtle">{deal.assigned_users?.length || 0} assigned</span>
      </div>
      <div className="bg-brand-surface border border-brand-border/50 rounded-xl p-3">
        <div className="flex flex-wrap gap-2">
          {usersList.map((u) => {
            const isAssigned = deal.assigned_users?.some((au) => au.id === u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleUser(u.id)}
                disabled={assignDeal.isPending}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                  isAssigned
                    ? 'bg-brand-primary border-brand-primary shadow-md scale-105'
                    : 'bg-brand-white border-brand-border/50 hover:border-brand-primary/30 opacity-70 hover:opacity-100'
                }`}
              >
                <div className={`transition-transform ${isAssigned ? 'scale-110' : ''}`}>
                  <Avatar size={18} name={u.name} variant="beam" colors={avatarColors} />
                </div>
                <span className={`text-[11px] font-bold ${isAssigned ? 'text-brand-white' : 'text-brand-secondary'}`}>
                  {u.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

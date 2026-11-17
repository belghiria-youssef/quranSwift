import { ReactNode, createContext, useContext, useMemo, useState } from 'react';

import { ReadingSystem, Team } from '@/domain/entities/Team';
import { useTeams } from '@/presentation/hooks/useTeams';

interface ActiveTeamValue {
  teams: Team[];
  loading: boolean;
  activeTeam: Team | null;
  setActiveTeamId: (id: string) => void;
  createTeam: (name: string, readingSystem: ReadingSystem) => Promise<Team>;
  joinByCode: (code: string) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  renameTeam: (teamId: string, name: string) => Promise<void>;
}

const ActiveTeamContext = createContext<ActiveTeamValue | null>(null);

export function ActiveTeamProvider({ children }: { children: ReactNode }) {
  const { teams, loading, createTeam, joinByCode, deleteTeam, renameTeam } = useTeams();
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeId) ?? teams[0] ?? null,
    [teams, activeId],
  );

  const value = useMemo<ActiveTeamValue>(
    () => ({
      teams,
      loading,
      activeTeam,
      setActiveTeamId: setActiveId,
      createTeam,
      joinByCode,
      deleteTeam,
      renameTeam,
    }),
    [teams, loading, activeTeam, createTeam, joinByCode, deleteTeam, renameTeam],
  );

  return <ActiveTeamContext.Provider value={value}>{children}</ActiveTeamContext.Provider>;
}

export function useActiveTeam(): ActiveTeamValue {
  const context = useContext(ActiveTeamContext);
  if (!context) {
    throw new Error('useActiveTeam must be used within ActiveTeamProvider');
  }
  return context;
}
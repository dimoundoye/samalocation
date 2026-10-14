// Espaces de travail d'un compte : son espace personnel et les équipes de propriétaires qu'il a rejointes.
// L'espace actif est mémorisé dans localStorage ("active_context") et envoyé au serveur (en-tête X-Active-Context),
// qui vérifie lui-même l'adhésion : ce fichier ne sert qu'à l'affichage.

export interface Workspace {
  id: string;
  name: string;
  type?: string;
  role: string;
  permissions: string[];
  available?: boolean;
}

interface WorkspaceUser {
  id: string;
  organizations?: Workspace[];
}

const STORAGE_KEY = "active_context";

const readStoredContext = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/** Équipes d'autres propriétaires dans lesquelles l'utilisateur peut travailler. */
export const getTeamWorkspaces = (user: WorkspaceUser | null | undefined): Workspace[] =>
  (user?.organizations || []).filter(o => o.id !== user!.id && o.role !== "owner" && o.available === true);

/** Membre de l'équipe d'au moins un autre propriétaire (même si cet espace est momentanément indisponible). */
export const isTeamMember = (user: WorkspaceUser | null | undefined): boolean =>
  (user?.organizations || []).some(o => o.id !== user!.id && o.role !== "owner");

/** Équipe active, ou null quand l'utilisateur est dans son espace personnel. */
export const getActiveWorkspace = (
  user: WorkspaceUser | null | undefined,
  stored: string | null = readStoredContext()
): Workspace | null => {
  if (!stored || stored === "personal") return null;
  return getTeamWorkspaces(user).find(o => o.id === stored) || null;
};

/** Événement émis à chaque changement d'espace : les données propres à l'espace (abonnement...) se rechargent. */
export const WORKSPACE_CHANGED_EVENT = "samalocation:workspace-changed";

export const setActiveWorkspaceId = (id: string | null) => {
  const next = !id || id === "personal" ? null : id;
  if (next === (readStoredContext() || null)) return;
  try {
    if (!next) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Stockage indisponible : on reste dans l'espace personnel
  }
  window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT));
};

/** Oublie un espace mémorisé auquel l'utilisateur n'a plus accès (retiré de l'équipe, abonnement expiré). */
export const dropStaleWorkspace = (user: WorkspaceUser | null | undefined) => {
  const stored = readStoredContext();
  if (stored && stored !== "personal" && !getActiveWorkspace(user)) {
    setActiveWorkspaceId(null);
  }
};

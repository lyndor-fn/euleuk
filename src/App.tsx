import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Bot,
  Briefcase,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Palette,
  PlusCircle,
  Send,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UserCircle,
  Users,
  WandSparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ChatMessage, Profile, Recommendation, User } from './types';

type View =
  | 'landing'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'profile'
  | 'chat'
  | 'coach-dashboard';

type AccentTheme = 'sunrise' | 'lagoon' | 'canopy';
type Density = 'comfortable' | 'compact';

type UISettings = {
  accent: AccentTheme;
  density: Density;
  motion: boolean;
};

type StudentSummary = {
  id: number;
  full_name: string;
  email: string;
  skills?: string | null;
  goals?: string | null;
};

type SidebarItem = {
  view: View;
  label: string;
  icon: LucideIcon;
};

const UI_SETTINGS_KEY = 'euleuk_ui_settings';
const USER_STORAGE_KEY = 'euleuk_user';
const VIEW_STORAGE_KEY = 'euleuk_view';

const DEFAULT_UI_SETTINGS: UISettings = {
  accent: 'sunrise',
  density: 'comfortable',
  motion: true,
};

const themeOptions: Array<{
  value: AccentTheme;
  name: string;
  description: string;
  preview: string;
}> = [
  {
    value: 'sunrise',
    name: 'Sahel',
    description: 'Chaleureux, solaire et editorial.',
    preview: 'linear-gradient(135deg, #cb7a52 0%, #f0d7ab 100%)',
  },
  {
    value: 'lagoon',
    name: 'Lagon',
    description: 'Plus tech, plus net, tres lisible.',
    preview: 'linear-gradient(135deg, #0f7c82 0%, #9be3db 100%)',
  },
  {
    value: 'canopy',
    name: 'Canopee',
    description: 'Pose, premium, oriente progression.',
    preview: 'linear-gradient(135deg, #557a46 0%, #d5e3ae 100%)',
  },
];

const densityOptions: Array<{ value: Density; label: string; description: string }> = [
  {
    value: 'comfortable',
    label: 'Confort',
    description: 'Plus d air et des cartes plus genereuses.',
  },
  {
    value: 'compact',
    label: 'Compact',
    description: 'Davantage d information a l ecran.',
  },
];

const studentNavItems: SidebarItem[] = [
  { view: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { view: 'profile', label: 'Mon profil', icon: UserCircle },
  { view: 'chat', label: 'Chat IA', icon: MessageSquare },
];

const coachNavItems: SidebarItem[] = [
  { view: 'coach-dashboard', label: 'Etudiants', icon: Users },
];

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function getStoredView(): View | null {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (!raw) return null;
    const allowed: View[] = [
      'landing',
      'login',
      'signup',
      'dashboard',
      'profile',
      'chat',
      'coach-dashboard',
    ];
    return allowed.includes(raw as View) ? (raw as View) : null;
  } catch {
    return null;
  }
}

function getStoredChatMessages(userId: number | null): ChatMessage[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`euleuk_chat_${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function getStoredUiSettings(): UISettings {
  try {
    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    if (!raw) return DEFAULT_UI_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UISettings>;
    return {
      accent:
        parsed.accent === 'lagoon' || parsed.accent === 'canopy' || parsed.accent === 'sunrise'
          ? parsed.accent
          : DEFAULT_UI_SETTINGS.accent,
      density: parsed.density === 'compact' ? 'compact' : 'comfortable',
      motion: parsed.motion ?? true,
    };
  } catch {
    return DEFAULT_UI_SETTINGS;
  }
}

function normalizeViewForRole(currentView: View, role: User['role']): View {
  if (role === 'student') {
    return currentView === 'coach-dashboard' ? 'dashboard' : currentView;
  }
  return currentView === 'dashboard' || currentView === 'profile' || currentView === 'chat'
    ? 'coach-dashboard'
    : currentView;
}

function getFirstName(fullName?: string | null) {
  return fullName?.trim().split(/\s+/)[0] ?? 'ami';
}

function calculateProfileCompletion(profile: Profile | null) {
  if (!profile) return 0;
  const fields: Array<Exclude<keyof Profile, 'user_id'>> = [
    'skills',
    'hobbies',
    'personality',
    'favorite_subjects',
    'goals',
    'strengths',
    'weaknesses',
  ];
  const completed = fields.filter((field) => profile[field]?.trim()).length;
  return Math.round((completed / fields.length) * 100);
}

function splitKeywords(value?: string | null, limit = 3) {
  if (!value) return [];
  return value
    .split(/[,;/]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function getRecommendationScore(index: number) {
  return Math.max(74, 94 - index * 5);
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon apres-midi';
  return 'Bonsoir';
}

const AppSidebar = memo(function AppSidebar({
  title,
  subtitle,
  items,
  activeView,
  userLabel,
  onNavigate,
  onOpenPersonalization,
  onLogout,
}: {
  title: string;
  subtitle: string;
  items: SidebarItem[];
  activeView: View;
  userLabel: string;
  onNavigate: (view: View) => void;
  onOpenPersonalization: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="glass-card sticky top-4 z-20 flex flex-col gap-4 p-4 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Euleuk
            </p>
            <h1 className="font-serif text-2xl text-[var(--text)]">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onOpenPersonalization} className="icon-button">
              <Palette size={18} />
            </button>
            <button type="button" onClick={onLogout} className="icon-button text-red-600">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item) => {
            const isActive = item.view === activeView;
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => onNavigate(item.view)}
                className={`nav-chip whitespace-nowrap ${isActive ? 'nav-chip-active' : ''}`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="glass-card hidden w-full max-w-[18rem] flex-col gap-6 p-5 lg:sticky lg:top-6 lg:flex">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Plateforme
            </p>
            <h2 className="font-serif text-3xl text-[var(--text)]">Euleuk</h2>
          </div>
          <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
            <p className="text-sm font-semibold text-[var(--text)]">{userLabel}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const isActive = item.view === activeView;
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => onNavigate(item.view)}
                className={`nav-chip w-full justify-start ${isActive ? 'nav-chip-active' : ''}`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <button type="button" onClick={onOpenPersonalization} className="ghost-button w-full">
            <Palette size={18} />
            Personnaliser
          </button>
          <button type="button" onClick={onLogout} className="ghost-button w-full text-red-600">
            <LogOut size={18} />
            Deconnexion
          </button>
        </div>
      </aside>
    </>
  );
});

const PersonalizationPanel = memo(function PersonalizationPanel({
  open,
  settings,
  onClose,
  onUpdate,
}: {
  open: boolean;
  settings: UISettings;
  onClose: () => void;
  onUpdate: (next: UISettings) => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
            aria-label="Fermer le panneau de personnalisation"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.24 }}
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-md border-l border-[var(--border)] bg-[var(--panel-strong)]/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex h-full flex-col">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                    Personnalisation
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-[var(--text)]">
                    Une interface qui vous ressemble
                  </h2>
                </div>
                <button type="button" onClick={onClose} className="icon-button">
                  <ArrowRight size={18} className="rotate-180" />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto pr-1">
                <section className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text)]">Palette visuelle</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Choisissez un accent plus editorial, plus tech ou plus nature.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onUpdate({ ...settings, accent: option.value })}
                        className={`theme-option ${settings.accent === option.value ? 'theme-option-active' : ''}`}
                      >
                        <span className="theme-preview" style={{ background: option.preview }} />
                        <span className="flex-1 text-left">
                          <span className="block font-semibold text-[var(--text)]">{option.name}</span>
                          <span className="block text-sm text-[var(--muted)]">{option.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text)]">Densite</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Ajustez l espace disponible selon votre rythme de travail.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {densityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onUpdate({ ...settings, density: option.value })}
                        className={`choice-card ${settings.density === option.value ? 'choice-card-active' : ''}`}
                      >
                        <span className="font-semibold text-[var(--text)]">{option.label}</span>
                        <span className="mt-1 block text-sm text-[var(--muted)]">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text)]">Animations</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Gardez une interface expressive ou reduisez les effets visuels.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => onUpdate({ ...settings, motion: true })}
                      className={`choice-card ${settings.motion ? 'choice-card-active' : ''}`}
                    >
                      <span className="font-semibold text-[var(--text)]">Dynamique</span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">
                        Transitions souples et mise en valeur progressive.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdate({ ...settings, motion: false })}
                      className={`choice-card ${!settings.motion ? 'choice-card-active' : ''}`}
                    >
                      <span className="font-semibold text-[var(--text)]">Sobre</span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">
                        Moins de mouvement, chargement percu plus direct.
                      </span>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
});

const LandingPage = memo(function LandingPage({
  onSignup,
  onLogin,
  onOpenPersonalization,
}: {
  onSignup: () => void;
  onLogin: () => void;
  onOpenPersonalization: () => void;
}) {
  const highlights = [
    'Analyse de profil plus claire',
    'Dashboard plus personnel',
    'Chat IA mieux contextualise',
  ];

  return (
    <div className="min-h-screen px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="glass-card flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Orientation augmentee
            </p>
            <h1 className="font-serif text-3xl text-[var(--text)] md:text-4xl">Euleuk</h1>
          </div>
          <button type="button" onClick={onOpenPersonalization} className="ghost-button">
            <Palette size={18} />
            Personnaliser
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card hero-panel overflow-hidden p-7 md:p-10"
          >
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm font-medium text-[var(--text)]">
                <Sparkles size={16} className="text-[var(--accent)]" />
                Une experience plus design, plus lisible, plus personnalisee
              </div>
              <h2 className="mt-6 font-serif text-5xl leading-[0.95] text-[var(--text)] md:text-7xl">
                L orientation qui part vraiment de votre profil.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                Euleuk combine votre parcours, vos centres d interet et vos objectifs pour
                proposer des pistes de metiers, un suivi et un coach IA plus utiles au quotidien.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={onSignup} className="accent-button">
                  Commencer maintenant
                  <ArrowRight size={18} />
                </button>
                <button type="button" onClick={onLogin} className="ghost-button">
                  Se connecter
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {highlights.map((item) => (
                  <span key={item} className="accent-pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.section>

          <div className="grid gap-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="glass-card p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Ce qui change
              </p>
              <div className="mt-5 space-y-4">
                <div className="metric-card">
                  <Target className="text-[var(--accent)]" size={20} />
                  <div>
                    <p className="font-semibold text-[var(--text)]">Parcours personnalise</p>
                    <p className="text-sm text-[var(--muted)]">
                      Des ecrans adaptes au role et a l avancement du profil.
                    </p>
                  </div>
                </div>
                <div className="metric-card">
                  <WandSparkles className="text-[var(--accent)]" size={20} />
                  <div>
                    <p className="font-semibold text-[var(--text)]">Look plus premium</p>
                    <p className="text-sm text-[var(--muted)]">
                      Nouvelle direction visuelle, plus forte et moins generique.
                    </p>
                  </div>
                </div>
                <div className="metric-card">
                  <TrendingUp className="text-[var(--accent)]" size={20} />
                  <div>
                    <p className="font-semibold text-[var(--text)]">Chargement plus propre</p>
                    <p className="text-sm text-[var(--muted)]">
                      Moins de requetes inutiles et interface plus reactive.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="glass-card p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Valeur immediate
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
                  <p className="text-3xl font-semibold text-[var(--text)]">3x</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    plus de reperes visuels dans le dashboard
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
                  <p className="text-3xl font-semibold text-[var(--text)]">100%</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    d interface adaptable via la personnalisation
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border)] bg-white/70 p-4">
                  <p className="text-3xl font-semibold text-[var(--text)]">0 re-fetch</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    inutile a chaque changement de vue
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
});

const AuthForm = memo(function AuthForm({
  type,
  fullName,
  username,
  identifier,
  role,
  email,
  password,
  loading,
  error,
  onFullNameChange,
  onUsernameChange,
  onIdentifierChange,
  onRoleChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleView,
  onBack,
}: {
  type: 'login' | 'signup';
  fullName: string;
  username: string;
  identifier: string;
  role: 'student' | 'coach';
  email: string;
  password: string;
  loading: boolean;
  error: string;
  onFullNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onIdentifierChange: (value: string) => void;
  onRoleChange: (value: 'student' | 'coach') => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleView: () => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card hero-panel hidden flex-col justify-between p-8 lg:flex"
        >
          <div>
            <button type="button" onClick={onBack} className="ghost-button">
              <ArrowRight size={18} className="rotate-180" />
              Retour
            </button>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Experience etudiante
            </p>
            <h1 className="mt-3 font-serif text-6xl leading-[0.92] text-[var(--text)]">
              Prenez une longueur d avance sur votre avenir.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Creez votre profil, laissez l IA vous suggerer des metiers coherents, puis affinez
              vos choix avec un espace plus lisible et plus motivant.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="metric-card">
              <Sparkles size={20} className="text-[var(--accent)]" />
              <div>
                <p className="font-semibold text-[var(--text)]">Profil enrichi</p>
                <p className="text-sm text-[var(--muted)]">7 dimensions pour mieux cibler les recommandations.</p>
              </div>
            </div>
            <div className="metric-card">
              <Bot size={20} className="text-[var(--accent)]" />
              <div>
                <p className="font-semibold text-[var(--text)]">Chat contextualise</p>
                <p className="text-sm text-[var(--muted)]">L IA repond selon vos objectifs et vos points forts.</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 md:p-8"
        >
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                {type === 'login' ? 'Connexion' : 'Creation de compte'}
              </p>
              <h2 className="mt-2 font-serif text-4xl text-[var(--text)]">
                {type === 'login' ? 'Bienvenue' : 'Rejoindre Euleuk'}
              </h2>
            </div>
            <button type="button" onClick={onBack} className="ghost-button lg:hidden">
              Retour
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {type === 'signup' ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text)]">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(event) => onFullNameChange(event.target.value)}
                    className="app-input w-full"
                    placeholder="Ex: Awa Ndiaye"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                    Nom d utilisateur
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(event) => onUsernameChange(event.target.value)}
                    className="app-input w-full"
                    placeholder="Ex: awa.ndiaye"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text)]">Role</label>
                  <select
                    value={role}
                    onChange={(event) => onRoleChange(event.target.value as 'student' | 'coach')}
                    className="app-input w-full"
                  >
                    <option value="student">Etudiant</option>
                    <option value="coach">Coach / Administrateur</option>
                  </select>
                </div>
              </>
            ) : null}

            {type === 'login' ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  Email ou nom d utilisateur
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(event) => onIdentifierChange(event.target.value)}
                  className="app-input w-full"
                  placeholder="Ex: awa.ndiaye ou nom@exemple.com"
                />
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  className="app-input w-full"
                  placeholder="nom@exemple.com"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                className="app-input w-full"
                placeholder="Minimum 8 caracteres"
              />
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={loading} className="accent-button w-full justify-center">
              {loading ? 'Chargement...' : type === 'login' ? 'Se connecter' : 'Creer mon compte'}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--muted)]">
            {type === 'login' ? 'Pas encore de compte ?' : 'Deja inscrit ?'}
            <button type="button" onClick={onToggleView} className="ml-2 font-semibold text-[var(--accent)]">
              {type === 'login' ? 'S inscrire' : 'Se connecter'}
            </button>
          </p>
        </motion.section>
      </div>
    </div>
  );
});

const StudentDashboard = memo(function StudentDashboard({
  user,
  view,
  profile,
  recommendations,
  recommendationError,
  profileCompletion,
  chatCount,
  initialDataLoading,
  recommendationsLoading,
  onNavigate,
  onGenerateRecommendations,
  onOpenPersonalization,
  onLogout,
}: {
  user: User;
  view: View;
  profile: Profile | null;
  recommendations: Recommendation[];
  recommendationError: string;
  profileCompletion: number;
  chatCount: number;
  initialDataLoading: boolean;
  recommendationsLoading: boolean;
  onNavigate: (view: View) => void;
  onGenerateRecommendations: () => void;
  onOpenPersonalization: () => void;
  onLogout: () => void;
}) {
  const firstName = getFirstName(user.full_name);
  const focusAreas = useMemo(
    () => [
      ...splitKeywords(profile?.skills, 2),
      ...splitKeywords(profile?.favorite_subjects, 1),
      ...splitKeywords(profile?.goals, 1),
    ].slice(0, 4),
    [profile],
  );

  const nextStep = !profile
    ? { label: 'Completer mon profil', action: () => onNavigate('profile') }
    : recommendations.length === 0
      ? { label: 'Lancer une analyse IA', action: onGenerateRecommendations }
      : { label: 'Ouvrir le chat IA', action: () => onNavigate('chat') };

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-start">
        <AppSidebar
          title="Espace etudiant"
          subtitle="Suivi, recommandations et chat IA."
          items={studentNavItems}
          activeView={view}
          userLabel={user.full_name}
          onNavigate={onNavigate}
          onOpenPersonalization={onOpenPersonalization}
          onLogout={onLogout}
        />

        <main className="flex-1 space-y-4">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card hero-panel overflow-hidden p-6 md:p-8"
          >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {getTimeGreeting()}, {firstName}
                </p>
                <h1 className="mt-3 font-serif text-4xl leading-tight text-[var(--text)] md:text-6xl">
                  Votre cap d orientation est maintenant plus clair.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
                  Retrouvez un espace plus lisible, des reperes plus personnels et des suggestions
                  mieux mises en valeur pour avancer sans friction.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {(focusAreas.length > 0 ? focusAreas : ['profil a completer', 'recommandations IA', 'suivi intelligent']).map(
                    (item) => (
                      <span key={item} className="accent-pill">
                        {item}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="grid min-w-full gap-3 sm:grid-cols-3 xl:min-w-[20rem]">
                <div className="rounded-[28px] border border-[var(--border)] bg-white/78 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Profil</p>
                  <p className="mt-2 text-4xl font-semibold text-[var(--text)]">{profileCompletion}%</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {profile ? 'Niveau de completion du dossier' : 'Profil non commence'}
                  </p>
                </div>
                <div className="rounded-[28px] border border-[var(--border)] bg-white/78 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Chat</p>
                  <p className="mt-2 text-4xl font-semibold text-[var(--text)]">{chatCount}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Questions deja posees au coach IA</p>
                </div>
                <div className="rounded-[28px] border border-[var(--border)] bg-white/78 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Cap</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                    {recommendations[0]?.job_title ?? 'A definir'}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {recommendations.length > 0 ? 'Piste principale recommandee' : 'A generer avec l IA'}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <section className="glass-card p-5 md:p-6">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                    Recommandations
                  </p>
                  <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-[var(--text)]">
                    <Briefcase size={22} className="text-[var(--accent)]" />
                    Metiers qui vous correspondent
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onGenerateRecommendations}
                  disabled={!profile || recommendationsLoading}
                  className="accent-button"
                >
                  <WandSparkles size={18} />
                  {recommendationsLoading ? 'Analyse...' : 'Actualiser'}
                </button>
              </div>

              {recommendationError ? (
                <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {recommendationError}
                </p>
              ) : null}

              {initialDataLoading ? (
                <div className="grid gap-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="skeleton-block h-28 rounded-[26px]" />
                  ))}
                </div>
              ) : recommendations.length > 0 ? (
                <div className="grid gap-3">
                  {recommendations.map((recommendation, index) => (
                    <motion.article
                      key={recommendation.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-[28px] border border-[var(--border)] bg-white/78 p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                            Score d affinite
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-[var(--text)]">
                            {recommendation.job_title}
                          </h3>
                        </div>
                        <div className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
                          {getRecommendationScore(index)}%
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                        {recommendation.explanation}
                      </p>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[30px] border border-dashed border-[var(--border)] bg-white/65 px-6 py-12 text-center">
                  <Briefcase size={42} className="mx-auto text-[var(--accent)]/70" />
                  <h3 className="mt-4 text-xl font-semibold text-[var(--text)]">
                    Pas encore de recommandations
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--muted)]">
                    Completez votre profil puis lancez une analyse pour obtenir des pistes de
                    metiers plus pertinentes.
                  </p>
                </div>
              )}
            </section>

            <div className="grid gap-4">
              <section className="glass-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Progression
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                  Votre rythme actuel
                </h2>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--accent-soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                    style={{ width: `${Math.max(profileCompletion, 8)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {profileCompletion >= 100
                    ? 'Excellent. Votre profil est complet et pret pour des recommandations plus fines.'
                    : `Il reste ${Math.max(0, 100 - profileCompletion)}% a renseigner pour enrichir vos suggestions.`}
                </p>
              </section>

              <section className="glass-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Action prioritaire
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">{nextStep.label}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  L interface vous propose en continu l etape la plus utile selon l avancement de
                  votre dossier.
                </p>
                <button type="button" onClick={nextStep.action} className="ghost-button mt-5 w-full justify-center">
                  Continuer
                  <ChevronRight size={18} />
                </button>
              </section>

              <section className="glass-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Raccourcis
                </p>
                <div className="mt-4 space-y-3">
                  <button type="button" onClick={() => onNavigate('chat')} className="quick-link">
                    <span className="flex items-center gap-3">
                      <MessageSquare size={18} />
                      Poser une question au coach IA
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  <button type="button" onClick={() => onNavigate('profile')} className="quick-link">
                    <span className="flex items-center gap-3">
                      <Settings size={18} />
                      Ajuster mon profil
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  <button type="button" onClick={onOpenPersonalization} className="quick-link">
                    <span className="flex items-center gap-3">
                      <Palette size={18} />
                      Changer le style de l interface
                    </span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
});

const ProfileForm = memo(function ProfileForm({
  profile,
  loading,
  onSubmit,
  onCancel,
}: {
  profile: Profile | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-5xl">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8"
        >
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Profil etudiant
              </p>
              <h1 className="mt-2 font-serif text-4xl text-[var(--text)] md:text-5xl">
                Construire un profil plus utile a l IA
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                Plus votre profil est precis, plus les recommandations et les reponses du coach IA
                seront coherentes.
              </p>
            </div>
            <button type="button" onClick={onCancel} className="ghost-button">
              Retour au dashboard
            </button>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  Competences techniques et academiques
                </label>
                <textarea
                  name="skills"
                  required
                  defaultValue={profile?.skills}
                  className="app-textarea h-28 w-full"
                  placeholder="Ex: Python, mathematiques, redaction..."
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  Hobbies et centres d interet
                </label>
                <textarea
                  name="hobbies"
                  required
                  defaultValue={profile?.hobbies}
                  className="app-textarea h-28 w-full"
                  placeholder="Ex: musique, sport, montage video..."
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  Personnalite professionnelle
                </label>
                <textarea
                  name="personality"
                  required
                  defaultValue={profile?.personality}
                  className="app-textarea h-28 w-full"
                  placeholder="Ex: curieux, rigoureux, aime travailler en equipe..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  Matieres preferees
                </label>
                <input
                  name="favorite_subjects"
                  required
                  defaultValue={profile?.favorite_subjects}
                  className="app-input w-full"
                  placeholder="Ex: physique, histoire, economie..."
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  Objectifs professionnels
                </label>
                <textarea
                  name="goals"
                  required
                  defaultValue={profile?.goals}
                  className="app-textarea h-28 w-full"
                  placeholder="Ex: devenir ingenieur data ou travailler dans l education..."
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">Points forts</label>
                <input
                  name="strengths"
                  required
                  defaultValue={profile?.strengths}
                  className="app-input w-full"
                  placeholder="Ex: organisation, communication, analyse..."
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">Points faibles</label>
                <input
                  name="weaknesses"
                  required
                  defaultValue={profile?.weaknesses}
                  className="app-input w-full"
                  placeholder="Ex: prise de parole, procrastination..."
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <button type="submit" disabled={loading} className="accent-button w-full justify-center">
                {loading ? 'Enregistrement...' : 'Enregistrer mon profil'}
              </button>
            </div>
          </form>
        </motion.section>
      </div>
    </div>
  );
});

const ChatInterface = memo(function ChatInterface({
  user,
  profile,
  chatMessages,
  loading,
  inputMessage,
  chatError,
  onInputChange,
  onSendMessage,
  onNavigate,
  onOpenPersonalization,
  onLogout,
}: {
  user: User;
  profile: Profile | null;
  chatMessages: ChatMessage[];
  loading: boolean;
  inputMessage: string;
  chatError: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onNavigate: (view: View) => void;
  onOpenPersonalization: () => void;
  onLogout: () => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const quickPrompts = useMemo(
    () => [
      'Quels metiers correspondent le mieux a mon profil ?',
      'Quelles competences devrais-je renforcer en priorite ?',
      'Comment transformer mes centres d interet en projet professionnel ?',
    ],
    [],
  );
  const profileTags = useMemo(
    () => [
      ...splitKeywords(profile?.skills, 2),
      ...splitKeywords(profile?.goals, 1),
      ...splitKeywords(profile?.favorite_subjects, 1),
    ].slice(0, 4),
    [profile],
  );
  const canChat = Boolean(profile);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, loading]);

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-start">
        <AppSidebar
          title="Coach IA"
          subtitle="Conversation contextuelle et suivi."
          items={studentNavItems}
          activeView="chat"
          userLabel={user.full_name}
          onNavigate={onNavigate}
          onOpenPersonalization={onOpenPersonalization}
          onLogout={onLogout}
        />

        <main className="glass-card flex min-h-[calc(100vh-2rem)] flex-1 flex-col overflow-hidden">
          <header className="border-b border-[var(--border)] px-5 py-5 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--accent-soft)] text-[var(--accent)]">
                  <GraduationCap size={28} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                    Conversation active
                  </p>
                  <h1 className="text-2xl font-semibold text-[var(--text)]">Conseiller IA Euleuk</h1>
                  <p className="text-sm text-[var(--muted)]">
                    Base sur le profil de {getFirstName(user.full_name)} et ses objectifs.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profileTags.length > 0 ? profileTags : ['profil requis']).map((tag) => (
                  <span key={tag} className="accent-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {chatError ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {chatError}
              </p>
            ) : null}
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
            {chatMessages.length === 0 ? (
              <div className="mx-auto max-w-4xl">
                <div className="rounded-[30px] border border-[var(--border)] bg-white/78 p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <Bot size={22} className="text-[var(--accent)]" />
                    <h2 className="text-xl font-semibold text-[var(--text)]">Demarrer la discussion</h2>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                    Utilisez le chat pour comparer des metiers, comprendre vos forces ou demander un
                    plan d action personnalise.
                  </p>

                  {!canChat ? (
                    <div className="mt-6 rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--accent-soft)]/35 p-5">
                      <p className="text-sm leading-7 text-[var(--muted)]">
                        Completez d abord votre profil pour donner un contexte utile au coach IA.
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate('profile')}
                        className="ghost-button mt-4"
                      >
                        <PlusCircle size={18} />
                        Completer mon profil
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => onInputChange(prompt)}
                          className="choice-card text-left"
                        >
                          <span className="font-semibold text-[var(--text)]">{prompt}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex max-w-4xl flex-col gap-4">
                {chatMessages.map((message, index) => (
                  <motion.div
                    key={`${message.role}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-[26px] px-5 py-4 text-sm leading-7 md:max-w-[72%] ${
                        message.role === 'user'
                          ? 'bg-[var(--accent)] text-white'
                          : 'border border-[var(--border)] bg-white/82 text-[var(--text)]'
                      }`}
                    >
                      {message.content}
                    </div>
                  </motion.div>
                ))}
                {loading ? (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-[24px] border border-[var(--border)] bg-white/82 px-5 py-4">
                      <span className="loading-dot" />
                      <span className="loading-dot" />
                      <span className="loading-dot" />
                    </div>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] px-5 py-5 md:px-6">
            <div className="mx-auto flex max-w-4xl flex-col gap-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(event) => onInputChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      onSendMessage();
                    }
                  }}
                  disabled={!canChat || loading}
                  placeholder={
                    canChat
                      ? 'Ecrivez votre message...'
                      : 'Completez votre profil pour activer le coach IA'
                  }
                  className="app-input w-full"
                />
                <button
                  type="button"
                  onClick={onSendMessage}
                  disabled={loading || !inputMessage.trim() || !canChat}
                  className="accent-button h-[3.6rem] w-[3.6rem] justify-center rounded-full px-0"
                >
                  <Send size={19} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
});

const CoachDashboard = memo(function CoachDashboard({
  view,
  students,
  studentsLoading,
  selectedStudentId,
  onSelectStudent,
  onOpenPersonalization,
  onLogout,
}: {
  view: View;
  students: StudentSummary[];
  studentsLoading: boolean;
  selectedStudentId: number | null;
  onSelectStudent: (studentId: number) => void;
  onOpenPersonalization: () => void;
  onLogout: () => void;
}) {
  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );
  const profilesStarted = useMemo(
    () => students.filter((student) => student.skills || student.goals).length,
    [students],
  );

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-start">
        <AppSidebar
          title="Espace coach"
          subtitle="Suivi des etudiants et vision d ensemble."
          items={coachNavItems}
          activeView={view}
          userLabel="Coach / Administrateur"
          onNavigate={() => undefined}
          onOpenPersonalization={onOpenPersonalization}
          onLogout={onLogout}
        />

        <main className="flex-1 space-y-4">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card hero-panel p-6 md:p-8"
          >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Pilotage
                </p>
                <h1 className="mt-3 font-serif text-4xl leading-tight text-[var(--text)] md:text-6xl">
                  Suivi etudiant plus clair, plus rapide a parcourir.
                </h1>
                <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                  Vous avez maintenant une vue synthese plus lisible, avec un acces direct aux
                  etudiants et a leur niveau d avancement.
                </p>
              </div>

              <div className="grid min-w-full gap-3 sm:grid-cols-3 xl:min-w-[20rem]">
                <div className="rounded-[28px] border border-[var(--border)] bg-white/78 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Etudiants</p>
                  <p className="mt-2 text-4xl font-semibold text-[var(--text)]">{students.length}</p>
                </div>
                <div className="rounded-[28px] border border-[var(--border)] bg-white/78 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Profils actifs</p>
                  <p className="mt-2 text-4xl font-semibold text-[var(--text)]">{profilesStarted}</p>
                </div>
                <div className="rounded-[28px] border border-[var(--border)] bg-white/78 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Etat</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--text)]">
                    {studentsLoading ? 'Chargement' : 'Pret'}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <section className="glass-card overflow-hidden p-0">
              <div className="border-b border-[var(--border)] px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Liste des etudiants
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">Acces rapide aux dossiers</h2>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {studentsLoading ? (
                  <div className="space-y-3 p-5">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="skeleton-block h-20 rounded-[24px]" />
                    ))}
                  </div>
                ) : students.length > 0 ? (
                  <div className="space-y-2 p-4">
                    {students.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => onSelectStudent(student.id)}
                        className={`student-row ${student.id === selectedStudentId ? 'student-row-active' : ''}`}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] font-semibold text-[var(--accent-strong)]">
                          {student.full_name?.[0] ?? '?'}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate font-semibold text-[var(--text)]">{student.full_name}</p>
                          <p className="truncate text-sm text-[var(--muted)]">{student.email}</p>
                        </div>
                        <ChevronRight size={18} className="text-[var(--muted)]" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <Users size={40} className="mx-auto text-[var(--accent)]/70" />
                    <p className="mt-4 text-sm text-[var(--muted)]">Aucun etudiant pour le moment.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="glass-card p-5 md:p-6">
              {selectedStudent ? (
                <motion.div
                  key={selectedStudent.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                        Dossier selectionne
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold text-[var(--text)]">
                        {selectedStudent.full_name}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">{selectedStudent.email}</p>
                    </div>
                    <button type="button" className="ghost-button">
                      <MessageSquare size={18} />
                      Contacter
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[28px] border border-[var(--border)] bg-white/78 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                        Competences
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--text)]">
                        {selectedStudent.skills || 'Non renseigne'}
                      </p>
                    </div>
                    <div className="rounded-[28px] border border-[var(--border)] bg-white/78 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                        Objectifs
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--text)]">
                        {selectedStudent.goals || 'Non renseigne'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-dashed border-[var(--border)] bg-white/65 p-6">
                    <h3 className="flex items-center gap-2 text-xl font-semibold text-[var(--text)]">
                      <FileText size={20} className="text-[var(--accent)]" />
                      Dossier de suivi
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                      Cet espace peut accueillir les notes de suivi, les documents ou les prochaines
                      etapes a travailler avec l etudiant.
                    </p>
                    <button type="button" className="accent-button mt-5">
                      Ajouter une note
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-[30px] border border-dashed border-[var(--border)] bg-white/60 px-6 text-center">
                  <Users size={40} className="text-[var(--accent)]/70" />
                  <h2 className="mt-4 text-2xl font-semibold text-[var(--text)]">
                    Selectionnez un etudiant
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-7 text-[var(--muted)]">
                    Cliquez sur un nom dans la colonne de gauche pour afficher un resume du profil et
                    commencer le suivi.
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
});

export default function App() {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [view, setView] = useState<View>(() => {
    const storedUser = getStoredUser();
    const storedView = getStoredView();
    if (storedUser && storedView) {
      return normalizeViewForRole(storedView, storedUser.role);
    }
    return 'landing';
  });
  const [uiSettings, setUiSettings] = useState<UISettings>(() => getStoredUiSettings());
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [initialDataLoading, setInitialDataLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState('');

  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'coach'>('student');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    getStoredChatMessages(getStoredUser()?.id ?? null),
  );
  const [inputMessage, setInputMessage] = useState('');

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [recommendationError, setRecommendationError] = useState('');
  const [chatError, setChatError] = useState('');

  const profileCompletion = useMemo(() => calculateProfileCompletion(profile), [profile]);
  const chatCount = useMemo(
    () => chatMessages.filter((message) => message.role === 'user').length,
    [chatMessages],
  );

  const updateView = useCallback((nextView: View) => {
    setError('');
    setRecommendationError('');
    setChatError('');
    setView(nextView);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setView('landing');
    setProfile(null);
    setRecommendations([]);
    setStudents([]);
    setSelectedStudentId(null);
    setChatMessages([]);
    setInputMessage('');
    setError('');
    setRecommendationError('');
    setChatError('');
    setIdentifier('');
    setEmail('');
    setUsername('');
    setPassword('');
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = uiSettings.accent;
    document.documentElement.dataset.density = uiSettings.density;
    document.documentElement.dataset.motion = uiSettings.motion ? 'full' : 'reduced';
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(uiSettings));
  }, [uiSettings]);

  useEffect(() => {
    if (!isPersonalizationOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPersonalizationOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPersonalizationOpen]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(VIEW_STORAGE_KEY);
    }
  }, [user, view]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`euleuk_chat_${user.id}`, JSON.stringify(chatMessages));
  }, [user, chatMessages]);

  useEffect(() => {
    if (!user) return;
    setView((currentView) => normalizeViewForRole(currentView, user.role));
    setChatMessages(getStoredChatMessages(user.id));

    if (user.role === 'student') {
      setStudents([]);
      setSelectedStudentId(null);
    } else {
      setProfile(null);
      setRecommendations([]);
      setChatMessages([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    const controller = new AbortController();
    const loadInitialData = async () => {
      setInitialDataLoading(true);
      setStudentsLoading(user.role === 'coach');

      try {
        if (user.role === 'student') {
          const [profileResponse, recommendationsResponse] = await Promise.all([
            fetch(`/api/profile/${user.id}`, { signal: controller.signal }),
            fetch(`/api/recommendations/${user.id}`, { signal: controller.signal }),
          ]);

          const [profileData, recommendationsData] = await Promise.all([
            profileResponse.json(),
            recommendationsResponse.json(),
          ]);

          if (controller.signal.aborted) return;

          setProfile(profileData?.user_id ? profileData : null);
          setRecommendations(Array.isArray(recommendationsData) ? recommendationsData : []);
        } else {
          const response = await fetch('/api/coach/students', { signal: controller.signal });
          const data = await response.json();
          if (controller.signal.aborted) return;
          const nextStudents = Array.isArray(data) ? (data as StudentSummary[]) : [];
          setStudents(nextStudents);
          setSelectedStudentId((current) => {
            if (current && nextStudents.some((student) => student.id === current)) return current;
            return nextStudents[0]?.id ?? null;
          });
        }
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          console.error('Impossible de charger les donnees initiales.', fetchError);
        }
      } finally {
        if (!controller.signal.aborted) {
          setInitialDataLoading(false);
          setStudentsLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => controller.abort();
  }, [user]);

  const handleLogin = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setAuthLoading(true);
      setError('');
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data);
          setView(data.role === 'coach' ? 'coach-dashboard' : 'dashboard');
          setIdentifier('');
          setEmail('');
          setPassword('');
        } else {
          setError(data.error || 'Impossible de se connecter.');
        }
      } catch {
        setError('Erreur de connexion');
      } finally {
        setAuthLoading(false);
      }
    },
    [identifier, password],
  );

  const handleSignup = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setAuthLoading(true);
      setError('');
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password, role, full_name: fullName }),
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data);
          setView(data.role === 'coach' ? 'coach-dashboard' : 'dashboard');
          setIdentifier('');
          setEmail('');
          setUsername('');
          setPassword('');
          setFullName('');
        } else {
          setError(data.error || 'Impossible de creer le compte.');
        }
      } catch {
        setError('Erreur d inscription');
      } finally {
        setAuthLoading(false);
      }
    },
    [email, fullName, password, role, username],
  );

  const handleProfileSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!user) return;

      setProfileSaving(true);
      const formData = new FormData(event.currentTarget as HTMLFormElement);
      const profileData: Profile = {
        user_id: user.id,
        skills: String(formData.get('skills') ?? ''),
        hobbies: String(formData.get('hobbies') ?? ''),
        personality: String(formData.get('personality') ?? ''),
        favorite_subjects: String(formData.get('favorite_subjects') ?? ''),
        goals: String(formData.get('goals') ?? ''),
        strengths: String(formData.get('strengths') ?? ''),
        weaknesses: String(formData.get('weaknesses') ?? ''),
      };

      try {
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        });

        if (!response.ok) {
          throw new Error('Impossible d enregistrer le profil.');
        }

        setProfile(profileData);
        updateView('dashboard');
      } catch (saveError) {
        console.error(saveError);
      } finally {
        setProfileSaving(false);
      }
    },
    [updateView, user],
  );

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !user || !profile) return;

    setChatError('');
    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: inputMessage }];
    setChatMessages(nextMessages);
    setInputMessage('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, profile, messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) {
        const fallbackError = data.error || 'Impossible de discuter avec l IA.';
        setChatError(fallbackError);
        setChatMessages([...nextMessages, { role: 'model', content: fallbackError }]);
      } else {
        setChatMessages([...nextMessages, { role: 'model', content: data.reply }]);
      }
    } catch {
      const fallbackError = 'Desole, je n ai pas pu repondre pour le moment.';
      setChatError('Impossible de discuter avec l IA.');
      setChatMessages([...nextMessages, { role: 'model', content: fallbackError }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatMessages, inputMessage, profile, user]);

  const handleGenerateRecommendations = useCallback(async () => {
    if (!user || !profile) return;

    setRecommendationsLoading(true);
    setRecommendationError('');

    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, profile }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRecommendationError(data.error || 'Impossible de generer les recommandations.');
      } else {
        setRecommendations(data.recommendations || []);
      }
    } catch {
      setRecommendationError('Impossible de generer les recommandations pour le moment.');
    } finally {
      setRecommendationsLoading(false);
    }
  }, [profile, user]);

  return (
    <div className="selection:bg-[var(--accent)] selection:text-white">
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <LandingPage
            key="landing"
            onSignup={() => updateView('signup')}
            onLogin={() => updateView('login')}
            onOpenPersonalization={() => setIsPersonalizationOpen(true)}
          />
        ) : null}

        {view === 'login' ? (
          <AuthForm
            key="login"
            type="login"
            fullName={fullName}
            username={username}
            identifier={identifier}
            role={role}
            email={email}
            password={password}
            loading={authLoading}
            error={error}
            onFullNameChange={setFullName}
            onUsernameChange={setUsername}
            onIdentifierChange={setIdentifier}
            onRoleChange={setRole}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
            onToggleView={() => updateView('signup')}
            onBack={() => updateView('landing')}
          />
        ) : null}

        {view === 'signup' ? (
          <AuthForm
            key="signup"
            type="signup"
            fullName={fullName}
            username={username}
            identifier={identifier}
            role={role}
            email={email}
            password={password}
            loading={authLoading}
            error={error}
            onFullNameChange={setFullName}
            onUsernameChange={setUsername}
            onIdentifierChange={setIdentifier}
            onRoleChange={setRole}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSignup}
            onToggleView={() => updateView('login')}
            onBack={() => updateView('landing')}
          />
        ) : null}

        {view === 'dashboard' && user?.role === 'student' ? (
          <StudentDashboard
            key="dashboard"
            user={user}
            view={view}
            profile={profile}
            recommendations={recommendations}
            recommendationError={recommendationError}
            profileCompletion={profileCompletion}
            chatCount={chatCount}
            initialDataLoading={initialDataLoading}
            recommendationsLoading={recommendationsLoading}
            onNavigate={updateView}
            onGenerateRecommendations={handleGenerateRecommendations}
            onOpenPersonalization={() => setIsPersonalizationOpen(true)}
            onLogout={handleLogout}
          />
        ) : null}

        {view === 'profile' ? (
          <ProfileForm
            key="profile"
            profile={profile}
            loading={profileSaving}
            onSubmit={handleProfileSubmit}
            onCancel={() => updateView(user?.role === 'coach' ? 'coach-dashboard' : 'dashboard')}
          />
        ) : null}

        {view === 'chat' && user?.role === 'student' ? (
          <ChatInterface
            key="chat"
            user={user}
            profile={profile}
            chatMessages={chatMessages}
            loading={chatLoading}
            inputMessage={inputMessage}
            chatError={chatError}
            onInputChange={setInputMessage}
            onSendMessage={handleSendMessage}
            onNavigate={updateView}
            onOpenPersonalization={() => setIsPersonalizationOpen(true)}
            onLogout={handleLogout}
          />
        ) : null}

        {view === 'coach-dashboard' && user?.role === 'coach' ? (
          <CoachDashboard
            key="coach-dashboard"
            view={view}
            students={students}
            studentsLoading={studentsLoading}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            onOpenPersonalization={() => setIsPersonalizationOpen(true)}
            onLogout={handleLogout}
          />
        ) : null}
      </AnimatePresence>

      <PersonalizationPanel
        open={isPersonalizationOpen}
        settings={uiSettings}
        onClose={() => setIsPersonalizationOpen(false)}
        onUpdate={setUiSettings}
      />
    </div>
  );
}

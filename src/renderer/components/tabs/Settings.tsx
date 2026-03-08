import { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useClients } from '../../hooks/useClients';
import { useProjects } from '../../hooks/useProjects';
import { useToast } from '../../hooks/useToast';
import { getCurrencySymbol } from '../../../shared/utils/currency';
import { getLocalDate } from '../../../shared/utils/date';
import {
  IconPencil, IconArchive, IconUnarchive, IconPlus,
  IconUsers, IconFolder, IconAlertCircle, IconStar,
  IconChevronRight, IconChevronLeft,
} from '../common/Icons';
import { Select } from '../common/Select';
import { Tooltip } from '../common/Tooltip';
import type { Client, ClientInput, Project, ProjectInput } from '@/shared/types';
import styles from './Settings.module.css';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

type SubView = 'main' | 'clients' | 'projects';

const isMac = window.kronobar.platform === 'darwin';

export function Settings() {
  const [subView, setSubView] = useState<SubView>('main');
  const { settings, updateSetting } = useSettings();
  const { clients, create: createClient, update: updateClient, archive: archiveClient, unarchive: unarchiveClient, refresh: refreshClients } = useClients(true);
  const { projects, create: createProject, update: updateProject, archive: archiveProject, unarchive: unarchiveProject } = useProjects(undefined, true);
  const { showToast } = useToast();

  if (subView === 'clients') {
    return (
      <ClientsView
        clients={clients}
        currency={settings.currency}
        onCreate={createClient}
        onUpdate={updateClient}
        onArchive={archiveClient}
        onUnarchive={unarchiveClient}
        onBack={() => setSubView('main')}
      />
    );
  }

  if (subView === 'projects') {
    return (
      <ProjectsView
        clients={clients.filter((c) => !c.archived_at)}
        projects={projects}
        onCreate={async (input) => {
          await createProject(input);
          await refreshClients();
        }}
        onUpdate={updateProject}
        onArchive={archiveProject}
        onUnarchive={unarchiveProject}
        onBack={() => setSubView('main')}
      />
    );
  }

  const handleExport = async () => {
    try {
      const today = getLocalDate();
      const d = new Date();
      d.setDate(1);
      const monthStart = d.toLocaleDateString('en-CA');
      const result = await window.kronobar.tracking.export(monthStart, today);
      if (result.success) {
        showToast('Export CSV réussi');
      }
    } catch {
      showToast("Erreur lors de l'export", 'error');
    }
  };

  return (
    <div className={styles.scroll}>
      <div className={styles.header}>Réglages</div>

      <div className={styles.section}>
        {/* TEMPS & CALCUL */}
        <div className={styles.sectionLabel} style={{ marginTop: 0, paddingTop: 16 }}>
          Temps &amp; calcul
        </div>

        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Format du temps</div>
          </div>
          <div className={styles.segmented}>
            <button
              className={`${styles.segmentedBtn} ${settings.time_format === 'hhmm' ? styles.segmentedBtnActive : ''}`}
              onClick={() => updateSetting('time_format', 'hhmm')}
            >
              2h 30m
            </button>
            <button
              className={`${styles.segmentedBtn} ${settings.time_format === 'decimal' ? styles.segmentedBtnActive : ''}`}
              onClick={() => updateSetting('time_format', 'decimal')}
            >
              2.5h
            </button>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Heures / jour</div>
            <div className={styles.settingDesc}>Base de calcul des jours</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="number"
              className={styles.numInput}
              value={settings.hours_per_day}
              min={1}
              max={24}
              onChange={(e) => updateSetting('hours_per_day', parseInt(e.target.value) || 7)}
            />
            <span className={styles.settingUnit}>h</span>
          </div>
        </div>

        {/* CLIENTS & PROJETS */}
        <div className={styles.sectionLabel}>Clients &amp; projets</div>

        <button className={styles.settingLink} onClick={() => setSubView('clients')}>
          <div className={styles.settingLinkIcon} style={{ background: 'var(--accent-soft)' }}>
            <IconUsers size={16} style={{ color: 'var(--accent-color)' }} />
          </div>
          <div className={styles.settingLinkContent}>
            <div className={styles.settingLabel}>Gestion des clients</div>
            <div className={styles.settingDesc}>Ajouter, modifier, archiver</div>
          </div>
          <IconChevronRight size={16} className={styles.settingLinkChevron} />
        </button>

        <button className={styles.settingLink} onClick={() => setSubView('projects')}>
          <div className={styles.settingLinkIcon} style={{ background: 'var(--blue-soft)' }}>
            <IconFolder size={16} style={{ color: 'var(--blue-color)' }} />
          </div>
          <div className={styles.settingLinkContent}>
            <div className={styles.settingLabel}>Gestion des projets</div>
            <div className={styles.settingDesc}>Ajouter, modifier, archiver</div>
          </div>
          <IconChevronRight size={16} className={styles.settingLinkChevron} />
        </button>

        {/* APPLICATION */}
        <div className={styles.sectionLabel}>Application</div>

        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Lancer au démarrage</div>
            <div className={styles.settingDesc}>Ouvrir KronoBar au démarrage du système</div>
          </div>
          <button
            className={`${styles.toggle} ${settings.launch_at_login ? styles.toggleOn : ''}`}
            onClick={async () => {
              const error = await updateSetting('launch_at_login', !settings.launch_at_login);
              if (error) {
                showToast(error, 'error');
              }
            }}
          >
            <div className={styles.toggleKnob} />
          </button>
        </div>

        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Raccourci global</div>
            <div className={styles.settingDesc}>Ouvrir/fermer le popup</div>
          </div>
          <div className={styles.segmented} style={{ background: 'var(--bg-secondary)' }}>
            <span className={styles.shortcutDisplay}>{isMac ? '⌘' : 'Ctrl'} + Shift + T</span>
          </div>
        </div>

        {/* DONNÉES */}
        <div className={styles.sectionLabel}>Données</div>

        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Exporter (CSV)</div>
            <div className={styles.settingDesc}>Sauvegarder toutes les entrées</div>
          </div>
          <button className={styles.btnExport} onClick={handleExport}>
            Exporter
          </button>
        </div>

        {/* À PROPOS */}
        <div className={styles.sectionLabel}>À propos</div>

        <button
          className={styles.settingLink}
          style={{ borderBottom: `1px solid var(--border-subtle)` }}
          onClick={() => window.kronobar.shell.openExternal('https://github.com/splyy/KronoBar/issues')}
        >
          <div className={styles.settingLinkIcon} style={{ background: 'var(--danger-soft)' }}>
            <IconAlertCircle size={16} style={{ color: 'var(--danger-color)' }} />
          </div>
          <div className={styles.settingLinkContent}>
            <div className={styles.settingLabel}>Signaler un bug</div>
            <div className={styles.settingDesc}>Ouvrir une issue sur GitHub</div>
          </div>
          <IconChevronRight size={16} className={styles.settingLinkChevron} />
        </button>

        <button
          className={styles.settingLink}
          onClick={() => window.kronobar.shell.openExternal('https://github.com/splyy/KronoBar')}
        >
          <div className={styles.settingLinkIcon} style={{ background: 'var(--purple-soft)' }}>
            <IconStar size={16} style={{ color: 'var(--purple-color)' }} />
          </div>
          <div className={styles.settingLinkContent}>
            <div className={styles.settingLabel}>Soutenir le projet</div>
            <div className={styles.settingDesc}>Laisser une étoile sur GitHub</div>
          </div>
          <IconChevronRight size={16} className={styles.settingLinkChevron} />
        </button>
      </div>

      <div className={styles.appFooter}>
        <div className={styles.appFooterName}>KronoBar</div>
        <div className={styles.appFooterVersion}>v1.0.0 — MIT License</div>
      </div>
    </div>
  );
}

// --- Clients View ---
function ClientsView({ clients, currency, onCreate, onUpdate, onArchive, onUnarchive, onBack }: {
  clients: Client[];
  currency: string;
  onCreate: (input: ClientInput) => Promise<Client>;
  onUpdate: (id: number, input: ClientInput) => Promise<Client>;
  onArchive: (id: number) => Promise<void>;
  onUnarchive: (id: number) => Promise<void>;
  onBack: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const currencySymbol = getCurrencySymbol(currency);

  const handleSave = async (input: ClientInput) => {
    if (editingClient) {
      await onUpdate(editingClient.id, input);
    } else {
      await onCreate(input);
    }
    setShowForm(false);
    setEditingClient(null);
  };

  return (
    <div className={styles.scroll}>
      <div className={styles.subHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <IconChevronLeft size={16} />
        </button>
        <span className={styles.subTitle}>Clients</span>
      </div>

      <div className={styles.section}>
        <div className={styles.itemList}>
          {clients.map((client) => (
            <div key={client.id} className={`${styles.item} ${client.archived_at ? styles.itemArchived : ''}`}>
              <span className={styles.itemDot} style={{ backgroundColor: client.color }} />
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>{client.name}</div>
                {client.daily_rate != null && (
                  <div className={styles.itemDetail}>{client.daily_rate}{currencySymbol}/j</div>
                )}
              </div>
              <div className={styles.itemActions}>
                <Tooltip content="Modifier">
                  <button
                    className={styles.iconBtn}
                    onClick={() => { setEditingClient(client); setShowForm(true); }}
                  >
                    <IconPencil size={13} />
                  </button>
                </Tooltip>
                <Tooltip content={client.archived_at ? 'Désarchiver' : 'Archiver'}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => client.archived_at ? onUnarchive(client.id) : onArchive(client.id)}
                  >
                    {client.archived_at ? <IconUnarchive size={13} /> : <IconArchive size={13} />}
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        {showForm ? (
          <ClientForm
            client={editingClient}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingClient(null); }}
          />
        ) : (
          <button className={styles.addItemBtn} onClick={() => setShowForm(true)}>
            <IconPlus size={14} /> Ajouter un client
          </button>
        )}
      </div>
    </div>
  );
}

function ClientForm({ client, onSave, onCancel }: {
  client: Client | null;
  onSave: (input: ClientInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(client?.name ?? '');
  const [color, setColor] = useState(client?.color ?? COLORS[0]);
  const [dailyRate, setDailyRate] = useState(client?.daily_rate?.toString() ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      color,
      daily_rate: dailyRate ? parseFloat(dailyRate) : null,
    });
  };

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      <div className={styles.inlineFormRow}>
        <div className={styles.colorPresets}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.colorChip} ${color === c ? styles.colorChipActive : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
          <Tooltip content="Couleur personnalisée">
            <input
              type="color"
              className={styles.colorInput}
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </Tooltip>
        </div>
      </div>
      <div className={styles.inlineFormRow}>
        <input
          className={styles.inlineInput}
          placeholder="Nom du client"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className={styles.inlineFormRow}>
        <input
          className={styles.inlineInput}
          type="number"
          step="0.01"
          placeholder="TJM (optionnel)"
          value={dailyRate}
          onChange={(e) => setDailyRate(e.target.value)}
        />
      </div>
      <div className={styles.inlineFormActions}>
        <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className={`${styles.btnSm} ${styles.btnPrimary}`} disabled={!name.trim()}>
          {client ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}

// --- Projects View ---
function ProjectsView({ clients, projects, onCreate, onUpdate, onArchive, onUnarchive, onBack }: {
  clients: Client[];
  projects: Project[];
  onCreate: (input: ProjectInput) => Promise<void>;
  onUpdate: (id: number, input: ProjectInput) => Promise<Project>;
  onArchive: (id: number) => Promise<void>;
  onUnarchive: (id: number) => Promise<void>;
  onBack: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleSave = async (input: ProjectInput) => {
    if (editingProject) {
      await onUpdate(editingProject.id, input);
    } else {
      await onCreate(input);
    }
    setShowForm(false);
    setEditingProject(null);
  };

  const clientMap = new Map(clients.map((c) => [c.id, c]));

  return (
    <div className={styles.scroll}>
      <div className={styles.subHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <IconChevronLeft size={16} />
        </button>
        <span className={styles.subTitle}>Projets</span>
      </div>

      <div className={styles.section}>
        <div className={styles.itemList}>
          {projects.map((project) => {
            const client = clientMap.get(project.client_id);
            return (
              <div key={project.id} className={`${styles.item} ${project.archived_at ? styles.itemArchived : ''}`}>
                <span className={styles.itemDot} style={{ backgroundColor: client?.color ?? '#999' }} />
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{project.name}</div>
                  <div className={styles.itemDetail}>{client?.name ?? 'Client inconnu'}</div>
                </div>
                <div className={styles.itemActions}>
                  <Tooltip content="Modifier">
                    <button
                      className={styles.iconBtn}
                      onClick={() => { setEditingProject(project); setShowForm(true); }}
                    >
                      <IconPencil size={13} />
                    </button>
                  </Tooltip>
                  <Tooltip content={project.archived_at ? 'Désarchiver' : 'Archiver'}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => project.archived_at ? onUnarchive(project.id) : onArchive(project.id)}
                    >
                      {project.archived_at ? <IconUnarchive size={13} /> : <IconArchive size={13} />}
                    </button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>

        {showForm ? (
          <ProjectForm
            clients={clients}
            project={editingProject}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingProject(null); }}
          />
        ) : (
          <button className={styles.addItemBtn} onClick={() => setShowForm(true)} disabled={clients.length === 0}>
            <IconPlus size={14} /> Ajouter un projet
          </button>
        )}
      </div>
    </div>
  );
}

function ProjectForm({ clients, project, onSave, onCancel }: {
  clients: Client[];
  project: Project | null;
  onSave: (input: ProjectInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [clientId, setClientId] = useState<number | ''>(project?.client_id ?? (clients[0]?.id ?? ''));
  const [name, setName] = useState(project?.name ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) return;
    await onSave({
      client_id: clientId as number,
      name: name.trim(),
    });
  };

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      <div className={styles.inlineFormRow}>
        <Select
          value={String(clientId)}
          onValueChange={(v) => setClientId(v ? parseInt(v) : '')}
          options={clients.map((c) => ({ value: String(c.id), label: c.name }))}
          placeholder="Client"
          className={styles.flexOne}
        />
      </div>
      <div className={styles.inlineFormRow}>
        <input
          className={styles.inlineInput}
          placeholder="Nom du projet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className={styles.inlineFormActions}>
        <button type="button" className={`${styles.btnSm} ${styles.btnGhost}`} onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className={`${styles.btnSm} ${styles.btnPrimary}`} disabled={!name.trim() || !clientId}>
          {project ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}

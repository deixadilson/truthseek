<template>
  <div class="group-details-page">
    <div v-if="isLoading" class="state container">
      <LoadingMessage message="Carregando detalhes do grupo..." />
    </div>

    <div v-else-if="loadError" class="state container">
      <h2>Grupo não encontrado</h2>
      <p>{{ loadError }}</p>
      <NuxtLink to="/categories" class="button-primary">Explorar Categorias</NuxtLink>
    </div>

    <template v-else-if="group">
      <header class="group-header">
        <div class="header-background-image" :style="headerBackgroundStyle" />
        <nav v-if="breadcrumbs.length > 0" aria-label="breadcrumb" class="breadcrumb-nav container">
          <ol>
            <li v-for="(crumb, index) in breadcrumbs" :key="crumb.key">
              <span v-if="index === breadcrumbs.length - 1" class="active">{{ crumb.name }}</span>
              <NuxtLink v-else-if="crumb.to" :to="crumb.to">{{ crumb.name }}</NuxtLink>
              <span v-else>{{ crumb.name }}</span>
            </li>
          </ol>
        </nav>
        <div class="header-content container">
          <div class="group-flag-container">
            <img
              v-if="flagUrl"
              :src="flagUrl"
              :alt="`Bandeira de ${group.name}`"
              class="group-flag"
              :class="{ logo: isMetaGroupPage }"
            />
            <div v-else class="group-flag-placeholder">
              <span>{{ group.name.substring(0, 1) }}</span>
            </div>
          </div>
          <div class="group-title-info">
            <h1>{{ group.name }}</h1>
            <p class="group-meta">
              <span class="country-with-flag">
                <img
                  v-if="countryFlag"
                  :src="countryFlag"
                  :alt="`Bandeira de ${formatCountryName(group.country_code)}`"
                  class="country-flag"
                  width="24"
                  height="18"
                  loading="lazy"
                />
                {{ formatCountryName(group.country_code) }}
              </span>
              <span class="group-access-status" :class="group.is_open ? 'open' : 'closed'">
                |
                <Icon
                  :name="group.is_open ? 'lucide:unlock' : 'lucide:lock'"
                  :size="14"
                  class="group-status-icon"
                />
                Grupo {{ group.is_open ? 'Aberto' : 'Restrito' }}
              </span>
            </p>
          </div>
        </div>
      </header>

      <div class="details-body container">
        <p v-if="group.is_open && !isMetaGroupPage" class="open-notice card-style">
          Esta página de detalhes é pensada para grupos restritos (vieses).
          Grupos abertos concentram discussão geral — use o feed do grupo para participar.
        </p>

        <section class="about card-style">
          <h2>Sobre</h2>
          <p v-if="group.description" class="description">{{ group.description }}</p>
          <p v-else class="muted">Este grupo ainda não possui descrição.</p>

          <dl class="stats">
            <div class="stat">
              <dt>Membros</dt>
              <dd>{{ memberCount }}</dd>
            </div>
            <div class="stat">
              <dt>Debates</dt>
              <dd class="muted-value">Em breve</dd>
            </div>
            <div class="stat">
              <dt>Vitórias</dt>
              <dd class="muted-value">Em breve</dd>
            </div>
          </dl>
        </section>

        <section v-if="!group.is_open" class="premises card-style">
          <div class="section-header">
            <h2>Premissas</h2>
            <p class="section-hint">
              Bases deste viés. Quem o declara confirma concordar com elas.
            </p>
          </div>

          <div v-if="isLoadingPremises" class="section-state">
            <LoadingMessage message="Carregando premissas..." :icon-size="16" />
          </div>
          <p v-else-if="premises.length === 0" class="section-empty muted">
            Este viés ainda não possui premissas cadastradas.
          </p>
          <ol v-else class="premises-list">
            <li v-for="premise in premises" :key="premise.id" class="premise-item">
              <span class="premise-name">{{ premise.name }}</span>
              <span v-if="premise.description" class="premise-description">
                {{ premise.description }}
              </span>
            </li>
          </ol>
        </section>

        <section v-if="subgroups.length > 0" class="subgroups card-style">
          <h2>Subgrupos</h2>
          <ul>
            <li v-for="sub in subgroups" :key="sub.id">
              <NuxtLink :to="`/${sub.country_code}/${sub.slug}`">{{ sub.name }}</NuxtLink>
            </li>
          </ul>
        </section>

        <section v-if="showInfluenceRanking" class="ranking card-style">
          <div class="section-header">
            <h2>Ranking de influência</h2>
            <p class="section-hint">
              {{
                isMetaGroupPage
                  ? 'Membros da plataforma agrupados por título de influência.'
                  : 'Defensores deste viés agrupados por título de influência.'
              }}
            </p>
          </div>

          <div v-if="isLoadingRank" class="section-state">
            <LoadingMessage message="Carregando ranking..." :icon-size="16" />
          </div>
          <p v-else-if="ranking.length === 0" class="section-empty muted">
            {{
              isMetaGroupPage
                ? 'Ainda não há membros com influência registrada na plataforma.'
                : 'Ainda não há membros declarados neste viés.'
            }}
          </p>
          <div v-else class="rank-groups">
            <section
              v-for="titleGroup in rankingByTitle"
              :key="`${titleGroup.level}-${titleGroup.title}`"
              class="rank-group"
            >
              <header class="rank-group-header">
                <InfluenceBadge
                  :level="titleGroup.level"
                  :title="titleGroup.title"
                  size="lg"
                  show-pe
                />
                <span class="rank-group-count">
                  {{ titleGroup.entries.length }}
                  {{ titleGroup.entries.length === 1 ? 'membro' : 'membros' }}
                </span>
              </header>
              <ol class="rank-list">
                <li
                  v-for="entry in titleGroup.entries"
                  :key="entry.biasId"
                  class="rank-row"
                >
                  <span class="rank-pos" :aria-label="`Posição ${entry.position}`">
                    {{ entry.position }}
                  </span>
                  <NuxtLink
                    v-if="entry.username"
                    :to="`/user/${entry.username}`"
                    class="rank-user"
                  >
                    <UserAvatar
                      :src="entry.avatarUrl"
                      :alt="entry.username"
                      size="md"
                      class="rank-avatar"
                      :level="entry.level"
                      :title="entry.title"
                    />
                    <span class="rank-username">{{ entry.username }}</span>
                  </NuxtLink>
                  <div v-else class="rank-user unknown">
                    <UserAvatar
                      :src="defaultAvatar"
                      alt=""
                      size="md"
                      class="rank-avatar"
                    />
                    <span class="rank-username">Usuário</span>
                  </div>
                  <div class="rank-influence">
                    <span class="points">{{ entry.influencePoints }} pts</span>
                  </div>
                </li>
              </ol>
            </section>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Group } from '~/types/app';
import type { Database } from '~/types/supabase';
import { countryFlagUrl, formatCountryName } from '~/utils/formatters';
import { isMetaGroup, resolveGroupFlagUrl } from '~/utils/groupFlags';

type PremiseRow = Pick<
  Database['public']['Tables']['premises']['Row'],
  'id' | 'name' | 'description' | 'sort_order'
>;

type RankEntry = {
  biasId: string;
  userId: string;
  influencePoints: number;
  title: string;
  level: number;
  username: string | null;
  avatarUrl: string;
  position: number;
};

type RankTitleGroup = {
  level: number;
  title: string;
  entries: RankEntry[];
};

const route = useRoute();
const supabase = useSupabaseClient();

const defaultAvatar = '/images/default-avatar.png';
const avatarBucket = 'https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/avatars';
const RANK_LIMIT = 50;

const country = computed(() => {
  const c = route.params.country_code;
  return typeof c === 'string' ? c : Array.isArray(c) ? c[0] : '';
});

const groupSlug = computed(() => {
  const s = route.params.slug;
  if (Array.isArray(s)) return s.join('/');
  return typeof s === 'string' ? s : '';
});

const groupPath = computed(() => `/${country.value}/${groupSlug.value}`);

const isMetaGroupPage = computed(() => isMetaGroup(group.value));
const showInfluenceRanking = computed(
  () => !!group.value && (!group.value.is_open || isMetaGroupPage.value)
);

const rankingByTitle = computed((): RankTitleGroup[] => {
  const groups: RankTitleGroup[] = [];
  for (const entry of ranking.value) {
    const last = groups[groups.length - 1];
    if (last && last.level === entry.level && last.title === entry.title) {
      last.entries.push(entry);
    } else {
      groups.push({
        level: entry.level,
        title: entry.title,
        entries: [entry],
      });
    }
  }
  return groups;
});

const isLoading = ref(true);
const loadError = ref('');
const group = ref<Group | null>(null);
const subgroups = ref<Pick<Group, 'id' | 'name' | 'slug' | 'country_code'>[]>([]);
const memberCount = ref(0);
const ranking = ref<RankEntry[]>([]);
const isLoadingRank = ref(false);
const premises = ref<PremiseRow[]>([]);
const isLoadingPremises = ref(false);

type GroupBreadcrumb = {
  key: string;
  name: string;
  to: string | null;
};

const breadcrumbs = ref<GroupBreadcrumb[]>([]);

/** Walk parent_group_id chain; append current group (link) + Detalhes. */
async function buildBreadcrumbs(groupRow: Group) {
  const ancestors: GroupBreadcrumb[] = [];
  let parentId = groupRow.parent_group_id;
  let guard = 0;

  while (parentId && guard < 8) {
    guard += 1;
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, slug, country_code, parent_group_id')
      .eq('id', parentId)
      .maybeSingle();

    if (error || !data) break;

    ancestors.unshift({
      key: data.id,
      name: data.name,
      to: `/${data.country_code}/${data.slug}`,
    });
    parentId = data.parent_group_id;
  }

  breadcrumbs.value = [
    { key: 'categories-root', name: 'Categorias', to: '/categories' },
    ...ancestors,
    {
      key: groupRow.id,
      name: groupRow.name,
      to: `/${groupRow.country_code}/${groupRow.slug}`,
    },
    { key: 'details', name: 'Detalhes', to: null },
  ];
}

const flagUrl = computed(() =>
  group.value
    ? resolveGroupFlagUrl({
        slug: group.value.slug,
        flag_path: group.value.flag_path,
      })
    : null
);
const { fallbackColor: flagFallbackColor } = useFlagTheme(() =>
  group.value?.cover_image_path ? null : (flagUrl.value || '')
);

const countryFlag = computed(() => countryFlagUrl(group.value?.country_code));

const headerBackgroundStyle = computed(() => {
  if (group.value?.cover_image_path) {
    const coverUrl = `https://iayfnbhvsqtszwmwwjmk.supabase.co/storage/v1/object/public/covers/${group.value.cover_image_path}`;
    return { backgroundImage: `url('${coverUrl}')` };
  }
  return { backgroundColor: flagFallbackColor.value };
});

function avatarUrlFor(path: string | null | undefined): string {
  if (!path) return defaultAvatar;
  return `${avatarBucket}/${path}`;
}

async function loadPremises(groupId: string) {
  isLoadingPremises.value = true;
  premises.value = [];
  try {
    const { data, error } = await supabase
      .from('premises')
      .select('id, name, description, sort_order')
      .eq('group_id', groupId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    premises.value = data || [];
  } catch (e) {
    console.error('Erro ao carregar premissas do grupo:', e);
  } finally {
    isLoadingPremises.value = false;
  }
}

async function loadRanking(groupId: string) {
  isLoadingRank.value = true;
  ranking.value = [];
  try {
    const { data: biases, error } = await supabase
      .from('biases')
      .select('id, user_id, influence_points, title, level, created_at')
      .eq('group_id', groupId)
      .limit(RANK_LIMIT);

    if (error) throw error;

    const rows = biases || [];
    memberCount.value = rows.length;

    // Exact total when capped by limit
    if (rows.length >= RANK_LIMIT) {
      const { count } = await supabase
        .from('biases')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId);
      if (typeof count === 'number') memberCount.value = count;
    }

    if (rows.length === 0) return;

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_path, created_at')
      .in('id', userIds);

    if (profileError) throw profileError;

    const byId = new Map((profiles || []).map((p) => [p.id, p]));

    const sorted = [...rows].sort((a, b) => {
      const pointsDiff = (b.influence_points ?? 0) - (a.influence_points ?? 0);
      if (pointsDiff !== 0) return pointsDiff;

      const aProfile = byId.get(a.user_id)?.created_at || '';
      const bProfile = byId.get(b.user_id)?.created_at || '';
      if (aProfile !== bProfile) return aProfile < bProfile ? -1 : 1;

      const aBias = a.created_at || '';
      const bBias = b.created_at || '';
      if (aBias !== bBias) return aBias < bBias ? -1 : 1;

      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    ranking.value = sorted.map((row, index) => {
      const profile = byId.get(row.user_id);
      return {
        biasId: row.id,
        userId: row.user_id,
        influencePoints: row.influence_points,
        title: row.title || 'Aspirante',
        level: row.level ?? 1,
        username: profile?.username ?? null,
        avatarUrl: avatarUrlFor(profile?.avatar_path),
        position: index + 1,
      };
    });
  } catch (e) {
    console.error('Erro ao carregar ranking do grupo:', e);
  } finally {
    isLoadingRank.value = false;
  }
}

async function loadDetails() {
  isLoading.value = true;
  loadError.value = '';
  group.value = null;
  subgroups.value = [];
  memberCount.value = 0;
  ranking.value = [];
  premises.value = [];
  breadcrumbs.value = [];

  if (!country.value || !groupSlug.value) {
    loadError.value = 'Link do grupo incompleto.';
    isLoading.value = false;
    return;
  }

  try {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        id, name, slug, description, flag_path, country_code, is_open,
        category_group_id, parent_group_id, has_subgroups, cover_image_path
      `)
      .eq('slug', groupSlug.value)
      .eq('country_code', country.value)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        loadError.value = `Grupo "${groupSlug.value}" não encontrado.`;
      } else {
        throw error;
      }
      return;
    }

    group.value = data as Group;

    const tasks: Promise<unknown>[] = [buildBreadcrumbs(group.value)];

    if (group.value.has_subgroups) {
      tasks.push(
        supabase
          .from('groups')
          .select('id, name, slug, country_code')
          .eq('parent_group_id', group.value.id)
          .eq('country_code', country.value)
          .order('name', { ascending: true })
          .then(({ data: subData, error: subError }) => {
            if (subError) throw subError;
            subgroups.value = subData || [];
          })
      );
    }

    if (!group.value.is_open) {
      tasks.push(loadPremises(group.value.id));
      tasks.push(loadRanking(group.value.id));
    } else if (isMetaGroup(group.value)) {
      tasks.push(loadRanking(group.value.id));
    } else {
      // Still show member count for open groups if anyone declared them
      tasks.push(
        supabase
          .from('biases')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', group.value.id)
          .then(({ count }) => {
            memberCount.value = count ?? 0;
          })
      );
    }

    await Promise.all(tasks);
  } catch (e: any) {
    console.error('Erro ao carregar detalhes do grupo:', e);
    loadError.value = e.message || 'Falha ao carregar detalhes do grupo.';
    group.value = null;
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => [country.value, groupSlug.value],
  () => {
    void loadDetails();
  },
  { immediate: true }
);

useSeoMeta({
  title: () =>
    group.value
      ? `${group.value.name} — Detalhes · TruthSeek Network`
      : 'Detalhes do grupo · TruthSeek Network',
  description: () =>
    group.value?.description
      || (group.value ? `Detalhes e ranking do grupo ${group.value.name}.` : 'Detalhes do grupo'),
});
</script>

<style scoped>
.group-details-page {
  padding-bottom: 3rem;
}

.state {
  padding: 3rem 1rem;
  text-align: center;
}

.state h2 {
  margin: 0 0 0.5rem;
  color: var(--primary-color);
}

.breadcrumb-nav {
  position: relative;
  z-index: 2;
  margin: 0 auto;
  padding: 0.85rem 15px 0;
  font-size: 0.9rem;
  background: none;
  box-shadow: none;
  border-radius: 0;
}
.breadcrumb-nav ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  align-items: center;
}
.breadcrumb-nav li:not(:last-child)::after {
  content: '›';
  margin-left: 0.5rem;
  color: var(--header-text);
  opacity: 0.85;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  display: inline-block;
}
.breadcrumb-nav a,
.breadcrumb-nav li span {
  color: var(--header-text);
  text-decoration: none;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}
.breadcrumb-nav a:hover {
  opacity: 0.85;
  text-decoration: none;
  color: var(--header-text);
}
.breadcrumb-nav li span.active {
  font-weight: 500;
  opacity: 0.95;
}

.group-header {
  color: var(--header-text);
  position: relative;
  margin-bottom: 2rem;
}

.header-background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 250px;
  background-size: cover;
  background-position: center;
  background-color: var(--primary-color-light);
  z-index: 1;
}
.header-background-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
}

.header-content {
  position: relative;
  z-index: 2;
  padding-top: 1.25rem;
  padding-bottom: 1.5rem;
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  min-height: calc(250px - 2.5rem);
}

.group-flag-container {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid var(--card-bg);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  background-color: var(--primary-color);
  flex-shrink: 0;
}
.group-flag-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  color: var(--header-text);
}
.group-flag {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.group-flag.logo {
  object-fit: contain;
  padding: 0.7rem;
  box-sizing: border-box;
}

.group-title-info {
  flex-grow: 1;
}
.group-title-info h1 {
  font-size: 2.2rem;
  margin-bottom: 0.25rem;
  color: var(--header-text);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}
.group-meta {
  font-size: 0.9rem;
  color: var(--header-text);
  opacity: 0.9;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}
.country-with-flag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.country-flag {
  display: inline-block;
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}
.group-access-status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.group-status-icon {
  flex-shrink: 0;
}

.details-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 720px;
}

.open-notice {
  margin: 0;
  padding: 1rem 1.15rem;
  font-size: 0.92rem;
  color: #555;
  line-height: 1.45;
}

.about h2,
.premises h2,
.subgroups h2,
.ranking h2 {
  margin: 0 0 0.75rem;
  font-size: 1.15rem;
  color: var(--primary-color-dark);
}

.section-header {
  margin-bottom: 1rem;
}

.section-hint {
  margin: -0.35rem 0 0;
  font-size: 0.88rem;
  color: #666;
}

.section-state,
.section-empty {
  padding: 0.75rem 0;
}

.premises-list {
  list-style: none;
  margin: 0;
  padding: 0;
  counter-reset: premise;
}

.premise-item {
  counter-increment: premise;
  position: relative;
  padding: 0.85rem 0 0.85rem 2.1rem;
  border-bottom: 1px solid var(--border-color);
}

.premise-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.premise-item:first-child {
  padding-top: 0;
}

.premise-item::before {
  content: counter(premise);
  position: absolute;
  left: 0;
  top: 0.85rem;
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary-color) 12%, white);
  color: var(--primary-color-dark);
  font-size: 0.78rem;
  font-weight: 700;
}

.premise-item:first-child::before {
  top: 0;
}

.premise-name {
  display: block;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.35;
}

.premise-description {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.9rem;
  line-height: 1.45;
  color: #555;
}

.description {
  margin: 0 0 1.25rem;
  line-height: 1.55;
  color: #444;
  white-space: pre-wrap;
}

.muted {
  margin: 0 0 1.25rem;
  color: #888;
  font-style: italic;
}

.section-empty.muted {
  margin-bottom: 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.stat {
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: #fafbfb;
  text-align: center;
}

.stat dt {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #777;
}

.stat dd {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--primary-color-dark);
}

.muted-value {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  color: #999 !important;
}

.subgroups ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.subgroups li a {
  display: block;
  padding: 0.55rem 0;
  border-bottom: 1px dotted var(--border-color);
  color: var(--link-color);
  text-decoration: none;
}

.subgroups li:last-child a {
  border-bottom: none;
}

.subgroups li a:hover {
  color: var(--primary-color-dark);
}

.rank-groups {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.rank-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0.5rem 0.55rem;
  margin-bottom: 0.1rem;
}

.rank-group-count {
  font-size: 0.8rem;
  color: #777;
  white-space: nowrap;
}

.rank-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rank-row {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.5rem;
  margin-bottom: 0.25rem;
  border-radius: 6px;
  border-bottom: none;
  background: color-mix(in srgb, var(--primary-color) 5%, white);
}

.rank-row:last-child {
  margin-bottom: 0;
}

.rank-pos {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--primary-color);
  text-align: center;
}

.rank-user {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.rank-user:hover .rank-username {
  color: var(--primary-color);
}

.rank-user.unknown {
  opacity: 0.75;
}

.rank-user :deep(.rank-avatar),
.rank-user :deep(.user-avatar.rank-avatar) {
  width: 2.5rem;
  height: 2.5rem;
}

.rank-username {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-influence {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  text-align: right;
}

.rank-influence .points {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--primary-color-dark);
  font-size: 0.9rem;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .group-title-info h1 {
    font-size: 1.6rem;
  }

  .group-flag-container {
    width: 88px;
    height: 88px;
  }

  .header-content {
    gap: 1rem;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .rank-row {
    grid-template-columns: 1.75rem minmax(0, 1fr) auto;
  }

  .rank-influence {
    justify-content: flex-end;
  }
}
</style>

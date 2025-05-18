// Interface para o ViewModel usado na página de listagem de categorias/grupos
export interface CategoryGroupDisplay {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  flag_path: string | null;
  country_code: string;
}

// Interface para dados de um Grupo (usado na página do grupo)
interface GroupData {
  id: string; name: string;
  slug: string;
  description: string | null;
  flag_path: string | null;
  country_code: string;
  is_open: boolean;
  category_group_id: string | null;
  taxon: { name: string } | null;
  parent_group_id: string | null;
  members_count?: number;
  cover_image_path?: string | null;
}

// Interface para dados de Subgrupo
interface SubgroupData {
  id: string;
  name: string;
  slug: string;
  country_code: string;
}

// Tipo para os dados brutos do post da query
interface PostFromQuery {
  id: string;
  author_id: string;
  profiles: { username: string | null; avatar_url: string | null; } | null;
  text_content: string | null;
  image_path: string | null;
  video_url: string | null;
  is_edited: boolean;
  is_anonymous: boolean;
  created_at: string;
  likes_count?: number; // Se você tiver essas colunas
  dislikes_count?: number;
  comments_count?: number;
}

// Interface para um Post formatado para exibição (usado em PostItem e PostList)
interface DisplayPost {
  id: string;
  author_id: string;
  text_content: string | null;
  image_path: string | null;
  video_url: string | null;
  is_edited: boolean;
  is_anonymous: boolean;
  created_at: string;
  author_username: string | null;
  author_avatar_path: string | null;
  likes_count?: number;
  dislikes_count?: number;
  comments_count?: number;
}
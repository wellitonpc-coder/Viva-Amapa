import { supabase } from '../api/supabaseClient';

export async function getPlaceMedia(placeId) {
  const { data, error } = await supabase
    .from('place_media')
    .select('id, type, url')
    .eq('place_id', placeId)
    .order('created_at');

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

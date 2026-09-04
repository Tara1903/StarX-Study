import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { resolveSubject } from '@/lib/subject-resolver';
import { MaterialsClient } from './materials-client';

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectMaterialsPage({ params }: PageProps) {
  const { subjectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const subject = await resolveSubject(subjectId, supabase);
  if (!subject) {
    notFound();
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('subject_members')
    .select('id')
    .eq('subject_id', subject.uuid)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  let materials: any[] = [];
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('subject_id', subject.uuid)
      .order('created_at', { ascending: false });

    if (!error && data) {
      materials = data.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description || undefined,
        file_name: m.file_name,
        file_type: m.file_type,
        file_size: m.file_size,
        file_url: m.storage_path || '#',
        created_at: m.created_at,
        category: m.topic || m.file_type?.split('/')[1] || 'document',
        size: `${(m.file_size / (1024 * 1024)).toFixed(1)} MB`,
      }));
    }
  } catch (err) {
    console.error('Error fetching subject materials:', err);
  }

  return (
    <MaterialsClient
      subject={{
        id: subject.id,
        name: subject.name,
        facultyName: subject.facultyName,
        color: subject.color,
      }}
      materials={materials}
    />
  );
}

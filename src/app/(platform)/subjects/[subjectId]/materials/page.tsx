import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { resolveSubject, getSubjectMaterials, isUuid } from '@/lib/subject-resolver';
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

  let materials: any[] = [];
  if (isUuid(subject.uuid)) {
    try {
      const { data } = await supabase
        .from('materials')
        .select('*')
        .eq('subject_id', subject.uuid)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        materials = data;
      }
    } catch {}
  }

  if (materials.length === 0) {
    materials = getSubjectMaterials(subject.id);
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

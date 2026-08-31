import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { FileText, Download, Upload, FileIcon, ImageIcon, FileAudioIcon } from 'lucide-react';

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

  const { data: membership } = await supabase
    .from('subject_members')
    .select('role')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    notFound();
  }

  const isTeacher = membership.role === 'teacher';

  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="h-10 w-10 text-blue-500" />;
    if (type.includes('audio') || type.includes('video')) return <FileAudioIcon className="h-10 w-10 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="h-10 w-10 text-red-500" />;
    return <FileIcon className="h-10 w-10 text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground mt-1 text-sm">Access course documents, slides, and other resources.</p>
        </div>
        {isTeacher && (
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
            <Upload className="h-4 w-4" />
            Upload Material
          </button>
        )}
      </div>

      {!materials || materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card/50 border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No materials available</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            {isTeacher 
              ? "You haven't uploaded any materials yet. Click 'Upload Material' to get started." 
              : "Your teacher hasn't uploaded any materials for this subject yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((material) => (
            <div key={material.id} className="bg-card border rounded-xl p-4 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-muted/50 rounded-lg">
                  {getFileIcon(material.file_type || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate" title={material.title}>{material.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {material.description || 'No description provided'}
                  </p>
                </div>
              </div>
              
              <div className="mt-auto flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{formatSize(material.file_size)}</span>
                  <span>•</span>
                  <span>{new Date(material.created_at).toLocaleDateString()}</span>
                </div>
                <button 
                  className="p-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

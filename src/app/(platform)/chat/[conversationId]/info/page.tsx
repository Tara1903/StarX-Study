import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { GroupInfoPanel } from '@/components/chat/group-info/group-info-panel';
import { getRealGroupInfo } from '@/actions/group-info';

interface GroupInfoPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function generateMetadata({
  params,
}: GroupInfoPageProps): Promise<Metadata> {
  const { conversationId } = await params;
  const data = await getRealGroupInfo(conversationId);
  return {
    title: data ? `${data.name} | Info` : 'Group Info | studchat',
    description: data ? `Group and member details for ${data.name} on studchat` : 'Group details on studchat',
  };
}

export default async function GroupInfoPage({ params }: GroupInfoPageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const data = await getRealGroupInfo(conversationId);
  if (!data) {
    notFound();
  }

  return (
    <div className="h-[calc(100vh-4.25rem)] lg:h-[calc(100vh-4rem)] flex w-full justify-center bg-[#050B16] overflow-hidden">
      <div className="w-full max-w-2xl h-full flex flex-col bg-[#050B16] border-x border-white/10 shadow-2xl overflow-hidden">
        <GroupInfoPanel
          data={data}
          isMobileFullPage={true}
        />
      </div>
    </div>
  );
}

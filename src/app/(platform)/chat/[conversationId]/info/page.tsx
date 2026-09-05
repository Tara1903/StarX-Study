import { redirect } from 'next/navigation';

interface GroupInfoPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function GroupInfoPage({ params }: GroupInfoPageProps) {
  const { conversationId } = await params;
  redirect(`/chat/${conversationId}?info=1`);
}

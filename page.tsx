import { auth } from '@/auth';
import AnonEntryGate from '@/components/anon-entry-gate';
import SoloGame from '@/components/solo-game';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ topic?: string }>;
}) {
  const session = await auth();
  const needToVerifyHuman = !session || !session.user || !session.user.id;
  if (needToVerifyHuman) return <AnonEntryGate destinationLabel="solo game" />;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const id = (await params).id?.[0];
  const { topic } = await searchParams;
  return <SoloGame topic={topic} />;
}

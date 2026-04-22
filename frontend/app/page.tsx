import { GraphPanel } from '@/components/GraphPanel';

export default function HomePage() {
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-5 px-4 py-5 md:px-8 md:py-8'>
      <GraphPanel />
    </main>
  );
}

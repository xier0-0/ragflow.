import { Outlet, useLocation } from 'react-router';
import { Header } from './next-header';

export default function NextLayout() {
  const { pathname } = useLocation();
  return (
    <main className="h-full flex flex-col">
      <Header />
      <Outlet key={pathname} />
    </main>
  );
}

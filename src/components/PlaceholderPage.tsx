import { useLocation } from 'react-router-dom';

export function PlaceholderPage() {
  const { pathname } = useLocation();
  return (
    <div className="placeholder-page">
      <h2>Coming Soon</h2>
      <p>
        The <code>{pathname}</code> feature is under development.
      </p>
    </div>
  );
}

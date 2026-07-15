import { useState } from 'react';
import { ProjectsScreen } from './screens/ProjectsScreen';
import { ProjectDetailScreen } from './screens/ProjectDetailScreen';

type Screen = { name: 'list' } | { name: 'detail'; projectId: string };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'list' });

  if (screen.name === 'detail') {
    return (
      <ProjectDetailScreen
        projectId={screen.projectId}
        onBack={() => setScreen({ name: 'list' })}
      />
    );
  }

  return <ProjectsScreen onOpenProject={(projectId) => setScreen({ name: 'detail', projectId })} />;
}

export default App;

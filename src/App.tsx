import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Standings from './components/Standings';
import Bracket from './components/Bracket';
import Stats from './components/Stats';
import { useTournamentData } from './hooks/useTournamentData';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { matches, teams, loading } = useTournamentData();

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyber-blue border-t-transparent rounded-full animate-spin shadow-neon"></div>
        <div className="text-cyber-blue font-mono text-sm animate-pulse tracking-[0.3em] uppercase">Initializing Quantum Core...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard matches={matches} />;
      case 'standings':
        return <Standings matches={matches} teams={teams} />;
      case 'bracket':
        return <Bracket matches={matches} />;
      case 'stats':
        return <Stats matches={matches} />;
      default:
        return <Dashboard matches={matches} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default App;

import { useState, useEffect, useCallback } from 'react';
import { audioSystem } from './audio';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  capitalist: {
    id: 'capitalist',
    title: 'Capitalista Pragmático',
    description: 'Gaste todo o dinheiro disponível.',
    icon: '💰'
  },
  needle: {
    id: 'needle',
    title: 'O Peso da Agulha',
    description: 'Sacrifique alguém no Arbítrio 5x seguidas.',
    icon: '⚖️'
  },
  creator: {
    id: 'creator',
    title: 'Criador de Mundos',
    description: 'Desbloqueie 30 elementos na Alquimia.',
    icon: '🌍'
  },
  oppenheimer: {
    id: 'oppenheimer',
    title: 'Oppenheimer',
    description: 'Detone uma bomba atômica ou antimatéria.',
    icon: '☢️'
  },
  pyromaniac: {
    id: 'pyromaniac',
    title: 'Piromaníaco',
    description: 'Use Fogo no modo Sandbox.',
    icon: '🔥'
  },
  dr_frankenstein: {
    id: 'dr_frankenstein',
    title: 'Dr. Frankenstein',
    description: 'Crie uma forma de vida misturando elementos na Alquimia.',
    icon: '🧟'
  },
  overpopulation: {
    id: 'overpopulation',
    title: 'Superpopulação',
    description: 'Acumule 10.000 partículas ativas no Sandbox.',
    icon: '🏢'
  },
  god_complex: {
    id: 'god_complex',
    title: 'Complexo de Deus',
    description: 'Limpe o mundo inteiro no Sandbox.',
    icon: '🧹'
  },
  virus_outbreak: {
    id: 'virus_outbreak',
    title: 'Pandemia',
    description: 'Espalhe um vírus letal no Sandbox.',
    icon: '🦠'
  },
  black_hole_event: {
    id: 'black_hole_event',
    title: 'Evento de Horizonte',
    description: 'Invoque um Buraco Negro no Sandbox.',
    icon: '🕳️'
  },
  let_it_grow: {
    id: 'let_it_grow',
    title: 'Jardim do Éden',
    description: 'Plante sementes (Plant ou Vine) no Sandbox.',
    icon: '🌱'
  },
  electrician: {
    id: 'electrician',
    title: 'Eletricista',
    description: 'Zapeie as coisas usando Eletricidade no Sandbox.',
    icon: '⚡'
  },
  acid_bath: {
    id: 'acid_bath',
    title: 'Banho de Ácido',
    description: 'Use Ácido intenso para dissolver materiais.',
    icon: '🧪'
  },
  absolute_zero: {
    id: 'absolute_zero',
    title: 'Zero Absoluto',
    description: 'Utilize Nitrogênio Líquido para congelar tudo.',
    icon: '❄️'
  }
};

type AchievementCallback = (achievement: Achievement) => void;
const listeners = new Set<AchievementCallback>();

export const unlockAchievement = (id: string) => {
  try {
    const unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
    if (!unlocked.includes(id) && ACHIEVEMENTS[id]) {
      unlocked.push(id);
      localStorage.setItem('achievements', JSON.stringify(unlocked));
      
      const achievement = ACHIEVEMENTS[id];
      listeners.forEach(listener => listener(achievement));
      audioSystem.playSuccess();
    }
  } catch (e) {
    console.error('Fast achievement error', e);
  }
};

export const useAchievements = () => {
  const [toast, setToast] = useState<Achievement | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  const loadUnlocked = useCallback(() => {
    try {
      const unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
      setUnlockedIds(unlocked);
    } catch {
      setUnlockedIds([]);
    }
  }, []);

  useEffect(() => {
    loadUnlocked();
    
    const listener: AchievementCallback = (achievement) => {
      setToast(achievement);
      loadUnlocked(); // reload when a new achievement hits
      setTimeout(() => setToast(null), 5000);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [loadUnlocked]);

  return { toast, unlockedIds, achievements: Object.values(ACHIEVEMENTS) };
};

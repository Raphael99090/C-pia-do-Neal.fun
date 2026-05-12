import fs from 'fs';
import path from 'path';

function mergeGames(targetFile, sourceFiles) {
  let reactImports = new Set();
  let lucideImports = new Set();
  let motionImports = new Set();
  let otherImports = new Set();
  let code = '';

  sourceFiles.forEach(f => {
    const fullPath = path.join('src/components', f);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    let inImport = true;

    for (let i = 0; i < lines.length; i++) {
      let l = lines[i];
      if (l.trim() === '' && inImport) continue;
      
      if (l.startsWith('import ') && inImport) {
        // Collect multi-line imports
        let importBlock = l;
        while (!importBlock.includes(';') && i < lines.length - 1) {
          i++;
          importBlock += '\n' + lines[i];
        }

        if (importBlock.includes('from "react"') || importBlock.includes("from 'react'")) {
           const match = importBlock.match(/\{([^}]+)\}/);
           if (match) {
             match[1].split(',').map(s => s.trim()).forEach(s => { if(s) reactImports.add(s); });
           }
        } else if (importBlock.includes('lucide-react')) {
           const match = importBlock.match(/\{([^}]+)\}/);
           if (match) {
             match[1].split(',').map(s => s.trim()).forEach(s => { if(s) lucideImports.add(s); });
           }
        } else if (importBlock.includes('motion/react')) {
           const match = importBlock.match(/\{([^}]+)\}/);
           if (match) {
             match[1].split(',').map(s => s.trim()).forEach(s => { if(s) motionImports.add(s); });
           }
        } else {
           otherImports.add(importBlock);
        }
      } else {
        inImport = false;
        code += l + '\n';
      }
    }
  });

  let finalContent = `import React, { ${[...reactImports].join(', ')} } from 'react';\n`;
  if (lucideImports.size > 0) finalContent += `import { ${[...lucideImports].join(', ')} } from 'lucide-react';\n`;
  if (motionImports.size > 0) finalContent += `import { ${[...motionImports].join(', ')} } from 'motion/react';\n`;
  
  // Dedup other imports (like audioSystem)
  // we do simple string matching
  let otherUnique = new Set();
  [...otherImports].forEach(imp => {
     let simplified = imp.replace(/\s+/g, ' ');
     if (![...otherUnique].some(u => u.replace(/\s+/g, ' ') === simplified)) {
       otherUnique.add(imp);
     }
  });

  [...otherUnique].forEach(imp => {
    finalContent += imp + '\n';
  });

  finalContent += '\n' + code;
  fs.writeFileSync(path.join('src/components', targetFile), finalContent);
}

// Group 1: Action/Reaction
mergeGames('ActionGames.tsx', ['AimTrainer.tsx', 'CPSTest.tsx', 'ReactionGame.tsx', 'SpeedMatch.tsx', 'SpeedTyper.tsx']);
// Group 2: Brain
mergeGames('BrainGames.tsx', ['ColorGenius.tsx', 'QuickMath.tsx', 'SequenceMaster.tsx', 'VocabMaster.tsx', 'PerfectCircle.tsx']);
// Group 3: Creative / Toys
mergeGames('CreativeToys.tsx', ['Kaleidoscope.tsx', 'ParticleFlow.tsx', 'PixelStudio.tsx', 'Theremin.tsx', 'SynthPad.tsx']);
// Group 4: Simulation
mergeGames('SimulationGames.tsx', ['AlchemyGame.tsx', 'CellStage.tsx', 'GravitySandbox.tsx', 'SandboxGame.tsx', 'SpendMoney.tsx']);
// Meta/Misc
mergeGames('MetaGames.tsx', ['LifeStats.tsx', 'MoralDilemmas.tsx', 'Leaderboard.tsx']);

console.log('Merged successfully.');

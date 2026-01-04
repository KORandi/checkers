# 🎮 Dáma - AI Tournament

Herní engine pro českou dámu (checkers) s kompletním API pro tvorbu AI a pořádání turnajů.

## 📋 Obsah

- [Instalace](#instalace)
- [Rychlý start](#rychlý-start)
- [API Reference](#api-reference)
- [Tvorba AI](#tvorba-ai)
- [Pravidla hry](#pravidla-hry)
- [Příklady](#příklady)

## 🚀 Instalace

```bash
# Klonování/vytvoření projektu
npm install

# Build
npm run build

# Vývoj s hot reload
npm run watch
```

## ⚡ Rychlý start

```typescript
import { CheckersGame, parsePosition } from './checkers-game';

const game = new CheckersGame();

// Zobrazení šachovnice
game.displayBoard();

// Získání všech legálních tahů
const moves = game.getLegalMoves('white');
console.log(`Počet možných tahů: ${moves.length}`);

// Provedení tahu
const move = {
  from: parsePosition('c3')!,
  to: parsePosition('d4')!
};

const result = game.makeMove(move);
if (result.success) {
  console.log('Tah proveden!');
  game.displayBoard();
} else {
  console.error('Chyba:', result.error);
}
```

## 📚 API Reference

### CheckersGame

Hlavní třída herního enginu.

#### Konstruktor

```typescript
const game = new CheckersGame();
```

#### Metody

##### `getState(): GameState`

Vrací kompletní stav hry.

```typescript
interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Player;
  winner?: Player;
  moveHistory: Move[];
}
```

##### `getPiece(pos: Position): Piece | null`

Vrací figurku na dané pozici.

##### `isValidMove(move: Move): { valid: boolean; error?: string }`

Validuje tah a vrací výsledek s případnou chybovou zprávou.

##### `makeMove(move: Move): { success: boolean; error?: string }`

Provede tah. Automaticky validuje a aplikuje všechna pravidla.

##### `getLegalMoves(player: Player): Move[]`

Vrací seznam všech legálních tahů pro daného hráče.

##### `displayBoard(): void`

Zobrazí aktuální stav šachovnice v terminálu.

### Typy

```typescript
type Player = 'white' | 'black';
type PieceType = 'man' | 'king';

interface Position {
  row: number;  // 0-7
  col: number;  // 0-7
}

interface Move {
  from: Position;
  to: Position;
  captures?: Position[];  // Sebráné figurky
}

interface Piece {
  player: Player;
  type: PieceType;
}
```

### Pomocné funkce

```typescript
// Převod šachové notace na pozici
parsePosition('e3') // -> { row: 5, col: 4 }

// Převod pozice na notaci
formatPosition({ row: 5, col: 4 }) // -> 'e3'
```

## 🤖 Tvorba AI

### Základní struktura AI

```typescript
interface CheckersAI {
  name: string;
  chooseMove(game: CheckersGame, player: Player): Move;
}
```

### Příklad - Náhodná AI

```typescript
class RandomAI implements CheckersAI {
  name = "Random AI";

  chooseMove(game: CheckersGame, player: Player): Move {
    const moves = game.getLegalMoves(player);
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }
}
```

### Příklad - Hladová AI (nejvíc sebere)

```typescript
class GreedyAI implements CheckersAI {
  name = "Greedy AI";

  chooseMove(game: CheckersGame, player: Player): Move {
    const moves = game.getLegalMoves(player);
    
    // Vyber tah s nejvíc sebraných figurek
    return moves.reduce((best, move) => {
      const captures = move.captures?.length || 0;
      const bestCaptures = best.captures?.length || 0;
      return captures > bestCaptures ? move : best;
    });
  }
}
```

### Příklad - Minimax AI

```typescript
class MinimaxAI implements CheckersAI {
  name = "Minimax AI";
  
  constructor(private depth: number = 4) {}

  chooseMove(game: CheckersGame, player: Player): Move {
    const moves = game.getLegalMoves(player);
    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      // Vytvoř kopii hry a simuluj tah
      const gameCopy = this.cloneGame(game);
      gameCopy.makeMove(move);
      
      const score = this.minimax(gameCopy, this.depth - 1, false, player);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private minimax(game: CheckersGame, depth: number, maximizing: boolean, player: Player): number {
    // Implementace minimax algoritmu
    // ... hodnotící funkce, rekurze, alpha-beta pruning ...
  }

  private cloneGame(game: CheckersGame): CheckersGame {
    // Deep copy hry pro simulace
  }
}
```

## 📖 Pravidla hry

### Základní pravidla

- Hra se hraje na šachovnici 8×8
- Bílý hráč začína zdola, černý shora
- Figurky se pohybují diagonálně po tmavých polích
- Pěšci se pohybují pouze dopředu
- Dámy se pohybují dopředu i dozadu

### Braní

- Skok přes soupeřovu figurku na volné pole
- **Povinné braní**: pokud existuje možnost skoku, musíte skákat
- Vícenásobné skoky jsou povoleny

### Dámy

- Pěšec se stává dámou při dosažení poslední řady
- Dáma může táhnout dopředu i dozadu

### Výhra

- Soupeř nemá žádné legální tahy
- Soupeř nemá žádné figurky

## 💡 Příklady

### Hra mezi dvěma AI

```typescript
import { CheckersGame } from './checkers-game';

const game = new CheckersGame();
const ai1 = new RandomAI();
const ai2 = new GreedyAI();

while (!game.getState().winner) {
  const currentPlayer = game.getState().currentPlayer;
  const ai = currentPlayer === 'white' ? ai1 : ai2;
  
  const move = ai.chooseMove(game, currentPlayer);
  game.makeMove(move);
  game.displayBoard();
  
  // Krátká pauza pro sledování
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log(`Vyhrál: ${game.getState().winner}`);
```

### Turnaj více AI

```typescript
const ais = [
  new RandomAI(),
  new GreedyAI(),
  new MinimaxAI(3),
  new MinimaxAI(5),
];

const results = runTournament(ais, {
  gamesPerPair: 10,
  timeLimit: 5000  // 5s na tah
});

printLeaderboard(results);
```

## 📁 Struktura projektu

```
checkers-ai-tournament/
├── src/
│   ├── checkers-game.ts      # Hlavní engine
│   ├── index.ts               # Export
│   └── ai/
│       ├── random-ai.ts
│       ├── greedy-ai.ts
│       └── minimax-ai.ts
├── examples/
│   ├── game-example.ts
│   └── tournament-example.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 Tipy pro AI

1. **Hodnotící funkce**: Počet figurek, pozice, dámy mají vyšší hodnotu
2. **Minimax s alpha-beta pruning**: Efektivní prohledávání stromu
3. **Hloubka prohledávání**: Balance mezi rychlostí a kvalitou
4. **Opening book**: Předpřipravené začátky hry
5. **Endgame tables**: Optimální tahy v koncovkách

## 📝 Legenda zobrazení

```
w = bílý pěšec
W = bílá dáma
b = černý pěšec  
B = černá dáma
· = prázdné pole
```

## 🤝 Přispívání

Pro turnaj:

1. Vytvoř vlastní AI třídu implementující `CheckersAI` rozhraní
2. Otestuj proti základním AI
3. Přines na turnaj!

## 📄 Licence

MIT

---

Vytvořeno pro AI turnaj v dámě 🏆
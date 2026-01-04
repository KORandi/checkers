type Player = 'white' | 'black';
type PieceType = 'man' | 'queen';

interface Position {
  row: number;
  col: number;
}

interface Piece {
  player: Player;
  type: PieceType;
}

interface Move {
  from: Position;
  to: Position;
  captures?: Position[];
}

interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Player;
  winner?: Player;
  moveHistory: Move[];
}

// Herní engine
class CheckersGame {
  private board: (Piece | null)[][];
  private currentPlayer: Player;
  private moveHistory: Move[];
  private winner?: Player;

  constructor() {
    this.board = this.initBoard();
    this.currentPlayer = 'white';
    this.moveHistory = [];
  }

  private initBoard(): (Piece | null)[][] {
    const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Černé figurky (nahoře)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { player: 'black', type: 'man' };
        }
      }
    }

    // Bílé figurky (dole)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { player: 'white', type: 'man' };
        }
      }
    }

    return board;
  }

  // API metody
  getState(): GameState {
    return {
      board: this.board.map(row => [...row]),
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      moveHistory: [...this.moveHistory]
    };
  }

  getPiece(pos: Position): Piece | null {
    if (!this.isValidPosition(pos)) return null;
    return this.board[pos.row][pos.col];
  }

  private isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }

  // Validace tahů
  isValidMove(move: Move): { valid: boolean; error?: string } {
    if (this.winner) {
      return { valid: false, error: 'Hra již skončila' };
    }

    if (!this.isValidPosition(move.from) || !this.isValidPosition(move.to)) {
      return { valid: false, error: 'Neplatná pozice' };
    }

    const piece = this.getPiece(move.from);
    if (!piece) {
      return { valid: false, error: 'Na pozici není figurka' };
    }

    if (piece.player !== this.currentPlayer) {
      return { valid: false, error: 'Není na tahu tento hráč' };
    }

    if (this.getPiece(move.to)) {
      return { valid: false, error: 'Cílová pozice je obsazená' };
    }

    const allMoves = this.getLegalMoves(this.currentPlayer);
    const hasCaptures = allMoves.some(m => m.captures && m.captures.length > 0);

    // Pokud existují skoky, musí hráč skákat
    if (hasCaptures && (!move.captures || move.captures.length === 0)) {
      return { valid: false, error: 'Musíte provést skok' };
    }

    const moveStr = JSON.stringify(move);
    const isLegal = allMoves.some(m => JSON.stringify(m) === moveStr);

    if (!isLegal) {
      return { valid: false, error: 'Neplatný tah' };
    }

    return { valid: true };
  }

  makeMove(move: Move): { success: boolean; error?: string } {
    const validation = this.isValidMove(move);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const piece = this.getPiece(move.from)!;

    // Provedení tahu
    this.board[move.to.row][move.to.col] = piece;
    this.board[move.from.row][move.from.col] = null;

    // Odebrání sebraných figurek
    if (move.captures) {
      for (const cap of move.captures) {
        this.board[cap.row][cap.col] = null;
      }
    }

    // Povýšení na dámu
    if (piece.type === 'man') {
      if ((piece.player === 'white' && move.to.row === 0) ||
        (piece.player === 'black' && move.to.row === 7)) {
        this.board[move.to.row][move.to.col]!.type = 'queen';
      }
    }

    this.moveHistory.push(move);
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

    // Kontrola výhry
    this.checkWinner();

    return { success: true };
  }

  getLegalMoves(player: Player): Move[] {
    const moves: Move[] = [];
    const captures: Move[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.player === player) {
          const pos = { row, col };
          const pieceMoves = this.getPieceMoves(pos);

          for (const move of pieceMoves) {
            if (move.captures && move.captures.length > 0) {
              captures.push(move);
            } else {
              moves.push(move);
            }
          }
        }
      }
    }

    return captures.length > 0 ? captures : moves;
  }

  private getPieceMoves(from: Position): Move[] {
    const piece = this.getPiece(from);
    if (!piece) return [];

    const moves: Move[] = [];
    const directions = this.getDirections(piece);

    for (const [dr, dc] of directions) {
      // Normální tahy
      const to = { row: from.row + dr, col: from.col + dc };
      if (this.isValidPosition(to) && !this.getPiece(to)) {
        moves.push({ from, to });
      }

      // Skoky
      const jumpTo = { row: from.row + dr * 2, col: from.col + dc * 2 };
      const captured = { row: from.row + dr, col: from.col + dc };

      if (this.isValidPosition(jumpTo) && !this.getPiece(jumpTo)) {
        const capPiece = this.getPiece(captured);
        if (capPiece && capPiece.player !== piece.player) {
          moves.push({ from, to: jumpTo, captures: [captured] });
        }
      }
    }

    return moves;
  }

  private getDirections(piece: Piece): [number, number][] {
    if (piece.type === 'queen') {
      return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    }

    return piece.player === 'white'
      ? [[-1, -1], [-1, 1]]
      : [[1, -1], [1, 1]];
  }

  private checkWinner(): void {
    const whiteMoves = this.getLegalMoves('white');
    const blackMoves = this.getLegalMoves('black');

    if (whiteMoves.length === 0) {
      this.winner = 'black';
    } else if (blackMoves.length === 0) {
      this.winner = 'white';
    }
  }

  // Vizualizace v terminálu
  displayBoard(): void {
    console.log('\n  a b c d e f g h');
    console.log('  ---------------');

    for (let row = 0; row < 8; row++) {
      let line = `${8 - row}|`;

      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        const isBlack = (row + col) % 2 === 1;

        if (!isBlack) {
          line += '  ';
        } else if (!piece) {
          line += '· ';
        } else {
          const symbol = piece.type === 'queen'
            ? (piece.player === 'white' ? 'W' : 'B')
            : (piece.player === 'white' ? 'w' : 'b');
          line += symbol + ' ';
        }
      }

      console.log(line + `|${8 - row}`);
    }

    console.log('  ---------------');
    console.log('  a b c d e f g h\n');
    console.log(`Na tahu: ${this.currentPlayer === 'white' ? 'Bílý' : 'Černý'}`);

    if (this.winner) {
      console.log(`\n🏆 Vyhrál: ${this.winner === 'white' ? 'BÍLÝ' : 'ČERNÝ'}!\n`);
    }
  }
}

// Pomocné funkce pro notaci
function parsePosition(notation: string): Position | null {
  if (notation.length !== 2) return null;

  const col = notation.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(notation[1]);

  if (col < 0 || col > 7 || row < 0 || row > 7) return null;

  return { row, col };
}

function formatPosition(pos: Position): string {
  return String.fromCharCode('a'.charCodeAt(0) + pos.col) + (8 - pos.row);
}

// Export
export { CheckersGame, parsePosition, formatPosition };
export type { Player, PieceType, Position, Piece, Move, GameState };
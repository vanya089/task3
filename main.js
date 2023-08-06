import { Random } from "random-js";
import crypto from 'crypto';
import * as readline from 'readline';

class HMACCalculator {
    constructor() {
        this.key = crypto.randomBytes(32).toString('hex');
    }

    calculateHMAC(data) {
        const hmac = crypto.createHmac('sha256', this.key);
        hmac.update(data);
        return hmac.digest('hex');
    }
}

class MoveGenerator {
    constructor(moves) {
        this.moves = moves;
    }

    generateRandomMove() {
        const random = new Random();
        const randomIndex = random.integer(0, this.moves.length - 1);
        return this.moves[randomIndex];
    }
}

class ResultsTable {
    constructor(moves, gameLogic) {
        this.moves = moves;
        this.gameLogic = gameLogic;
        this.generateTable();
    }

    generateTable() {
        this.table = [[' User/Computer', ...this.moves]];
        for (let i = 0; i < this.moves.length; i++) {
            const row = [this.moves[i]];
            for (let j = 0; j < this.moves.length; j++) {
                const result = this.gameLogic.determineWinner(this.moves[i], this.moves[j]);
                row.push(result);
            }
            this.table.push(row);
        }
    }

    formatTable() {
        const colWidths = this.table[0].map((_, colIndex) =>
            Math.max(...this.table.map(row => row[colIndex].length))
        );

        const separator = colWidths.map(width => '-'.repeat(width)).join('-+-');

        const formattedRows = this.table.map(row =>
            row.map((cell, colIndex) => cell.padEnd(colWidths[colIndex])).join(' | ')
        );

        return formattedRows.map((row, rowIndex) =>
            (rowIndex === 1 ? separator + '\n' : '') + row + '\n'
        ).join('') + separator;
    }
}

class NonTransitiveGame {
    constructor(moves) {
        this.moves = moves;

        const distinctMoves = new Set(this.moves);
        if (distinctMoves.size !== this.moves.length) {
            console.error('Error: Duplicate moves detected. Please enter distinct moves.');
            process.exit(1);
        }

        if (this.moves.length < 3 || this.moves.length % 2 !== 1) {
            console.error('Invalid input. Please enter an odd number of at least three moves.');
            process.exit(1);
        }

        this.moveGenerator = new MoveGenerator(moves);
        this.gameLogic = new GameLogic(moves);
        this.resultsTable = new ResultsTable(moves, this.gameLogic);
        this.computerMove = this.moveGenerator.generateRandomMove();
        this.hmacCalculator = new HMACCalculator();
        this.computerHmac = this.hmacCalculator.calculateHMAC(this.computerMove);
    }

    displayHelp() {
        console.log('\x1b[36mInstructions:\x1b[0m');
        console.log('This table shows the results for the user.');
        console.log('To find out who wins, locate your move in the "User" column,');
        console.log('then go to the corresponding row and column to see the result.');
        console.log('Type "?" or "help" as a move to see the game results table.\n');
    }

    play() {
        console.log('Available moves:');
        console.log('? - Show game results');
        this.moves.forEach((move, index) => {
            console.log(`${index + 1} - ${move}`);
        });
        console.log('0 - Exit');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter your move: ', (input) => {
            rl.close();
            if (input === '0') {
                process.exit(0);
            } else if (input.toLowerCase() === '?' || input.toLowerCase() === 'help') {
                this.displayHelp();
                console.log('\n\x1b[36mGame Results (from the user\'s perspective):\x1b[0m');
                console.log(this.resultsTable.formatTable());
            } else if (isNaN(input) || input < 1 || input > this.moves.length) {
                console.log('Invalid input. Please enter a valid move.');
            } else {
                const playerMove = this.moves[input - 1];
                console.log(`Your move: ${playerMove}`);
                console.log(`Computer's HMAC move: ${this.computerHmac}`);
                console.log(`Enter HMAC key: ${this.hmacCalculator.key}`);
                console.log(`Computer's move: ${this.computerMove}`);
                console.log(`Your HMAC move: ${this.hmacCalculator.calculateHMAC(playerMove)}`);

                const result = this.gameLogic.determineWinner(playerMove, this.computerMove);
                console.log(result);
            }
        });
        this.displayHelp();
    }
}

class GameLogic {
    constructor(moves) {
        this.moves = moves;
        this.generateResults();
    }

    generateResults() {
        this.results = {};
        for (let i = 0; i < this.moves.length; i++) {
            const currentMove = this.moves[i];
            const nextMoveIndex = (i + 1) % this.moves.length;
            this.results[currentMove] = this.moves[nextMoveIndex];
        }
    }

    determineWinner(playerMove, computerMove) {
        if (this.results[computerMove] === playerMove) {
            return 'Win!';
        } else if (this.results[playerMove] === computerMove) {
            return 'Lose!';
        } else {
            return 'Draw!';
        }
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter moves (separated by spaces): ', (input) => {
    rl.close();

    const moves = input.split(' ');

    const game = new NonTransitiveGame(moves);
    game.play();
});

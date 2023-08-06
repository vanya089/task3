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

class NonTransitiveGame {
    constructor(moves) {
        this.moves = moves;
        this.generateResults();
        this.computerMove = this.generateRandomMove();
        this.hmacCalculator = new HMACCalculator();
        this.computerHmac = this.hmacCalculator.calculateHMAC(this.computerMove);
    }

    generateRandomMove() {
        const random = new Random();
        const randomIndex = random.integer(0, this.moves.length - 1);
        return this.moves[randomIndex];
    }

    generateResults() {
        this.results = {};
        for (let i = 0; i < this.moves.length; i++) {
            const currentMove = this.moves[i];
            const nextMoveIndex = (i + 1) % this.moves.length;
            const nextMove = this.moves[nextMoveIndex];

            this.results[currentMove] = nextMove;
        }
    }

    displayHelp() {
        console.log('\x1b[36mInstructions:\x1b[0m');
        console.log('This table shows the results for the user.');
        console.log('To find out who wins, locate your move in the "User" column,');
        console.log('then go to the corresponding row and column to see the result.');
        console.log('');

        const table = [[' User/Computer', ...this.moves]];
        for (let i = 0; i < this.moves.length; i++) {
            const row = [this.moves[i]];
            for (let j = 0; j < this.moves.length; j++) {
                const result = this.determineWinner(this.moves[i], this.moves[j]);
                row.push(result);
            }
            table.push(row);
        }

        console.log('\n\x1b[36mGame Results (from the user\'s perspective):\x1b[0m');
        console.log(this.formatTable(table));
    }

    formatTable(table) {
        const colWidths = table[0].map((_, colIndex) =>
            Math.max(...table.map(row => row[colIndex].length))
        );

        const separator = colWidths.map(width => '-'.repeat(width)).join('-+-');

        const formattedRows = table.map(row =>
            row.map((cell, colIndex) => cell.padEnd(colWidths[colIndex])).join(' | ')
        );

        return formattedRows.map((row, rowIndex) =>
            (rowIndex === 1 ? separator + '\n' : '') + row + '\n'
        ).join('') + separator;
    }

    play() {
        console.log('Available moves:');
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
            } else if (isNaN(input) || input < 1 || input > this.moves.length) {
                console.log('Invalid input. Please enter a valid move.');
            } else {
                const playerMove = this.moves[input - 1];
                console.log(`Your move: ${playerMove}`);
                console.log(`Computer's HMAC move: ${this.computerHmac}`);
                console.log(`Enter HMAC key: ${this.hmacCalculator.key}`);
                console.log(`Computer's move: ${this.computerMove}`);
                console.log(`Your HMAC move: ${this.hmacCalculator.calculateHMAC(playerMove)}`);

                const result = this.determineWinner(playerMove, this.computerMove);
                console.log(result);
            }
        });
        this.displayHelp();
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

    if (moves.length < 3) {
        console.error('Invalid input. Please enter at least three moves.');
    } else {
        const game = new NonTransitiveGame(moves);
        game.play();
    }
});

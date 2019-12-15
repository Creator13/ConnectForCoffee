const fs = require('fs');
const path = require('path');

class Question {
    constructor(text) {
        this.text = text;
        this.used = false;
        this.hasOptions = text.m
    }
}

const NO_QUESTION = new Question("empty");

function loadFile(filename) {
    const filepath = path.join(__dirname, `static/${filename}`)
    // Load the file
    const data = fs.readFileSync(filepath, 'UTF-8');
    // Split on newline chars
    const lines = data.split(/\r?\n/);

    // Trim all the lines
    lines.forEach((line, i) => {
        lines[i] = line.trim();
    });

    return lines;
}

function getQuestions() {
    let makeQuestions = (line) => {
        let questions = [];
        questions.push(new Question(line));
        return questions;
    }

    return {
        appearance: makeQuestions(loadFile('appearance.txt')),
        interest: makeQuestions(loadFile('interests.txt'))
    }
}

function randomSelect(array, n = 1) {
    if (n > array.length) {
        throw `Cannot select ${n} elements from array with only ${array.length} elements.`;
    }
    if (n < 1) {
        throw `Cannot select less than 1 element`;
    }

    // Generate n unique random numbers
    let randomIndexes = [];
    while (randomIndexes.length < n) {
        let num = Math.floor(Math.random() * array.length);

        if (!randomIndexes.includes(num)) {
            randomIndexes.push(num);
        }
    }

    // Select the elements from the given array at each random index
    let selection = [];
    randomIndexes.forEach((i) => {
        selection.push(array[i]);
    });

    return selection;
}

class QuestionPooler {
    constructor(players = 2) {
        this.players = players;
        // this.waitingForAnswer = false;
        
        this.pools = [];
        for (let i = 0; i < players; i++) {
            // Add a new pool
            this.pools.push({
                current: 0,
                questions: getQuestions()
            });
        }

    }

    getNewQuestions(playerIndex) {
        if (playerIndex >= this.players) {
            throw `playerIndex ${playerIndex} was out of range. Player count: ${this.players}.`;
        }

        let currentPool = this.pools[playerIndex];

        randomSelect(currentPool.questions.appearance, 3);
    }
}

module.exports = {
    Pooler: QuestionPooler,
    NO_QUESTION: NO_QUESTION
}

let qp = new QuestionPooler();
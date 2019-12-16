const fs = require('fs');
const path = require('path');

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
    let makeQuestions = (array) => {
        let questions = [];
        array.forEach((line) => {
            questions.push(new Question(line));
        });
        return questions;
    }

    return {
        appearance: makeQuestions(loadFile('appearance.txt')),
        interests: makeQuestions(loadFile('interests.txt'))
    }
}

function randomSelect(array, n = 1) {
    if (n > array.length) {
        throw `Cannot select ${n} elements from array with only ${array.length} elements.`;
    }
    if (n < 1) {
        throw `Cannot select less than 1 element`;
    }

    let unusedQuestions = array.filter(q => !q.used);

    n = unusedQuestions.length < n ? unusedQuestions.length : n;

    // Generate n unique random numbers
    let randomIndexes = [];
    while (randomIndexes.length < n) {
        let num = Math.floor(Math.random() * unusedQuestions.length);

        if (randomIndexes.includes(num)) continue;

        randomIndexes.push(num);
    }

    // Select the elements from the given array at each random index
    let selection = [];
    randomIndexes.forEach((i) => {
        selection.push(unusedQuestions[i]);
    });

    return selection;
}

class Question {
    constructor(text) {
        this.text = text;
        this.used = false;

        let regex = /\[[A-Z ]*\]/
        this.hasOptions = regex.test(text);
        
        if (this.hasOptions) {
            // convert variable in question from form [VARIABLE NAME] to variable-name
            let optionFileName = this.text.match(regex)[0];
            optionFileName = optionFileName.replace(/\[|\]/g, '').replace(/ /, '-').toLowerCase();

            // Load the file static/options/variable-name.txt
            try {
                this.options = loadFile(`options/${optionFileName}.txt`);
            }
            catch (err) {
                console.error(`No options file found for ${optionFileName}. ("${this.text}")`);
            }
        }
    }

    use() {
        this.used = true;
    }
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

    getNewQuestions(playerIndex, n = 3) {
        if (playerIndex >= this.players || playerIndex < 0 || playerIndex == undefined) {
            throw `playerIndex ${playerIndex} was out of range. Player count: ${this.players}.`;
        }

        let currentPool = this.pools[playerIndex];

        return randomSelect(currentPool.questions.interests, n);
    }

    getAll(playerIndex) {
        if (playerIndex >= this.players || playerIndex < 0 || playerIndex == undefined) {
            throw `playerIndex ${playerIndex} was out of range. Player count: ${this.players}.`;
        }

        return this.pools[playerIndex].questions;
    }
}

const NO_QUESTION = new Question("empty");

module.exports = {
    Pooler: QuestionPooler,
    NO_QUESTION: NO_QUESTION
}

////// EXAMPLE CODE: //////

// let qp = new QuestionPooler();

// for (let i = 0; i < 20; i++) {
//     let qs = qp.getNewQuestions(0);
//     console.log(qs);
//     console.log(`${i}: Got ${qs.length} questions back`);
    
//     if (qs.length <= 0) break;

//     qs[0].use();
//     console.log(`used question "${qs[0].text}"`);
// }

// console.log(qp.getAll(0).appearance[0].options);
let vm = new Vue({
    el: '#app',

    data: {
        round: { all: 0, correctJudgments: 0 },
        numbers: [0, 0],
        isThinking: true,
        isCorrectResult: true,
        displayResult: 0,
        scoreAnimation: '',
        ARITHMETIC_TYPE: {
            ADDITION: 1,
            SUBTRACTION: 2,
            MULTIPLICATION: 3,
            DIVISION: 4,
            properties: {
                1: { operation: '+', f: ([x, y]) => x + y, gen: (arr) => arr, level: [2, 2] },
                2: { operation: '-', f: ([x, y]) => x - y, gen: ([a, b]) => a >= b ? [a, b] : [b, a], level: [2, 2] },
                3: { operation: '×', f: ([x, y]) => x * y, gen: (arr) => arr, level: [2, 1] },
                4: { operation: '÷', f: ([x, y]) => x / y, gen: ([a, b]) => [a * b, b], level: [1, 2] }
            }
        },
        arithmeticType: 1,
        sound: {
            right: new Howl({ src: ['https://freesound.org/data/previews/203/203121_777645-lq.mp3'] }),
            wrong: new Howl({ src: ['https://freesound.org/data/previews/415/415209_5121236-lq.mp3'] })
        },
    },

    computed: {
        operation: function() {
            return this.ARITHMETIC_TYPE.properties[this.arithmeticType].operation;
        },
        correctResult: function() {
            return this.ARITHMETIC_TYPE.properties[this.arithmeticType].f(this.numbers);
        },
        score: function() {
            if (this.round.all <= 1) return 100;
            return Math.max(0, Math.round((this.round.correctJudgments / (this.round.all - 1)) * 100));
        }
    },

    methods: {
        getRandomNumber: function(level) {
            let min = Math.pow(10, level - 1);
            let max = Math.pow(10, level);
            return min + Math.floor(Math.random() * (max - min));
        },
        getNumbers: function() {
            let level = this.ARITHMETIC_TYPE.properties[this.arithmeticType].level;
            let a = this.getRandomNumber(level[0]);
            let b = this.getRandomNumber(level[1]);
            return this.ARITHMETIC_TYPE.properties[this.arithmeticType].gen([a, b]);
        },
        generateDisplayResult: function() {
            const correct = this.correctResult;
            this.isCorrectResult = Math.random() > 0.5;
            if (this.isCorrectResult) {
                this.displayResult = correct;
            } else {
                // Generate a wrong result within ±20% of the correct result, but not equal to it
                let offset;
                do {
                    offset = correct * (0.8 + Math.random() * 0.4);
                } while (Math.abs(offset - correct) < 1);
                this.displayResult = this.arithmeticType === 4
                    ? Math.round(offset * 10) / 10 // Round division to 1 decimal
                    : Math.round(offset);
            }
        },
        newRound: function() {
            this.numbers = this.getNumbers();
            this.isThinking = true;
            this.scoreAnimation = '';
        },
        next: function() {
            this.newRound();
            this.round.all++;
        },
        getResult: function() {
            this.generateDisplayResult();
            this.isThinking = false;
        },
        answerRight: function() {
            if (this.isCorrectResult) {
                this.round.correctJudgments++;
                this.scoreAnimation = 'up';
                this.sound.right.play();
            } else {
                this.scoreAnimation = 'down';
                this.sound.wrong.play();
            }
            this.next();
        },
        answerWrong: function() {
            if (!this.isCorrectResult) {
                this.round.correctJudgments++;
                this.scoreAnimation = 'up';
                this.sound.right.play();
            } else {
                this.scoreAnimation = 'down';
                this.sound.wrong.play();
            }
            this.next();
        },
    },

    watch: {
        arithmeticType: function() {
            this.newRound();
        }
    }
});

window.onload = vm.next;
import React from 'react';
import Chain from './chain';
import Dices from './dices';

class Player {
  constructor(level, rule25) {
    //this.user = user;
    this.dices = [];
    this.points = 0;
    this.lastTurn = null;
    this.level = level;
    this.rule25 = rule25;
  }
  addDice(dice) { // потом убрать, это лишнее
    this.dices.push(dice[0], dice[1]);
  }
  throwDice(diceNumber) {
    return this.dices.splice(diceNumber, 2);
  }
  get sumOfPoints() {
    if (this.dices.length === 0) {
      return 0;
    }
    if ((this.rule25) && (this.dices.length === 2) && (this.dices[0] + this.dices[1] === 0)) {
      return 25;
    }
    return this.dices.reduce((sum, point) => {
      return sum + point;
    });
  }
}

export default class Table extends React.Component  {
  constructor({playersNumber, dicesNumber, rule25}) {
    super();
    this.playersNumber = playersNumber;
    this.dicesNumber = dicesNumber;
    this.state = {
      currentPlayer: 0,
      players : [],
      dices : [],
      chain : [],
      status : 'not started'
    };
    this.chain = [];
    this.dices = [];
    this.players = [];
    this.currentPlayer = 0;
    this.firstDiceInChain = [this.dicesNumber - 1, this.dicesNumber - 1];
    this.lastGivenDice = [];
    this.commonSum = 0;
    this.turnNumber = 0;
    this.rule25 = rule25;
  }
  get currPlayerDices() {
    return this.players[this.currentPlayer].dices;
  }
  get sumOfPointsInChain() {
    if (this.chain.length === 0) {
      return 0;
    }
    return this.chain.reduce(function(sum, point) {
      return sum + point;
    });
  }
  get sumOfPointsInDiceBank() {
    if (this.dices.length === 0) {
      return 0;
    }
    return this.dices.reduce(function(sum, point) {
      return sum + point;
    });
  }
  componentDidUpdate() {
    console.log('компонентДидАпдейт');

  }
  initialize = () => {
    //создаем массив игроков
    for(let i = 0; i < this.playersNumber; i++) {
      this.players[i] = new Player((i % 2) ? 'normal' : 'stupid', this.rule25);
    }
    // определяем количество сдаваемых костей
    if (this.setStatus() === 'incorrect') {
      return 'error';
    }
    // создаем колоду костей
    for(let i = 0; i < this.dicesNumber; i++) {
      for(let j = i; j < this.dicesNumber; j++) {
        this.dices.push(i, j);
      }
    }
    this.setState({dices: this.dices, chain: this.chain, players: this.players});
    //this.commonSum = this.sumOfPointsIndiceBank;
  }
  dealDices = () => {
    // Раздаем игрокам кости и определяем кость, обладатель которой ходит первым
    let startDicesNumber = this.playersNumber === 2 ? 7 : 5;
    //this.firstDiceInChain = this.dicesNumber - 1;
    for(let i = 0; i < startDicesNumber * this.playersNumber; i++) {
      this.players[this.currentPlayer].lastTurn = this.giveDice();
      this.switchPlayer();
    }
    this.setState({dices: this.dices, chain: this.chain});
    // находим первую кость для игры
    let doubleIsFound = false;
    let minDouble = this.dicesNumber - 1;
    let minDice = (this.dicesNumber - 1) * 2 - 1;
    this.players.forEach((player, j) => {
      for(let i = 0; i < player.dices.length; i+=2) {
        if ((player.dices[i] === player.dices[i+1]) && (player.dices[i] <= minDouble) && (player.dices[i] !== 0)) {
          doubleIsFound = true;
          minDouble = player.dices[i];
        }
        if ((player.dices[i] + player.dices[i+1] > 0) && (player.dices[i] + player.dices[i+1] <= minDice)) {
          this.firstDiceInChain = [player.dices[i], player.dices[i+1]];
          minDice = player.dices[i] + player.dices[i+1];
        }
      }
    });
    if (doubleIsFound) {
      this.firstDiceInChain = [minDouble, minDouble]
    }
  }
  showDices(dices) {
    //удобный вид демонстрации костей в логах
    let result = '('
    for (let i = 0; i < dices.length - 1; i++) {
      result = result + dices[i];
      result += (i % 2 === 0) ? ',' : '),('
    }
    result = result + dices[dices.length - 1] + ')';
    return result;
  }
  giveDice() {
    if (this.dices.length === 0) {
      return 'missed';
    } else {
      let randomDiceNumber = Math.floor(Math.random() * (this.dices.length / 2));
      this.lastGivenDice = this.dices.splice(randomDiceNumber * 2, 2);
      this.players[this.currentPlayer].addDice(this.lastGivenDice);
      console.log(`Player ${this.currentPlayer} successfully took (${this.lastGivenDice})!`)
      return 'took card';
    }
  }
  switchPlayer() { 
    this.currentPlayer = (this.currentPlayer < this.players.length - 1) ? (++this.currentPlayer) : 0;
    this.turnNumber++;
    this.setState({currentPlayer: this.currentPlayer, players: this.players, dices: this.dices,
    chain: this.chain});
    console.log(`свитчплеер ${this.state.currentPlayer} ${this.currentPlayer}`);
  }
  setStatus() {
    if ((this.players.length > 4) || (this.players.length < 2)) {
      return 'incorrect';
    }
    if ((this.dices.length === 0) && (this.players[this.currentPlayer].dices.length === 0)) {
      return 'finished';
    }
    let theGameIsLooped = (this.dices.length === 0);
    this.players.forEach((player) => {
      theGameIsLooped = theGameIsLooped * (player.lastTurn === 'missed');
    })
    if (theGameIsLooped) {
      let minPoints = this.players[0].sumOfPoints;
      this.currentPlayer = 0;
      this.players.forEach((player, i) => {
        if (player.sumOfPoints < minPoints) {
          minPoints = player.sumOfPoints;
          this.currentPlayer = i; //в игре могут быть несколько победителей - исправить!
        }
      })
      return 'finished';
    }
    return 'continuing';
  }
  checkState = () => {
    this.setState({status: this.setStatus()});
    console.log(`The game is ${this.setStatus()}.`);
    console.log(`Chain state: ${this.showDices(this.chain)}. Chain length is ${this.chain.length}. it's player ${this.currentPlayer + 1}'s turn.
    He's gonna search for ${this.chain[0]} and ${this.chain[this.chain.length - 1]}.`);
    console.log(`Dice bank state: ${this.showDices(this.dices)}. It's ${this.sumOfPointsInDiceBank} points.`);
    if (this.chain.length === 0) {
      console.log(`The first dice in chain is gonna be (${this.firstDiceInChain[0]}, ${this.firstDiceInChain[1]})!`);
    }
    //let testSum = this.sumOfPointsInChain + this.sumOfPointsIndiceBank;
    this.players.forEach((player, i) => {
      console.log(`Player ${i} has ${this.showDices(player.dices)} and ${player.sumOfPoints} points.\
 Total points number is ${player.points} points. This guy is ${player.level}`);
    //  testSum += this.players[i].sumOfPoints;
    })
    //console.log(`Common sum of the dices is ${this.commonSum}. The sum in current game is ${testSum}`)
    if (this.setStatus() === 'finished') {
      let winnersPoint = - this.players[this.currentPlayer].sumOfPoints * 2;
      this.players.forEach((player, i) => {
        winnersPoint += player.sumOfPoints;
        console.log(`Player ${i} had ${player.points} points before this game was finished.`)
      })
      this.players[this.currentPlayer].points += winnersPoint;
      console.log(`Player ${this.currentPlayer} wins the game with ${winnersPoint} points.`);
    }
    console.log(`______________________________________________________________________________`);
  }
  putDice(i) {
    let dice = [this.currPlayerDices[i], this.currPlayerDices[i + 1] ];
    this.players[this.currentPlayer].lastTurn = 'missed';
    if ((this.chain[this.chain.length - 1] === dice[0]) || ((this.chain.length === 0) && (dice[0] === this.firstDiceInChain[0]) && (dice[1] === this.firstDiceInChain[1]))) {
      console.log(`successful pushing of (${dice}) by Player ${this.currentPlayer}`);
      this.chain.push(dice[0], dice[1]);
      this.players[this.currentPlayer].lastTurn = 'card thrown';
    } else if (this.chain[this.chain.length - 1] === dice[1]) {
      console.log(`successful pushing of (${dice}) by Player ${this.currentPlayer}`);
      this.chain.push(dice[1], dice[0]);
      this.players[this.currentPlayer].lastTurn = 'card thrown';
    } else if (this.chain[0] === dice[0]) {
      console.log(`successful unshifting of (${dice}) by Player ${this.currentPlayer}`);
      this.chain.unshift(dice[1], dice[0]);
      this.players[this.currentPlayer].lastTurn = 'card thrown';
    } else if (this.chain[0] === dice[1]) {
      console.log(`successful unshifting of (${dice}) by Player ${this.currentPlayer}`);
      this.chain.unshift(dice[0], dice[1]);
      this.players[this.currentPlayer].lastTurn = 'card thrown';
    }
    if (this.players[this.currentPlayer].lastTurn === 'card thrown') {
      this.players[this.currentPlayer].throwDice(i);
      return true;
    }
    return false;
  }
  diceFinder() {
    let maxPoint = 0, diceFound;
    for(let i = 0; i < this.currPlayerDices.length; i+=2) {
      if ((this.currPlayerDices[i] === this.chain[0]) || (this.currPlayerDices[i + 1] === this.chain[0]) ||
      (this.currPlayerDices[i] === this.chain[this.chain.length - 1]) || (this.currPlayerDices[i + 1] === this.chain[this.chain.length - 1])) {
        if (this.players[this.currentPlayer].level === 'stupid') {
          console.log(`Optimal dice for Player ${this.currentPlayer} is number ${i}`);
          return i;
        } else {
          if (this.currPlayerDices[i] + this.currPlayerDices[i + 1] > maxPoint) {
            maxPoint = this.currPlayerDices[i] + this.currPlayerDices[i + 1];
            diceFound = i;
          }
        }
      }
    }
    console.log(`Optimal dice for Player ${this.currentPlayer} is number ${diceFound}`);
    return diceFound;
  }
  game = () => {
    this.setStatus();
    while (this.setStatus() === 'continuing') {
      this.switchPlayer();
      if (this.currPlayerDices.length === 0) {
        this.players[this.currentPlayer].lastTurn = 'missed';
      }
      if (this.chain.length === 0) { //может быть, здесь уместнее другой метод - find или что-то вроде того
        for(let i = 0; i < this.currPlayerDices.length; i+=2) {
          if (this.putDice(i)) {
            break;
          }
        }
      } else { //если это уже не первый ход в игре - выбираем кость в зависимости от способностей
        this.putDice(this.diceFinder());
      } // игрок должен набирать кости пока не найден нужную - исправить на цикл, но не удалять старый код (для вариаций правил)
      if ((this.players[this.currentPlayer].lastTurn === 'missed') && (this.chain.length !== 0)) {
        console.log(`Player ${this.currentPlayer} doesn't have right dice and tries to take new one.`);
        this.giveDice(); // если не смогли походить - тянем кость и пробуем походить еще раз
        this.putDice(this.currPlayerDices.length - 2);
      }
      this.setState({dices: this.dices, chain: this.chain, players: this.players});
      this.checkState();
    }
    // Фиксируем очки лидера и сдаем кости в базар
    let leaderPoint = 0;
    this.players.forEach((player) => {
      if (leaderPoint < player.points) {
        leaderPoint = player.points;
      }
      this.dices = this.dices.concat(player.dices);
      player.dices = [];
    })
    this.dices = this.dices.concat(this.chain);
    this.chain = [];
    return leaderPoint;
  }
  render() {
    return (
      <div>
        <p><button onClick={this.initialize}>Создать игру</button></p>
        <p><button onClick={this.checkState}>Проверить состояние</button></p>
        <p><button onClick={this.dealDices}>Раздать</button></p>
        <p><button onClick={this.game}>Играть</button></p>
        <p>{this.state.status}</p>
        <p>Current player is number {this.state.currentPlayer}</p>
        <Dices dices={this.state.dices} message={"Dice bank:"} showDices={this.showDices.bind(this)} />
        <Dices dices={this.state.chain} message={"Chain:"} showDices={this.showDices.bind(this)} />
        {this.state.players.map((player, i) => <Dices key={i} dices={player.dices} message={`Player ${i}'s dice: `}
        showDices={this.showDices.bind(this)} />)}
      </div>
    )
  }
}

Table.defaultProps = {
  playersNumber : 4,
  dicesNumber : 7,
  rule25 : true,
  winnerPoint : 50
}

function Game(props) {
  const {playersNumber, dicesNumber, winnerPoint, rule25} = props;
  // создаем игровое поле
  let PlayTable = new Table(playersNumber, dicesNumber, rule25);
  // запускаем игровой процесс
  PlayTable.initialize();
  //начинаем играть
  let currentLeaderPoint = 0;
  while((currentLeaderPoint < winnerPoint) && (PlayTable.state !== 'incorrect')) {
    PlayTable.checkState();
    PlayTable.dealDices();
    currentLeaderPoint = PlayTable.game();
    alert(`Player ${PlayTable.currentPlayer} won the game. The leader has ${currentLeaderPoint} points!`);
  }
  console.log(`Final Table is:`);
  PlayTable.players.map((player, i) => {
    console.log(`Player ${i} finally has ${player.points}. This guy is ${player.level}`)
  })
  return (
    <div>
      <h1>Final Table is:</h1>
    </div>
  )
}
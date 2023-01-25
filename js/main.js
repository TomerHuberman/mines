'use strict'
/*----START----GLOBAL VARIABELS----START--- */
const gLevel = {
    SIZE: 4,
    MINES: 2
}
const gGame = {
    isOn: false,
    isFirstClick: true,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3

}
var gBoard = []
const MINE = '💣'
const EMPTY = ''
const FLAG = '🚩'
const HEART = '❤️'
const SMILE = '😁'
const HOT = '🥵'
const DEAD = '😵'
const WON = '🍾'
/*----END----GLOBAL VARIABELS---END--- */

/*--------START---------ON GAME START-----------START------------ */
function onInit() {
    var elModal = document.querySelector('.modal')
    elModal.style.display = 'none'
    gGame.isOn = true
    gGame.isFirstClick = true
    gGame.lives = 3
    renderReset(SMILE)
    buildBoard(gLevel.SIZE)
    renderBoard()
    renderLives()
}

function startGame(elCell, i, j) {
    var firstPos = { i, j }
    setRandomMines(gBoard, gLevel.MINES, firstPos)
    setMinesNegsCount(gBoard)
    onCellClicked(elCell, i, j)

}

function setLvl(size, numOfMines) {
    gLevel.SIZE = size
    gLevel.MINES = numOfMines
    onInit()
}

function buildBoard(size) {
    gBoard = []
    for (var i = 0; i < size; i++) {
        const row = []
        for (var j = 0; j < size; j++) {
            var cell = {
                minesAroundCount: null,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
            row.push(cell)
        }
        gBoard.push(row)
    }
    /*aunt mides */
    // gBoard[0][1].isMine = true
    // gBoard[1][2].isMine = true

    return gBoard
}

function renderBoard() {

    var strHTML = '<tbody>'
    for (var i = 0; i < gBoard.length; i++) {

        strHTML += '<tr>'
        for (var j = 0; j < gBoard[0].length; j++) {


            const className = `cell cell-${i}-${j}`
            // const dataIAndJ = `data-i${j}`

            strHTML += `<td onclick="onCellClicked(this,${i},${j}) "onContextMenu="onCellMarked(this,${i},${j})" class="${className}"></td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody>'

    const elContainer = document.querySelector('table')
    elContainer.innerHTML = strHTML
}

function renderLives() {
    var strLives = ''
    for (var i = 0; i < gGame.lives; i++) {
        strLives += HEART
    }
    const elLives = document.querySelector('.menu p span')
    elLives.innerText = strLives
}

function setRandomMines(board, numOfMines, firstPos) {
    var poss = getAllBoardPoss(board)

    for (var i = 0; i < numOfMines; i++) {
        var randomIdx = getRandomInt(0, poss.length)
        var currPos = poss.splice(randomIdx, 1)[0]
        if (currPos.i === firstPos.i && currPos.j === firstPos.j) {
            currPos = poss.splice(randomIdx, 1)[0]
        }
        board[currPos.i][currPos.j].isMine = true

    }
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            gBoard[i][j].minesAroundCount = getMineNegsCount(i, j, board)
        }
    }
}

function getMineNegsCount(rowIdx, colIdx, board) {
    var negsMineCount = 0
    if (gBoard[rowIdx][colIdx].isMine) return negsMineCount

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= board[i].length) continue
            if (board[i][j].isMine) negsMineCount++
        }
    }
    return negsMineCount
}
/*-------END------------ON GAME START--------------END----------- */

/*^^^^^^^^START^^^^^^^^^^^ON CLICK^^^^^^^^^^^^^^START^^^^^^^^^^^^^*/

function onCellClicked(elCell, i, j) {
    if (gBoard[i][j].isMarked) return
    if (gBoard[i][j].isShown) return
    renderReset(SMILE)
    if (gGame.isFirstClick) {
        gGame.isFirstClick = false
        startGame(elCell, i, j)
        return
    }

    gBoard[i][j].isShown = true
    var str
    if (gBoard[i][j].isMine) {
        str = MINE
        clickedMine(elCell)
        // gGame.lives--
        // renderLives()
        // elCell.classList.add('mine')
        // revealAllMines()
    } else {
        str = gBoard[i][j].minesAroundCount
    }

    if (!str) str = EMPTY

    elCell.innerText = str
    elCell.classList.add('clicked')

    if (!gBoard[i][j].minesAroundCount && !gBoard[i][j].isMine) expandShown(gBoard, i, j)
    checkGameOver(true)
}

function clickedMine(elCell) {
    gGame.lives--
    renderLives()
    renderReset(HOT)
    elCell.classList.add('mine')
    revealAllMines()
}

function onCellMarked(elCell, i, j) {
    if (gBoard[i][j].isShown) return
    if (!gGame.isOn) return


    gBoard[i][j].isMarked = !gBoard[i][j].isMarked
    elCell.innerText = gBoard[i][j].isMarked ? FLAG : EMPTY
    checkGameOver(true)
}
/*^^^^^^END^^^^^^^^^^^^^^^^ON CLICK^^^^^^^^^^^^^^^^^^END^^^^^^^^^^*/

/*__________START___________FOLLOW UPS____________START__________*/
function renderReset(simbol) {
    const elResetBtn = document.querySelector('.reset')
    elResetBtn.innerText = simbol
}

function expandShown(board, rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= board[i].length) continue
            if (gBoard[i][j].isShown) continue
            var elCell = document.querySelector(`.cell-${i}-${j}`)
            onCellClicked(elCell, i, j)
        }
    }
}

function revealAllMines() {
    if (gGame.lives) return
    gGame.isOn = false
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            var elCell = document.querySelector(`.cell-${i}-${j}`)
            if (currCell.isMine) {
                elCell.innerText = MINE
                elCell.classList.add('mine')
            }
        }
    }
    renderReset(DEAD)
    openModal(false)
}
/*__________END_____________FOLLOW UPS_____________END__________*/


function checkGameOver() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (!currCell.isShown && !(currCell.isMine && currCell.isMarked)) return
        }
    }
    openModal(true)
    renderReset(WON)
}

function openModal(isWon) {
    gGame.isOn = false
    var elModalSpan = document.querySelector('.modal h3')
    elModalSpan.innerText = isWon ? 'YOU WON' : 'Try agein'
    var elModal = document.querySelector('.modal')
    elModal.style.display = 'block'
}


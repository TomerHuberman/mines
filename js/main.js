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
    lives: 3,
    minesCount: 0,
    timer: 0,
    isHint: false,
    safeClick: 3,
}
var gBoard = []
var gTimerInterval = null
const MINE = '💣'
const EMPTY = ''
const FLAG = '🚩'
const HEART = '❤️'
const SMILE = '😁'
const SCERED = '😬'
const HOT = '🥵'
const DEAD = '😵'
const WON = '🍾'
/*----END----GLOBAL VARIABELS---END--- */

/*--------START---------ON GAME START-----------START------------ */
function onInit() {
    var elModal = document.querySelector('.modal')
    elModal.style.display = 'none'
    // gGame.isOn = true
    gGame.isFirstClick = true
    gGame.lives = 3
    gGame.minesCount = gLevel.MINES
    gGame.timer = -1
    gGame.safeClick = 3
    clearInterval(gTimerInterval)
    gTimerInterval = null
    startTimer()
    renderReset(SMILE)
    buildBoard(gLevel.SIZE)
    renderBoard()
    renderLives()
    renderMineCount()
    resetHints()
    renderBestScore()
    renderSafeClicks()

}

function startGame(elCell, i, j) {
    gGame.isOn = true
    var firstPos = { i, j }
    setRandomMines(gBoard, gLevel.MINES, firstPos)
    setMinesNegsCount(gBoard)
    onCellClicked(elCell, i, j)
    gTimerInterval = setInterval(startTimer, 1000)
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
    const elLives = document.querySelector('.menu #lives span')
    elLives.innerText = strLives
}

function renderBestScore() {
    var bestScore
    switch (gLevel.SIZE) {
        case 4:
            bestScore = localStorage.BeginnerBestScore
            break
        case 6:
            bestScore = localStorage.MediumBestScore
            break
        case 12:
            bestScore = localStorage.ExpertBestScore
            break
        default:
            break;
    }

    var elBestScore = document.querySelector('.best-score span')
    elBestScore.innerText = isNaN(bestScore) ? 'No result yet' : +bestScore + ' sec'
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
    addEventListener('mousedown', (event) => { renderReset(SCERED) });
    addEventListener('mouseup', (event) => { renderReset(SMILE) });
    if (gGame.isFirstClick) {
        gGame.isFirstClick = false
        startGame(elCell, i, j)
        return
    }
    if (gGame.isHint) {
        hendalHint(i, j)
        return
    }
    // gBoard[i][j].isShown = true
    renderCell({ i, j })
    if (gBoard[i][j].isMine) clickedMine(elCell)

    if (!gBoard[i][j].minesAroundCount && !gBoard[i][j].isMine && !gGame.isHint) expandShown(gBoard, i, j)
    if (!gGame.isHint) checkGameOver(true)
}

function clickedMine(elCell) {
    gGame.minesCount--
    gGame.lives--
    renderMineCount()
    renderLives()
    renderReset(HOT)
    elCell.classList.add('mine')
    revealAllMines()
}

function onCellMarked(elCell, i, j) {
    if (gBoard[i][j].isShown) return
    if (!gGame.isOn) return


    gBoard[i][j].isMarked = !gBoard[i][j].isMarked
    // elCell.innerText = gBoard[i][j].isMarked ? FLAG : EMPTY
    if (gBoard[i][j].isMarked) {
        elCell.innerText = FLAG
        gGame.minesCount--
    } else {
        elCell.innerText = EMPTY
        gGame.minesCount++
    }
    renderMineCount()
    checkGameOver(true)
}

function activeHint(elHint) {
    if (!gGame.isOn) return
    gGame.isHint = true
    elHint.disabled = true
}

function activeSafeClick() {
    if (!gGame.safeClick) return
    if (!gGame.isOn) return
    gGame.safeClick--
    renderSafeClicks()
    const pos = getRandomSafePos()
    const elCell = renderCell(pos)
    setTimeout(closeCell, 1000, elCell, pos);
}
/*^^^^^^END^^^^^^^^^^^^^^^^ON CLICK^^^^^^^^^^^^^^^^^^END^^^^^^^^^^*/

/*__________START___________FOLLOW UPS____________START__________*/
function renderSafeClicks() {
    const elSafeClickCount = document.querySelector('.safe-clicks span')
    elSafeClickCount.innerText = gGame.safeClick
}

function renderCell(pos) {
    gBoard[pos.i][pos.j].isShown = true
    const elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`)
    var str = gBoard[pos.i][pos.j].isMine ? MINE : gBoard[pos.i][pos.j].minesAroundCount
    if (!str) str = EMPTY
    elCell.innerText = str
    elCell.classList.add('clicked')
    return elCell
}

function resetHints() {
    const hints = document.querySelectorAll('.hint')
    hints[0].disabled = false
    hints[1].disabled = false
    hints[2].disabled = false
}

function renderReset(simbol) {
    const elResetBtn = document.querySelector('.reset')
    elResetBtn.innerText = simbol
}

function startTimer() {
    gGame.timer++
    const elTimer = document.querySelector('.timer')
    elTimer.innerText = gGame.timer
}

function hendalHint(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (gBoard[i][j].isShown) continue
            gBoard[i][j].isMarked = false
            renderCell({ i, j })
            var elCell = document.querySelector(`.cell-${i}-${j}`)
            setTimeout(closeCell, 1000, elCell, { i, j });
        }
    }
    gGame.isHint = false
}

function closeCell(elCell, pos) {
    gBoard[pos.i][pos.j].isShown = false
    elCell.innerText = EMPTY
    elCell.classList.remove('clicked')
}

function renderMineCount() {
    const mineCountSpan = document.querySelector('.mines-count span')
    if (gGame.minesCount < 0) gGame.minesCount = 0
    mineCountSpan.innerText = gGame.minesCount
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
    gGame.isHint = false
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

function getSafePoss() {
    const safePoss = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (currCell.isMine) continue
            if (currCell.isShown) continue
            if (currCell.isMarked) continue
            safePoss.push({ i, j })
        }
    }
    return safePoss
}

function getRandomSafePos() {
    const poss = getSafePoss()
    const possIdx = getRandomInt(0, poss.length)
    return poss[possIdx]
}
/*__________END_____________FOLLOW UPS_____________END__________*/


function checkGameOver() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (!currCell.isShown && !(currCell.isMine && currCell.isMarked)) return
        }
    }
    clearInterval(gTimerInterval)
    gTimerInterval = null
    openModal(true)
    renderReset(WON)
}

function updateBestScore() {
    var lvlBestScore
    switch (gLevel.SIZE) {
        case 4:
            lvlBestScore = +localStorage.BeginnerBestScore
            if (isNaN(lvlBestScore)) lvlBestScore = Infinity
            if (gGame.timer < lvlBestScore) localStorage.BeginnerBestScore = gGame.timer
            break;
        case 6:
            lvlBestScore = +localStorage.MediumBestScore
            if (isNaN(lvlBestScore)) lvlBestScore = Infinity
            if (gGame.timer < lvlBestScore) localStorage.MediumBestScore = gGame.timer
            break;
        case 12:
            lvlBestScore = +localStorage.ExpertBestScore
            if (isNaN(lvlBestScore)) lvlBestScore = Infinity
            if (gGame.timer < lvlBestScore) localStorage.ExpertBestScore = gGame.timer
            break;
        default:
            break;
    }


}

function openModal(isWon) {
    gGame.isOn = false
    var elModalSpan = document.querySelector('.modal h3')
    elModalSpan.innerText = isWon ? '🎊YOU WON🎊' : 'Try agein'
    var elModal = document.querySelector('.modal')
    elModal.style.display = 'block'
    if (isWon) updateBestScore()
}


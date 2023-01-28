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
    isManually: false,
    isExpending: false,
    isUndo: false,
    lastPos: [],
    isDark: false,
    isMagaHint: false,
    isMagaHintUsed: false,
    magaHintPoss: [],
}
// var gGameHistory = []
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

    // reset game vars
    gGame.isFirstClick = true
    gGame.lives = 3
    gGame.minesCount = gLevel.MINES
    gGame.timer = -1
    gGame.safeClick = 3
    gGame.lastPos = []
    gGame.magaHintPoss = []
    gGame.isMagaHintUsed = false
    //////////////////////////////
    //timer
    clearInterval(gTimerInterval)
    gTimerInterval = null
    startTimer()
    /////////////////
    //renders
    renderReset(SMILE)
    buildBoard(gLevel.SIZE)
    renderBoard()
    renderLives()
    renderMineCount()
    resetHints()
    renderBestScore()
    renderSafeClicks()
    renderResetBtns()
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
            var className = `cell cell-${i}-${j}`
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

    if (gGame.isManually) {
        gBoard[i][j].isMine = true
        gGame.minesCount++
        renderMineCount()
        elCell.innerText = MINE
        return
    }
    // prevents the first click to be a mine
    if (gGame.isFirstClick) {
        gGame.isFirstClick = false
        startGame(elCell, i, j)
        return
    }

    if (gGame.isHint) {
        hendalHint(i, j)
        return
    }

    if (gGame.isMagaHint) {
        activeMegaHint({ i, j })
        return
    }
    //update the model and dome
    renderCell({ i, j })
    if (gBoard[i][j].isMine) clickedMine(elCell)
    //hendal expend of no negs mines
    if (!gBoard[i][j].minesAroundCount && !gBoard[i][j].isMine && !gGame.isHint) expandShown(gBoard, i, j)

    if (!gGame.isHint) checkGameOver(true)
    // the data for undo
    gGame.lastPos.push({ i, j })


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

function activeSafeClick(elBtn) {
    if (!gGame.safeClick) return
    if (!gGame.isOn) return
    gGame.safeClick--
    if(!gGame.safeClick) elBtn.classList.add('btnUsed') 
    renderSafeClicks()
    const pos = getRandomSafePos()
    const elCell = renderCell(pos)
    setTimeout(closeCell, 1000, pos);
}

function activeManually(elManully) {
    gGame.isManually = !gGame.isManually
    if (!gGame.isManually) {
        hideAllMines()
        setMinesNegsCount(gBoard)
        gGame.isFirstClick = false
        elManully.innerText = '⚒️manually⚒️'
        gGame.isOn = true
        gTimerInterval = setInterval(startTimer, 1000)
        return
    }
    elManully.innerText = 'Start'
    onInit()
    gGame.minesCount = 0
    renderMineCount()
}

function activeUndo() {
    gGame.isUndo = true
    var currPoss = gGame.lastPos.pop()
    closeCell(currPoss)
}

function magaHint(elMagaBtn) {
    if (gGame.isMagaHintUsed) return
    gGame.isMagaHint = true
    elMagaBtn.classList.add('btnUsed')
}

function activeMegaHint(pos) {
    gGame.magaHintPoss.push(pos)
    if (gGame.magaHintPoss.length < 2) return
    gGame.isMagaHint = false
    gGame.isMagaHintUsed = true
    const poss = gGame.magaHintPoss

    var iStartIdx = poss[0].i > poss[1].i ? poss[1].i : poss[0].i
    var iEndIdx = poss[0].i < poss[1].i ? poss[1].i : poss[0].i
    var jStartIdx = poss[0].j > poss[1].j ? poss[1].j : poss[0].j
    var jEndIdx = poss[0].j < poss[1].j ? poss[1].j : poss[0].j

    for (var i = iStartIdx; i <= iEndIdx; i++) {
        for (var j = jStartIdx; j <= jEndIdx; j++) {
            if (gBoard[i][j].isShown || gBoard[i][j].isMarked) continue
            gBoard[i][j].isShown = true
            setTimeout(closeCell, 2000, { i, j })
        }
    }
    renderAllCells()
}

function darkMode(elBtn) {
    gGame.isDark = !gGame.isDark
    elBtn.innerText = gGame.isDark ? 'Normal mode' : 'Dark mode'
    const elBody = document.querySelector('body')
    const elfooter = document.querySelector('footer')
    const elmenu = document.querySelector('.menu')
    elBody.classList.toggle('dark-mode')
    elfooter.classList.toggle('dark-mode')
    elmenu.classList.toggle('dark-mode')
}

function activeExterminator() {
    const poss = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (currCell.isMine && !currCell.isMarked && !currCell.isShown) {
                poss.push({ i, j })
            }
        }
    }
    for (var j = 0; j < 3; j++) {
        if (!poss.length) break
        var randomIdx = getRandomInt(0, poss.length)
        var pos = poss.splice(randomIdx, 1)[0]
        console.log("pos: ", pos);
        gBoard[pos.i][pos.j].isMine = false
        gGame.minesCount--
    }
    setMinesNegsCount(gBoard)
    renderMineCount()
    renderAllCells()
}
/*^^^^^^END^^^^^^^^^^^^^^^^ON CLICK^^^^^^^^^^^^^^^^^^END^^^^^^^^^^*/

/*__________START___________FOLLOW UPS____________START__________*/
function renderResetBtns(){
    const elModal = document.querySelector('.modal')
    elModal.style.display = 'none'
    const elMagaBtn = document.querySelector('#maga-hint')
    elMagaBtn.classList.remove('btnUsed')
    const elSafeClickBtn = document.querySelector('.safe-clicks')
    elSafeClickBtn.classList.remove('btnUsed')
}

function renderSafeClicks() {
    const elSafeClickCount = document.querySelector('.safe-clicks span')
    elSafeClickCount.innerText = gGame.safeClick
}

function renderAllCells() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (currCell.isShown) renderCell({ i, j })

        }
    }
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
            setTimeout(closeCell, 1000, { i, j });
        }
    }
    gGame.isHint = false
}

function closeCell(pos) {
    if (!pos) return
    var elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`)
    gBoard[pos.i][pos.j].isShown = false
    elCell.innerText = EMPTY
    elCell.classList.remove('clicked')
    if (gBoard[pos.i][pos.j].isMine && gGame.isUndo) {
        elCell.classList.remove('mine')
        gGame.lives++
        renderLives()
        gGame.isUndo = false
    }

}

function renderMineCount() {
    const mineCountSpan = document.querySelector('.mines-count span')
    if (gGame.minesCount < 0) gGame.minesCount = 0
    mineCountSpan.innerText = gGame.minesCount
}

function expandShown(board, rowIdx, colIdx) {
    gGame.isExpending = true
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
    gGame.isExpending = false
    gGame.isHint = false
}

function hideAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            var elCell = document.querySelector(`.cell-${i}-${j}`)
            if (currCell.isMine) {
                elCell.innerText = EMPTY
            }
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

function copyBoard(board) {
    var newBoard = []
    for (var i = 0; i < board.length; i++) {
        newBoard[i] = []
        for (var j = 0; j < board[0].length; j++) {
            newBoard[i][j] = {}
            newBoard[i][j].isMarked = board[i][j].isMarked
            newBoard[i][j].isMine = board[i][j].isMine
            newBoard[i][j].isShown = board[i][j].isShown
            newBoard[i][j].minesAroundCount = board[i][j].minesAroundCount
        }
    }
    return newBoard
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


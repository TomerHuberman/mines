'use strict'
window.addEventListener("contextmenu", e => e.preventDefault()); // prevent the context menu

function getAllBoardPoss(board) {
    const elemantPoss = []
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
                elemantPoss.push({ i, j })
        }
    }
    return elemantPoss
}

function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min //The maximum is inclusive and the minimum is inclusive
}
"use client"

import { useEffect, useState, useRef } from "react"
import { Sparkles, Code } from "lucide-react"

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [codeIndex, setCodeIndex] = useState(0)
  const [gameState, setGameState] = useState(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState("X")
  const codeRef = useRef<HTMLDivElement>(null)

  const codeSnippets = [
    "function TicTacToe() {",
    "  const [board, setBoard] = useState(Array(9).fill(null));",
    "  const [isXNext, setIsXNext] = useState(true);",
    "",
    "  const handleClick = (index) => {",
    "    if (board[index] || calculateWinner(board)) return;",
    "    const newBoard = [...board];",
    '    newBoard[index] = isXNext ? "X" : "O";',
    "    setBoard(newBoard);",
    "    setIsXNext(!isXNext);",
    "  };",
    "",
    "  const renderSquare = (index) => {",
    "    return (",
    '      <button className="square" onClick={() => handleClick(index)}>',
    "        {board[index]}",
    "      </button>",
    "    );",
    "  };",
    "",
    "  return (",
    '    <div className="game-board">',
    '      <div className="board-row">',
    "        {renderSquare(0)}",
    "        {renderSquare(1)}",
    "        {renderSquare(2)}",
    "      </div>",
    '      <div className="board-row">',
    "        {renderSquare(3)}",
    "        {renderSquare(4)}",
    "        {renderSquare(5)}",
    "      </div>",
    '      <div className="board-row">',
    "        {renderSquare(6)}",
    "        {renderSquare(7)}",
    "        {renderSquare(8)}",
    "      </div>",
    "    </div>",
    "  );",
    "}",
  ]

  useEffect(() => {
    setMounted(true)

    // Code typing animation
    const codeInterval = setInterval(() => {
      setCodeIndex((prev) => {
        if (prev < codeSnippets.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 150)

    // Tic-tac-toe game simulation
    const gameInterval = setInterval(() => {
      setGameState((prev) => {
        const emptyCells = prev.map((cell, idx) => (cell === null ? idx : null)).filter((idx) => idx !== null)
        if (emptyCells.length === 0) {
          return Array(9).fill(null)
        }

        const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)] as number
        const newState = [...prev]
        newState[randomIndex] = currentPlayer
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X")
        return newState
      })
    }, 1000)

    // Scroll code into view as it's typed
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight
    }

    return () => {
      clearInterval(codeInterval)
      clearInterval(gameInterval)
    }
  }, [codeIndex, currentPlayer])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background/95 to-background/90 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-purple-500/5 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-1/4 h-1/4 bg-blue-500/5 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="container px-4 py-16 md:py-24 flex flex-col items-center text-center">
          <div className="animate-float flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary to-purple-500 opacity-75 blur-sm animate-pulse"></div>
              <div className="relative bg-background rounded-full p-3">
                <Code className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-4 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            MakeX
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-[600px] mb-8 animate-fade-in-delay">
            Generate iOS apps instantly with AI. No coding required.
          </p>

          <div className="w-full max-w-md mb-12 animate-fade-in-delay-2">
            <div id="getWaitlistContainer" data-waitlist_id="26328" data-widget_type="WIDGET_2"></div>
          </div>

          {/* iPhone Mockup */}
          <div className="relative mx-auto animate-float-slow">
            <div className="relative mx-auto border-[14px] border-gray-800 rounded-[60px] h-[600px] w-[300px] shadow-xl">
              {/* iPhone Notch */}
              <div className="absolute top-0 inset-x-0">
                <div className="mx-auto h-6 w-40 bg-gray-800 rounded-b-3xl"></div>
              </div>

              {/* Power Button */}
              <div className="absolute -right-[14px] top-[120px] h-[32px] w-[3px] bg-gray-800 rounded-r-lg"></div>

              {/* Volume Buttons */}
              <div className="absolute -left-[14px] top-[100px] h-[32px] w-[3px] bg-gray-800 rounded-l-lg"></div>
              <div className="absolute -left-[14px] top-[150px] h-[32px] w-[3px] bg-gray-800 rounded-l-lg"></div>

              {/* Screen Content */}
              <div className="h-full w-full overflow-hidden rounded-[48px] bg-black">
                {/* App Tabs */}
                <div className="flex h-full flex-col">
                  {/* App Header */}
                  <div className="flex-none h-14 bg-gray-900 flex items-center justify-center border-b border-gray-800">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm font-medium text-white">MakeX App Generator</span>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="flex-grow overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-800 bg-gray-900">
                      <div className="flex-1 py-2 text-xs text-center text-primary border-b-2 border-primary">Code</div>
                      <div className="flex-1 py-2 text-xs text-center text-gray-400">Preview</div>
                    </div>

                    {/* Code View */}
                    <div className="h-[calc(100%-40px)] overflow-y-auto p-3 text-left font-mono text-xs text-green-400 code-scrollbar">
                      <div className="mb-2 text-xs text-gray-400">// AI generating TicTacToe app</div>
                      {codeSnippets.slice(0, codeIndex + 1).map((line, i) => (
                        <div key={i} className={`${i === codeIndex ? "typing-line" : ""}`}>
                          {line || " "}
                        </div>
                      ))}
                      <div className="typing-cursor"></div>
                    </div>

                    {/* Preview Button */}
                    <div className="absolute bottom-20 right-4 bg-primary text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1 animate-pulse">
                      <Sparkles className="h-3 w-3" />
                      <span>See Preview</span>
                    </div>

                    {/* Game Preview (Floating) */}
                    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-gray-700 animate-float">
                      <div className="text-xs text-center text-white mb-2">Tic Tac Toe</div>
                      <div className="grid grid-cols-3 gap-1 w-24 h-24">
                        {gameState.map((cell, index) => (
                          <div
                            key={index}
                            className={`
                              flex items-center justify-center border border-gray-700 rounded-md text-sm font-bold bg-gray-900/80
                              ${cell === "X" ? "text-primary animate-pop-in" : cell === "O" ? "text-purple-500 animate-pop-in" : ""}
                            `}
                          >
                            {cell}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* iPhone Home Indicator */}
                  <div className="flex-none h-6 flex items-center justify-center">
                    <div className="w-24 h-1 bg-gray-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Shadow */}
            <div className="absolute -bottom-6 inset-x-0">
              <div className="h-6 w-48 mx-auto bg-gradient-to-b from-gray-900 to-transparent rounded-full blur-md"></div>
            </div>
          </div>

          <div className="mt-12 flex items-center space-x-4 text-sm animate-fade-in-delay-3">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`h-8 w-8 rounded-full border-2 border-background bg-gray-${200 + i * 100}`}
                ></div>
              ))}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium">5,000+</span> people on waitlist
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground relative z-10">© 2025 MakeX</footer>
    </div>
  )
}


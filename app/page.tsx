"use client"

import { useEffect, useState, useRef } from "react"
import { Sparkles, Code } from "lucide-react"
import Image from 'next/image'
import dynamic from 'next/dynamic'
import WaitlistContainer from '@/components/waitlist-container'

const TYPING_SPEED = 200 // Slower typing speed
const TYPING_INITIAL_DELAY = 2000 // Longer initial delay

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [codeIndex, setCodeIndex] = useState(0)
  const [gameState, setGameState] = useState(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState("X")
  const codeRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [userPrompt, setUserPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingCode, setGeneratingCode] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const demoPrompt = "A tic-tac-toe game"
  const [isLooping, setIsLooping] = useState(true)

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
    '      <div className="board-row">',
    "        {renderSquare(6)}",
    "        {renderSquare(7)}",
    "        {renderSquare(8)}",
    "      </div>",
    "    </div>",
    "  );",
    "}",
  ]

  // Add these realistic React code snippets
  const realisticCode = [
    'import React, { useState } from "react"',
    'import { View, Text, TouchableOpacity } from "react-native"',
    '',
    'export default function TicTacToe() {',
    '  const [board, setBoard] = useState(Array(9).fill(null))',
    '  const [isXNext, setIsXNext] = useState(true)',
    '',
    '  const handlePress = (index) => {',
    '    const newBoard = [...board]',
    '    newBoard[index] = isXNext ? "X" : "O"',
    '    setBoard(newBoard)',
    '    setIsXNext(!isXNext)',
    '  }',
    '',
    '  const renderSquare = (index) => (',
    '    <TouchableOpacity',
    '      style={styles.square}',
    '      onPress={() => handlePress(index)}>',
    '      <Text style={styles.text}>{board[index]}</Text>',
    '    </TouchableOpacity>',
    '  )',
    '',
    '  return (',
    '    <View style={styles.container}>',
    '      <Text style={styles.title}>Tic Tac Toe</Text>',
    '      <View style={styles.board}>',
    '        <View style={styles.row}>',
    '          {renderSquare(0)}',
    '          {renderSquare(1)}',
    '          {renderSquare(2)}',
    '        </View>',
    '      </View>',
    '    </View>',
    '  )',
    '}',
    '',
    'const styles = StyleSheet.create({',
    '  container: { flex: 1, padding: 20 },',
    '  board: { aspectRatio: 1 },',
    '  square: { flex: 1, borderWidth: 1 },',
    '  text: { fontSize: 24, textAlign: "center" }',
    '})'
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

    // Tic-tac-toe game simulation - only run in step 2
    let gameInterval: NodeJS.Timeout | null = null
    if (step === 2) {
      gameInterval = setInterval(() => {
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
    }

    // Scroll code into view as it's typed
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight
    }

    return () => {
      clearInterval(codeInterval)
      if (gameInterval) clearInterval(gameInterval)
    }
  }, [codeIndex, currentPlayer, step])

  useEffect(() => {
    if (mounted && !isTyping) { // Only start if not already typing
      simulateTyping()
    }
  }, [mounted]) // Remove other dependencies

  const generateRandomCode = () => {
    const elements = [
      'import React', 'const App', 'function', 'export default', 'useState',
      'useEffect', 'StyleSheet', 'View', 'Text', 'TouchableOpacity',
      'const styles', 'return', 'render', 'props', 'navigation'
    ]
    const snippets = [
      'from "react-native"',
      'createStackNavigator()',
      'flex: 1,',
      'backgroundColor: "#fff",',
      'padding: 20,',
      'onPress={() => {}}',
      '<View style={styles.container}>',
      '<Text style={styles.text}>',
      'justifyContent: "center",',
      'alignItems: "center",'
    ]
    const randomElement = elements[Math.floor(Math.random() * elements.length)]
    const randomSnippet = snippets[Math.floor(Math.random() * snippets.length)]
    return `${randomElement} ${randomSnippet}`
  }

  const startGeneration = () => {
    setStep(1)
    
    // Create multiple copies of the code to fill the screen
    const repeatedCode = Array(5).fill(realisticCode).flat()
    setGeneratingCode(repeatedCode)

    // Move to game after animation
    setTimeout(() => {
      setStep(2)
      // Reset to home page after showing game for 5 seconds
      setTimeout(() => {
        setStep(0)
        setUserPrompt("")
        setGameState(Array(9).fill(null))
        simulateTyping() // Start the loop again
      }, 5000)
    }, 4000)
  }

  const simulateTyping = () => {
    if (isTyping) return // Prevent multiple typing instances
    
    setIsTyping(true)
    setUserPrompt("") // Clear existing text
    
    setTimeout(() => {
      let i = 0
      const typingInterval = setInterval(() => {
        setUserPrompt(demoPrompt.slice(0, i + 1))
        i++
        if (i === demoPrompt.length) {
          clearInterval(typingInterval)
          setIsTyping(false)
          // Add small delay before starting generation
          setTimeout(() => {
            startGeneration()
          }, 500)
        }
      }, TYPING_SPEED)

      // Cleanup functionoptimise this for phone
      return () => clearInterval(typingInterval)
    }, TYPING_INITIAL_DELAY)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background/95 to-background/90 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-purple-500/5 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-1/4 h-1/4 bg-blue-500/5 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Discord Button */}
      <a
        href="https://discord.gg/3EsUgb53Zp"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-50 flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-full hover:bg-[#4752C4] transition-colors shadow-lg"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
        <span className="font-medium">Get early access</span>
      </a>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 mt-16 md:mt-0">
        <div className="container px-4 py-4 md:py-16 flex flex-col items-center text-center">
          <div className="flex items-center justify-center mb-4 md:mb-6">
            <div className="relative">
              <Image 
                src="/logo.png"
                alt="MakeX Logo"
                width={48}
                height={48}
                className="h-12 w-12 md:h-16 md:w-16"
              />
            </div>
          </div>

          <h1 className="text-3xl md:text-7xl font-bold tracking-tight mb-2 md:mb-4 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            MakeX
          </h1>

          <p className="text-lg md:text-2xl text-muted-foreground max-w-[600px] mb-4 md:mb-8 animate-fade-in-delay">
            Anyone can build
          </p>

          <div className="w-full max-w-md mb-4 md:mb-8 animate-fade-in-delay-2">
            <WaitlistContainer />
          </div>

          {/* Updated iPhone Mockup with better mobile responsiveness */}
          <div className="relative mx-auto animate-float-slow mb-4 md:mb-8 scale-90 md:scale-100">
            <div className="relative w-[240px] sm:w-[280px] h-[488px] sm:h-[570px] rounded-[44px] bg-black p-[10px] sm:p-[12px] shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[20px] sm:h-[25px] w-[120px] sm:w-[150px] bg-black rounded-b-[14px] z-20" />
              
              {/* Screen */}
              <div className="relative h-full w-full rounded-[28px] sm:rounded-[32px] overflow-hidden bg-white">
                <div className="flex h-full flex-col">
                  {/* App Header */}
                  <div className="flex-none h-10 sm:h-14 bg-white border-b flex items-center justify-between px-3 sm:px-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900">MakeX</span>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="flex-grow overflow-hidden p-2 sm:p-4">
                    {step === 0 && (
                      <div className="h-full flex flex-col items-center justify-center space-y-3 sm:space-y-6 px-2 sm:px-4">
                        <div className="text-center space-y-1 sm:space-y-2">
                          <h3 className="text-base sm:text-xl font-semibold text-gray-900">What would you like to build?</h3>
                          <p className="text-xs sm:text-sm text-gray-500">Describe your app idea in simple words</p>
                        </div>
                        <input
                          type="text"
                          value={userPrompt}
                          readOnly
                          placeholder="e.g. A tic-tac-toe game"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm"
                        />
                        <button
                          onClick={simulateTyping}
                          disabled={isTyping}
                          className="w-full bg-primary text-white rounded-xl py-2 sm:py-3 font-medium disabled:opacity-50 text-xs sm:text-sm"
                        >
                          {isTyping ? "Typing..." : "Generate App →"}
                        </button>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="h-full w-full bg-white overflow-hidden">
                        <div 
                          className="h-full font-mono text-[10px] sm:text-xs whitespace-pre animate-scroll-up"
                          style={{
                            willChange: 'transform'
                          }}
                        >
                          {generatingCode.map((line, i) => (
                            <div 
                              key={i} 
                              className="text-gray-800 leading-4 sm:leading-5"
                              style={{ opacity: 0.8 }}
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="h-full w-full bg-white flex items-center justify-center p-2 sm:p-4">
                        <div className="w-full max-w-xs">
                          <div className="text-sm sm:text-lg text-center text-gray-900 mb-3 sm:mb-6 font-semibold">Tic Tac Toe</div>
                          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 aspect-square w-full">
                            {gameState.map((cell, index) => (
                              <div
                                key={index}
                                className={`
                                  flex items-center justify-center rounded-md sm:rounded-xl text-lg sm:text-2xl font-bold bg-gray-50 border border-gray-100
                                  ${cell === "X" ? "text-primary animate-pop-in" : cell === "O" ? "text-purple-500 animate-pop-in" : ""}
                                `}
                                style={{
                                  aspectRatio: "1/1"
                                }}
                              >
                                {cell}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar */}
                  <div className="flex-none h-10 sm:h-16 border-t bg-white flex items-center justify-center">
                    <div className="w-20 sm:w-32 h-1 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Power Button */}
              <div className="absolute right-[-2px] top-[100px] sm:top-[120px] w-[3px] h-[25px] sm:h-[30px] bg-neutral-800 rounded-l-sm" />
              
              {/* Volume Buttons */}
              <div className="absolute left-[-2px] top-[85px] sm:top-[100px] w-[3px] h-[25px] sm:h-[30px] bg-neutral-800 rounded-r-sm" />
              <div className="absolute left-[-2px] top-[120px] sm:top-[140px] w-[3px] h-[50px] sm:h-[60px] bg-neutral-800 rounded-r-sm" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
"use client"

import { useEffect, useState, useRef } from "react"
import { Sparkles, Code } from "lucide-react"
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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

      <main className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="container px-4 py-8 md:py-16 flex flex-col items-center text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Image 
                src="/logo.png"
                alt="MakeX Logo"
                width={64}
                height={64}
                className="h-16 w-16"
              />
            </div>
          </div>

          <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-4 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            MakeX
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-[600px] mb-8 animate-fade-in-delay">
            Anyone can build
          </p>

          <div className="w-full max-w-md mb-6 md:mb-8 animate-fade-in-delay-2">
            <WaitlistContainer />
            <div className="mt-4 text-center">
              <Link href="/pricing">
                <Button variant="outline">
                  View Pricing Plans
                </Button>
              </Link>
            </div>
          </div>

          {/* Updated iPhone Mockup */}
          <div className="relative mx-auto animate-float-slow mb-8">
            <div className="relative w-[266px] sm:w-[280px] h-[541.5px] sm:h-[570px] rounded-[44px] bg-black p-[12px] shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[25px] w-[150px] bg-black rounded-b-[14px] z-20" />
              
              {/* Screen */}
              <div className="relative h-full w-full rounded-[32px] overflow-hidden bg-white">
                <div className="flex h-full flex-col">
                  {/* App Header */}
                  <div className="flex-none h-12 sm:h-14 bg-white border-b flex items-center justify-between px-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-gray-900">MakeX</span>
                    </div>
                  </div>

                  {/* App Content - Adjust padding and text sizes */}
                  <div className="flex-grow overflow-hidden p-3 sm:p-4">
                    {step === 0 && (
                      <div className="h-full flex flex-col items-center justify-center space-y-4 sm:space-y-6 px-2 sm:px-4">
                        <div className="text-center space-y-2">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">What would you like to build?</h3>
                          <p className="text-xs sm:text-sm text-gray-500">Describe your app idea in simple words</p>
                        </div>
                        <input
                          type="text"
                          value={userPrompt}
                          readOnly
                          placeholder="e.g. A tic-tac-toe game"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                        <button
                          onClick={simulateTyping}
                          disabled={isTyping}
                          className="w-full bg-primary text-white rounded-xl py-2 sm:py-3 font-medium disabled:opacity-50 text-sm"
                        >
                          {isTyping ? "Typing..." : "Generate App →"}
                        </button>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="h-full w-full bg-white overflow-hidden">
                        <div 
                          className="h-full font-mono text-xs whitespace-pre animate-scroll-up"
                          style={{
                            willChange: 'transform'
                          }}
                        >
                          {generatingCode.map((line, i) => (
                            <div 
                              key={i} 
                              className="text-gray-800 leading-5"
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
                          <div className="text-base sm:text-lg text-center text-gray-900 mb-4 sm:mb-6 font-semibold">Tic Tac Toe</div>
                          <div className="grid grid-cols-3 gap-2 sm:gap-3 aspect-square w-full">
                            {gameState.map((cell, index) => (
                              <div
                                key={index}
                                className={`
                                  flex items-center justify-center rounded-lg sm:rounded-xl text-xl sm:text-2xl font-bold bg-gray-50 border border-gray-100
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
                  <div className="flex-none h-12 sm:h-16 border-t bg-white flex items-center justify-center">
                    <div className="w-24 sm:w-32 h-1 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Power Button */}
              <div className="absolute right-[-2px] top-[120px] w-[3px] h-[30px] bg-neutral-800 rounded-l-sm" />
              
              {/* Volume Buttons */}
              <div className="absolute left-[-2px] top-[100px] w-[3px] h-[30px] bg-neutral-800 rounded-r-sm" />
              <div className="absolute left-[-2px] top-[140px] w-[3px] h-[60px] bg-neutral-800 rounded-r-sm" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


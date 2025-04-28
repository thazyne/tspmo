'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useInterval } from '@/hooks/use-interval';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const GRID_SIZE = 20;
const CELL_SIZE = 20; // pixels
const INITIAL_SNAKE = [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }];
const INITIAL_DIRECTION = { x: 1, y: 0 }; // Moving right initially
const SNAKE_TEXT = "ts pmo";
const FOOD_TEXT = "gurt";
const INITIAL_SPEED = 200; // ms

type Position = { x: number; y: number };
type Direction = Position;

const getRandomPosition = (snakeBody: Position[] = []): Position => {
  let position: Position;
  do {
    position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // Check against snake body
  } while (snakeBody.some(segment => segment.x === position.x && segment.y === position.y));
  return position;
};


export default function Game() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  // Initialize food to null to avoid hydration mismatch
  const [food, setFood] = useState<Position | null>(null);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [speed, setSpeed] = useState<number | null>(INITIAL_SPEED);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false); // Track if component is mounted

  // Set initial food position only on the client after mount
  useEffect(() => {
    setIsMounted(true);
    setFood(getRandomPosition(INITIAL_SNAKE));
  }, []);


  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent changing direction if game is over
     if (isGameOver) return;

    switch (event.key) {
      case 'ArrowUp':
        if (direction.y === 0) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        if (direction.y === 0) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        if (direction.x === 0) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        if (direction.x === 0) setDirection({ x: 1, y: 0 });
        break;
    }
  }, [direction, isGameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const gameLoop = useCallback(() => {
    if (isGameOver || !food) { // Don't run loop if game over or food not set
      setSpeed(null);
      return;
    }

    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      head.x += direction.x;
      head.y += direction.y;

      // Wrap around walls (alternative to game over)
      // head.x = (head.x + GRID_SIZE) % GRID_SIZE;
      // head.y = (head.y + GRID_SIZE) % GRID_SIZE;

      // Wall collision -> Game Over
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        setIsGameOver(true);
        setSpeed(null);
        return prevSnake;
      }

      // Self collision -> Game Over
      // Start checking from the second segment (index 1)
      if (newSnake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
         setIsGameOver(true);
         setSpeed(null);
         return prevSnake;
      }

      // Add new head
      newSnake.unshift(head);

      // Food consumption
      if (head.x === food.x && head.y === food.y) {
        setScore((prevScore) => prevScore + 1);
        setFood(getRandomPosition(newSnake)); // Pass the updated snake body
        // Increase speed slightly on score, cap at 50ms
        setSpeed(prevSpeed => prevSpeed ? Math.max(50, prevSpeed - 5) : INITIAL_SPEED);
      } else {
        // Remove tail if no food eaten
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver]); // Add food here

  useInterval(gameLoop, speed);

  const restartGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(getRandomPosition(INITIAL_SNAKE)); // Get a new random position
    setDirection(INITIAL_DIRECTION);
    setSpeed(INITIAL_SPEED);
    setScore(0);
    setIsGameOver(false);
  };

  const getSegmentText = (index: number) => {
    return SNAKE_TEXT[index % SNAKE_TEXT.length];
  };

   // Prevent rendering until mounted to avoid hydration issues
  if (!isMounted) {
    return null; // Or a loading indicator
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-auto mb-4 bg-secondary shadow-lg rounded-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-accent text-2xl font-mono tracking-wider">Text Snake</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center flex-col pt-2">
           <div className="mb-2 text-accent font-mono text-xl">Score: {score}</div>
          <div
            className="relative grid border border-border bg-background shadow-inner rounded-md overflow-hidden" // Added relative and overflow-hidden
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              width: `${GRID_SIZE * CELL_SIZE}px`,
              height: `${GRID_SIZE * CELL_SIZE}px`,
            }}
          >
            {/* Render Snake */}
            {snake.map((segment, index) => (
              <div
                key={`${segment.x}-${segment.y}-${index}`}
                className={cn(
                  "flex items-center justify-center font-mono text-xs transition-transform duration-100 ease-linear",
                  "text-primary font-bold", // Green color for snake
                   index === 0 ? "z-[5]" : "z-[4]" // Head on top
                )}
                style={{
                  gridColumnStart: segment.x + 1,
                  gridRowStart: segment.y + 1,
                  // More subtle transition for movement feel
                  // transform: `translate(${direction.x * (index === 0 ? 2 : 0)}px, ${direction.y * (index === 0 ? 2 : 0)}px)`
                }}
              >
                {getSegmentText(index)}
              </div>
            ))}

            {/* Render Food - Only render if food position is set */}
            {food && (
                 <div
                    className="flex items-center justify-center font-mono text-xs font-bold text-destructive z-[3]" // Red color for food
                    style={{
                        gridColumnStart: food.x + 1,
                        gridRowStart: food.y + 1,
                    }}
                 >
                    {FOOD_TEXT}
                 </div>
            )}


             {/* Game Over Overlay */}
            {isGameOver && (
                <div
                    className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-md" // Use absolute positioning
                    // Remove gridColumn/gridRow styles as it's absolutely positioned now
                    >
                    <p className="text-destructive text-3xl font-bold mb-4 animate-pulse">Game Over!</p>
                    <p className="text-accent text-xl mb-6">Final Score: {score}</p>
                    <Button onClick={restartGame} variant="default" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        Restart
                    </Button>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
       <p className="text-muted-foreground text-sm mt-4 font-mono">Use Arrow Keys to move.</p>
    </div>
  );
}
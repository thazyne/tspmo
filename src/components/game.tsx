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
  } while (snakeBody.some(segment => segment.x === position.x && segment.y === position.y));
  return position;
};

export default function Game() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(getRandomPosition(INITIAL_SNAKE));
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [speed, setSpeed] = useState<number | null>(INITIAL_SPEED);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
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
  }, [direction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const gameLoop = useCallback(() => {
    if (isGameOver) {
      setSpeed(null);
      return;
    }

    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      head.x += direction.x;
      head.y += direction.y;

      // Wall collision
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

      // Self collision
      if (newSnake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
         setIsGameOver(true);
         setSpeed(null);
         return prevSnake;
      }

      newSnake.unshift(head);

      // Food consumption
      if (head.x === food.x && head.y === food.y) {
        setScore((prevScore) => prevScore + 1);
        setFood(getRandomPosition(newSnake));
        // Increase speed slightly on score
        setSpeed(prevSpeed => prevSpeed ? Math.max(50, prevSpeed - 5) : 50);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver]);

  useInterval(gameLoop, speed);

  const restartGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(getRandomPosition(INITIAL_SNAKE));
    setDirection(INITIAL_DIRECTION);
    setSpeed(INITIAL_SPEED);
    setScore(0);
    setIsGameOver(false);
  };

  const getSegmentText = (index: number) => {
    return SNAKE_TEXT[index % SNAKE_TEXT.length];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-auto mb-4 bg-secondary shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-accent text-2xl font-mono">Text Snake</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center flex-col">
           <div className="mb-2 text-accent font-mono text-xl">Score: {score}</div>
          <div
            className="grid border border-border bg-background shadow-inner"
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
                  "text-primary font-bold" // Green color for snake
                )}
                style={{
                  gridColumnStart: segment.x + 1,
                  gridRowStart: segment.y + 1,
                  // Basic transition for movement feel
                  transform: `translate(${direction.x * (index === 0 ? 5 : 0)}px, ${direction.y * (index === 0 ? 5 : 0)}px)`
                }}
              >
                {getSegmentText(index)}
              </div>
            ))}

            {/* Render Food */}
            <div
              className="flex items-center justify-center font-mono text-xs font-bold text-destructive" // Red color for food
              style={{
                gridColumnStart: food.x + 1,
                gridRowStart: food.y + 1,
              }}
            >
              {FOOD_TEXT}
            </div>

             {/* Game Over Overlay */}
            {isGameOver && (
                <div
                className="col-span-full row-span-full bg-black/70 flex flex-col items-center justify-center z-10 rounded-md"
                style={{ gridColumn: `1 / ${GRID_SIZE + 1}`, gridRow: `1 / ${GRID_SIZE + 1}` }}
                >
                <p className="text-destructive text-3xl font-bold mb-4">Game Over!</p>
                <p className="text-accent text-xl mb-6">Final Score: {score}</p>
                <Button onClick={restartGame} variant="default" size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Restart
                </Button>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
       <p className="text-muted-foreground text-sm mt-4">Use Arrow Keys to move.</p>
    </div>
  );
}

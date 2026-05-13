import { useState } from 'react';
import { Button } from '@/react-app/components/ui/button';
import { Card } from '@/react-app/components/ui/card';

interface CalculatorProps {
  onUnlock: () => void;
}

export default function Calculator({ onUnlock }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetDisplay, setResetDisplay] = useState(false);
  const [secretCode, setSecretCode] = useState('');

  const handleNumber = (num: string) => {
    // Check for secret code: 911=
    const newCode = secretCode + num;
    setSecretCode(newCode);
    
    if (resetDisplay) {
      setDisplay(num);
      setResetDisplay(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperation = (op: string) => {
    // Check for secret code completion: 911=
    const codeToCheck = secretCode + op;
    if (codeToCheck === '911=') {
      onUnlock();
      return;
    }
    setSecretCode(codeToCheck);

    if (previousValue === null) {
      setPreviousValue(parseFloat(display));
      setOperation(op);
      setResetDisplay(true);
    } else if (operation) {
      const result = calculate(previousValue, parseFloat(display), operation);
      setDisplay(result.toString());
      setPreviousValue(result);
      setOperation(op);
      setResetDisplay(true);
    }
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    // Check for secret code: 911=
    const codeToCheck = secretCode + '=';
    if (codeToCheck === '911=') {
      onUnlock();
      return;
    }
    setSecretCode(codeToCheck);

    if (operation && previousValue !== null) {
      const result = calculate(previousValue, parseFloat(display), operation);
      setDisplay(result.toString());
      setPreviousValue(null);
      setOperation(null);
      setResetDisplay(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setResetDisplay(false);
    setSecretCode('');
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const buttonClass = "h-16 text-lg font-medium";
  const operationClass = "h-16 text-lg font-medium bg-orange-500 hover:bg-orange-600 text-white";
  const numberClass = "h-16 text-lg font-medium bg-gray-700 hover:bg-gray-600 text-white";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-gray-900 border-gray-800">
        <div className="p-6 space-y-4">
          {/* Display */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-right text-4xl font-light text-white break-all">
              {display}
            </div>
          </div>

          {/* Buttons Grid */}
          <div className="grid grid-cols-4 gap-3">
            {/* Row 1 */}
            <Button onClick={handleClear} className={`${buttonClass} bg-gray-600 hover:bg-gray-500 text-white`}>
              AC
            </Button>
            <Button onClick={() => handleOperation('÷')} className={operationClass}>
              ÷
            </Button>
            <Button onClick={() => handleOperation('×')} className={operationClass}>
              ×
            </Button>
            <Button onClick={() => setDisplay(display.slice(0, -1) || '0')} className={`${buttonClass} bg-gray-600 hover:bg-gray-500 text-white`}>
              ⌫
            </Button>

            {/* Row 2 */}
            <Button onClick={() => handleNumber('7')} className={numberClass}>7</Button>
            <Button onClick={() => handleNumber('8')} className={numberClass}>8</Button>
            <Button onClick={() => handleNumber('9')} className={numberClass}>9</Button>
            <Button onClick={() => handleOperation('-')} className={operationClass}>-</Button>

            {/* Row 3 */}
            <Button onClick={() => handleNumber('4')} className={numberClass}>4</Button>
            <Button onClick={() => handleNumber('5')} className={numberClass}>5</Button>
            <Button onClick={() => handleNumber('6')} className={numberClass}>6</Button>
            <Button onClick={() => handleOperation('+')} className={operationClass}>+</Button>

            {/* Row 4 */}
            <Button onClick={() => handleNumber('1')} className={numberClass}>1</Button>
            <Button onClick={() => handleNumber('2')} className={numberClass}>2</Button>
            <Button onClick={() => handleNumber('3')} className={numberClass}>3</Button>
            <Button onClick={handleEquals} className={`${operationClass} row-span-2`}>=</Button>

            {/* Row 5 */}
            <Button onClick={() => handleNumber('0')} className={`${numberClass} col-span-2`}>0</Button>
            <Button onClick={handleDecimal} className={numberClass}>.</Button>
          </div>

          {/* Hint (very subtle) */}
          <div className="text-center text-xs text-gray-600 pt-2">
            Calculadora
          </div>
        </div>
      </Card>
    </div>
  );
}

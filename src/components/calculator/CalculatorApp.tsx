import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Clock, Trash2, X, RotateCcw } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { IOSAlert } from '../common/IOSAlert';

export interface CalculationHistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

const CALCULATOR_STORAGE_KEY = 'ios_calculator_history_v1';

// Evaluates a sequence of tokens with standard mathematical precedence (* and / before + and -)
function evaluateTokens(tokens: string[]): { success: boolean; result: number | string } {
  if (tokens.length === 0) return { success: true, result: 0 };

  // 1. Convert tokens into numbers and operators
  const values: number[] = [];
  const ops: string[] = [];

  // Pass 1: Handle multiplication and division first
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === '×' || token === '÷' || token === '*' || token === '/') {
      const prevVal = values.pop();
      const nextToken = tokens[i + 1];
      const nextVal = parseFloat(nextToken);

      if (prevVal === undefined || isNaN(nextVal)) {
        return { success: false, result: '错误' };
      }

      if (token === '÷' || token === '/') {
        if (nextVal === 0) {
          return { success: false, result: '错误' };
        }
        values.push(prevVal / nextVal);
      } else {
        values.push(prevVal * nextVal);
      }
      i += 2;
    } else if (token === '+' || token === '-') {
      ops.push(token);
      i++;
    } else {
      const num = parseFloat(token);
      if (isNaN(num)) return { success: false, result: '错误' };
      values.push(num);
      i++;
    }
  }

  // Pass 2: Handle addition and subtraction
  let res = values[0] ?? 0;
  for (let j = 0; j < ops.length; j++) {
    const op = ops[j];
    const val = values[j + 1];
    if (val === undefined) break;
    if (op === '+') res += val;
    else if (op === '-') res -= val;
  }

  // Avoid floating point inaccuracies (e.g. 0.1 + 0.2)
  const rounded = parseFloat(res.toFixed(9));
  return { success: true, result: rounded };
}

export const CalculatorApp: React.FC = () => {
  const { goHome } = useChat();

  const [displayValue, setDisplayValue] = useState<string>('0');
  const [tokens, setTokens] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('0');
  const [isNewNumber, setIsNewNumber] = useState<boolean>(true);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const raw = localStorage.getItem(CALCULATOR_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load calculator history', e);
    }
    return [];
  });

  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showClearAlert, setShowClearAlert] = useState<boolean>(false);

  // Save history to localStorage
  const saveHistory = (items: CalculationHistoryItem[]) => {
    setHistory(items);
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (e) {
      console.warn('Failed to save calculator history', e);
    }
  };

  // Number Button Press (0-9)
  const handleDigit = (digit: string) => {
    if (hasEvaluated) {
      // Starting fresh after '='
      setTokens([]);
      setCurrentInput(digit);
      setDisplayValue(digit);
      setHasEvaluated(false);
      setIsNewNumber(false);
      return;
    }

    if (isNewNumber || currentInput === '0') {
      setCurrentInput(digit);
      setDisplayValue(digit);
      setIsNewNumber(false);
    } else {
      if (currentInput.replace('-', '').length >= 12) return; // limit length
      const next = currentInput + digit;
      setCurrentInput(next);
      setDisplayValue(next);
    }
  };

  // Decimal Point Press (.)
  const handleDot = () => {
    if (hasEvaluated) {
      setTokens([]);
      setCurrentInput('0.');
      setDisplayValue('0.');
      setHasEvaluated(false);
      setIsNewNumber(false);
      return;
    }

    if (isNewNumber) {
      setCurrentInput('0.');
      setDisplayValue('0.');
      setIsNewNumber(false);
    } else if (!currentInput.includes('.')) {
      const next = currentInput + '.';
      setCurrentInput(next);
      setDisplayValue(next);
    }
  };

  // Operator Press (+, -, ×, ÷)
  const handleOperator = (op: string) => {
    if (hasEvaluated) {
      setHasEvaluated(false);
      setTokens([currentInput, op]);
      setIsNewNumber(true);
      return;
    }

    if (isNewNumber && tokens.length > 0) {
      // Change the last operator
      const nextTokens = [...tokens];
      nextTokens[nextTokens.length - 1] = op;
      setTokens(nextTokens);
      return;
    }

    const nextTokens = [...tokens, currentInput, op];
    setTokens(nextTokens);
    setIsNewNumber(true);
  };

  // Equals Press (=)
  const handleEquals = () => {
    if (tokens.length === 0) return;

    const fullTokens = [...tokens, currentInput];
    const { success, result } = evaluateTokens(fullTokens);

    const exprStr = fullTokens.join(' ');
    const resStr = success ? String(result) : '错误';

    setDisplayValue(resStr);
    setCurrentInput(success ? String(result) : '0');
    setTokens([]);
    setHasEvaluated(true);
    setIsNewNumber(true);

    if (success) {
      const newHistoryItem: CalculationHistoryItem = {
        id: 'calc_' + Date.now(),
        expression: exprStr,
        result: resStr,
        timestamp: Date.now(),
      };
      saveHistory([newHistoryItem, ...history.slice(0, 29)]);
    }
  };

  // Clear (AC)
  const handleClear = () => {
    setDisplayValue('0');
    setCurrentInput('0');
    setTokens([]);
    setIsNewNumber(true);
    setHasEvaluated(false);
  };

  // Backspace (⌫)
  const handleBackspace = () => {
    if (hasEvaluated || displayValue === '错误') {
      handleClear();
      return;
    }

    if (currentInput.length > 1) {
      const next = currentInput.slice(0, -1);
      setCurrentInput(next);
      setDisplayValue(next);
    } else {
      setCurrentInput('0');
      setDisplayValue('0');
      setIsNewNumber(true);
    }
  };

  // Negate (+/-)
  const handleToggleSign = () => {
    if (displayValue === '错误' || currentInput === '0') return;
    const num = parseFloat(currentInput);
    if (isNaN(num)) return;
    const next = String(-num);
    setCurrentInput(next);
    setDisplayValue(next);
  };

  // Percentage (%)
  const handlePercentage = () => {
    if (displayValue === '错误') return;
    const num = parseFloat(currentInput);
    if (isNaN(num)) return;
    const next = String(parseFloat((num / 100).toFixed(8)));
    setCurrentInput(next);
    setDisplayValue(next);
  };

  // Restore from history
  const handleSelectHistory = (item: CalculationHistoryItem) => {
    setDisplayValue(item.result);
    setCurrentInput(item.result);
    setTokens([]);
    setIsNewNumber(true);
    setHasEvaluated(true);
    setShowHistory(false);
  };

  // Dynamic font sizing for long numbers
  const getFontSizeClass = (val: string) => {
    const len = val.length;
    if (len > 12) return 'text-[32px]';
    if (len > 9) return 'text-[40px]';
    if (len > 6) return 'text-[50px]';
    return 'text-[62px]';
  };

  // Expression preview string
  const expressionPreview = tokens.length > 0 ? `${tokens.join(' ')} ${isNewNumber ? '' : currentInput}` : '';

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#1C1C1E] select-none text-white relative overflow-hidden">
      {/* Top Header Bar */}
      <div className="ios-safe-header px-4 sticky top-0 z-20 shrink-0 bg-[#1C1C1E]/95 backdrop-blur-md border-b border-white/5">
        <div className="h-11 flex items-center justify-between">
          {/* Back button */}
          <button
            type="button"
            onClick={goHome}
            className="ios-back-btn text-[15px] font-normal text-neutral-300 hover:text-white active:opacity-60 transition-opacity pr-2 cursor-pointer"
            title="返回桌面 (Esc)"
          >
            <ChevronLeft size={22} className="-mr-0.5 text-neutral-300" />
            <span>返回</span>
          </button>

          <h2 className="text-[16px] font-semibold text-white tracking-tight">
            计算器
          </h2>

          {/* History Button */}
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-end text-neutral-300 hover:text-white active:scale-95 transition-all cursor-pointer pl-2"
            title="计算历史"
          >
            <Clock size={20} />
          </button>
        </div>
      </div>

      {/* Display Screen */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-4 pt-2">
        {/* Expression trace preview */}
        <div className="text-right text-[15px] text-neutral-400 font-mono min-h-[22px] truncate select-text">
          {expressionPreview}
        </div>

        {/* Main Display Number */}
        <div className="flex items-center justify-end overflow-hidden mt-1">
          <div
            className={`font-light font-mono tracking-tight text-white select-text transition-all duration-150 ${getFontSizeClass(
              displayValue
            )}`}
          >
            {displayValue}
          </div>
        </div>
      </div>

      {/* Button Keypad */}
      <div
        className="px-4 pt-2"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
        }}
      >
        <div className="grid grid-cols-4 gap-3 max-w-[360px] mx-auto">
          {/* Row 1: AC, +/-, %, ÷ */}
          <button
            type="button"
            onClick={handleClear}
            className="w-full aspect-square rounded-full bg-[#505054] hover:bg-[#606064] active:scale-92 text-white font-medium text-[22px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            {currentInput !== '0' || tokens.length > 0 ? 'C' : 'AC'}
          </button>
          <button
            type="button"
            onClick={handleToggleSign}
            className="w-full aspect-square rounded-full bg-[#505054] hover:bg-[#606064] active:scale-92 text-white font-medium text-[22px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            ⁺∕₋
          </button>
          <button
            type="button"
            onClick={handlePercentage}
            className="w-full aspect-square rounded-full bg-[#505054] hover:bg-[#606064] active:scale-92 text-white font-medium text-[22px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => handleOperator('÷')}
            className={`w-full aspect-square rounded-full font-medium text-[26px] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-92 ${
              tokens[tokens.length - 1] === '÷' && isNewNumber
                ? 'bg-white text-[#FF9F0A]'
                : 'bg-[#FF9F0A] hover:bg-[#FFAE2B] text-white'
            }`}
          >
            ÷
          </button>

          {/* Row 2: 7, 8, 9, × */}
          <button
            type="button"
            onClick={() => handleDigit('7')}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleDigit('8')}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleDigit('9')}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleOperator('×')}
            className={`w-full aspect-square rounded-full font-medium text-[26px] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-92 ${
              tokens[tokens.length - 1] === '×' && isNewNumber
                ? 'bg-white text-[#FF9F0A]'
                : 'bg-[#FF9F0A] hover:bg-[#FFAE2B] text-white'
            }`}
          >
            ×
          </button>

          {/* Row 3: 4, 5, 6, - */}
          <button
            type="button"
            onClick={() => handleDigit('4')}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleDigit('5')}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleDigit('6')}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleOperator('-')}
            className={`w-full aspect-square rounded-full font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-92 ${
              tokens[tokens.length - 1] === '-' && isNewNumber
                ? 'bg-white text-[#FF9F0A]'
                : 'bg-[#FF9F0A] hover:bg-[#FFAE2B] text-white'
            }`}
          >
            −
          </button>

          {/* Row 4: 1, 2, 3, + */}
          <button
            type="button"
            onClick={() => handleDigit('1')}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleDigit('2')}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleDigit('3')}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleOperator('+')}
            className={`w-full aspect-square rounded-full font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-92 ${
              tokens[tokens.length - 1] === '+' && isNewNumber
                ? 'bg-white text-[#FF9F0A]'
                : 'bg-[#FF9F0A] hover:bg-[#FFAE2B] text-white'
            }`}
          >
            +
          </button>

          {/* Row 5: 0, ., ⌫, = */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDot}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="w-full aspect-square rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] active:scale-92 text-neutral-300 font-medium text-[22px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="退格"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={handleEquals}
            className="w-full aspect-square rounded-full bg-[#FF9F0A] hover:bg-[#FFAE2B] active:scale-92 text-white font-medium text-[28px] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            =
          </button>
        </div>
      </div>

      {/* Calculation History Drawer */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="w-full max-h-[75vh] bg-[#2C2C2E] text-white rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
            }}
          >
            {/* Top Handle */}
            <div className="w-full pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-neutral-600" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#FF9F0A]" />
                <h3 className="text-[17px] font-bold text-white">计算历史</h3>
                <span className="text-[12px] text-neutral-400">({history.length})</span>
              </div>

              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearAlert(true)}
                    className="text-[13px] text-[#FF453A] hover:text-red-400 font-medium px-2 py-1 transition-colors cursor-pointer"
                  >
                    清空
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="w-7 h-7 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-white cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 px-4 py-2">
              {history.length === 0 ? (
                <div className="py-16 text-center text-neutral-400 flex flex-col items-center justify-center">
                  <Clock size={36} className="text-neutral-600 mb-2" />
                  <p className="text-[14px]">暂无计算历史记录</p>
                  <p className="text-[12px] text-neutral-500 mt-1">计算结果将自动保存在这里</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistory(item)}
                    className="py-3 px-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-[13px] text-neutral-400 font-mono truncate">
                        {item.expression}
                      </div>
                      <div className="text-[20px] font-semibold text-white font-mono mt-0.5 truncate">
                        = {item.result}
                      </div>
                    </div>
                    <span className="text-[11px] text-neutral-500 shrink-0">点击回填</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Alert */}
      <IOSAlert
        isOpen={showClearAlert}
        title="清空计算历史"
        message="确定要清空所有计算历史记录吗？此操作不可撤销。"
        confirmText="清空"
        cancelText="取消"
        isDestructive={true}
        onConfirm={() => {
          saveHistory([]);
          setShowClearAlert(false);
        }}
        onCancel={() => setShowClearAlert(false)}
      />
    </div>
  );
};

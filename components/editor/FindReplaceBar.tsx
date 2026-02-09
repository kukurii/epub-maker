import React from 'react';
import { Search, ChevronUp, ChevronDown, X, CaseSensitive, WholeWord, Type } from 'lucide-react';

interface FindReplaceBarProps {
    findText: string;
    setFindText: (val: string) => void;
    replaceText: string;
    setReplaceText: (val: string) => void;
    matchCase: boolean;
    setMatchCase: (val: boolean) => void;
    wholeWord: boolean;
    setWholeWord: (val: boolean) => void;
    matchesCount: number;
    currentMatchIndex: number;
    onNavigateNext: () => void;
    onNavigatePrev: () => void;
    onReplace: () => void;
    onClose: () => void;
}

const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
    findText, setFindText, replaceText, setReplaceText,
    matchCase, setMatchCase, wholeWord, setWholeWord,
    matchesCount, currentMatchIndex, onNavigateNext, onNavigatePrev, onReplace, onClose
}) => {
    return (
        <div className="flex-none bg-white border-b border-gray-200 px-6 py-2 flex flex-wrap gap-3 items-center animate-in slide-in-from-top-2 z-10 shadow-sm">
           <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 flex-1 min-w-[150px]">
              <Search size={14} className="text-gray-400 mr-2 flex-shrink-0" />
              <input 
                className="text-sm bg-transparent outline-none w-full min-w-0 placeholder:text-gray-400" 
                placeholder="查找..." 
                value={findText} 
                onChange={e => setFindText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onNavigateNext()}}
              />
              
              <div className="h-4 w-px bg-gray-300 mx-2 flex-shrink-0" />
              
              <button 
                 onClick={() => setMatchCase(!matchCase)} 
                 className={`p-0.5 rounded transition-colors ${matchCase ? 'bg-blue-200 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                 title="区分大小写"
              >
                  <CaseSensitive size={14} />
              </button>
              <button 
                 onClick={() => setWholeWord(!wholeWord)} 
                 className={`ml-1 p-0.5 rounded transition-colors ${wholeWord ? 'bg-blue-200 text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                 title="全词匹配"
              >
                  <WholeWord size={14} />
              </button>

              {findText && <span className="text-xs text-gray-400 ml-2 whitespace-nowrap tabular-nums border-l border-gray-300 pl-2">{matchesCount > 0 ? `${currentMatchIndex + 1}/${matchesCount}` : '0/0'}</span>}
           </div>
           
           <div className="flex space-x-1 flex-shrink-0 bg-gray-100 rounded-lg p-0.5">
               <button onClick={onNavigatePrev} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500"><ChevronUp size={16}/></button>
               <button onClick={onNavigateNext} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500"><ChevronDown size={16}/></button>
           </div>

           <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 flex-1 min-w-[150px]">
              <Type size={14} className="text-gray-400 mr-2 flex-shrink-0" />
              <input 
                className="text-sm bg-transparent outline-none w-full min-w-0 placeholder:text-gray-400" 
                placeholder="替换..." 
                value={replaceText} 
                onChange={e => setReplaceText(e.target.value)}
              />
           </div>
           
           <button onClick={onReplace} className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors flex-shrink-0">替换</button>
           <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={18}/></button>
        </div>
    );
};

export default FindReplaceBar;

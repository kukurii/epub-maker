import React from 'react';
import { 
  Heading1, Heading2, Bold, Italic, Underline, Strikethrough, Link, Quote, List, ListOrdered, 
  Image as ImageIcon, AlignLeft, AlignJustify, RotateCcw, RotateCw, 
  Search, Scissors, Minus, Captions, ArrowLeft 
} from 'lucide-react';

interface ToolbarButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
    title?: string;
    active?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, onClick, title, active }) => (
  <button 
    onMouseDown={(e) => e.preventDefault()} 
    onClick={onClick} 
    title={title}
    className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
        active 
        ? 'bg-blue-50 text-blue-600' 
        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
    }`}
  >
    {icon}
  </button>
);

interface EditorToolbarProps {
    onMobileBack?: () => void;
    execCmd: (cmd: string, val?: string) => void;
    toggleBlock: (tag: 'H1' | 'H2') => void;
    toggleBlockquote: () => void;
    toggleCaption: () => void;
    handleSplit: () => void;
    setShowImageModal: (show: boolean) => void;
    showFindBar: boolean;
    setShowFindBar: (show: boolean) => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
    onMobileBack, execCmd, toggleBlock, toggleBlockquote, toggleCaption, 
    handleSplit, setShowImageModal, showFindBar, setShowFindBar
}) => {
    
    const handleInsertLink = () => {
        // Save the current selection
        const selection = window.getSelection();
        let savedRange: Range | null = null;
        if (selection && selection.rangeCount > 0) {
            savedRange = selection.getRangeAt(0);
        }

        const url = window.prompt('请输入链接地址 (URL):', 'https://');
        
        // Restore selection
        if (savedRange && selection) {
            selection.removeAllRanges();
            selection.addRange(savedRange);
        }

        if (url) {
            execCmd('createLink', url);
        }
    };

    return (
        <div className="flex-none h-14 bg-white border-b border-gray-200 px-2 md:px-6 flex items-center justify-between z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center flex-1 overflow-x-auto no-scrollbar mask-gradient-right">
                
                {/* Mobile Back Button */}
                {onMobileBack && (
                <div className="md:hidden flex items-center mr-2 pr-2 border-r border-gray-200">
                    <button 
                    onClick={onMobileBack}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    title="返回目录"
                    >
                    <ArrowLeft size={18} />
                    </button>
                </div>
                )}

                {/* History */}
                <div className="flex items-center space-x-1 mr-2 flex-shrink-0">
                    <ToolbarButton icon={<RotateCcw size={16} />} onClick={() => execCmd('undo')} title="撤销" />
                    <ToolbarButton icon={<RotateCw size={16} />} onClick={() => execCmd('redo')} title="重做" />
                </div>
                
                <div className="h-5 w-px bg-gray-200 mx-2 flex-shrink-0" />

                {/* Headings */}
                <div className="flex items-center space-x-1 mx-2 flex-shrink-0">
                    <ToolbarButton icon={<Heading1 size={16} />} onClick={() => toggleBlock('H1')} title="标题 1 (章节名)" />
                    <ToolbarButton icon={<Heading2 size={16} />} onClick={() => toggleBlock('H2')} title="标题 2 (小节)" />
                </div>

                <div className="h-5 w-px bg-gray-200 mx-2 flex-shrink-0" />

                {/* Formatting */}
                <div className="flex items-center space-x-1 mx-2 flex-shrink-0">
                    <ToolbarButton icon={<Bold size={16} />} onClick={() => execCmd('bold')} title="加粗" />
                    <ToolbarButton icon={<Italic size={16} />} onClick={() => execCmd('italic')} title="斜体" />
                    <ToolbarButton icon={<Underline size={16} />} onClick={() => execCmd('underline')} title="下划线" />
                    <ToolbarButton icon={<Strikethrough size={16} />} onClick={() => execCmd('strikeThrough')} title="删除线" />
                    <ToolbarButton icon={<Link size={16} />} onClick={handleInsertLink} title="插入链接" />
                    <ToolbarButton icon={<Quote size={16} />} onClick={toggleBlockquote} title="引用" />
                    <ToolbarButton icon={<Captions size={16} />} onClick={toggleCaption} title="图片说明 (图注)" />
                </div>

                <div className="h-5 w-px bg-gray-200 mx-2 flex-shrink-0" />

                {/* Lists */}
                <div className="flex items-center space-x-1 mx-2 flex-shrink-0">
                    <ToolbarButton icon={<List size={16} />} onClick={() => execCmd('insertUnorderedList')} title="无序列表" />
                    <ToolbarButton icon={<ListOrdered size={16} />} onClick={() => execCmd('insertOrderedList')} title="有序列表" />
                </div>

                <div className="h-5 w-px bg-gray-200 mx-2 flex-shrink-0" />

                {/* Alignment */}
                <div className="flex items-center space-x-1 mx-2 flex-shrink-0">
                    <ToolbarButton icon={<AlignLeft size={16} />} onClick={() => execCmd('justifyLeft')} />
                    <ToolbarButton icon={<AlignJustify size={16} />} onClick={() => execCmd('justifyCenter')} />
                </div>

                <div className="h-5 w-px bg-gray-200 mx-2 flex-shrink-0" />

                {/* Insert & Actions */}
                <div className="flex items-center space-x-1 mx-2 flex-shrink-0">
                    <ToolbarButton icon={<ImageIcon size={16} />} onClick={() => setShowImageModal(true)} title="插入图片" />
                    <ToolbarButton icon={<Minus size={16} />} onClick={() => execCmd('insertHorizontalRule')} title="插入分割线" />
                </div>

                <div className="h-5 w-px bg-gray-200 mx-2 flex-shrink-0" />

                {/* Tools */}
                <div className="flex items-center space-x-1 mx-2 flex-shrink-0">
                    <ToolbarButton icon={<Scissors size={16} />} onClick={handleSplit} title="手动切分章节" />
                </div>
            </div>

            <div className="flex items-center flex-shrink-0 ml-2">
                <button 
                    onClick={() => setShowFindBar(!showFindBar)} 
                    className={`p-2 rounded-lg transition-colors ${showFindBar ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    title="查找与替换"
                >
                    <Search size={18} />
                </button>
            </div>
        </div>
    );
};

export default EditorToolbar;
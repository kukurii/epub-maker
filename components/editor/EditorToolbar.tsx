import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Editor } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Quote,
  List,
  ListOrdered,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RotateCcw,
  RotateCw,
  Search,
  Scissors,
  ArrowLeft,
  RemoveFormatting,
  ChevronDown,
  SeparatorHorizontal,
  Pilcrow,
} from 'lucide-react';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, onClick, title, active, disabled }) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
      disabled ? 'opacity-30 cursor-not-allowed text-gray-400'
      : active ? 'bg-blue-100 text-blue-700 shadow-sm'
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
    }`}
  >
    {icon}
  </button>
);

interface EditorToolbarProps {
  editor: Editor | null;
  onMobileBack?: () => void;
  handleSplit: () => void;
  setShowImageModal: (show: boolean) => void;
  showFindBar: boolean;
  setShowFindBar: (show: boolean) => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  onMobileBack,
  handleSplit,
  setShowImageModal,
  showFindBar,
  setShowFindBar
}) => {
  const [showDividerMenu, setShowDividerMenu] = useState(false);
  const [dividerMenuStyle, setDividerMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMenuPosition = () => {
      if (!showDividerMenu || !dividerRef.current) return;
      const rect = dividerRef.current.getBoundingClientRect();
      setDividerMenuStyle({
        top: rect.bottom + 6,
        left: rect.left,
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [showDividerMenu]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dividerRef.current && !dividerRef.current.contains(e.target as Node)) {
        const menuEl = document.getElementById('editor-divider-menu');
        if (menuEl && menuEl.contains(e.target as Node)) return;
        setShowDividerMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) {
    return <div className="min-h-[56px] bg-white border-b border-gray-200 animate-pulse" />;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const rawUrl = window.prompt('请输入链接地址 (URL):', previousUrl || 'https://');

    if (rawUrl === null) return;

    const url = rawUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: normalizedUrl }).run();
  };

  const toggleCaption = () => {
    const isActive = editor.isActive('paragraph', { class: 'caption' });
    if (isActive) editor.commands.setNode('paragraph');
    else editor.commands.setNode('paragraph', { class: 'caption' });
  };

  const setRuby = () => {
    if (editor.isActive('ruby')) {
      editor.chain().focus().unsetRuby().run();
      return;
    }

    const { from, to } = editor.state.selection;
    if (from === to) {
      window.alert('请先选中要添加注音的文字。');
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to, '');
    if (!selectedText.trim()) {
      window.alert('当前选区没有可注音的文字。');
      return;
    }

    const rtText = window.prompt(`请输入“${selectedText}”的注音:`);
    if (rtText !== null && rtText.trim()) {
      editor.chain().focus().setRuby({ text: selectedText, rt: rtText.trim() }).run();
    }
  };

  const DIVIDERS = [
    { label: '默认分割线', cls: '', preview: '---' },
    { label: '分割线 1', cls: 'divider-1', preview: '* * *' },
    { label: '分割线 2', cls: 'divider-2', preview: '◈ ◈ ◈' },
    { label: '分割线 3', cls: 'divider-3', preview: '❀ ✿ ❀' },
    { label: '分割线 4', cls: 'divider-4', preview: '• • •' },
    { label: '分割线 5', cls: 'divider-5', preview: '～～～' },
  ];

  const insertDivider = (cls: string) => {
    editor.chain().focus().insertContent(`<hr class="${cls}" />`).run();
  };

  return (
    <>
      <div className="relative z-50 flex-none min-h-14 bg-white border-b border-gray-200 px-2 md:px-4 flex items-center justify-between shadow-sm overflow-visible">
        <div className="flex items-center flex-1 overflow-x-auto gap-y-0 scrollbar-none min-w-0 py-1">
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

          <div className="flex items-center space-x-0.5 mr-2 flex-shrink-0">
            <ToolbarButton icon={<RotateCcw size={16} />} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="撤销" />
            <ToolbarButton icon={<RotateCw size={16} />} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="重做" />
            <ToolbarButton icon={<RemoveFormatting size={16} />} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="清除格式" />
          </div>

          <div className="h-5 w-px bg-gray-200 mx-1 flex-shrink-0" />

          <div className="flex items-center space-x-0.5 mx-1 flex-shrink-0">
            <ToolbarButton icon={<Heading1 size={16} />} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="大章节 (H1)" />
            <ToolbarButton icon={<Heading2 size={16} />} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="小节 (H2)" />
            <ToolbarButton icon={<Pilcrow size={16} />} onClick={toggleCaption} active={editor.isActive('paragraph', { class: 'caption' })} title="图注段落" />
          </div>

          <div className="h-5 w-px bg-gray-200 mx-1 flex-shrink-0" />

          <div className="flex items-center space-x-0.5 mx-1 flex-shrink-0">
            <ToolbarButton icon={<Bold size={16} />} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="加粗" />
            <ToolbarButton icon={<Italic size={16} />} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体" />
            <ToolbarButton icon={<Underline size={16} />} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="下划线" />
            <ToolbarButton icon={<Strikethrough size={16} />} onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="删除线" />
            <ToolbarButton icon={<Link size={16} />} onClick={setLink} active={editor.isActive('link')} title="插入链接" />
            <ToolbarButton icon={<Quote size={16} />} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用块" />
            <ToolbarButton icon={<span className="font-bold text-xs" style={{ display: 'inline-block', lineHeight: 1 }}>A/あ</span>} onClick={setRuby} active={editor.isActive('ruby')} title="注音" />
          </div>

          <div className="h-5 w-px bg-gray-200 mx-1 flex-shrink-0" />

          <div className="flex items-center space-x-0.5 mx-1 flex-shrink-0">
            <ToolbarButton icon={<List size={16} />} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="无序列表" />
            <ToolbarButton icon={<ListOrdered size={16} />} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序列表" />
          </div>

          <div className="h-5 w-px bg-gray-200 mx-1 flex-shrink-0" />

          <div className="flex items-center space-x-0.5 mx-1 flex-shrink-0">
            <ToolbarButton icon={<AlignLeft size={16} />} onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="左对齐" />
            <ToolbarButton icon={<AlignCenter size={16} />} onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="居中对齐" />
            <ToolbarButton icon={<AlignRight size={16} />} onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="右对齐" />
            <ToolbarButton icon={<AlignJustify size={16} />} onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="两端对齐" />
          </div>

          <div className="h-5 w-px bg-gray-200 mx-1 flex-shrink-0" />

          <div className="flex items-center space-x-2 mx-1 flex-shrink-0">
            <button
              onClick={() => setShowImageModal(true)}
              className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
              title="插入图片"
            >
              <ImageIcon size={16} className="mr-1.5" /> 图片
            </button>

            <div className="relative flex-shrink-0" ref={dividerRef}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowDividerMenu(v => !v)}
                title="插入分割线"
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showDividerMenu
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-800 border border-gray-200'
                }`}
              >
                <SeparatorHorizontal size={15} className="mr-1" />
                分割线
                <ChevronDown size={13} className={`ml-1 transition-transform duration-200 ${showDividerMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          <div className="h-5 w-px bg-gray-200 mx-1 flex-shrink-0" />

          <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSplit}
              className="flex items-center px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-sm font-medium transition-colors"
              title="在光标处拆分章节"
            >
              <Scissors size={14} className="mr-1.5" /> 拆分章节
            </button>
          </div>
        </div>

        <div className="flex items-center flex-shrink-0 ml-4 pl-4 border-l border-gray-200 sticky right-0 bg-white">
          <button
            onClick={() => setShowFindBar(!showFindBar)}
            className={`p-2 rounded-lg transition-colors ${showFindBar ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            title="查找与替换"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {showDividerMenu && dividerMenuStyle && createPortal(
        <div
          id="editor-divider-menu"
          style={{
            position: 'fixed',
            top: dividerMenuStyle.top,
            left: dividerMenuStyle.left,
          }}
          className="z-[120] bg-white border border-gray-200 rounded-xl shadow-xl p-2 flex gap-1.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {DIVIDERS.map(({ label, cls, preview }, index) => (
            <button
              key={cls || 'hr'}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                insertDivider(cls);
                setShowDividerMenu(false);
              }}
              title={label}
              className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-gray-600 transition-colors group"
            >
              <span className="text-xs font-bold text-gray-400 group-hover:text-blue-500">{index + 1}</span>
              <span className="text-[11px] whitespace-nowrap">{preview}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default EditorToolbar;

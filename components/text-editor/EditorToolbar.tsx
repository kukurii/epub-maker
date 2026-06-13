/**
 * EditorToolbar - 编辑器工具栏（阶段二重构版）
 *
 * 改进：
 * 1. 更合理的按钮分组（核心区/扩展区/操作区）
 * 2. 三级响应式断点（移动 sm / 平板 lg / 桌面 xl）
 * 3. 移动端优化的"更多"菜单
 * 4. 按钮尺寸和间距优化
 * 5. 减少视觉混乱，提升易用性
 */

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
  RotateCcw,
  RotateCw,
  Search,
  Scissors,
  ArrowLeft,
  RemoveFormatting,
  ChevronDown,
  SeparatorHorizontal,
  Pilcrow,
  MoreHorizontal,
} from 'lucide-react';

// ─── 分割线样式列表 ───
const DIVIDERS = [
  { label: '默认分割线', cls: '', preview: '---' },
  { label: '分割线 1', cls: 'divider-1', preview: '* * *' },
  { label: '分割线 2', cls: 'divider-2', preview: '◈ ◈ ◈' },
  { label: '分割线 3', cls: 'divider-3', preview: '❀ ✿ ❀' },
  { label: '分割线 4', cls: 'divider-4', preview: '• • •' },
  { label: '分割线 5', cls: 'divider-5', preview: '～～～' },
];

interface EditorToolbarProps {
  editor: Editor | null;
  onMobileBack?: () => void;
  onSplit: () => void;
  onOpenImagePicker: () => void;
  showFindBar: boolean;
  onToggleFindBar: (show: boolean) => void;
}

/**
 * 编辑器工具栏
 */
const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  onMobileBack,
  onSplit,
  onOpenImagePicker,
  showFindBar,
  onToggleFindBar,
}) => {
  const [showDividerMenu, setShowDividerMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [dividerMenuStyle, setDividerMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const [moreMenuStyle, setMoreMenuStyle] = useState<{ top: number; left: number } | null>(null);

  const dividerRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // 分割线菜单定位
  useEffect(() => {
    const updatePosition = () => {
      if (!showDividerMenu || !dividerRef.current) return;
      const rect = dividerRef.current.getBoundingClientRect();
      setDividerMenuStyle({ top: rect.bottom + 6, left: rect.left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showDividerMenu]);

  // 更多菜单定位
  useEffect(() => {
    const updatePosition = () => {
      if (!showMoreMenu || !moreRef.current) return;
      const rect = moreRef.current.getBoundingClientRect();
      setMoreMenuStyle({ top: rect.bottom + 6, left: rect.right - 200 }); // 右对齐
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showMoreMenu]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 关闭分割线菜单
      if (dividerRef.current && !dividerRef.current.contains(e.target as Node)) {
        const menuEl = document.getElementById('editor-divider-menu');
        if (menuEl && menuEl.contains(e.target as Node)) return;
        setShowDividerMenu(false);
      }

      // 关闭更多菜单
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        const menuEl = document.getElementById('editor-more-menu');
        if (menuEl && menuEl.contains(e.target as Node)) return;
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) {
    return <div className="min-h-[48px] md:min-h-[56px] bg-white border-b border-gray-200 animate-pulse" />;
  }

  // ─── 编辑操作 ───

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

    const rtText = window.prompt(`请输入"${selectedText}"的注音:`);
    if (rtText !== null && rtText.trim()) {
      editor.chain().focus().setRuby({ text: selectedText, rt: rtText.trim() }).run();
    }
  };

  const insertDivider = (cls: string) => {
    editor.chain().focus().insertContent(`<hr class="${cls}" />`).run();
  };

  // ─── 渲染 ───

  return (
    <>
      <div className="relative z-50 flex-none min-h-12 md:min-h-14 bg-white border-b border-gray-200 px-2 md:px-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center flex-1 overflow-x-auto gap-0.5 scrollbar-none min-w-0">
          {/* 移动端返回按钮 */}
          {onMobileBack && (
            <div className="md:hidden flex items-center mr-1 pr-1 border-r border-gray-200">
              <ToolbarButton icon={<ArrowLeft size={18} />} onClick={onMobileBack} title="返回目录" />
            </div>
          )}

          {/* ━━━ 核心区：始终可见（撤销/重做 + 标题 + 基础格式）━━━ */}
          <ButtonGroup>
            <ToolbarButton
              icon={<RotateCcw size={15} />}
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="撤销 (Ctrl+Z)"
            />
            <ToolbarButton
              icon={<RotateCw size={15} />}
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="重做 (Ctrl+Y)"
            />
          </ButtonGroup>

          <Divider />

          {/* 标题 */}
          <ButtonGroup>
            <ToolbarButton
              icon={<Heading1 size={15} />}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              title="大标题 (Ctrl+Alt+1)"
            />
            <ToolbarButton
              icon={<Heading2 size={15} />}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="小标题 (Ctrl+Alt+2)"
            />
          </ButtonGroup>

          <Divider />

          {/* 基础格式（粗斜下）*/}
          <ButtonGroup>
            <ToolbarButton
              icon={<Bold size={15} />}
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="加粗 (Ctrl+B)"
            />
            <ToolbarButton
              icon={<Italic size={15} />}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="斜体 (Ctrl+I)"
            />
            <ToolbarButton
              icon={<Underline size={15} />}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              title="下划线 (Ctrl+U)"
            />
          </ButtonGroup>

          {/* ━━━ 扩展区：平板及以上显示（次要格式）━━━ */}
          <Divider className="hidden sm:block" />

          <ButtonGroup className="hidden sm:flex">
            <ToolbarButton
              icon={<Strikethrough size={15} />}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              title="删除线"
            />
            <ToolbarButton
              icon={<Link size={15} />}
              onClick={setLink}
              active={editor.isActive('link')}
              title="插入链接 (Ctrl+K)"
            />
            <ToolbarButton
              icon={<Quote size={15} />}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              title="引用块"
            />
          </ButtonGroup>

          {/* 注音和图注 - 桌面端显示 */}
          <ButtonGroup className="hidden lg:flex">
            <ToolbarButton
              icon={<span className="font-bold text-xs">A/あ</span>}
              onClick={setRuby}
              active={editor.isActive('ruby')}
              title="注音"
            />
            <ToolbarButton
              icon={<Pilcrow size={15} />}
              onClick={toggleCaption}
              active={editor.isActive('paragraph', { class: 'caption' })}
              title="图注段落"
            />
          </ButtonGroup>

          {/* 对齐 - 大屏显示 */}
          <Divider className="hidden xl:block" />

          <ButtonGroup className="hidden xl:flex">
            <ToolbarButton
              icon={<AlignLeft size={15} />}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
              title="左对齐"
            />
            <ToolbarButton
              icon={<AlignCenter size={15} />}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
              title="居中"
            />
            <ToolbarButton
              icon={<AlignRight size={15} />}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
              title="右对齐"
            />
          </ButtonGroup>

          {/* ━━━ 操作区：始终可见（插入 + 拆分）━━━ */}
          <Divider />

          <div className="flex items-center space-x-1 mx-0.5">
            {/* 插入图片 */}
            <button
              onClick={onOpenImagePicker}
              className="flex items-center px-2 md:px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs md:text-sm font-medium transition-colors"
              title="插入图片"
            >
              <ImageIcon size={14} className="md:mr-1.5" />
              <span className="hidden md:inline">图片</span>
            </button>

            {/* 分割线按钮 - 平板及以上 */}
            <div className="relative hidden sm:block" ref={dividerRef}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowDividerMenu((v) => !v)}
                title="插入分割线"
                className={`flex items-center px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  showDividerMenu
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-800 border border-gray-200'
                }`}
              >
                <SeparatorHorizontal size={14} className="lg:mr-1" />
                <span className="hidden lg:inline">分割线</span>
                <ChevronDown size={12} className={`ml-0.5 transition-transform ${showDividerMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          <Divider />

          {/* 拆分章节 */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSplit}
            className="flex items-center px-2 md:px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-xs md:text-sm font-medium transition-colors"
            title="在光标处拆分章节"
          >
            <Scissors size={13} className="md:mr-1.5" />
            <span className="hidden md:inline">拆分</span>
          </button>

          {/* "更多"按钮 - 移动端 */}
          <div className="sm:hidden ml-0.5" ref={moreRef}>
            <button
              onClick={() => setShowMoreMenu((v) => !v)}
              className={`p-1.5 rounded-lg transition-colors ${
                showMoreMenu ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="更多工具"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* 查找按钮（固定在右侧）*/}
        <div className="flex items-center flex-shrink-0 ml-2 pl-2 border-l border-gray-200">
          <button
            onClick={() => onToggleFindBar(!showFindBar)}
            className={`p-1.5 md:p-2 rounded-lg transition-colors ${
              showFindBar ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="查找与替换 (Ctrl+F)"
          >
            <Search size={17} />
          </button>
        </div>
      </div>

      {/* 分割线下拉菜单（通过 Portal 渲染到 body）*/}
      {showDividerMenu && dividerMenuStyle && createPortal(
        <div
          id="editor-divider-menu"
          style={{ position: 'fixed', top: dividerMenuStyle.top, left: dividerMenuStyle.left }}
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
        document.body,
      )}

      {/* 更多工具菜单（移动端）*/}
      {showMoreMenu && moreMenuStyle && createPortal(
        <div
          id="editor-more-menu"
          style={{ position: 'fixed', top: moreMenuStyle.top, left: moreMenuStyle.left }}
          className="z-[120] bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-48 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="space-y-1">
            <MenuButton
              icon={<Strikethrough size={16} />}
              label="删除线"
              onClick={() => { editor.chain().focus().toggleStrike().run(); setShowMoreMenu(false); }}
              active={editor.isActive('strike')}
            />
            <MenuButton
              icon={<Link size={16} />}
              label="插入链接"
              onClick={() => { setLink(); setShowMoreMenu(false); }}
              active={editor.isActive('link')}
            />
            <MenuButton
              icon={<Quote size={16} />}
              label="引用块"
              onClick={() => { editor.chain().focus().toggleBlockquote().run(); setShowMoreMenu(false); }}
              active={editor.isActive('blockquote')}
            />
            <MenuButton
              icon={<List size={16} />}
              label="无序列表"
              onClick={() => { editor.chain().focus().toggleBulletList().run(); setShowMoreMenu(false); }}
              active={editor.isActive('bulletList')}
            />
            <MenuButton
              icon={<ListOrdered size={16} />}
              label="有序列表"
              onClick={() => { editor.chain().focus().toggleOrderedList().run(); setShowMoreMenu(false); }}
            />
            <MenuButton
              icon={<Pilcrow size={16} />}
              label="图注"
              onClick={() => { toggleCaption(); setShowMoreMenu(false); }}
              active={editor.isActive('paragraph', { class: 'caption' })}
            />
            <MenuButton
              icon={<span className="font-bold text-xs">A/あ</span>}
              label="注音"
              onClick={() => { setRuby(); setShowMoreMenu(false); }}
              active={editor.isActive('ruby')}
            />
            <MenuButton
              icon={<RemoveFormatting size={16} />}
              label="清除格式"
              onClick={() => { editor.chain().focus().clearNodes().unsetAllMarks().run(); setShowMoreMenu(false); }}
            />

            <div className="border-t border-gray-200 my-2" />

            <MenuButton
              icon={<AlignLeft size={16} />}
              label="左对齐"
              onClick={() => { editor.chain().focus().setTextAlign('left').run(); setShowMoreMenu(false); }}
              active={editor.isActive({ textAlign: 'left' })}
            />
            <MenuButton
              icon={<AlignCenter size={16} />}
              label="居中"
              onClick={() => { editor.chain().focus().setTextAlign('center').run(); setShowMoreMenu(false); }}
              active={editor.isActive({ textAlign: 'center' })}
            />
            <MenuButton
              icon={<AlignRight size={16} />}
              label="右对齐"
              onClick={() => { editor.chain().focus().setTextAlign('right').run(); setShowMoreMenu(false); }}
              active={editor.isActive({ textAlign: 'right' })}
            />

            <div className="border-t border-gray-200 my-2" />

            <MenuButton
              icon={<SeparatorHorizontal size={16} />}
              label="分割线"
              onClick={() => { insertDivider(''); setShowMoreMenu(false); }}
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

// ─── 小型 UI 组件 ───

const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({ icon, onClick, title, active, disabled, className = '' }) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-1.5 rounded-lg transition-all duration-200 flex-shrink-0 ${className} ${
      disabled
        ? 'opacity-30 cursor-not-allowed text-gray-400'
        : active
          ? 'bg-blue-100 text-blue-700 shadow-sm'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
    }`}
  >
    {icon}
  </button>
);

const ButtonGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex items-center space-x-0 mx-0.5 flex-shrink-0 ${className}`}>{children}</div>
);

const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-5 w-px bg-gray-200 mx-0.5 flex-shrink-0 ${className}`} />
);

const MenuButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}> = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
      active
        ? 'bg-blue-50 text-blue-700 font-medium'
        : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span>{label}</span>
  </button>
);

export default EditorToolbar;

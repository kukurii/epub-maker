export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  fileType?: 'xhtml' | 'css' | 'image' | 'xml' | 'opf' | 'ncx' | 'mimetype';
  children?: FileNode[];
  sizeBytes?: number;
  isEditable?: boolean;
  isActive?: boolean;
  canRename?: boolean;
  canDelete?: boolean;
  dataUrl?: string; 
}

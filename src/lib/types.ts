export interface User {
  id: string;
  username: string;
  fingerprint: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number;
  modifiedAt: Date;
  createdAt: Date;
  mimeType?: string;
}

export interface DirectoryListing {
  path: string;
  files: FileNode[];
}

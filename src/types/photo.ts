export interface EntryPhoto {
  id: string;
  userId: string;
  date: string;
  storagePath: string;
  createdAt: string;
}

export interface EntryPhotoWithUrl extends EntryPhoto {
  signedUrl: string;
}

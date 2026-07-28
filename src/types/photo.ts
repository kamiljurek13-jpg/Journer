export interface EntryPhoto {
  date: string;
  storagePath: string;
}

export interface EntryPhotoWithUrl extends EntryPhoto {
  signedUrl: string;
}

export interface StickerItem {
  id: string;
  pack: 'boy' | 'girl';
  title: string;
  image: string;
}

export const BOY_STICKERS: StickerItem[] = [
  { id: 'boy_01', pack: 'boy', title: 'Ahh Ngantuk', image: '/stickers/boy/boy_01.png' },
  { id: 'boy_02', pack: 'boy', title: 'Buruan Oy!', image: '/stickers/boy/boy_02.png' },
  { id: 'boy_03', pack: 'boy', title: 'Lapar', image: '/stickers/boy/boy_03.png' },
  { id: 'boy_04', pack: 'boy', title: 'Oke Siap!', image: '/stickers/boy/boy_04.png' },
  { id: 'boy_05', pack: 'boy', title: 'Hah?', image: '/stickers/boy/boy_05.png' },
  { id: 'boy_06', pack: 'boy', title: 'Pusing...', image: '/stickers/boy/boy_06.png' },
  { id: 'boy_07', pack: 'boy', title: 'Hahaha', image: '/stickers/boy/boy_07.png' },
  { id: 'boy_08', pack: 'boy', title: 'Sedih...', image: '/stickers/boy/boy_08.png' },
  { id: 'boy_09', pack: 'boy', title: 'Semangat!', image: '/stickers/boy/boy_09.png' },
  { id: 'boy_10', pack: 'boy', title: 'Waduh!', image: '/stickers/boy/boy_10.png' },
  { id: 'boy_11', pack: 'boy', title: 'Bye Bye', image: '/stickers/boy/boy_11.png' },
  { id: 'boy_12', pack: 'boy', title: 'Hmmm...', image: '/stickers/boy/boy_12.png' },
  { id: 'boy_13', pack: 'boy', title: 'Minum Dulu', image: '/stickers/boy/boy_13.png' },
  { id: 'boy_14', pack: 'boy', title: 'Capek...', image: '/stickers/boy/boy_14.png' },
  { id: 'boy_15', pack: 'boy', title: 'Fokus Dulu', image: '/stickers/boy/boy_15.png' },
];

export const GIRL_STICKERS: StickerItem[] = [
  { id: 'girl_01', pack: 'girl', title: 'Aduh Ngantuk...', image: '/stickers/girl/girl_01.png' },
  { id: 'girl_02', pack: 'girl', title: 'Buruan Ya!', image: '/stickers/girl/girl_02.png' },
  { id: 'girl_03', pack: 'girl', title: 'Lapar Nih...', image: '/stickers/girl/girl_03.png' },
  { id: 'girl_04', pack: 'girl', title: 'Oke Siap!', image: '/stickers/girl/girl_04.png' },
  { id: 'girl_05', pack: 'girl', title: 'Hah?', image: '/stickers/girl/girl_05.png' },
  { id: 'girl_06', pack: 'girl', title: 'Pusing Banget...', image: '/stickers/girl/girl_06.png' },
  { id: 'girl_07', pack: 'girl', title: 'Hahaha', image: '/stickers/girl/girl_07.png' },
  { id: 'girl_08', pack: 'girl', title: 'Sedih...', image: '/stickers/girl/girl_08.png' },
  { id: 'girl_09', pack: 'girl', title: 'Semangat Yaa!', image: '/stickers/girl/girl_09.png' },
  { id: 'girl_10', pack: 'girl', title: 'Waduh!', image: '/stickers/girl/girl_10.png' },
  { id: 'girl_11', pack: 'girl', title: 'Bye Bye Dulu~', image: '/stickers/girl/girl_11.png' },
  { id: 'girl_12', pack: 'girl', title: 'Hmm...', image: '/stickers/girl/girl_12.png' },
  { id: 'girl_13', pack: 'girl', title: 'Minum Dulu..', image: '/stickers/girl/girl_13.png' },
  { id: 'girl_14', pack: 'girl', title: 'Capek Deh...', image: '/stickers/girl/girl_14.png' },
  { id: 'girl_15', pack: 'girl', title: 'Fokus Dulu', image: '/stickers/girl/girl_15.png' },
];

export const ALL_STICKERS: StickerItem[] = [...BOY_STICKERS, ...GIRL_STICKERS];

export const STICKER_MAP: Record<string, StickerItem> = ALL_STICKERS.reduce((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {} as Record<string, StickerItem>);

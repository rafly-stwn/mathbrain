import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import type { GameId } from '../../types';
import { useGameStore } from '../../stores/gameStore';

export interface InstructionModalProps {
  gameId: GameId;
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

const instructionData: Record<string, { title: string; steps: string[]; tip: string }> = {
  'speed-addition': {
    title: 'Penjumlahan Cepat ⚡',
    steps: [
      'Jawab soal penjumlahan secepat dan setepat mungkin!',
      'Ketik jawaban angka Anda pada kolom input lalu tekan Enter.',
      'Anda memiliki batas waktu 60 detik untuk mengumpulkan skor tertinggi.',
    ],
    tip: 'Pertahankan jawaban benar beruntun (streak) untuk memicu skor bonus dan menjaga ritme berpikir.',
  },
  'speed-multiplication': {
    title: 'Perkalian Cepat ✖️',
    steps: [
      'Selesaikan operasi perkalian matematika berpacu dengan detik!',
      'Ketik jawaban hasil perkalian lalu tekan Enter.',
      'Waktu permainan berlangsung selama 60 detik penuh.',
    ],
    tip: 'Gunakan trik perkalian cepat puluhan dan satuan agar dapat menjawab dalam hitungan detik.',
  },
  'kraepelin': {
    title: 'Tes Kraepelin 📰',
    steps: [
      'Jumlahkan 2 angka bersebelahan secara vertikal dari bawah ke atas.',
      'Tuliskan HANYA digit satuannya saja (contoh: 8 + 7 = 15, ketik angka 5).',
      'Ketik menggunakan tombol numpad di layar atau keyboard fisik Anda (0–9).',
    ],
    tip: 'Jaga ritme dan tempo hitung yang stabil untuk membentuk kurva performa yang konsisten.',
  },
  'magic-square': {
    title: 'Magic Square 🔢',
    steps: [
      'Tempatkan angka 1 hingga 9 ke dalam kisi 3x3.',
      'Jumlah angka pada setiap baris, kolom, dan diagonal harus bernilai tepat sama (angka ajaib 15).',
      'Setiap angka hanya boleh digunakan satu kali tanpa ada duplikasi.',
    ],
    tip: 'Ingat kunci utamanya: angka 5 selalu menempati kotak pusat di tengah kisi 3x3!',
  },
  'sudoku': {
    title: 'Sudoku 🧩',
    steps: [
      'Isi seluruh kotak kisi 9x9 dengan angka 1 sampai 9.',
      'Setiap baris, kolom, dan sub-grid 3x3 tidak boleh memiliki angka yang sama.',
      'Manfaatkan fitur Catatan (Notes) untuk menandai kemungkinan kandidat angka.',
    ],
    tip: 'Mulai dari baris, kolom, atau sub-grid 3x3 yang sudah memiliki angka terisi paling banyak.',
  },
  'kenken': {
    title: 'KenKen 🧮',
    steps: [
      'Isi kisi dengan angka 1 sampai N tanpa ada perulangan angka di baris atau kolom.',
      'Perhatikan sangkar bergaris tebal: angka di dalamnya harus menghasilkan target sesuai operatornya (+, −, ×, ÷).',
      'Angka boleh berulang di dalam sangkar yang sama asalkan tidak berada di baris atau kolom yang sama.',
    ],
    tip: 'Isi sangkar satu kotak terlebih dahulu (angka gratis) untuk membuka petunjuk kotak di sekitarnya.',
  },
  'kakuro': {
    title: 'Kakuro ➕',
    steps: [
      'Teka-teki silang matematika: isi kotak putih dengan angka 1 sampai 9.',
      'Jumlah angka pada deret mendatar/menurun harus sesuai dengan angka petunjuk segitiganya.',
      'Angka di dalam satu deret penjumlahan tidak boleh berulang.',
    ],
    tip: 'Hafalkan kombinasi angka unik, misalnya petunjuk 3 dari 2 kotak pasti berisi angka 1 dan 2.',
  },
  'math-scrabble': {
    title: 'Math Scrabble 🔤',
    steps: [
      'Letakkan ubin dari rak 8 kartu ke papan 15x15 untuk membentuk persamaan matematika yang valid.',
      'Setiap baris/kolom harus berupa persamaan seimbang dengan tanda sama dengan (=), misalnya 5 + 3 = 8 atau 7 × 2 = 14.',
      'Langkah pertama wajib melewati kotak bintang di tengah papan (7, 7).',
      'Manfaatkan kotak pengganda nilai ubin (x2, x3 point) dan total skor (x2, x3 score).',
    ],
    tip: 'Gunakan seluruh 8 kartu dari rak dalam 1 putaran untuk meraih bonus Bingo +50 poin!',
  },
  'default': {
    title: 'Cara Bermain',
    steps: ['Ikuti petunjuk yang tertera di layar.', 'Berikan performa terbaikmu!'],
    tip: 'Selamat bermain dan asah kecerdasan matematikamu!',
  }
};

const InstructionModal: React.FC<InstructionModalProps> = ({
  gameId,
  isOpen,
  onClose,
  onStart,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const markInstructionSeen = useGameStore((state) => state.markInstructionSeen);

  const data = instructionData[gameId as string] || instructionData['default'];

  const handleStart = () => {
    if (dontShowAgain) {
      markInstructionSeen(gameId);
    }
    onStart();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={data.title}>
      <div className="space-y-4">
        <ul className="list-disc pl-5 space-y-2 text-charcoal text-sm leading-relaxed">
          {data.steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ul>
        
        <div className="bg-lemon/20 p-3 rounded-button text-sm text-charcoal font-medium border border-lemon/40">
          💡 <strong>Tips:</strong> {data.tip}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="dontShowAgain"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded text-lavender focus:ring-lavender cursor-pointer"
          />
          <label htmlFor="dontShowAgain" className="text-sm text-warmgray cursor-pointer select-none">
            Jangan tampilkan panduan ini lagi
          </label>
        </div>

        <div className="pt-4">
          <Button fullWidth onClick={handleStart} size="lg" className="bg-charcoal hover:bg-black text-white font-black text-base py-3.5">
            Mulai Bermain! 🎮
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InstructionModal;

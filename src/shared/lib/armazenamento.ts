import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/**
 * Armazenamento usado por todas as stores para salvar no aparelho.
 * Se um dia trocarmos o AsyncStorage por outra coisa (ex: SQLite ou backend),
 * só este arquivo muda.
 */
export const armazenamento = createJSONStorage(() => AsyncStorage);

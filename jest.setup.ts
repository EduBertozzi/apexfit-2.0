// Substitui o AsyncStorage real por uma versão em memória durante os testes
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

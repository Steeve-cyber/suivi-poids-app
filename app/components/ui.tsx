import React from 'react';
import { View } from 'react-native';

export const C = {
  background: '#0B132B',
  mint: '#48E5C2',
  subtle: '#5C6B73',
};

export function Card({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
}
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  const handlePress = () => {
    setCount(prev => prev + 1);
  };

  const handleReset = () => {
    setCount(0);
    Alert.alert('Reset', 'Bộ đếm đã được đặt lại về 0!');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background decoration elements */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.card}>
        <Text style={styles.title}>🚀 SignBridge Test App</Text>
        <Text style={styles.subtitle}>Kiểm tra kết nối mạng & Tương thích SDK 54</Text>
        
        <View style={styles.divider} />

        <View style={styles.counterBox}>
          <Text style={styles.counterLabel}>Số lần bạn đã nhấn nút:</Text>
          <Text style={styles.counterValue}>{count}</Text>
        </View>

        <TouchableOpacity 
          style={styles.primaryButton} 
          activeOpacity={0.8}
          onPress={handlePress}
        >
          <Text style={styles.buttonText}>Click Tôi Đi! 👆</Text>
        </TouchableOpacity>

        {count > 0 && (
          <TouchableOpacity 
            style={styles.secondaryButton} 
            activeOpacity={0.7}
            onPress={handleReset}
          >
            <Text style={styles.secondaryButtonText}>Đặt lại bộ đếm</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.footer}>Được thiết kế cho SignBridge • SDK 54</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark Slate Blue background
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  circle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.15)', // Indigo glow
  },
  circle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(236, 72, 153, 0.1)', // Pink glow
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1E293B', // Soft dark gray card
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 20,
  },
  counterBox: {
    backgroundColor: '#0F172A',
    width: '100%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  counterLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  counterValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#38BDF8', // Cyan Highlight
  },
  primaryButton: {
    backgroundColor: '#6366F1', // Indigo primary
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    color: '#475569',
  },
});
